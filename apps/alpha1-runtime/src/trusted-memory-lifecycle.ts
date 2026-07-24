import { randomUUID } from "node:crypto";

import type pg from "pg";

import {
  assertIdempotencyKey,
  assertSourceWireIdentifier,
  MAX_CANDIDATE_CONTENT_BYTES,
  MAX_DECISION_REASON_BYTES,
  STORY1_API_SCHEMA
} from "./config.js";
import { SafeError } from "./errors.js";
import { canonicalRequestDigest } from "./idempotency.js";
import type { AuthenticatedCredential } from "./repository.js";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export type TrustedMemoryCorrection = {
  memoryId: string;
  namespaceId: string;
  expectedRevisionId: string;
  content: string;
  contentByteCount: number;
  reason: string;
  idempotencyKey: string;
};

export type TrustedMemoryRevocation = {
  memoryId: string;
  namespaceId: string;
  expectedRevisionId: string;
  reason: string;
  idempotencyKey: string;
};

export type TrustedMemoryCorrectionResult = {
  memoryId: string;
  previousRevisionId: string;
  revisionId: string;
  revisionNumber: number;
  state: "active";
  correctedAt: string;
  auditEventId: string;
};

export type TrustedMemoryRevocationResult = {
  memoryId: string;
  revisionId: string;
  state: "revoked";
  revokedAt: string;
  auditEventId: string;
};

export type TrustedMemoryLifecycleDigestInput = {
  apiSchema: typeof STORY1_API_SCHEMA;
  method: "POST";
  operation: "correct_trusted_memory" | "revoke_trusted_memory";
  actorCredentialId: string;
  actorIdentityId: string;
  ownerId: string;
  namespaceId: string;
  memoryId: string;
  expectedRevisionId: string;
  content?: string;
  reason: string;
  idempotencyKey: string;
};

type CorrectionOutcome = {
  kind: "trusted_memory_correction";
  memoryId: string;
  previousRevisionId: string;
  revisionId: string;
  revisionNumber: number;
  state: "active";
  correctedAt: string;
};

type RevocationOutcome = {
  kind: "trusted_memory_revocation";
  memoryId: string;
  revisionId: string;
  state: "revoked";
  revokedAt: string;
};

type LifecycleOutcome = CorrectionOutcome | RevocationOutcome;

type StoredLifecycleRow = {
  request_digest: string;
  status: string;
  response_status: number;
  safe_outcome: unknown;
  audit_event_id: string;
};

export function parseTrustedMemoryCorrection(
  memoryId: unknown,
  value: unknown
): TrustedMemoryCorrection {
  const record = requireExactObject(value, [
    "namespaceId",
    "expectedRevisionId",
    "content",
    "reason",
    "idempotencyKey"
  ]);
  return {
    memoryId: validateUuid(memoryId),
    namespaceId: validateIdentifier(record.namespaceId, "namespaceId"),
    expectedRevisionId: validateUuid(record.expectedRevisionId),
    content: validateBoundedText(
      record.content,
      MAX_CANDIDATE_CONTENT_BYTES
    ),
    contentByteCount: Buffer.byteLength(String(record.content), "utf8"),
    reason: validateBoundedText(record.reason, MAX_DECISION_REASON_BYTES),
    idempotencyKey: validateIdempotencyKey(record.idempotencyKey)
  };
}

export function parseTrustedMemoryRevocation(
  memoryId: unknown,
  value: unknown
): TrustedMemoryRevocation {
  const record = requireExactObject(value, [
    "namespaceId",
    "expectedRevisionId",
    "reason",
    "idempotencyKey"
  ]);
  return {
    memoryId: validateUuid(memoryId),
    namespaceId: validateIdentifier(record.namespaceId, "namespaceId"),
    expectedRevisionId: validateUuid(record.expectedRevisionId),
    reason: validateBoundedText(record.reason, MAX_DECISION_REASON_BYTES),
    idempotencyKey: validateIdempotencyKey(record.idempotencyKey)
  };
}

export function canonicalTrustedMemoryLifecycleDigest(
  input: TrustedMemoryLifecycleDigestInput
): string {
  return canonicalRequestDigest(input);
}

export async function correctTrustedMemory(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  input: TrustedMemoryCorrection,
  traceId: string
): Promise<TrustedMemoryCorrectionResult> {
  requireLifecycleAuthority(actor, input.namespaceId, "trusted_memory.correct");
  const operation = "correct_trusted_memory" as const;
  const requestDigest = canonicalTrustedMemoryLifecycleDigest({
    apiSchema: STORY1_API_SCHEMA,
    method: "POST",
    operation,
    actorCredentialId: actor.credentialId,
    actorIdentityId: actor.actorIdentityId,
    ownerId: actor.ownerId,
    namespaceId: input.namespaceId,
    memoryId: input.memoryId,
    expectedRevisionId: input.expectedRevisionId,
    content: input.content,
    reason: input.reason,
    idempotencyKey: input.idempotencyKey
  });
  const result = await executeMutation({
    pool,
    actor,
    namespaceId: input.namespaceId,
    operation,
    idempotencyKey: input.idempotencyKey,
    requestDigest,
    traceId,
    mutate: async (client) => {
      const revisionId = randomUUID();
      const lifecycleEventId = randomUUID();
      const correctedAt = new Date();
      const mutation = await client.query<{ revision_number: number }>(
        `SELECT source_wire_memory.apply_trusted_memory_correction(
           $1::uuid,
           $2::varchar,
           $3::varchar,
           $4::uuid,
           $5::uuid,
           $6::uuid,
           $7::text,
           $8::integer,
           $9::text,
           $10::uuid,
           $11::timestamptz
         ) AS revision_number`,
        [
          actor.credentialId,
          actor.ownerId,
          input.namespaceId,
          input.memoryId,
          input.expectedRevisionId,
          revisionId,
          input.content,
          input.contentByteCount,
          input.reason,
          lifecycleEventId,
          correctedAt
        ]
      );
      const revisionNumber = mutation.rows[0]?.revision_number ?? 0;
      if (revisionNumber < 1) {
        throw new SafeError("revision_conflict", 409);
      }
      return {
        outcome: {
          kind: "trusted_memory_correction" as const,
          memoryId: input.memoryId,
          previousRevisionId: input.expectedRevisionId,
          revisionId,
          revisionNumber,
          state: "active" as const,
          correctedAt: correctedAt.toISOString()
        },
        auditMetadata: {
          memoryId: input.memoryId,
          expectedRevisionId: input.expectedRevisionId,
          resultingRevisionId: revisionId,
          lifecycleState: "active"
        }
      };
    }
  });
  if (result.outcome.kind !== "trusted_memory_correction") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return {
    memoryId: result.outcome.memoryId,
    previousRevisionId: result.outcome.previousRevisionId,
    revisionId: result.outcome.revisionId,
    revisionNumber: result.outcome.revisionNumber,
    state: result.outcome.state,
    correctedAt: result.outcome.correctedAt,
    auditEventId: result.auditEventId
  };
}

export async function revokeTrustedMemory(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  input: TrustedMemoryRevocation,
  traceId: string
): Promise<TrustedMemoryRevocationResult> {
  requireLifecycleAuthority(actor, input.namespaceId, "trusted_memory.revoke");
  const operation = "revoke_trusted_memory" as const;
  const requestDigest = canonicalTrustedMemoryLifecycleDigest({
    apiSchema: STORY1_API_SCHEMA,
    method: "POST",
    operation,
    actorCredentialId: actor.credentialId,
    actorIdentityId: actor.actorIdentityId,
    ownerId: actor.ownerId,
    namespaceId: input.namespaceId,
    memoryId: input.memoryId,
    expectedRevisionId: input.expectedRevisionId,
    reason: input.reason,
    idempotencyKey: input.idempotencyKey
  });
  const result = await executeMutation({
    pool,
    actor,
    namespaceId: input.namespaceId,
    operation,
    idempotencyKey: input.idempotencyKey,
    requestDigest,
    traceId,
    mutate: async (client) => {
      const lifecycleEventId = randomUUID();
      const revokedAt = new Date();
      const mutation = await client.query<{ revoked: boolean }>(
        `SELECT source_wire_memory.apply_trusted_memory_revocation(
           $1::uuid,
           $2::varchar,
           $3::varchar,
           $4::uuid,
           $5::uuid,
           $6::text,
           $7::uuid,
           $8::timestamptz
         ) AS revoked`,
        [
          actor.credentialId,
          actor.ownerId,
          input.namespaceId,
          input.memoryId,
          input.expectedRevisionId,
          input.reason,
          lifecycleEventId,
          revokedAt
        ]
      );
      if (mutation.rows[0]?.revoked !== true) {
        throw new SafeError("revision_conflict", 409);
      }
      return {
        outcome: {
          kind: "trusted_memory_revocation" as const,
          memoryId: input.memoryId,
          revisionId: input.expectedRevisionId,
          state: "revoked" as const,
          revokedAt: revokedAt.toISOString()
        },
        auditMetadata: {
          memoryId: input.memoryId,
          expectedRevisionId: input.expectedRevisionId,
          resultingRevisionId: input.expectedRevisionId,
          lifecycleState: "revoked"
        }
      };
    }
  });
  if (result.outcome.kind !== "trusted_memory_revocation") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return {
    memoryId: result.outcome.memoryId,
    revisionId: result.outcome.revisionId,
    state: result.outcome.state,
    revokedAt: result.outcome.revokedAt,
    auditEventId: result.auditEventId
  };
}

async function executeMutation(input: {
  pool: pg.Pool;
  actor: AuthenticatedCredential;
  namespaceId: string;
  operation: "correct_trusted_memory" | "revoke_trusted_memory";
  idempotencyKey: string;
  requestDigest: string;
  traceId: string;
  mutate: (client: pg.PoolClient) => Promise<{
    outcome: LifecycleOutcome;
    auditMetadata: Record<string, string | number | boolean | null>;
  }>;
}): Promise<{ outcome: LifecycleOutcome; auditEventId: string }> {
  const client = await input.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '2s'");
    await client.query("SET LOCAL statement_timeout = '2s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 1913770106))",
      [`${input.actor.credentialId}|${input.operation}|${input.idempotencyKey}`]
    );
    const existing = await client.query<StoredLifecycleRow>(
      `SELECT request_digest, status, response_status, safe_outcome, audit_event_id
         FROM source_wire_memory.idempotency_records
        WHERE actor_credential_id = $1
          AND operation = $2
          AND idempotency_key = $3`,
      [input.actor.credentialId, input.operation, input.idempotencyKey]
    );
    const stored = existing.rows[0];
    if (stored) {
      if (stored.request_digest !== input.requestDigest) {
        throw new SafeError("idempotency_conflict", 409);
      }
      if (stored.status !== "completed" || stored.response_status !== 200) {
        throw new SafeError("operation_unavailable", 503, true);
      }
      const outcome = parseStoredOutcome(stored.safe_outcome, input.operation);
      await client.query("COMMIT");
      return { outcome, auditEventId: stored.audit_event_id };
    }

    const prepared = await input.mutate(client);
    const auditEventId = randomUUID();
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
         metadata
       ) VALUES ($1, $2, $3, 'allowed', $4, $5, $6, $7, $8, $9)`,
      [
        auditEventId,
        input.traceId,
        input.operation,
        input.actor.credentialId,
        input.actor.actorIdentityId,
        input.actor.actorReference,
        input.actor.ownerId,
        input.namespaceId,
        JSON.stringify(prepared.auditMetadata)
      ]
    );
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
         created_at
       ) VALUES (
         $1, $2, $3, $4, 'completed', 200, $5, $6, 'infinity'::timestamptz, $7
       )`,
      [
        input.actor.credentialId,
        input.operation,
        input.idempotencyKey,
        input.requestDigest,
        JSON.stringify(prepared.outcome),
        auditEventId,
        new Date()
      ]
    );
    await client.query("COMMIT");
    return { outcome: prepared.outcome, auditEventId };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "55P03" ||
        error.code === "40P01" ||
        error.code === "40001")
    ) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    throw error;
  } finally {
    client.release();
  }
}

function requireLifecycleAuthority(
  actor: AuthenticatedCredential,
  namespaceId: string,
  capability: "trusted_memory.correct" | "trusted_memory.revoke"
): void {
  if (actor.status !== "active" || actor.credentialClass !== "owner_admin") {
    throw new SafeError("capability_not_allowed", 403);
  }
  if (!actor.namespaceIds.includes(namespaceId)) {
    throw new SafeError("namespace_not_allowed", 403);
  }
  if (!actor.capabilities.includes(capability)) {
    throw new SafeError("capability_not_allowed", 403);
  }
}

function parseStoredOutcome(
  value: unknown,
  operation: "correct_trusted_memory" | "revoke_trusted_memory"
): LifecycleOutcome {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const record = value as Record<string, unknown>;
  if (
    operation === "correct_trusted_memory" &&
    record.kind === "trusted_memory_correction" &&
    isUuid(record.memoryId) &&
    isUuid(record.previousRevisionId) &&
    isUuid(record.revisionId) &&
    Number.isInteger(record.revisionNumber) &&
    Number(record.revisionNumber) > 0 &&
    record.state === "active" &&
    typeof record.correctedAt === "string"
  ) {
    return record as CorrectionOutcome;
  }
  if (
    operation === "revoke_trusted_memory" &&
    record.kind === "trusted_memory_revocation" &&
    isUuid(record.memoryId) &&
    isUuid(record.revisionId) &&
    record.state === "revoked" &&
    typeof record.revokedAt === "string"
  ) {
    return record as RevocationOutcome;
  }
  throw new SafeError("operation_unavailable", 503, true);
}

function requireExactObject(
  value: unknown,
  fields: string[]
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeError("validation_failed", 400);
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expected = [...fields].sort();
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index])
  ) {
    throw new SafeError("validation_failed", 400);
  }
  return record;
}

function validateIdentifier(value: unknown, field: string): string {
  try {
    return assertSourceWireIdentifier(value, field);
  } catch {
    throw new SafeError("validation_failed", 400);
  }
}

function validateIdempotencyKey(value: unknown): string {
  try {
    return assertIdempotencyKey(value);
  } catch {
    throw new SafeError("validation_failed", 400);
  }
}

function validateUuid(value: unknown): string {
  if (!isUuid(value)) {
    throw new SafeError("validation_failed", 400);
  }
  return value;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function validateBoundedText(value: unknown, maximumBytes: number): string {
  if (
    typeof value !== "string" ||
    value.includes("\0") ||
    hasUnpairedSurrogate(value) ||
    value.trim().length === 0
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const byteCount = Buffer.byteLength(value, "utf8");
  if (byteCount < 1 || byteCount > maximumBytes) {
    throw new SafeError("validation_failed", 400);
  }
  return value;
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}
