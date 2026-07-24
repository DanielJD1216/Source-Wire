import { randomUUID } from "node:crypto";

import type pg from "pg";

import {
  ALPHA1_SCHEMA_VERSION,
  PORTABLE_RESTORE_TIMEOUT_MS,
  RUNTIME_RECOVERY_GUARD_APPLICATION_NAME,
  assertSourceWireIdentifier
} from "./config.js";
import {
  CREDENTIAL_VERIFIER_ALGORITHM,
  computeCredentialVerifier,
  createCredentialSecret,
  parseCredentialToken,
  verifierMatches
} from "./credentials.js";
import {
  IDEMPOTENCY_REPLAY_WINDOW_MS,
  canonicalRequestDigest,
  decryptReplaySecret,
  deriveIdempotencyReplayKey,
  encryptReplaySecret,
  type ReplayAuthenticatedContext
} from "./idempotency.js";
import { inspectSchemaCompatibilityWithQueryable } from "./migration.js";
import {
  PORTABLE_FORMAT_VERSION,
  parsePortableBundle,
  type ParsedPortableBundle,
  type PortableRecord
} from "./portable-format.js";
import {
  validatePortableState,
  type ValidatedPortableState
} from "./portable-validation.js";

const INITIALIZATION_ADVISORY_LOCK = 1_913_770_102;
const AUTHENTICATION_EPOCH_LOCK_NAMESPACE = 1_913_770_104;
const AUTHENTICATION_EPOCH_LOCK_NAME =
  "source_wire_story4_authentication_epoch";
const OWNER_ADMIN_DEFAULT_TTL_MS = 15 * 60 * 1_000;
const OWNER_ADMIN_MAX_TTL_MS = 60 * 60 * 1_000;
const SECRET_ALGORITHM = "aes-256-gcm-hkdf-sha256-v1";
const OWNER_ADMIN_CAPABILITIES = [
  "runtime.health",
  "credential.manage",
  "memory_candidate.review",
  "memory_candidate.decide",
  "trusted_memory.correct",
  "trusted_memory.revoke",
  "memory.export"
] as const;

type RecoveryOperation = "portable_restore" | "physical_recovery";

export type RecoveryCredentialResult = {
  credentialId: string;
  displayPrefix: string;
  secret: string;
  status: "active";
  expiresAt: string;
};

export type RecoveryResult = {
  schemaVersion: typeof ALPHA1_SCHEMA_VERSION;
  operation: RecoveryOperation;
  ownerId: string;
  namespaceIds: string[];
  logicalStateSha256: string | null;
  governedRecordCount: number;
  restoreReceiptId: string;
  ownerAdminCredential: RecoveryCredentialResult;
  verificationRequired: boolean;
  replayed: boolean;
};

export type PortableRestoreStage =
  | "before_manifest_verification"
  | "after_manifest_verification"
  | "after_governed_inserts"
  | "before_credential_issue"
  | "before_audit"
  | "before_commit";

export type InitializeFromPortableExportInput = {
  bytes: Buffer;
  expectedLogicalStateSha256: string;
  operationKey: string;
  verifierKey: Buffer;
  verifierKeyId: string;
  expiresAt?: Date;
  onStage?: (stage: PortableRestoreStage) => void;
};

export type RecoverPhysicalBackupInput = {
  operationKey: string;
  verifierKey: Buffer;
  verifierKeyId: string;
  expiresAt?: Date;
};

export type VerifyRecoveredInstallationInput = {
  ownerAdminToken: string;
  verifierKey: Buffer;
  verifierKeyId: string;
  expectedLogicalStateSha256?: string;
};

export type VerifyRecoveredInstallationResult = {
  schemaVersion: typeof ALPHA1_SCHEMA_VERSION;
  status: "ready";
  operation: RecoveryOperation;
  ownerId: string;
  namespaceIds: string[];
  restoreReceiptId: string;
  logicalStateSha256: string | null;
  governedRecordCount: number;
  verifiedAt: string;
  auditEventId: string;
};

export async function initializeFromPortableExport(
  pool: pg.Pool,
  input: InitializeFromPortableExportInput
): Promise<RecoveryResult> {
  const operationKey = assertSourceWireIdentifier(
    input.operationKey,
    "operationKey"
  );
  const verifierKeyId = assertSourceWireIdentifier(
    input.verifierKeyId,
    "verifierKeyId"
  );
  const requestDigest = canonicalRequestDigest({
    expectedLogicalStateSha256: input.expectedLogicalStateSha256,
    operation: "portable_restore",
    operationKey,
    schemaVersion: ALPHA1_SCHEMA_VERSION
  });
  const startedAt = Date.now();
  const client = await pool.connect();
  let createdSecret: ReturnType<typeof createCredentialSecret> | undefined;

  try {
    await beginRecoveryTransaction(client);
    const replay = await readRecoveryReplay(
      client,
      "portable_restore",
      operationKey,
      requestDigest,
      input.verifierKey
    );
    if (replay) {
      await client.query("COMMIT");
      return replay;
    }
    await assertNoRuntimeSessions(client);
    await assertExactPortableRestoreTargetEmpty(client);
    assertWithinRestoreDeadline(startedAt);
    input.onStage?.("before_manifest_verification");
    const parsed = parsePortableBundle(
      input.bytes,
      input.expectedLogicalStateSha256
    );
    if (parsed.manifest.schemaVersion !== ALPHA1_SCHEMA_VERSION) {
      throw new Error("schema_incompatible");
    }
    const validated = validatePortableState(parsed);
    input.onStage?.("after_manifest_verification");
    assertWithinRestoreDeadline(startedAt);

    createdSecret = createCredentialSecret();
    const recoveryContext: Parameters<typeof insertPortableRecovery>[4] = {
      operationKey,
      requestDigest,
      verifierKey: input.verifierKey,
      verifierKeyId
    };
    if (input.expiresAt) recoveryContext.expiresAt = input.expiresAt;
    if (input.onStage) recoveryContext.onStage = input.onStage;
    const result = await insertPortableRecovery(
      client,
      parsed,
      validated,
      createdSecret,
      recoveryContext
    );
    assertWithinRestoreDeadline(startedAt);
    input.onStage?.("before_commit");
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    createdSecret = undefined;
    throw error;
  } finally {
    client.release();
  }
}

export async function recoverPhysicalBackup(
  pool: pg.Pool,
  input: RecoverPhysicalBackupInput
): Promise<RecoveryResult> {
  const operationKey = assertSourceWireIdentifier(
    input.operationKey,
    "operationKey"
  );
  const verifierKeyId = assertSourceWireIdentifier(
    input.verifierKeyId,
    "verifierKeyId"
  );
  const requestDigest = canonicalRequestDigest({
    operation: "physical_recovery",
    operationKey,
    schemaVersion: ALPHA1_SCHEMA_VERSION
  });
  const startedAt = Date.now();
  const client = await pool.connect();
  let createdSecret: ReturnType<typeof createCredentialSecret> | undefined;

  try {
    await beginRecoveryTransaction(client);
    const replay = await readRecoveryReplay(
      client,
      "physical_recovery",
      operationKey,
      requestDigest,
      input.verifierKey
    );
    if (replay) {
      await client.query("COMMIT");
      return replay;
    }
    await assertNoRuntimeSessions(client);
    const owner = await client.query<{ owner_id: string }>(
      `SELECT owner_id
         FROM source_wire_memory.owners
        ORDER BY owner_id`
    );
    if (owner.rows.length !== 1) throw new Error("recovery_target_invalid");
    const ownerId = owner.rows[0]!.owner_id;
    const namespaceIds = await readNamespaceIds(client, ownerId);
    if (namespaceIds.length < 1) throw new Error("recovery_target_invalid");
    await assertGovernedInvariants(client, ownerId, namespaceIds);
    const governedRecordCount = await countGovernedRecords(client, ownerId);

    const occurredAt = new Date();
    const restoreReceiptId = randomUUID();
    const authenticationEpochId = randomUUID();
    await client.query(
      `INSERT INTO source_wire_memory.authentication_epochs (
         authentication_epoch_id,
         activated_at,
         activation_reason
       ) VALUES ($1, $2, 'physical_recovery')`,
      [authenticationEpochId, occurredAt]
    );
    await client.query(
      `UPDATE source_wire_memory.credentials
          SET status = 'revoked',
              updated_at = $1
        WHERE status <> 'revoked'`,
      [occurredAt]
    );
    await client.query(
      `UPDATE source_wire_memory.protected_read_receipts
          SET consumption_state = 'invalidated',
              release_status = 'recovery_invalidated',
              consumed_at = $1
        WHERE consumption_state = 'issued'
          AND release_status = 'release_authorized'`,
      [occurredAt]
    );
    await client.query(
      `INSERT INTO source_wire_memory.restore_receipts (
         restore_receipt_id,
         operation,
         schema_version,
         portable_format_version,
         owner_id,
         authentication_epoch_id,
         logical_state_sha256,
         governed_record_count,
         result,
         occurred_at
       ) VALUES (
         $1, 'physical_recovery', $2, NULL, $3, $4, NULL, $5, 'accepted', $6
       )`,
      [
        restoreReceiptId,
        ALPHA1_SCHEMA_VERSION,
        ownerId,
        authenticationEpochId,
        governedRecordCount,
        occurredAt
      ]
    );
    await client.query(
      `UPDATE source_wire_memory.installation_state
          SET current_authentication_epoch_id = $1,
              updated_at = $2,
              runtime_state = 'verification_required',
              pending_restore_receipt_id = $3,
              runtime_verified_at = NULL
        WHERE singleton = true`,
      [authenticationEpochId, occurredAt, restoreReceiptId]
    );

    createdSecret = createCredentialSecret();
    const credential = await insertRecoveryCredential(
      client,
      ownerId,
      namespaceIds,
      authenticationEpochId,
      createdSecret,
      input.verifierKey,
      verifierKeyId,
      input.expiresAt,
      occurredAt
    );
    const auditEventId = randomUUID();
    await client.query(
      `INSERT INTO source_wire_memory.audit_events (
         event_id,
         occurred_at,
         trace_id,
         operation,
         result,
         actor_credential_id,
         actor_identity_id,
         actor_reference,
         owner_id,
         namespace_id,
         denial_code,
         metadata
       ) VALUES (
         $1, $2, $3, 'physical_recovery', 'allowed', $4, $4,
         'operator', $5, NULL, NULL, $6
       )`,
      [
        auditEventId,
        occurredAt,
        randomUUID(),
        credential.credentialId,
        ownerId,
        JSON.stringify({ governedRecordCount, restoreReceiptId })
      ]
    );
    await insertRecoveryReplay(
      client,
      "physical_recovery",
      operationKey,
      requestDigest,
      credential,
      restoreReceiptId,
      input.verifierKey,
      occurredAt
    );
    assertWithinRestoreDeadline(startedAt);
    await client.query("COMMIT");
    return {
      schemaVersion: ALPHA1_SCHEMA_VERSION,
      operation: "physical_recovery",
      ownerId,
      namespaceIds,
      logicalStateSha256: null,
      governedRecordCount,
      restoreReceiptId,
      ownerAdminCredential: credential,
      verificationRequired: true,
      replayed: false
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    createdSecret = undefined;
    throw error;
  } finally {
    client.release();
  }
}

export async function verifyRecoveredInstallation(
  pool: pg.Pool,
  input: VerifyRecoveredInstallationInput
): Promise<VerifyRecoveredInstallationResult> {
  const parsedToken = parseCredentialToken(input.ownerAdminToken);
  if (!parsedToken) throw new Error("credential_invalid");
  const verifierKeyId = assertSourceWireIdentifier(
    input.verifierKeyId,
    "verifierKeyId"
  );
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '90s'");
    await client.query(
      "SELECT pg_catalog.pg_advisory_xact_lock($1)",
      [INITIALIZATION_ADVISORY_LOCK]
    );
    await lockAuthenticationEpoch(client);
    await client.query("SET LOCAL ROLE source_wire_schema_owner");
    await requireCompatibleSchema(client);
    await assertNoRuntimeSessions(client);

    const installation = await client.query<{
      current_authentication_epoch_id: string;
      pending_restore_receipt_id: string | null;
      runtime_state: string;
    }>(
      `SELECT
         current_authentication_epoch_id,
         pending_restore_receipt_id,
         runtime_state
       FROM source_wire_memory.installation_state
       WHERE singleton = true
       FOR UPDATE`
    );
    const current = installation.rows[0];
    if (
      !current ||
      current.runtime_state !== "verification_required" ||
      !current.pending_restore_receipt_id
    ) {
      throw new Error("recovery_verification_not_pending");
    }
    const credential = await client.query<{
      credential_id: string;
      owner_id: string;
      verifier: Buffer;
      verifier_key_id: string;
      namespace_count: string;
      capability_count: string;
    }>(
      `SELECT
         credential.credential_id,
         credential.owner_id,
         credential.verifier,
         credential.verifier_key_id,
         (
           SELECT count(*)::text
           FROM source_wire_memory.credential_namespace_grants
           WHERE credential_id = credential.credential_id
         ) AS namespace_count,
         (
           SELECT count(*)::text
           FROM source_wire_memory.credential_capability_grants
           WHERE credential_id = credential.credential_id
             AND capability = ANY($2::varchar[])
         ) AS capability_count
       FROM source_wire_memory.credentials AS credential
       WHERE credential.credential_id = $1
         AND credential.credential_class = 'owner_admin'
         AND credential.status = 'active'
         AND credential.expires_at > pg_catalog.clock_timestamp()
         AND credential.authentication_epoch_id = $3`,
      [
        parsedToken.credentialId,
        [...OWNER_ADMIN_CAPABILITIES],
        current.current_authentication_epoch_id
      ]
    );
    const activeCredential = credential.rows[0];
    if (
      !activeCredential ||
      activeCredential.verifier_key_id !== verifierKeyId ||
      !verifierMatches(
        input.verifierKey,
        input.ownerAdminToken,
        activeCredential.verifier
      )
    ) {
      throw new Error("credential_invalid");
    }
    const namespaceIds = await readNamespaceIds(
      client,
      activeCredential.owner_id
    );
    if (
      Number(activeCredential.namespace_count) !== namespaceIds.length ||
      Number(activeCredential.capability_count) !==
        OWNER_ADMIN_CAPABILITIES.length
    ) {
      throw new Error("recovery_verification_failed");
    }
    const activeCredentialCounts = await client.query<{
      active_harness_count: string;
      active_owner_count: string;
    }>(
      `SELECT
         count(*) FILTER (
           WHERE credential_class = 'owner_admin'
             AND status = 'active'
             AND authentication_epoch_id = $1
         )::text AS active_owner_count,
         count(*) FILTER (
           WHERE credential_class = 'harness'
             AND status = 'active'
             AND authentication_epoch_id = $1
         )::text AS active_harness_count
       FROM source_wire_memory.credentials`,
      [current.current_authentication_epoch_id]
    );
    if (
      activeCredentialCounts.rows[0]?.active_owner_count !== "1" ||
      activeCredentialCounts.rows[0]?.active_harness_count !== "0"
    ) {
      throw new Error("recovery_verification_failed");
    }
    await assertGovernedInvariants(
      client,
      activeCredential.owner_id,
      namespaceIds
    );
    const receipt = await client.query<{
      operation: RecoveryOperation;
      logical_state_sha256: string | null;
      governed_record_count: number;
    }>(
      `SELECT operation, logical_state_sha256, governed_record_count
       FROM source_wire_memory.restore_receipts
       WHERE restore_receipt_id = $1
         AND owner_id = $2`,
      [current.pending_restore_receipt_id, activeCredential.owner_id]
    );
    const restoreReceipt = receipt.rows[0];
    if (!restoreReceipt) throw new Error("recovery_verification_failed");
    if (restoreReceipt.operation === "portable_restore") {
      if (
        !input.expectedLogicalStateSha256 ||
        input.expectedLogicalStateSha256 !==
          restoreReceipt.logical_state_sha256
      ) {
        throw new Error("portable_digest_mismatch");
      }
    } else if (input.expectedLogicalStateSha256 !== undefined) {
      throw new Error("validation_failed:expectedLogicalStateSha256");
    }

    const verifiedAt = new Date();
    const auditEventId = randomUUID();
    await client.query(
      `UPDATE source_wire_memory.installation_state
          SET runtime_state = 'ready',
              pending_restore_receipt_id = NULL,
              runtime_verified_at = $1,
              updated_at = $1
        WHERE singleton = true
          AND runtime_state = 'verification_required'
          AND pending_restore_receipt_id = $2`,
      [verifiedAt, current.pending_restore_receipt_id]
    );
    await client.query(
      `INSERT INTO source_wire_memory.audit_events (
         event_id,
         occurred_at,
         trace_id,
         operation,
         result,
         actor_credential_id,
         actor_identity_id,
         actor_reference,
         owner_id,
         namespace_id,
         denial_code,
         metadata
       ) VALUES (
         $1, $2, $3, 'verify_recovery', 'allowed', $4, $4,
         'operator', $5, NULL, NULL, $6
       )`,
      [
        auditEventId,
        verifiedAt,
        randomUUID(),
        activeCredential.credential_id,
        activeCredential.owner_id,
        JSON.stringify({
          governedRecordCount: restoreReceipt.governed_record_count,
          restoreReceiptId: current.pending_restore_receipt_id
        })
      ]
    );
    await client.query("COMMIT");
    return {
      schemaVersion: ALPHA1_SCHEMA_VERSION,
      status: "ready",
      operation: restoreReceipt.operation,
      ownerId: activeCredential.owner_id,
      namespaceIds,
      restoreReceiptId: current.pending_restore_receipt_id,
      logicalStateSha256: restoreReceipt.logical_state_sha256,
      governedRecordCount: restoreReceipt.governed_record_count,
      verifiedAt: verifiedAt.toISOString(),
      auditEventId
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function inspectRuntimeRecoveryGate(
  queryable: Pick<pg.Pool, "query"> | Pick<pg.PoolClient, "query">
): Promise<"ready" | "verification_required"> {
  const result = await queryable.query<{ runtime_state: string }>(
    `SELECT runtime_state
       FROM source_wire_memory.installation_state
      WHERE singleton = true`
  );
  const state = result.rows[0]?.runtime_state;
  if (state !== "ready" && state !== "verification_required") {
    throw new Error("schema_incompatible");
  }
  return state;
}

export async function acquireRuntimeRecoveryGuard(
  pool: pg.Pool
): Promise<() => Promise<void>> {
  const client = await pool.connect();
  let released = false;
  try {
    await client.query(
      "SELECT pg_catalog.set_config('application_name', $1, false)",
      [RUNTIME_RECOVERY_GUARD_APPLICATION_NAME]
    );
    await client.query(
      `SELECT pg_catalog.pg_advisory_lock_shared(
         pg_catalog.hashtextextended($1, $2)
       )`,
      [AUTHENTICATION_EPOCH_LOCK_NAME, AUTHENTICATION_EPOCH_LOCK_NAMESPACE]
    );
  } catch (error) {
    client.release();
    throw error;
  }
  return async () => {
    if (released) return;
    released = true;
    try {
      await client.query(
        `SELECT pg_catalog.pg_advisory_unlock_shared(
           pg_catalog.hashtextextended($1, $2)
         )`,
        [AUTHENTICATION_EPOCH_LOCK_NAME, AUTHENTICATION_EPOCH_LOCK_NAMESPACE]
      );
    } finally {
      client.release();
    }
  };
}

async function insertPortableRecovery(
  client: pg.PoolClient,
  parsed: ParsedPortableBundle,
  validated: ValidatedPortableState,
  createdSecret: ReturnType<typeof createCredentialSecret>,
  context: {
    operationKey: string;
    requestDigest: string;
    verifierKey: Buffer;
    verifierKeyId: string;
    expiresAt?: Date;
    onStage?: (stage: PortableRestoreStage) => void;
  }
): Promise<RecoveryResult> {
  const { sections } = parsed;
  const occurredAt = new Date();
  const authenticationEpochId = randomUUID();
  const restoreReceiptId = randomUUID();
  await client.query(
    `INSERT INTO source_wire_memory.owners (owner_id, created_at)
     VALUES ($1, $2)`,
    [validated.ownerId, parsed.manifest.snapshotCutoff]
  );
  await insertJsonRows(
    client,
    sections.namespaces,
    `INSERT INTO source_wire_memory.namespaces (
       namespace_id, owner_id, created_at
     )
     SELECT namespace_id, owner_id, created_at
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       namespace_id varchar,
       owner_id varchar,
       created_at timestamptz
     )`,
    (record) => ({
      namespace_id: record.namespaceId,
      owner_id: record.ownerId,
      created_at: record.createdAt
    })
  );
  await insertJsonRows(
    client,
    sections.actors,
    `INSERT INTO source_wire_memory.actor_identities (
       actor_identity_id, owner_id, actor_class, created_at
     )
     SELECT actor_identity_id, owner_id, actor_class, created_at
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       actor_identity_id uuid,
       owner_id varchar,
       actor_class varchar,
       created_at timestamptz
     )`,
    (record) => ({
      actor_identity_id: record.actorIdentityId,
      owner_id: record.ownerId,
      actor_class: record.actorClass,
      created_at: record.createdAt
    })
  );
  await insertJsonRows(
    client,
    sections.candidates,
    `INSERT INTO source_wire_memory.memory_candidates (
       candidate_id,
       owner_id,
       namespace_id,
       proposed_by_credential_id,
       proposed_by_actor_id,
       state,
       content,
       content_byte_count,
       created_at,
       updated_at,
       decided_at,
       decided_by_credential_id,
       decided_by_actor_id
     )
     SELECT
       candidate_id,
       owner_id,
       namespace_id,
       NULL,
       proposed_by_actor_id,
       state,
       content,
       content_byte_count,
       created_at,
       updated_at,
       decided_at,
       NULL,
       decided_by_actor_id
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       candidate_id uuid,
       owner_id varchar,
       namespace_id varchar,
       proposed_by_actor_id uuid,
       state varchar,
       content text,
       content_byte_count integer,
       created_at timestamptz,
       updated_at timestamptz,
       decided_at timestamptz,
       decided_by_actor_id uuid
     )`,
    (record) => snakeRecord(record)
  );
  await insertJsonRows(
    client,
    sections.memories,
    `INSERT INTO source_wire_memory.trusted_memories (
       memory_id, owner_id, namespace_id, origin_candidate_id, state, created_at
     )
     SELECT memory_id, owner_id, namespace_id, origin_candidate_id, state, created_at
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       memory_id uuid,
       owner_id varchar,
       namespace_id varchar,
       origin_candidate_id uuid,
       state varchar,
       created_at timestamptz
     )`,
    (record) => snakeRecord(record)
  );
  await insertJsonRows(
    client,
    sections.revisions,
    `INSERT INTO source_wire_memory.trusted_memory_revisions (
       revision_id,
       memory_id,
       owner_id,
       namespace_id,
       revision_number,
       status,
       content,
       content_byte_count,
       origin_candidate_id,
       created_by_credential_id,
       created_by_actor_id,
       created_at
     )
     SELECT
       revision_id,
       memory_id,
       owner_id,
       namespace_id,
       revision_number,
       status,
       content,
       content_byte_count,
       origin_candidate_id,
       NULL,
       created_by_actor_id,
       created_at
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       revision_id uuid,
       memory_id uuid,
       owner_id varchar,
       namespace_id varchar,
       revision_number integer,
       status varchar,
       content text,
       content_byte_count integer,
       origin_candidate_id uuid,
       created_by_actor_id uuid,
       created_at timestamptz
     )`,
    (record) => snakeRecord(record)
  );
  await insertJsonRows(
    client,
    sections.candidateProvenance,
    `INSERT INTO source_wire_memory.candidate_provenance (
       candidate_id,
       owner_id,
       namespace_id,
       provenance_kind,
       owner_assertion,
       prior_memory_id,
       prior_revision_id,
       created_at
     )
     SELECT
       candidate_id,
       owner_id,
       namespace_id,
       provenance_kind,
       owner_assertion,
       prior_memory_id,
       prior_revision_id,
       created_at
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       candidate_id uuid,
       owner_id varchar,
       namespace_id varchar,
       provenance_kind varchar,
       owner_assertion text,
       prior_memory_id uuid,
       prior_revision_id uuid,
       created_at timestamptz
     )`,
    (record) => snakeRecord(record)
  );
  await insertJsonRows(
    client,
    sections.trustedProvenance,
    `INSERT INTO source_wire_memory.trusted_memory_provenance (
       provenance_id,
       provenance_key,
       revision_id,
       memory_id,
       owner_id,
       namespace_id,
       origin_candidate_id,
       provenance_kind,
       owner_assertion,
       prior_memory_id,
       prior_revision_id,
       created_at
     )
     SELECT
       provenance_id,
       provenance_key,
       revision_id,
       memory_id,
       owner_id,
       namespace_id,
       origin_candidate_id,
       provenance_kind,
       owner_assertion,
       prior_memory_id,
       prior_revision_id,
       created_at
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       provenance_id uuid,
       provenance_key varchar,
       revision_id uuid,
       memory_id uuid,
       owner_id varchar,
       namespace_id varchar,
       origin_candidate_id uuid,
       provenance_kind varchar,
       owner_assertion text,
       prior_memory_id uuid,
       prior_revision_id uuid,
       created_at timestamptz
     )`,
    (record) => snakeRecord(record)
  );
  await insertJsonRows(
    client,
    sections.candidateDecisions,
    `INSERT INTO source_wire_memory.candidate_decisions (
       candidate_id,
       owner_id,
       namespace_id,
       decision,
       expected_state,
       reason,
       decided_by_credential_id,
       decided_by_actor_id,
       trusted_memory_id,
       trusted_revision_id,
       decided_at
     )
     SELECT
       candidate_id,
       owner_id,
       namespace_id,
       decision,
       expected_state,
       reason,
       NULL,
       decided_by_actor_id,
       trusted_memory_id,
       trusted_revision_id,
       decided_at
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       candidate_id uuid,
       owner_id varchar,
       namespace_id varchar,
       decision varchar,
       expected_state varchar,
       reason text,
       decided_by_actor_id uuid,
       trusted_memory_id uuid,
       trusted_revision_id uuid,
       decided_at timestamptz
     )`,
    (record) => snakeRecord(record)
  );
  await insertJsonRows(
    client,
    sections.lifecycleEvents,
    `INSERT INTO source_wire_memory.trusted_memory_lifecycle_events (
       lifecycle_event_id,
       owner_id,
       namespace_id,
       memory_id,
       event_type,
       expected_revision_id,
       resulting_revision_id,
       reason,
       actor_identity_id,
       actor_credential_id,
       occurred_at
     )
     SELECT
       lifecycle_event_id,
       owner_id,
       namespace_id,
       memory_id,
       event_type,
       expected_revision_id,
       resulting_revision_id,
       reason,
       actor_identity_id,
       NULL,
       occurred_at
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       lifecycle_event_id uuid,
       owner_id varchar,
       namespace_id varchar,
       memory_id uuid,
       event_type varchar,
       expected_revision_id uuid,
       resulting_revision_id uuid,
       reason text,
       actor_identity_id uuid,
       occurred_at timestamptz
     )`,
    (record) => snakeRecord(record)
  );
  await insertJsonRows(
    client,
    sections.mutationAudits,
    `INSERT INTO source_wire_memory.audit_events (
       event_id,
       occurred_at,
       trace_id,
       operation,
       result,
       actor_credential_id,
       actor_identity_id,
       actor_reference,
       owner_id,
       namespace_id,
       denial_code,
       metadata
     )
     SELECT
       event_id,
       occurred_at,
       trace_id,
       operation,
       result,
       NULL,
       actor_identity_id,
       CASE
         WHEN actor_identity_id IS NULL THEN 'operator'
         ELSE 'actor:' || actor_identity_id::text
       END,
       owner_id,
       namespace_id,
       denial_code,
       metadata
     FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS record(
       event_id uuid,
       occurred_at timestamptz,
       trace_id uuid,
       operation varchar,
       result varchar,
       actor_identity_id uuid,
       owner_id varchar,
       namespace_id varchar,
       denial_code varchar,
       metadata jsonb
     )`,
    (record) => snakeRecord(record)
  );
  context.onStage?.("after_governed_inserts");

  await client.query(
    `INSERT INTO source_wire_memory.authentication_epochs (
       authentication_epoch_id,
       activated_at,
       activation_reason
     ) VALUES ($1, $2, 'portable_restore')`,
    [authenticationEpochId, occurredAt]
  );
  await client.query(
    `INSERT INTO source_wire_memory.restore_receipts (
       restore_receipt_id,
       operation,
       schema_version,
       portable_format_version,
       owner_id,
       authentication_epoch_id,
       logical_state_sha256,
       governed_record_count,
       result,
       occurred_at
     ) VALUES (
       $1, 'portable_restore', $2, $3, $4, $5, $6, $7, 'accepted', $8
     )`,
    [
      restoreReceiptId,
      ALPHA1_SCHEMA_VERSION,
      PORTABLE_FORMAT_VERSION,
      validated.ownerId,
      authenticationEpochId,
      validated.logicalStateSha256,
      validated.governedRecordCount,
      occurredAt
    ]
  );
  await client.query(
    `UPDATE source_wire_memory.installation_state
        SET current_authentication_epoch_id = $1,
            updated_at = $2,
            runtime_state = 'verification_required',
            pending_restore_receipt_id = $3,
            runtime_verified_at = NULL
      WHERE singleton = true`,
    [authenticationEpochId, occurredAt, restoreReceiptId]
  );
  context.onStage?.("before_credential_issue");
  const credential = await insertRecoveryCredential(
    client,
    validated.ownerId,
    validated.namespaceIds,
    authenticationEpochId,
    createdSecret,
    context.verifierKey,
    context.verifierKeyId,
    context.expiresAt,
    occurredAt
  );
  context.onStage?.("before_audit");
  const auditEventId = randomUUID();
  await client.query(
    `INSERT INTO source_wire_memory.audit_events (
       event_id,
       occurred_at,
       trace_id,
       operation,
       result,
       actor_credential_id,
       actor_identity_id,
       actor_reference,
       owner_id,
       namespace_id,
       denial_code,
       metadata
     ) VALUES (
       $1, $2, $3, 'initialize_from_export', 'allowed', $4, $4,
       'operator', $5, NULL, NULL, $6
     )`,
    [
      auditEventId,
      occurredAt,
      randomUUID(),
      credential.credentialId,
      validated.ownerId,
      JSON.stringify({
        governedRecordCount: validated.governedRecordCount,
        logicalStateSha256: validated.logicalStateSha256,
        restoreReceiptId
      })
    ]
  );
  await insertRecoveryReplay(
    client,
    "portable_restore",
    context.operationKey,
    context.requestDigest,
    credential,
    restoreReceiptId,
    context.verifierKey,
    occurredAt
  );
  await assertGovernedInvariants(
    client,
    validated.ownerId,
    validated.namespaceIds
  );
  return {
    schemaVersion: ALPHA1_SCHEMA_VERSION,
    operation: "portable_restore",
    ownerId: validated.ownerId,
    namespaceIds: validated.namespaceIds,
    logicalStateSha256: validated.logicalStateSha256,
    governedRecordCount: validated.governedRecordCount,
    restoreReceiptId,
    ownerAdminCredential: credential,
    verificationRequired: true,
    replayed: false
  };
}

async function beginRecoveryTransaction(client: pg.PoolClient): Promise<void> {
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query("SET LOCAL statement_timeout = '90s'");
  await client.query(
    "SELECT pg_catalog.pg_advisory_xact_lock($1)",
    [INITIALIZATION_ADVISORY_LOCK]
  );
  await lockAuthenticationEpoch(client);
  await client.query("SET LOCAL ROLE source_wire_schema_owner");
  await requireCompatibleSchema(client);
}

async function lockAuthenticationEpoch(client: pg.PoolClient): Promise<void> {
  await client.query(
    `SELECT pg_catalog.pg_advisory_xact_lock(
       pg_catalog.hashtextextended($1, $2)
     )`,
    [AUTHENTICATION_EPOCH_LOCK_NAME, AUTHENTICATION_EPOCH_LOCK_NAMESPACE]
  );
}

async function requireCompatibleSchema(client: pg.PoolClient): Promise<void> {
  const compatibility = await inspectSchemaCompatibilityWithQueryable(client);
  if (!compatibility.compatible) throw new Error(compatibility.code);
}

async function assertNoRuntimeSessions(client: pg.PoolClient): Promise<void> {
  const sessions = await client.query<{ runtime_session_count: string }>(
    `SELECT count(*)::text AS runtime_session_count
       FROM pg_catalog.pg_stat_activity
      WHERE datname = pg_catalog.current_database()
        AND pid <> pg_catalog.pg_backend_pid()
        AND (
          usename = 'source_wire_runtime'
          OR application_name = 'source_wire_alpha1_runtime'
        )`
  );
  if (sessions.rows[0]?.runtime_session_count !== "0") {
    throw new Error("runtime_must_be_disabled");
  }
}

async function assertExactPortableRestoreTargetEmpty(
  client: pg.PoolClient
): Promise<void> {
  const counts = await client.query<Record<string, string>>(
    `SELECT
       (SELECT count(*) FROM source_wire_memory.owners)::text AS owners,
       (SELECT count(*) FROM source_wire_memory.namespaces)::text AS namespaces,
       (SELECT count(*) FROM source_wire_memory.actor_identities)::text AS actors,
       (SELECT count(*) FROM source_wire_memory.credentials)::text AS credentials,
       (SELECT count(*) FROM source_wire_memory.credential_namespace_grants)::text AS namespace_grants,
       (SELECT count(*) FROM source_wire_memory.credential_capability_grants)::text AS capability_grants,
       (SELECT count(*) FROM source_wire_memory.memory_candidates)::text AS candidates,
       (SELECT count(*) FROM source_wire_memory.candidate_provenance)::text AS candidate_provenance,
       (SELECT count(*) FROM source_wire_memory.candidate_decisions)::text AS decisions,
       (SELECT count(*) FROM source_wire_memory.trusted_memories)::text AS memories,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_revisions)::text AS revisions,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_provenance)::text AS trusted_provenance,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_lifecycle_events)::text AS lifecycle_events,
       (SELECT count(*) FROM source_wire_memory.audit_events)::text AS audits,
       (SELECT count(*) FROM source_wire_memory.protected_read_receipts)::text AS protected_receipts,
       (SELECT count(*) FROM source_wire_memory.protected_read_receipt_targets)::text AS receipt_targets,
       (SELECT count(*) FROM source_wire_memory.restore_receipts)::text AS restore_receipts,
       (SELECT count(*) FROM source_wire_memory.idempotency_records)::text AS idempotency_records,
       (SELECT count(*) FROM source_wire_memory.operator_initialization_records)::text AS initialization_records`
  );
  const row = counts.rows[0];
  if (!row || Object.values(row).some((value) => value !== "0")) {
    throw new Error("fresh_target_required");
  }
}

async function insertRecoveryCredential(
  client: pg.PoolClient,
  ownerId: string,
  namespaceIds: string[],
  authenticationEpochId: string,
  createdSecret: ReturnType<typeof createCredentialSecret>,
  verifierKey: Buffer,
  verifierKeyId: string,
  requestedExpiresAt: Date | undefined,
  issuedAt: Date
): Promise<RecoveryCredentialResult> {
  const expiresAt =
    requestedExpiresAt ??
    new Date(issuedAt.getTime() + OWNER_ADMIN_DEFAULT_TTL_MS);
  const ttl = expiresAt.getTime() - issuedAt.getTime();
  if (
    !Number.isFinite(expiresAt.getTime()) ||
    ttl <= 0 ||
    ttl > OWNER_ADMIN_MAX_TTL_MS
  ) {
    throw new Error("validation_failed:expiresAt");
  }
  const verifier = computeCredentialVerifier(verifierKey, createdSecret.token);
  await client.query(
    `INSERT INTO source_wire_memory.actor_identities (
       actor_identity_id, owner_id, actor_class, created_at
     ) VALUES ($1, $2, 'owner_admin', $3)`,
    [createdSecret.credentialId, ownerId, issuedAt]
  );
  await client.query(
    `INSERT INTO source_wire_memory.credentials (
       credential_id,
       display_prefix,
       credential_class,
       owner_id,
       actor_identity_id,
       authentication_epoch_id,
       status,
       issued_at,
       expires_at,
       verifier_algorithm,
       verifier_key_id,
       verifier
     ) VALUES (
       $1, $2, 'owner_admin', $3, $1, $4, 'active', $5, $6, $7, $8, $9
     )`,
    [
      createdSecret.credentialId,
      createdSecret.displayPrefix,
      ownerId,
      authenticationEpochId,
      issuedAt,
      expiresAt,
      CREDENTIAL_VERIFIER_ALGORITHM,
      verifierKeyId,
      verifier
    ]
  );
  await client.query(
    `INSERT INTO source_wire_memory.credential_namespace_grants (
       credential_id, namespace_id
     )
     SELECT $1, namespace_id
     FROM pg_catalog.unnest($2::varchar[]) AS namespace_id`,
    [createdSecret.credentialId, namespaceIds]
  );
  await client.query(
    `INSERT INTO source_wire_memory.credential_capability_grants (
       credential_id, capability
     )
     SELECT $1, capability
     FROM pg_catalog.unnest($2::varchar[]) AS capability`,
    [createdSecret.credentialId, [...OWNER_ADMIN_CAPABILITIES]]
  );
  return {
    credentialId: createdSecret.credentialId,
    displayPrefix: createdSecret.displayPrefix,
    secret: createdSecret.token,
    status: "active",
    expiresAt: expiresAt.toISOString()
  };
}

async function insertRecoveryReplay(
  client: pg.PoolClient,
  operation: RecoveryOperation,
  operationKey: string,
  requestDigest: string,
  credential: RecoveryCredentialResult,
  restoreReceiptId: string,
  verifierKey: Buffer,
  occurredAt: Date
): Promise<void> {
  const replayExpiresAt = new Date(
    occurredAt.getTime() + IDEMPOTENCY_REPLAY_WINDOW_MS
  );
  const replayContext: ReplayAuthenticatedContext = {
    actorCredentialId: credential.credentialId,
    operation,
    idempotencyKey: operationKey,
    requestDigest,
    replayExpiresAt: replayExpiresAt.toISOString()
  };
  const encrypted = encryptReplaySecret(
    deriveIdempotencyReplayKey(verifierKey),
    credential.secret,
    replayContext
  );
  await client.query(
    `INSERT INTO source_wire_memory.operator_initialization_records (
       operation,
       operation_key,
       request_digest,
       owner_admin_credential_id,
       restore_receipt_id,
       secret_algorithm,
       secret_nonce,
       secret_ciphertext,
       secret_auth_tag,
       replay_expires_at,
       created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      operation,
      operationKey,
      requestDigest,
      credential.credentialId,
      restoreReceiptId,
      SECRET_ALGORITHM,
      encrypted.nonce,
      encrypted.ciphertext,
      encrypted.tag,
      replayExpiresAt,
      occurredAt
    ]
  );
}

async function readRecoveryReplay(
  client: pg.PoolClient,
  operation: RecoveryOperation,
  operationKey: string,
  requestDigest: string,
  verifierKey: Buffer
): Promise<RecoveryResult | undefined> {
  const result = await client.query<{
    request_digest: string;
    owner_admin_credential_id: string;
    restore_receipt_id: string;
    secret_algorithm: string;
    secret_nonce: Buffer;
    secret_ciphertext: Buffer;
    secret_auth_tag: Buffer;
    replay_expires_at: Date;
    credential_id: string;
    display_prefix: string;
    status: string;
    expires_at: Date;
    owner_id: string;
    authentication_epoch_id: string;
    current_authentication_epoch_id: string;
    logical_state_sha256: string | null;
    governed_record_count: number;
    runtime_state: string;
  }>(
    `SELECT
       initialization.request_digest,
       initialization.owner_admin_credential_id,
       initialization.restore_receipt_id,
       initialization.secret_algorithm,
       initialization.secret_nonce,
       initialization.secret_ciphertext,
       initialization.secret_auth_tag,
       initialization.replay_expires_at,
       credential.credential_id,
       credential.display_prefix,
       credential.status,
       credential.expires_at,
       credential.owner_id,
       credential.authentication_epoch_id,
       installation.current_authentication_epoch_id,
       receipt.logical_state_sha256,
       receipt.governed_record_count,
       installation.runtime_state
     FROM source_wire_memory.operator_initialization_records AS initialization
     JOIN source_wire_memory.credentials AS credential
       ON credential.credential_id = initialization.owner_admin_credential_id
     JOIN source_wire_memory.restore_receipts AS receipt
       ON receipt.restore_receipt_id = initialization.restore_receipt_id
     JOIN source_wire_memory.installation_state AS installation
       ON installation.singleton = true
     WHERE initialization.operation = $1
       AND initialization.operation_key = $2
     FOR UPDATE OF initialization`,
    [operation, operationKey]
  );
  const row = result.rows[0];
  if (!row) return undefined;
  if (row.request_digest !== requestDigest) {
    throw new Error("idempotency_conflict");
  }
  if (
    row.secret_algorithm !== SECRET_ALGORITHM ||
    row.replay_expires_at.getTime() <= Date.now() ||
    row.status !== "active" ||
    row.authentication_epoch_id !== row.current_authentication_epoch_id ||
    row.expires_at.getTime() <= Date.now()
  ) {
    throw new Error("idempotency_replay_unavailable");
  }
  const replayContext: ReplayAuthenticatedContext = {
    actorCredentialId: row.owner_admin_credential_id,
    operation,
    idempotencyKey: operationKey,
    requestDigest,
    replayExpiresAt: row.replay_expires_at.toISOString()
  };
  const secret = decryptReplaySecret(
    deriveIdempotencyReplayKey(verifierKey),
    {
      ciphertext: row.secret_ciphertext,
      nonce: row.secret_nonce,
      tag: row.secret_auth_tag
    },
    replayContext
  );
  return {
    schemaVersion: ALPHA1_SCHEMA_VERSION,
    operation,
    ownerId: row.owner_id,
    namespaceIds: await readNamespaceIds(client, row.owner_id),
    logicalStateSha256: row.logical_state_sha256,
    governedRecordCount: row.governed_record_count,
    restoreReceiptId: row.restore_receipt_id,
    ownerAdminCredential: {
      credentialId: row.credential_id,
      displayPrefix: row.display_prefix,
      secret,
      status: "active",
      expiresAt: row.expires_at.toISOString()
    },
    verificationRequired: row.runtime_state === "verification_required",
    replayed: true
  };
}

async function readNamespaceIds(
  client: pg.PoolClient,
  ownerId: string
): Promise<string[]> {
  const result = await client.query<{ namespace_id: string }>(
    `SELECT namespace_id
       FROM source_wire_memory.namespaces
      WHERE owner_id = $1
      ORDER BY namespace_id`,
    [ownerId]
  );
  return result.rows.map((row) => row.namespace_id);
}

async function countGovernedRecords(
  client: pg.PoolClient,
  ownerId: string
): Promise<number> {
  const result = await client.query<{ governed_record_count: string }>(
    `SELECT (
       (SELECT count(*) FROM source_wire_memory.owners WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.namespaces WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.actor_identities WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.memory_candidates WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.candidate_provenance WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.candidate_decisions WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.trusted_memories WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.trusted_memory_revisions WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.trusted_memory_provenance WHERE owner_id = $1)
       + (SELECT count(*) FROM source_wire_memory.trusted_memory_lifecycle_events WHERE owner_id = $1)
       + (
           SELECT count(*)
           FROM source_wire_memory.audit_events
           WHERE owner_id = $1
             AND operation IN (
               'propose_memory_candidate',
               'decide_memory_candidate',
               'correct_trusted_memory',
               'revoke_trusted_memory',
               'initialize_from_export',
               'physical_recovery'
             )
             AND result = 'allowed'
         )
     )::text AS governed_record_count`,
    [ownerId]
  );
  const value = Number(result.rows[0]?.governed_record_count);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("recovery_target_invalid");
  }
  return value;
}

async function assertGovernedInvariants(
  client: pg.PoolClient,
  ownerId: string,
  namespaceIds: string[]
): Promise<void> {
  const result = await client.query<{
    invalid_actor_reference_count: string;
    invalid_candidate_count: string;
    invalid_decision_count: string;
    invalid_memory_count: string;
    invalid_revision_count: string;
    invalid_provenance_count: string;
    invalid_lifecycle_count: string;
  }>(
    `SELECT
       (
         SELECT count(*)::text
         FROM (
           SELECT proposed_by_actor_id AS actor_id
           FROM source_wire_memory.memory_candidates
           WHERE owner_id = $1
           UNION ALL
           SELECT decided_by_actor_id
           FROM source_wire_memory.memory_candidates
           WHERE owner_id = $1 AND decided_by_actor_id IS NOT NULL
           UNION ALL
           SELECT decided_by_actor_id
           FROM source_wire_memory.candidate_decisions
           WHERE owner_id = $1
           UNION ALL
           SELECT created_by_actor_id
           FROM source_wire_memory.trusted_memory_revisions
           WHERE owner_id = $1
           UNION ALL
           SELECT actor_identity_id
           FROM source_wire_memory.trusted_memory_lifecycle_events
           WHERE owner_id = $1
         ) AS reference
         LEFT JOIN source_wire_memory.actor_identities AS actor
           ON actor.actor_identity_id = reference.actor_id
          AND actor.owner_id = $1
         WHERE actor.actor_identity_id IS NULL
       ) AS invalid_actor_reference_count,
       (
         SELECT count(*)::text
         FROM source_wire_memory.memory_candidates AS candidate
         LEFT JOIN source_wire_memory.candidate_provenance AS provenance
           ON provenance.candidate_id = candidate.candidate_id
          AND provenance.owner_id = candidate.owner_id
          AND provenance.namespace_id = candidate.namespace_id
         WHERE candidate.owner_id = $1
           AND (
             candidate.namespace_id <> ALL($2::varchar[])
             OR provenance.candidate_id IS NULL
           )
       ) AS invalid_candidate_count,
       (
         SELECT count(*)::text
         FROM source_wire_memory.candidate_decisions AS decision
         JOIN source_wire_memory.memory_candidates AS candidate
           ON candidate.candidate_id = decision.candidate_id
         WHERE decision.owner_id = $1
           AND (
             decision.owner_id <> candidate.owner_id
             OR decision.namespace_id <> candidate.namespace_id
             OR (
               decision.decision = 'approve'
               AND candidate.state <> 'approved'
             )
             OR (
               decision.decision = 'reject'
               AND candidate.state <> 'rejected'
             )
           )
       ) AS invalid_decision_count,
       (
         SELECT count(*)::text
         FROM source_wire_memory.trusted_memories AS memory
         WHERE memory.owner_id = $1
           AND (
             memory.namespace_id <> ALL($2::varchar[])
             OR (
               memory.state = 'active'
               AND (
                 SELECT count(*)
                 FROM source_wire_memory.trusted_memory_revisions AS revision
                 WHERE revision.memory_id = memory.memory_id
                   AND revision.status = 'active'
               ) <> 1
             )
             OR (
               memory.state = 'revoked'
               AND EXISTS (
                 SELECT 1
                 FROM source_wire_memory.trusted_memory_revisions AS revision
                 WHERE revision.memory_id = memory.memory_id
                   AND revision.status = 'active'
               )
             )
           )
       ) AS invalid_memory_count,
       (
         SELECT count(*)::text
         FROM source_wire_memory.trusted_memory_revisions AS revision
         WHERE revision.owner_id = $1
           AND (
             revision.namespace_id <> ALL($2::varchar[])
             OR revision.revision_number <> (
               SELECT count(*)
               FROM source_wire_memory.trusted_memory_revisions AS prior
               WHERE prior.memory_id = revision.memory_id
                 AND prior.revision_number <= revision.revision_number
             )
           )
       ) AS invalid_revision_count,
       (
         SELECT count(*)::text
         FROM source_wire_memory.trusted_memory_provenance AS provenance
         JOIN source_wire_memory.trusted_memory_revisions AS revision
           ON revision.revision_id = provenance.revision_id
         WHERE provenance.owner_id = $1
           AND (
             provenance.owner_id <> revision.owner_id
             OR provenance.namespace_id <> revision.namespace_id
             OR provenance.memory_id <> revision.memory_id
           )
       ) AS invalid_provenance_count,
       (
         SELECT count(*)::text
         FROM source_wire_memory.trusted_memory_lifecycle_events AS event
         JOIN source_wire_memory.trusted_memories AS memory
           ON memory.memory_id = event.memory_id
         WHERE event.owner_id = $1
           AND (
             event.owner_id <> memory.owner_id
             OR event.namespace_id <> memory.namespace_id
           )
       ) AS invalid_lifecycle_count`
    ,
    [ownerId, namespaceIds]
  );
  const row = result.rows[0];
  if (!row || Object.values(row).some((value) => value !== "0")) {
    throw new Error("recovery_verification_failed");
  }
}

async function insertJsonRows(
  client: pg.PoolClient,
  records: PortableRecord[],
  sql: string,
  map: (record: PortableRecord) => Record<string, unknown>
): Promise<void> {
  if (records.length === 0) return;
  await client.query(sql, [JSON.stringify(records.map(map))]);
}

function snakeRecord(record: PortableRecord): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key.replace(/[A-Z]/gu, (character) => `_${character.toLowerCase()}`),
      value
    ])
  );
}

function assertWithinRestoreDeadline(startedAt: number): void {
  if (Date.now() - startedAt > PORTABLE_RESTORE_TIMEOUT_MS) {
    throw new Error("recovery_timeout");
  }
}
