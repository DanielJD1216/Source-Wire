import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import type pg from "pg";

import {
  assertCapability,
  assertSourceWireIdentifier,
  STORY1_HARNESS_CAPABILITIES,
  type Story1Capability
} from "./config.js";
import {
  computeCredentialVerifier,
  createCredentialSecret,
  CREDENTIAL_VERIFIER_ALGORITHM,
  assertCredentialIdentifier,
  parseCredentialToken,
  performDummyVerifierComparison,
  verifierMatches
} from "./credentials.js";
import type { Story1Database } from "./database.js";
import {
  credentialCapabilityGrants,
  credentialNamespaceGrants,
  credentials,
  installationState
} from "./drizzle-schema.js";
import { SafeError } from "./errors.js";
import {
  canonicalRequestDigest,
  decryptReplaySecret,
  deriveIdempotencyReplayKey,
  encryptReplaySecret,
  IDEMPOTENCY_REPLAY_WINDOW_MS,
  type EncryptedReplaySecret,
  type ReplayAuthenticatedContext
} from "./idempotency.js";

const HARNESS_DEFAULT_TTL_MS = 60 * 60 * 1_000;
const HARNESS_MAX_TTL_MS = 24 * 60 * 60 * 1_000;

export type AuthenticatedCredential = {
  credentialId: string;
  credentialClass: "owner_admin" | "harness";
  status: "active" | "rotated";
  ownerId: string;
  actorIdentityId: string;
  authenticationEpochId: string;
  namespaceIds: string[];
  capabilities: Story1Capability[];
  issuedAt: Date;
  expiresAt: Date;
  actorReference: string;
};

export type IssuedCredential = {
  credentialId: string;
  displayPrefix: string;
  secret: string;
  credentialClass: "owner_admin" | "harness";
  namespaceIds: string[];
  capabilities: Story1Capability[];
  status: "active";
  issuedAt: string;
  expiresAt: string;
  rotatedFrom?: string;
};

export type AuditInput = {
  traceId: string;
  operation: string;
  result: "allowed" | "denied";
  actor?: AuthenticatedCredential;
  namespaceId?: string;
  denialCode?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function authenticateCredential(
  database: Story1Database,
  verifierKey: Buffer,
  verifierKeyId: string,
  authorization: string | undefined,
  options: {
    allowRotatedCredential?: boolean;
  } = {}
): Promise<AuthenticatedCredential> {
  if (!authorization) {
    throw new SafeError("authentication_required", 401);
  }
  if (!authorization.startsWith("Bearer ") || authorization.includes(",")) {
    performDummyVerifierComparison(verifierKey, authorization);
    throw new SafeError("credential_invalid", 401);
  }

  const exactToken = authorization.slice("Bearer ".length);
  const parsed = parseCredentialToken(exactToken);
  if (!parsed) {
    performDummyVerifierComparison(verifierKey, exactToken);
    throw new SafeError("credential_invalid", 401);
  }

  const [row] = await database.drizzle
    .select({
      credentialId: credentials.credentialId,
      credentialClass: credentials.credentialClass,
      ownerId: credentials.ownerId,
      actorIdentityId: credentials.actorIdentityId,
      authenticationEpochId: credentials.authenticationEpochId,
      status: credentials.status,
      issuedAt: credentials.issuedAt,
      expiresAt: credentials.expiresAt,
      verifierAlgorithm: credentials.verifierAlgorithm,
      verifierKeyId: credentials.verifierKeyId,
      verifier: credentials.verifier
    })
    .from(credentials)
    .where(eq(credentials.credentialId, parsed.credentialId))
    .limit(1);

  if (!row) {
    performDummyVerifierComparison(verifierKey, exactToken);
    throw new SafeError("credential_invalid", 401);
  }

  if (
    row.verifierAlgorithm !== CREDENTIAL_VERIFIER_ALGORITHM ||
    row.verifierKeyId !== verifierKeyId ||
    !verifierMatches(verifierKey, exactToken, row.verifier)
  ) {
    throw new SafeError("credential_invalid", 401);
  }
  const [state] = await database.drizzle
    .select({
      currentAuthenticationEpochId:
        installationState.currentAuthenticationEpochId
    })
    .from(installationState)
    .limit(1);
  if (
    !state ||
    row.authenticationEpochId !== state.currentAuthenticationEpochId
  ) {
    throw new SafeError("credential_revoked", 401);
  }
  if (row.status === "revoked") {
    throw new SafeError("credential_revoked", 401);
  }
  if (
    row.status !== "active" &&
    !(row.status === "rotated" && options.allowRotatedCredential === true)
  ) {
    if (row.status === "rotated") {
      throw new SafeError("credential_revoked", 401);
    }
    throw new SafeError("credential_invalid", 401);
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    throw new SafeError("credential_expired", 401);
  }
  if (row.credentialClass !== "owner_admin" && row.credentialClass !== "harness") {
    throw new SafeError("credential_invalid", 401);
  }

  const namespaceRows = await database.drizzle
    .select({ namespaceId: credentialNamespaceGrants.namespaceId })
    .from(credentialNamespaceGrants)
    .where(eq(credentialNamespaceGrants.credentialId, row.credentialId));
  const capabilityRows = await database.drizzle
    .select({ capability: credentialCapabilityGrants.capability })
    .from(credentialCapabilityGrants)
    .where(eq(credentialCapabilityGrants.credentialId, row.credentialId));
  const capabilities = capabilityRows.map((grant) => assertCapability(grant.capability));

  return {
    credentialId: row.credentialId,
    credentialClass: row.credentialClass,
    status: row.status,
    ownerId: row.ownerId,
    actorIdentityId: row.actorIdentityId,
    authenticationEpochId: row.authenticationEpochId,
    namespaceIds: namespaceRows.map((grant) => grant.namespaceId),
    capabilities,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    actorReference: `credential:${row.credentialId}`
  };
}

export function requireNamespace(
  credential: AuthenticatedCredential,
  namespaceId: unknown
): string {
  if (namespaceId === undefined || namespaceId === null || namespaceId === "") {
    throw new SafeError("namespace_required", 400);
  }

  let selected: string;
  try {
    selected = assertSourceWireIdentifier(namespaceId, "namespaceId");
  } catch {
    throw new SafeError("namespace_not_allowed", 403);
  }

  if (!credential.namespaceIds.includes(selected)) {
    throw new SafeError("namespace_not_allowed", 403);
  }

  return selected;
}

export function requireCapability(
  credential: AuthenticatedCredential,
  capability: Story1Capability
): void {
  if (!credential.capabilities.includes(capability)) {
    throw new SafeError("capability_not_allowed", 403);
  }
}

export function requireOwnerAdmin(credential: AuthenticatedCredential): void {
  if (credential.status !== "active") {
    throw new SafeError("credential_revoked", 401);
  }
  requireOwnerAdminAuthority(credential);
}

function requireOwnerAdminAuthority(credential: AuthenticatedCredential): void {
  if (credential.credentialClass !== "owner_admin") {
    throw new SafeError("capability_not_allowed", 403);
  }
  requireCapability(credential, "credential.manage");
}

export async function recordAudit(
  pool: pg.Pool,
  input: AuditInput
): Promise<string> {
  const eventId = randomUUID();
  await pool.query(
    `INSERT INTO source_wire_memory.audit_events (
       event_id,
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
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      eventId,
      input.traceId,
      input.operation,
      input.result,
      input.actor?.credentialId ?? null,
      input.actor?.actorIdentityId ?? null,
      input.actor?.actorReference ?? "unknown",
      input.actor?.ownerId ?? null,
      input.namespaceId ?? null,
      input.denialCode ?? null,
      JSON.stringify(input.metadata ?? {})
    ]
  );
  return eventId;
}

type IssuedCredentialWithoutSecret = Omit<IssuedCredential, "secret">;

type StoredSafeOutcome =
  | {
      kind: "issued_credential";
      targetCredentialId: string | null;
      credential: IssuedCredentialWithoutSecret;
    }
  | {
      kind: "revoked_credential";
      targetCredentialId: string;
      credentialId: string;
      status: "revoked";
    };

type PreparedCredentialMutation = {
  responseStatus: 200 | 201;
  safeOutcome: StoredSafeOutcome;
  secret?: string;
  auditMetadata: Record<string, string | number | boolean | null>;
};

type IdempotentMutationResult = {
  responseStatus: 200 | 201;
  safeOutcome: StoredSafeOutcome;
  auditEventId: string;
  replaySecret?: string;
};

type StoredIdempotencyRow = {
  request_digest: string;
  status: string;
  response_status: number;
  safe_outcome: unknown;
  audit_event_id: string;
  replay_expires_at: Date;
  secret_algorithm: string | null;
  secret_nonce: Buffer | null;
  secret_ciphertext: Buffer | null;
  secret_auth_tag: Buffer | null;
};

export async function issueHarnessCredential(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  verifierKey: Buffer,
  verifierKeyId: string,
  input: {
    namespaceIds: unknown;
    capabilities: unknown;
    expiresAt: unknown;
  },
  idempotencyKey: string,
  traceId: string
): Promise<{ credential: IssuedCredential; auditEventId: string }> {
  const namespaceIds = validateGrantList(input.namespaceIds, "namespaceIds", 32);
  const capabilities = validateHarnessCapabilities(input.capabilities);
  const expiresAt = validateHarnessExpiry(input.expiresAt);
  const operation = "issue_harness_credential";
  const requestDigest = canonicalRequestDigest({
    method: "POST",
    operation,
    targetCredentialId: null,
    expectedStatus: null,
    overlapPolicy: null,
    body: {
      namespaceIds,
      capabilities,
      expiresAt: expiresAt.toISOString()
    }
  });
  const result = await executeCredentialMutationIdempotently({
    pool,
    actor,
    operation,
    idempotencyKey,
    requestDigest,
    replayKey: deriveIdempotencyReplayKey(verifierKey),
    traceId,
    mutate: async (client) => {
      const allowed = new Set(actor.namespaceIds);
      if (namespaceIds.some((namespaceId) => !allowed.has(namespaceId))) {
        throw new SafeError("namespace_not_allowed", 403);
      }

      const namespaceResult = await client.query<{ namespace_id: string }>(
        `SELECT namespace_id
           FROM source_wire_memory.namespaces
          WHERE owner_id = $1
            AND namespace_id = ANY($2::varchar[])`,
        [actor.ownerId, namespaceIds]
      );
      if (namespaceResult.rowCount !== namespaceIds.length) {
        throw new SafeError("namespace_not_allowed", 403);
      }

      const issuedAt = new Date();
      const secret = createCredentialSecret();
      const verifier = computeCredentialVerifier(verifierKey, secret.token);
      const epoch = await client.query<{
        current_authentication_epoch_id: string;
      }>(
        `SELECT current_authentication_epoch_id
           FROM source_wire_memory.installation_state
          WHERE singleton = true`
      );
      const authenticationEpochId =
        epoch.rows[0]?.current_authentication_epoch_id;
      if (!authenticationEpochId) {
        throw new SafeError("operation_unavailable", 503, true);
      }
      await client.query(
        `INSERT INTO source_wire_memory.actor_identities (
           actor_identity_id,
           owner_id,
           actor_class,
           created_at
         ) VALUES ($1, $2, 'harness', $3)`,
        [secret.credentialId, actor.ownerId, issuedAt]
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
           created_by,
           verifier_algorithm,
           verifier_key_id,
           verifier
         ) VALUES (
           $1, $2, 'harness', $3, $4, $5, 'active', $6, $7, $8, $9, $10, $11
         )`,
        [
          secret.credentialId,
          secret.displayPrefix,
          actor.ownerId,
          secret.credentialId,
          authenticationEpochId,
          issuedAt,
          expiresAt,
          actor.credentialId,
          CREDENTIAL_VERIFIER_ALGORITHM,
          verifierKeyId,
          verifier
        ]
      );
      await insertGrants(client, secret.credentialId, namespaceIds, capabilities);
      return {
        responseStatus: 201,
        safeOutcome: {
          kind: "issued_credential",
          targetCredentialId: null,
          credential: {
            credentialId: secret.credentialId,
            displayPrefix: secret.displayPrefix,
            credentialClass: "harness",
            namespaceIds,
            capabilities,
            status: "active",
            issuedAt: issuedAt.toISOString(),
            expiresAt: expiresAt.toISOString()
          }
        },
        secret: secret.token,
        auditMetadata: {
          namespaceCount: namespaceIds.length,
          capabilityCount: capabilities.length
        }
      };
    }
  });
  if (result.safeOutcome.kind !== "issued_credential" || !result.replaySecret) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return {
    credential: {
      ...result.safeOutcome.credential,
      secret: result.replaySecret
    },
    auditEventId: result.auditEventId
  };
}

export async function rotateHarnessCredential(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  verifierKey: Buffer,
  verifierKeyId: string,
  targetCredentialId: string,
  idempotencyKey: string,
  traceId: string
): Promise<{ credential: IssuedCredential; auditEventId: string }> {
  return rotateCredential(
    pool,
    actor,
    verifierKey,
    verifierKeyId,
    targetCredentialId,
    idempotencyKey,
    traceId,
    "harness"
  );
}

export async function rotateCredential(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  verifierKey: Buffer,
  verifierKeyId: string,
  targetCredentialId: string,
  idempotencyKey: string,
  traceId: string,
  requiredClass?: "owner_admin" | "harness"
): Promise<{ credential: IssuedCredential; auditEventId: string }> {
  try {
    assertCredentialIdentifier(targetCredentialId);
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  const operation = "rotate_credential";
  const requestDigest = canonicalRequestDigest({
    method: "POST",
    operation,
    targetCredentialId,
    expectedStatus: "active",
    overlapPolicy: "zero",
    body: {
      requiredCredentialClass: requiredClass ?? null
    }
  });
  const result = await executeCredentialMutationIdempotently({
    pool,
    actor,
    operation,
    idempotencyKey,
    requestDigest,
    replayKey: deriveIdempotencyReplayKey(verifierKey),
    traceId,
    mutate: async (client) => {
      await lockCredentialForMutation(client, targetCredentialId);
      const target = await client.query<{
        credential_id: string;
        owner_id: string;
        credential_class: string;
        status: string;
        expires_at: Date;
        actor_identity_id: string;
        authentication_epoch_id: string;
        current_authentication_epoch_id: string;
      }>(
        `SELECT
           credential.credential_id,
           credential.owner_id,
           credential.credential_class,
           credential.status,
           credential.expires_at,
           credential.actor_identity_id,
           credential.authentication_epoch_id,
           installation.current_authentication_epoch_id
           FROM source_wire_memory.credentials AS credential
           CROSS JOIN source_wire_memory.installation_state AS installation
          WHERE credential.credential_id = $1
            AND installation.singleton = true
          FOR UPDATE OF credential`,
        [targetCredentialId]
      );
      const row = target.rows[0];
      if (
        !row ||
        row.owner_id !== actor.ownerId ||
        (row.credential_class !== "harness" && row.credential_class !== "owner_admin") ||
        (requiredClass !== undefined && row.credential_class !== requiredClass) ||
        row.status !== "active" ||
        row.authentication_epoch_id !== row.current_authentication_epoch_id ||
        row.expires_at.getTime() <= Date.now()
      ) {
        throw new SafeError("state_conflict", 409);
      }

      const namespaceResult = await client.query<{ namespace_id: string }>(
        `SELECT namespace_id
           FROM source_wire_memory.credential_namespace_grants
          WHERE credential_id = $1
          ORDER BY namespace_id`,
        [targetCredentialId]
      );
      const capabilityResult = await client.query<{ capability: Story1Capability }>(
        `SELECT capability
           FROM source_wire_memory.credential_capability_grants
          WHERE credential_id = $1
          ORDER BY capability`,
        [targetCredentialId]
      );
      const namespaceIds = namespaceResult.rows.map((grant) => grant.namespace_id);
      const capabilities = capabilityResult.rows.map((grant) =>
        assertCapability(grant.capability)
      );
      const issuedAt = new Date();
      const secret = createCredentialSecret();
      const verifier = computeCredentialVerifier(verifierKey, secret.token);

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
           rotated_from,
           created_by,
           verifier_algorithm,
           verifier_key_id,
           verifier
         ) VALUES (
           $1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, $11, $12, $13
         )`,
        [
          secret.credentialId,
          secret.displayPrefix,
          row.credential_class,
          actor.ownerId,
          row.actor_identity_id,
          row.current_authentication_epoch_id,
          issuedAt,
          row.expires_at,
          targetCredentialId,
          actor.credentialId,
          CREDENTIAL_VERIFIER_ALGORITHM,
          verifierKeyId,
          verifier
        ]
      );
      await insertGrants(client, secret.credentialId, namespaceIds, capabilities);
      await client.query(
        `UPDATE source_wire_memory.credentials
            SET status = 'rotated', rotated_to = $1, updated_at = clock_timestamp()
          WHERE credential_id = $2`,
        [secret.credentialId, targetCredentialId]
      );

      return {
        responseStatus: 200,
        safeOutcome: {
          kind: "issued_credential",
          targetCredentialId,
          credential: {
            credentialId: secret.credentialId,
            displayPrefix: secret.displayPrefix,
            credentialClass: row.credential_class,
            namespaceIds,
            capabilities,
            status: "active",
            issuedAt: issuedAt.toISOString(),
            expiresAt: row.expires_at.toISOString(),
            rotatedFrom: targetCredentialId
          }
        },
        secret: secret.token,
        auditMetadata: { zeroOverlap: true }
      };
    }
  });
  if (result.safeOutcome.kind !== "issued_credential" || !result.replaySecret) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return {
    credential: {
      ...result.safeOutcome.credential,
      secret: result.replaySecret
    },
    auditEventId: result.auditEventId
  };
}

export async function revokeCredential(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  verifierKey: Buffer,
  targetCredentialId: string,
  idempotencyKey: string,
  traceId: string
): Promise<{ credentialId: string; status: "revoked"; auditEventId: string }> {
  try {
    assertCredentialIdentifier(targetCredentialId);
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  if (targetCredentialId === actor.credentialId) {
    throw new SafeError("state_conflict", 409);
  }
  const operation = "revoke_credential";
  const requestDigest = canonicalRequestDigest({
    method: "POST",
    operation,
    targetCredentialId,
    expectedStatus: "active",
    overlapPolicy: null,
    body: {
      expectedStatus: "active"
    }
  });
  const result = await executeCredentialMutationIdempotently({
    pool,
    actor,
    operation,
    idempotencyKey,
    requestDigest,
    replayKey: deriveIdempotencyReplayKey(verifierKey),
    traceId,
    mutate: async (client) => {
      await lockCredentialForMutation(client, targetCredentialId);
      const update = await client.query<{ credential_id: string }>(
        `UPDATE source_wire_memory.credentials
            SET status = 'revoked', updated_at = clock_timestamp()
          WHERE credential_id = $1
            AND owner_id = $2
            AND status = 'active'
        RETURNING credential_id`,
        [targetCredentialId, actor.ownerId]
      );
      if (update.rowCount !== 1) {
        throw new SafeError("state_conflict", 409);
      }

      return {
        responseStatus: 200,
        safeOutcome: {
          kind: "revoked_credential",
          targetCredentialId,
          credentialId: targetCredentialId,
          status: "revoked"
        },
        auditMetadata: {}
      };
    }
  });
  if (result.safeOutcome.kind !== "revoked_credential") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return {
    credentialId: result.safeOutcome.credentialId,
    status: result.safeOutcome.status,
    auditEventId: result.auditEventId
  };
}

async function executeCredentialMutationIdempotently(input: {
  pool: pg.Pool;
  actor: AuthenticatedCredential;
  operation:
    | "issue_harness_credential"
    | "rotate_credential"
    | "revoke_credential";
  idempotencyKey: string;
  requestDigest: string;
  replayKey: Buffer;
  traceId: string;
  mutate: (client: pg.PoolClient) => Promise<PreparedCredentialMutation>;
}): Promise<IdempotentMutationResult> {
  requireOwnerAdminAuthority(input.actor);
  const client = await input.pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `SELECT pg_catalog.pg_advisory_xact_lock_shared(
         pg_catalog.hashtextextended(
           'source_wire_story4_authentication_epoch',
           1913770104
         )
       )`
    );
    await lockCredentialForMutation(client, input.actor.credentialId);
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 1913770104))",
      [`${input.actor.credentialId}|${input.operation}|${input.idempotencyKey}`]
    );
    const existing = await client.query<StoredIdempotencyRow>(
      `SELECT
         request_digest,
         status,
         response_status,
         safe_outcome,
         audit_event_id,
         replay_expires_at,
         secret_algorithm,
         secret_nonce,
         secret_ciphertext,
         secret_auth_tag
       FROM source_wire_memory.idempotency_records
       WHERE actor_credential_id = $1
         AND operation = $2
         AND idempotency_key = $3`,
      [input.actor.credentialId, input.operation, input.idempotencyKey]
    );
    const row = existing.rows[0];
    if (row) {
      const result = replayStoredMutation(input, row);
      await client.query("COMMIT");
      return result;
    }

    if (input.actor.status !== "active") {
      throw new SafeError("credential_revoked", 401);
    }
    requireOwnerAdmin(input.actor);

    const prepared = await input.mutate(client);
    const auditEventId = await insertAuditWithClient(client, {
      traceId: input.traceId,
      operation: input.operation,
      result: "allowed",
      actor: input.actor,
      metadata: prepared.auditMetadata
    });
    const createdAt = new Date();
    const replayExpiresAt = new Date(
      createdAt.getTime() + IDEMPOTENCY_REPLAY_WINDOW_MS
    );
    const replayContext = createReplayContext(
      input,
      replayExpiresAt.toISOString()
    );
    const encrypted = prepared.secret
      ? encryptReplaySecret(input.replayKey, prepared.secret, replayContext)
      : undefined;

    await client.query(
      `INSERT INTO source_wire_memory.idempotency_records (
         actor_credential_id,
         operation,
         idempotency_key,
         request_digest,
         status,
         response_status,
         safe_outcome,
         audit_event_id,
         replay_expires_at,
         secret_algorithm,
         secret_nonce,
         secret_ciphertext,
         secret_auth_tag,
         created_at
       ) VALUES (
         $1, $2, $3, $4, 'completed', $5, $6, $7, $8,
         $9, $10, $11, $12, $13
       )`,
      [
        input.actor.credentialId,
        input.operation,
        input.idempotencyKey,
        input.requestDigest,
        prepared.responseStatus,
        JSON.stringify(prepared.safeOutcome),
        auditEventId,
        replayExpiresAt,
        encrypted ? "aes-256-gcm-hkdf-sha256-v1" : null,
        encrypted?.nonce ?? null,
        encrypted?.ciphertext ?? null,
        encrypted?.tag ?? null,
        createdAt
      ]
    );
    await client.query("COMMIT");

    return {
      responseStatus: prepared.responseStatus,
      safeOutcome: prepared.safeOutcome,
      auditEventId,
      ...(prepared.secret ? { replaySecret: prepared.secret } : {})
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function lockCredentialForMutation(
  client: pg.PoolClient,
  credentialId: string
): Promise<void> {
  await client.query(
    `SELECT pg_catalog.pg_advisory_xact_lock(
       pg_catalog.hashtextextended($1, 1913770104)
     )`,
    [`source_wire_story4_credential:${credentialId}`]
  );
}

function replayStoredMutation(
  input: {
    actor: AuthenticatedCredential;
    operation:
      | "issue_harness_credential"
      | "rotate_credential"
      | "revoke_credential";
    idempotencyKey: string;
    requestDigest: string;
    replayKey: Buffer;
  },
  row: StoredIdempotencyRow
): IdempotentMutationResult {
  if (row.status !== "completed" || (row.response_status !== 200 && row.response_status !== 201)) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  if (row.request_digest !== input.requestDigest) {
    throw new SafeError("idempotency_conflict", 409);
  }
  if (row.replay_expires_at.getTime() <= Date.now()) {
    throw new SafeError("idempotency_conflict", 409);
  }

  const safeOutcome = parseStoredSafeOutcome(row.safe_outcome);
  if (
    input.actor.status === "rotated" &&
    !(
      input.operation === "rotate_credential" &&
      safeOutcome.kind === "issued_credential" &&
      safeOutcome.targetCredentialId === input.actor.credentialId
    )
  ) {
    throw new SafeError("credential_revoked", 401);
  }

  const encrypted = readEncryptedReplaySecret(row);
  const replaySecret = encrypted
    ? decryptReplaySecret(
        input.replayKey,
        encrypted,
        createReplayContext(input, row.replay_expires_at.toISOString())
      )
    : undefined;

  return {
    responseStatus: row.response_status,
    safeOutcome,
    auditEventId: row.audit_event_id,
    ...(replaySecret ? { replaySecret } : {})
  };
}

function createReplayContext(
  input: {
    actor: AuthenticatedCredential;
    operation: string;
    idempotencyKey: string;
    requestDigest: string;
  },
  replayExpiresAt: string
): ReplayAuthenticatedContext {
  return {
    actorCredentialId: input.actor.credentialId,
    operation: input.operation,
    idempotencyKey: input.idempotencyKey,
    requestDigest: input.requestDigest,
    replayExpiresAt
  };
}

function readEncryptedReplaySecret(
  row: StoredIdempotencyRow
): EncryptedReplaySecret | undefined {
  const values = [
    row.secret_algorithm,
    row.secret_nonce,
    row.secret_ciphertext,
    row.secret_auth_tag
  ];
  if (values.every((value) => value === null)) {
    return undefined;
  }
  if (
    row.secret_algorithm !== "aes-256-gcm-hkdf-sha256-v1" ||
    !row.secret_nonce ||
    !row.secret_ciphertext ||
    !row.secret_auth_tag
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }

  return {
    nonce: row.secret_nonce,
    ciphertext: row.secret_ciphertext,
    tag: row.secret_auth_tag
  };
}

function parseStoredSafeOutcome(value: unknown): StoredSafeOutcome {
  if (!value || typeof value !== "object") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const outcome = value as Partial<StoredSafeOutcome>;
  if (outcome.kind !== "issued_credential" && outcome.kind !== "revoked_credential") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return outcome as StoredSafeOutcome;
}

async function insertGrants(
  client: pg.PoolClient,
  credentialId: string,
  namespaceIds: string[],
  capabilities: Story1Capability[]
): Promise<void> {
  for (const namespaceId of namespaceIds) {
    await client.query(
      `INSERT INTO source_wire_memory.credential_namespace_grants
        (credential_id, namespace_id)
       VALUES ($1, $2)`,
      [credentialId, namespaceId]
    );
  }
  for (const capability of capabilities) {
    await client.query(
      `INSERT INTO source_wire_memory.credential_capability_grants
        (credential_id, capability)
       VALUES ($1, $2)`,
      [credentialId, capability]
    );
  }
}

async function insertAuditWithClient(
  client: pg.PoolClient,
  input: AuditInput
): Promise<string> {
  const eventId = randomUUID();
  await client.query(
    `INSERT INTO source_wire_memory.audit_events (
       event_id,
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
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      eventId,
      input.traceId,
      input.operation,
      input.result,
      input.actor?.credentialId ?? null,
      input.actor?.actorIdentityId ?? null,
      input.actor?.actorReference ?? "unknown",
      input.actor?.ownerId ?? null,
      input.namespaceId ?? null,
      input.denialCode ?? null,
      JSON.stringify(input.metadata ?? {})
    ]
  );
  return eventId;
}

function validateGrantList(value: unknown, field: string, maximum: number): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum) {
    throw new SafeError("validation_failed", 400);
  }

  let identifiers: string[];
  try {
    identifiers = value.map((item) => assertSourceWireIdentifier(item, field));
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  if (new Set(identifiers).size !== identifiers.length) {
    throw new SafeError("validation_failed", 400);
  }
  return identifiers.sort();
}

function validateHarnessCapabilities(value: unknown): Story1Capability[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > STORY1_HARNESS_CAPABILITIES.length) {
    throw new SafeError("validation_failed", 400);
  }

  let capabilities: Story1Capability[];
  try {
    capabilities = value.map((item) => assertCapability(item));
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  if (
    new Set(capabilities).size !== capabilities.length ||
    capabilities.some(
      (capability) =>
        !STORY1_HARNESS_CAPABILITIES.includes(
          capability as (typeof STORY1_HARNESS_CAPABILITIES)[number]
        )
    )
  ) {
    throw new SafeError("validation_failed", 400);
  }
  return capabilities.sort();
}

function validateHarnessExpiry(value: unknown): Date {
  if (typeof value !== "string") {
    throw new SafeError("validation_failed", 400);
  }
  const expiresAt = new Date(value);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.toISOString() !== value) {
    throw new SafeError("validation_failed", 400);
  }
  const ttl = expiresAt.getTime() - Date.now();
  if (ttl <= 0 || ttl > HARNESS_MAX_TTL_MS) {
    throw new SafeError("validation_failed", 400);
  }
  if (ttl < 1 && HARNESS_DEFAULT_TTL_MS > 0) {
    throw new SafeError("validation_failed", 400);
  }
  return expiresAt;
}
