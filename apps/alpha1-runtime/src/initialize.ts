import { randomUUID } from "node:crypto";

import type pg from "pg";

import {
  assertSourceWireIdentifier,
  STORY1_SCHEMA_VERSION
} from "./config.js";
import {
  computeCredentialVerifier,
  createCredentialSecret,
  CREDENTIAL_VERIFIER_ALGORITHM
} from "./credentials.js";
import { inspectSchemaCompatibilityWithQueryable } from "./migration.js";

const INITIALIZATION_ADVISORY_LOCK = 1_913_770_102;
const OWNER_ADMIN_DEFAULT_TTL_MS = 15 * 60 * 1_000;
const OWNER_ADMIN_MAX_TTL_MS = 60 * 60 * 1_000;

export type InitializeFreshTargetInput = {
  ownerId: string;
  namespaceIds: string[];
  verifierKey: Buffer;
  verifierKeyId: string;
  expiresAt?: Date;
};

export type InitializeFreshTargetResult = {
  schemaVersion: typeof STORY1_SCHEMA_VERSION;
  ownerId: string;
  namespaceIds: string[];
  ownerAdminCredential: {
    credentialId: string;
    displayPrefix: string;
    secret: string;
    status: "active";
    expiresAt: string;
  };
  auditEventId: string;
};

export async function initializeFreshTarget(
  pool: pg.Pool,
  input: InitializeFreshTargetInput
): Promise<InitializeFreshTargetResult> {
  const ownerId = assertSourceWireIdentifier(input.ownerId, "ownerId");
  const namespaceIds = validateNamespaceIds(input.namespaceIds);
  const verifierKeyId = assertSourceWireIdentifier(input.verifierKeyId, "verifierKeyId");
  const client = await pool.connect();
  let createdSecret: ReturnType<typeof createCredentialSecret> | undefined;

  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SET LOCAL lock_timeout = '2s'");
    await client.query("SET LOCAL statement_timeout = '2s'");
    await client.query("SELECT pg_advisory_xact_lock($1)", [INITIALIZATION_ADVISORY_LOCK]);
    await client.query("SET LOCAL ROLE source_wire_schema_owner");
    const compatibility = await inspectSchemaCompatibilityWithQueryable(client);
    if (!compatibility.compatible) {
      throw new Error(compatibility.code);
    }

    const counts = await client.query<{
      owner_count: string;
      namespace_count: string;
      credential_count: string;
      namespace_grant_count: string;
      capability_grant_count: string;
      audit_count: string;
      idempotency_count: string;
    }>(
      `SELECT
         (SELECT count(*) FROM source_wire_memory.owners)::text AS owner_count,
         (SELECT count(*) FROM source_wire_memory.namespaces)::text AS namespace_count,
         (SELECT count(*) FROM source_wire_memory.credentials)::text AS credential_count,
         (SELECT count(*) FROM source_wire_memory.credential_namespace_grants)::text AS namespace_grant_count,
         (SELECT count(*) FROM source_wire_memory.credential_capability_grants)::text AS capability_grant_count,
         (SELECT count(*) FROM source_wire_memory.audit_events)::text AS audit_count,
         (SELECT count(*) FROM source_wire_memory.idempotency_records)::text AS idempotency_count`
    );
    const current = counts.rows[0];
    if (
      !current ||
      Object.values(current).some((value) => value !== "0")
    ) {
      throw new Error("fresh_target_required");
    }

    const issuedAt = new Date();
    const expiresAt = input.expiresAt ?? new Date(issuedAt.getTime() + OWNER_ADMIN_DEFAULT_TTL_MS);
    const ttl = expiresAt.getTime() - issuedAt.getTime();
    if (ttl <= 0 || ttl > OWNER_ADMIN_MAX_TTL_MS) {
      throw new Error("validation_failed:expiresAt");
    }

    createdSecret = createCredentialSecret();
    const verifier = computeCredentialVerifier(input.verifierKey, createdSecret.token);
    const auditEventId = randomUUID();
    const traceId = randomUUID();

    await client.query(
      "INSERT INTO source_wire_memory.owners (owner_id) VALUES ($1)",
      [ownerId]
    );
    for (const namespaceId of namespaceIds) {
      await client.query(
        `INSERT INTO source_wire_memory.namespaces (namespace_id, owner_id)
         VALUES ($1, $2)`,
        [namespaceId, ownerId]
      );
    }
    await client.query(
      `INSERT INTO source_wire_memory.credentials (
         credential_id,
         display_prefix,
         credential_class,
         owner_id,
         status,
         issued_at,
         expires_at,
         verifier_algorithm,
         verifier_key_id,
         verifier
       ) VALUES ($1, $2, 'owner_admin', $3, 'active', $4, $5, $6, $7, $8)`,
      [
        createdSecret.credentialId,
        createdSecret.displayPrefix,
        ownerId,
        issuedAt,
        expiresAt,
        CREDENTIAL_VERIFIER_ALGORITHM,
        verifierKeyId,
        verifier
      ]
    );
    for (const namespaceId of namespaceIds) {
      await client.query(
        `INSERT INTO source_wire_memory.credential_namespace_grants
          (credential_id, namespace_id)
         VALUES ($1, $2)`,
        [createdSecret.credentialId, namespaceId]
      );
    }
    for (const capability of ["runtime.health", "credential.manage"]) {
      await client.query(
        `INSERT INTO source_wire_memory.credential_capability_grants
          (credential_id, capability)
         VALUES ($1, $2)`,
        [createdSecret.credentialId, capability]
      );
    }
    await client.query(
      `INSERT INTO source_wire_memory.audit_events (
         event_id,
         trace_id,
         operation,
         result,
         actor_credential_id,
         actor_reference,
         owner_id,
         metadata
       ) VALUES ($1, $2, 'initialize_fresh_target', 'allowed', NULL, 'operator', $3, $4)`,
      [auditEventId, traceId, ownerId, JSON.stringify({ namespaceCount: namespaceIds.length })]
    );
    await client.query("COMMIT");

    return {
      schemaVersion: STORY1_SCHEMA_VERSION,
      ownerId,
      namespaceIds,
      ownerAdminCredential: {
        credentialId: createdSecret.credentialId,
        displayPrefix: createdSecret.displayPrefix,
        secret: createdSecret.token,
        status: "active",
        expiresAt: expiresAt.toISOString()
      },
      auditEventId
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    createdSecret = undefined;
    throw error;
  } finally {
    client.release();
  }
}

function validateNamespaceIds(values: string[]): string[] {
  if (values.length < 2 || values.length > 64) {
    throw new Error("validation_failed:namespaceIds");
  }

  const namespaceIds = values.map((value) => assertSourceWireIdentifier(value, "namespaceId"));
  if (new Set(namespaceIds).size !== namespaceIds.length) {
    throw new Error("validation_failed:namespaceIds");
  }

  return namespaceIds;
}
