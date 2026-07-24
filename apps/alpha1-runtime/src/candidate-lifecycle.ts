import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import type pg from "pg";

import {
  assertIdempotencyKey,
  assertSourceWireIdentifier,
  MAX_CANDIDATE_CONTENT_BYTES,
  MAX_DECISION_REASON_BYTES,
  MAX_LIST_CURSOR_BYTES,
  MAX_OWNER_ASSERTION_BYTES,
  STORY1_API_SCHEMA
} from "./config.js";
import { SafeError } from "./errors.js";
import { canonicalRequestDigest } from "./idempotency.js";
import type { AuthenticatedCredential } from "./repository.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const ASCII_CURSOR = /^[A-Za-z0-9_-]+$/u;

export type CandidateProvenance =
  | {
      kind: "owner_assertion";
      assertion: string;
    }
  | {
      kind: "prior_memory";
      memoryId: string;
      revisionId: string;
    };

export type CandidateProposal = {
  namespaceId: string;
  content: string;
  contentByteCount: number;
  provenance: CandidateProvenance;
  idempotencyKey: string;
};

export type CandidateProposalResult = {
  candidateId: string;
  state: "pending";
  createdAt: string;
  auditEventId: string;
};

export type CandidateDecision = {
  namespaceId: string;
  candidateId: string;
  decision: "approve" | "reject";
  expectedState: "pending";
  reason: string;
  idempotencyKey: string;
};

export type CandidateDecisionResult = {
  candidateId: string;
  state: "approved" | "rejected";
  decidedAt: string;
  memoryId?: string;
  revisionId?: string;
  auditEventId: string;
};

export type CandidateListOptions = {
  state: "pending" | "approved" | "rejected";
  limit: number;
  includeContent: boolean;
  cursor?: string;
};

export type CandidateListItem = {
  candidateId: string;
  state: "pending" | "approved" | "rejected";
  createdAt: string;
  provenanceKind: CandidateProvenance["kind"];
  contentByteCount: number;
  content?: string;
};

export type CandidateListResult = {
  items: CandidateListItem[];
  nextCursor?: string;
  auditEventId: string;
};

type ProposalOutcome = {
  kind: "candidate_proposal";
  candidateId: string;
  state: "pending";
  createdAt: string;
};

type DecisionOutcome = {
  kind: "candidate_decision";
  candidateId: string;
  state: "approved" | "rejected";
  decidedAt: string;
  memoryId: string | null;
  revisionId: string | null;
};

type LifecycleOutcome = ProposalOutcome | DecisionOutcome;

type StoredLifecycleRow = {
  request_digest: string;
  status: string;
  response_status: number;
  safe_outcome: unknown;
  audit_event_id: string;
};

export function parseCandidateProposal(value: {
  namespaceId: unknown;
  content: unknown;
  provenance: unknown;
  idempotencyKey: unknown;
}): CandidateProposal {
  let namespaceId: string;
  let idempotencyKey: string;
  try {
    namespaceId = assertSourceWireIdentifier(value.namespaceId, "namespaceId");
    idempotencyKey = assertIdempotencyKey(value.idempotencyKey);
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  const content = validateBoundedText(
    value.content,
    MAX_CANDIDATE_CONTENT_BYTES
  );
  return {
    namespaceId,
    content,
    contentByteCount: Buffer.byteLength(content, "utf8"),
    provenance: parseProvenance(value.provenance),
    idempotencyKey
  };
}

export function parseCandidateDecision(
  candidateId: unknown,
  value: {
    namespaceId: unknown;
    decision: unknown;
    expectedState: unknown;
    reason: unknown;
    idempotencyKey: unknown;
  }
): CandidateDecision {
  if (typeof candidateId !== "string" || !UUID.test(candidateId)) {
    throw new SafeError("validation_failed", 400);
  }
  let namespaceId: string;
  let idempotencyKey: string;
  try {
    namespaceId = assertSourceWireIdentifier(value.namespaceId, "namespaceId");
    idempotencyKey = assertIdempotencyKey(value.idempotencyKey);
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  if (
    (value.decision !== "approve" && value.decision !== "reject") ||
    value.expectedState !== "pending"
  ) {
    throw new SafeError("validation_failed", 400);
  }
  return {
    namespaceId,
    candidateId,
    decision: value.decision,
    expectedState: "pending",
    reason: validateBoundedText(value.reason, MAX_DECISION_REASON_BYTES),
    idempotencyKey
  };
}

export function parseCandidateListQuery(searchParams: URLSearchParams): CandidateListOptions {
  const allowed = new Set(["state", "limit", "cursor", "includeContent"]);
  for (const key of searchParams.keys()) {
    if (!allowed.has(key) || searchParams.getAll(key).length !== 1) {
      throw new SafeError("validation_failed", 400);
    }
  }

  const stateValue = searchParams.get("state") ?? "pending";
  if (
    stateValue !== "pending" &&
    stateValue !== "approved" &&
    stateValue !== "rejected"
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const limitValue = searchParams.get("limit");
  const limit = limitValue === null ? 25 : Number(limitValue);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50 ||
    (limitValue !== null && String(limit) !== limitValue)
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const includeContentValue = searchParams.get("includeContent");
  if (
    includeContentValue !== null &&
    includeContentValue !== "true" &&
    includeContentValue !== "false"
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const cursor = searchParams.get("cursor");
  if (cursor !== null) {
    validateCursorText(cursor);
  }

  return {
    state: stateValue,
    limit,
    includeContent: includeContentValue === "true",
    ...(cursor === null ? {} : { cursor })
  };
}

export async function proposeMemoryCandidate(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  proposal: CandidateProposal,
  traceId: string
): Promise<CandidateProposalResult> {
  requireHarnessActor(actor);
  requireActorNamespace(actor, proposal.namespaceId);
  requireActorCapability(actor, "memory_candidate.propose");
  const operation = "propose_memory_candidate";
  const requestDigest = canonicalRequestDigest({
    apiSchema: STORY1_API_SCHEMA,
    method: "POST",
    operation,
    actorCredentialId: actor.credentialId,
    ownerId: actor.ownerId,
    namespaceId: proposal.namespaceId,
    content: proposal.content,
    provenance: proposal.provenance
  });
  const result = await executeLifecycleMutation({
    pool,
    actor,
    namespaceId: proposal.namespaceId,
    operation,
    idempotencyKey: proposal.idempotencyKey,
    requestDigest,
    traceId,
    mutate: async (client) => {
      await validatePriorMemory(client, actor, proposal.namespaceId, proposal.provenance);
      const candidateId = randomUUID();
      const createdAt = new Date();
      await client.query(
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
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $8)`,
        [
          candidateId,
          actor.ownerId,
          proposal.namespaceId,
          actor.credentialId,
          actor.actorIdentityId,
          proposal.content,
          proposal.contentByteCount,
          createdAt
        ]
      );
      await insertCandidateProvenance(
        client,
        candidateId,
        actor.ownerId,
        proposal.namespaceId,
        proposal.provenance
      );
      return {
        responseStatus: 201 as const,
        outcome: {
          kind: "candidate_proposal" as const,
          candidateId,
          state: "pending" as const,
          createdAt: createdAt.toISOString()
        },
        auditMetadata: {
          candidateId,
          provenanceKind: proposal.provenance.kind,
          contentByteCount: proposal.contentByteCount
        }
      };
    }
  });
  if (result.outcome.kind !== "candidate_proposal") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return {
    candidateId: result.outcome.candidateId,
    state: result.outcome.state,
    createdAt: result.outcome.createdAt,
    auditEventId: result.auditEventId
  };
}

export async function decideMemoryCandidate(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  input: CandidateDecision,
  traceId: string
): Promise<CandidateDecisionResult> {
  requireOwnerActor(actor);
  requireActorNamespace(actor, input.namespaceId);
  requireActorCapability(actor, "memory_candidate.decide");
  const operation = "decide_memory_candidate";
  const requestDigest = canonicalRequestDigest({
    apiSchema: STORY1_API_SCHEMA,
    method: "POST",
    operation,
    actorCredentialId: actor.credentialId,
    ownerId: actor.ownerId,
    namespaceId: input.namespaceId,
    candidateId: input.candidateId,
    expectedState: input.expectedState,
    decision: input.decision,
    reason: input.reason
  });
  const result = await executeLifecycleMutation({
    pool,
    actor,
    namespaceId: input.namespaceId,
    operation,
    idempotencyKey: input.idempotencyKey,
    requestDigest,
    traceId,
    mutate: async (client) => {
      const candidateResult = await client.query<{
        candidate_id: string;
        state: string;
        content: string;
        content_byte_count: number;
        provenance_kind: CandidateProvenance["kind"];
        owner_assertion: string | null;
        prior_memory_id: string | null;
        prior_revision_id: string | null;
      }>(
        `SELECT
           candidate.candidate_id,
           candidate.state,
           candidate.content,
           candidate.content_byte_count,
           provenance.provenance_kind,
           provenance.owner_assertion,
           provenance.prior_memory_id,
           provenance.prior_revision_id
         FROM source_wire_memory.memory_candidates AS candidate
         JOIN source_wire_memory.candidate_provenance AS provenance
           ON provenance.candidate_id = candidate.candidate_id
          AND provenance.owner_id = candidate.owner_id
          AND provenance.namespace_id = candidate.namespace_id
        WHERE candidate.candidate_id = $1
          AND candidate.owner_id = $2
          AND candidate.namespace_id = $3
        FOR UPDATE OF candidate`,
        [input.candidateId, actor.ownerId, input.namespaceId]
      );
      const candidate = candidateResult.rows[0];
      if (!candidate || candidate.state !== "pending") {
        throw new SafeError("state_conflict", 409);
      }

      const decidedAt = new Date();
      const approved = input.decision === "approve";
      const memoryId = approved ? randomUUID() : null;
      const revisionId = approved ? randomUUID() : null;
      if (approved && memoryId && revisionId) {
        await client.query(
          `INSERT INTO source_wire_memory.trusted_memories (
             memory_id,
             owner_id,
             namespace_id,
             origin_candidate_id,
             state,
             created_at
           ) VALUES ($1, $2, $3, $4, 'active', $5)`,
          [memoryId, actor.ownerId, input.namespaceId, input.candidateId, decidedAt]
        );
        await client.query(
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
           ) VALUES (
             $1, $2, $3, $4, 1, 'active', $5, $6, $7, $8, $9, $10
           )`,
          [
            revisionId,
            memoryId,
            actor.ownerId,
            input.namespaceId,
            candidate.content,
            candidate.content_byte_count,
            input.candidateId,
            actor.credentialId,
            actor.actorIdentityId,
            decidedAt
          ]
        );
        await client.query(
          `INSERT INTO source_wire_memory.trusted_memory_provenance (
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
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            revisionId,
            memoryId,
            actor.ownerId,
            input.namespaceId,
            input.candidateId,
            candidate.provenance_kind,
            candidate.owner_assertion,
            candidate.prior_memory_id,
            candidate.prior_revision_id,
            decidedAt
          ]
        );
      }

      const state = approved ? "approved" : "rejected";
      const update = await client.query(
        `UPDATE source_wire_memory.memory_candidates
            SET state = $1,
                decided_at = $2,
                decided_by_credential_id = $3,
                decided_by_actor_id = $4,
                updated_at = $2
          WHERE candidate_id = $5
            AND owner_id = $6
            AND namespace_id = $7
            AND state = 'pending'`,
        [
          state,
          decidedAt,
          actor.credentialId,
          actor.actorIdentityId,
          input.candidateId,
          actor.ownerId,
          input.namespaceId
        ]
      );
      if (update.rowCount !== 1) {
        throw new SafeError("state_conflict", 409);
      }
      await client.query(
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
         ) VALUES (
           $1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10
         )`,
        [
          input.candidateId,
          actor.ownerId,
          input.namespaceId,
          input.decision,
          input.reason,
          actor.credentialId,
          actor.actorIdentityId,
          memoryId,
          revisionId,
          decidedAt
        ]
      );
      return {
        responseStatus: 200 as const,
        outcome: {
          kind: "candidate_decision" as const,
          candidateId: input.candidateId,
          state,
          decidedAt: decidedAt.toISOString(),
          memoryId,
          revisionId
        },
        auditMetadata: {
          candidateId: input.candidateId,
          state,
          trustedMemoryCreated: approved
        }
      };
    }
  });
  if (result.outcome.kind !== "candidate_decision") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return {
    candidateId: result.outcome.candidateId,
    state: result.outcome.state,
    decidedAt: result.outcome.decidedAt,
    ...(result.outcome.memoryId ? { memoryId: result.outcome.memoryId } : {}),
    ...(result.outcome.revisionId ? { revisionId: result.outcome.revisionId } : {}),
    auditEventId: result.auditEventId
  };
}

export async function listMemoryCandidates(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  namespaceId: string,
  options: CandidateListOptions,
  traceId: string,
  cursorKey: Buffer
): Promise<CandidateListResult> {
  requireOwnerActor(actor);
  requireActorNamespace(actor, namespaceId);
  requireActorCapability(actor, "memory_candidate.review");
  const cursor = options.cursor
    ? decodeCursor(
        options.cursor,
        cursorKey,
        actor.ownerId,
        namespaceId,
        options.state
      )
    : undefined;
  const client = await pool.connect();

  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    const result = options.includeContent
      ? await client.query<{
          candidate_id: string;
          state: CandidateListItem["state"];
          created_at: Date;
          provenance_kind: CandidateProvenance["kind"];
          content_byte_count: number;
          content: string;
        }>(
          `SELECT
             candidate.candidate_id,
             candidate.state,
             candidate.created_at,
             provenance.provenance_kind,
             candidate.content_byte_count,
             candidate.content
           FROM source_wire_memory.memory_candidates AS candidate
           JOIN source_wire_memory.candidate_provenance AS provenance
             ON provenance.candidate_id = candidate.candidate_id
          WHERE candidate.owner_id = $1
            AND candidate.namespace_id = $2
            AND candidate.state = $3
            AND (
              $4::timestamptz IS NULL
              OR (candidate.created_at, candidate.candidate_id) > ($4::timestamptz, $5::uuid)
            )
          ORDER BY candidate.created_at, candidate.candidate_id
          LIMIT $6`,
          [
            actor.ownerId,
            namespaceId,
            options.state,
            cursor?.createdAt ?? null,
            cursor?.candidateId ?? null,
            options.limit + 1
          ]
        )
      : await client.query<{
          candidate_id: string;
          state: CandidateListItem["state"];
          created_at: Date;
          provenance_kind: CandidateProvenance["kind"];
          content_byte_count: number;
        }>(
          `SELECT
             candidate.candidate_id,
             candidate.state,
             candidate.created_at,
             provenance.provenance_kind,
             candidate.content_byte_count
           FROM source_wire_memory.memory_candidates AS candidate
           JOIN source_wire_memory.candidate_provenance AS provenance
             ON provenance.candidate_id = candidate.candidate_id
          WHERE candidate.owner_id = $1
            AND candidate.namespace_id = $2
            AND candidate.state = $3
            AND (
              $4::timestamptz IS NULL
              OR (candidate.created_at, candidate.candidate_id) > ($4::timestamptz, $5::uuid)
            )
          ORDER BY candidate.created_at, candidate.candidate_id
          LIMIT $6`,
          [
            actor.ownerId,
            namespaceId,
            options.state,
            cursor?.createdAt ?? null,
            cursor?.candidateId ?? null,
            options.limit + 1
          ]
        );
    const hasMore = result.rows.length > options.limit;
    const rows = result.rows.slice(0, options.limit);
    const items: CandidateListItem[] = rows.map((row) => {
      const base: CandidateListItem = {
        candidateId: row.candidate_id,
        state: row.state,
        createdAt: row.created_at.toISOString(),
        provenanceKind: row.provenance_kind,
        contentByteCount: row.content_byte_count
      };
      if ("content" in row && typeof row.content === "string") {
        base.content = row.content;
      }
      return base;
    });
    const auditEventId = await insertAudit(client, {
      traceId,
      operation: "list_memory_candidates",
      actor,
      namespaceId,
      metadata: {
        state: options.state,
        includeContent: options.includeContent,
        itemCount: items.length
      }
    });
    await client.query("COMMIT");
    const last = rows.at(-1);
    return {
      items,
      ...(hasMore && last
        ? {
            nextCursor: encodeCursor(
              last.created_at.toISOString(),
              last.candidate_id,
              cursorKey,
              actor.ownerId,
              namespaceId,
              options.state
            )
          }
        : {}),
      auditEventId
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function parseProvenance(value: unknown): CandidateProvenance {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeError("validation_failed", 400);
  }
  const record = value as Record<string, unknown>;
  if (record.kind === "owner_assertion") {
    if (
      !hasExactKeys(record, ["kind", "assertion"])
    ) {
      throw new SafeError("validation_failed", 400);
    }
    return {
      kind: "owner_assertion",
      assertion: validateBoundedText(record.assertion, MAX_OWNER_ASSERTION_BYTES)
    };
  }
  if (record.kind === "prior_memory") {
    if (!hasExactKeys(record, ["kind", "memoryId", "revisionId"])) {
      throw new SafeError("validation_failed", 400);
    }
    if (
      typeof record.memoryId !== "string" ||
      !UUID.test(record.memoryId) ||
      typeof record.revisionId !== "string" ||
      !UUID.test(record.revisionId)
    ) {
      throw new SafeError("validation_failed", 400);
    }
    return {
      kind: "prior_memory",
      memoryId: record.memoryId,
      revisionId: record.revisionId
    };
  }
  throw new SafeError("validation_failed", 400);
}

function validateBoundedText(value: unknown, maximumBytes: number): string {
  if (
    typeof value !== "string" ||
    value.includes("\0") ||
    hasUnpairedSurrogate(value)
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const size = Buffer.byteLength(value, "utf8");
  if (size < 1 || size > maximumBytes) {
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

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const keys = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return keys.length === wanted.length && keys.every((key, index) => key === wanted[index]);
}

function requireHarnessActor(actor: AuthenticatedCredential): void {
  if (actor.status !== "active" || actor.credentialClass !== "harness") {
    throw new SafeError("capability_not_allowed", 403);
  }
}

function requireOwnerActor(actor: AuthenticatedCredential): void {
  if (actor.status !== "active" || actor.credentialClass !== "owner_admin") {
    throw new SafeError("capability_not_allowed", 403);
  }
}

function requireActorCapability(
  actor: AuthenticatedCredential,
  capability: "memory_candidate.propose" | "memory_candidate.review" | "memory_candidate.decide"
): void {
  if (!actor.capabilities.includes(capability)) {
    throw new SafeError("capability_not_allowed", 403);
  }
}

function requireActorNamespace(actor: AuthenticatedCredential, namespaceId: string): void {
  if (!actor.namespaceIds.includes(namespaceId)) {
    throw new SafeError("namespace_not_allowed", 403);
  }
}

async function validatePriorMemory(
  client: pg.PoolClient,
  actor: AuthenticatedCredential,
  namespaceId: string,
  provenance: CandidateProvenance
): Promise<void> {
  if (provenance.kind !== "prior_memory") return;
  const result = await client.query(
    `SELECT revision.revision_id
       FROM source_wire_memory.trusted_memories AS memory
       JOIN source_wire_memory.trusted_memory_revisions AS revision
         ON revision.memory_id = memory.memory_id
        AND revision.owner_id = memory.owner_id
        AND revision.namespace_id = memory.namespace_id
      WHERE memory.memory_id = $1
        AND revision.revision_id = $2
        AND memory.owner_id = $3
        AND memory.namespace_id = $4
        AND memory.state = 'active'
        AND revision.status = 'active'`,
    [provenance.memoryId, provenance.revisionId, actor.ownerId, namespaceId]
  );
  if (result.rowCount !== 1) {
    throw new SafeError("validation_failed", 400);
  }
}

async function insertCandidateProvenance(
  client: pg.PoolClient,
  candidateId: string,
  ownerId: string,
  namespaceId: string,
  provenance: CandidateProvenance
): Promise<void> {
  await client.query(
    `INSERT INTO source_wire_memory.candidate_provenance (
       candidate_id,
       owner_id,
       namespace_id,
       provenance_kind,
       owner_assertion,
       prior_memory_id,
       prior_revision_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      candidateId,
      ownerId,
      namespaceId,
      provenance.kind,
      provenance.kind === "owner_assertion" ? provenance.assertion : null,
      provenance.kind === "prior_memory" ? provenance.memoryId : null,
      provenance.kind === "prior_memory" ? provenance.revisionId : null
    ]
  );
}

async function executeLifecycleMutation(input: {
  pool: pg.Pool;
  actor: AuthenticatedCredential;
  namespaceId: string;
  operation: "propose_memory_candidate" | "decide_memory_candidate";
  idempotencyKey: string;
  requestDigest: string;
  traceId: string;
  mutate: (client: pg.PoolClient) => Promise<{
    responseStatus: 200 | 201;
    outcome: LifecycleOutcome;
    auditMetadata: Record<string, string | number | boolean | null>;
  }>;
}): Promise<{
  responseStatus: 200 | 201;
  outcome: LifecycleOutcome;
  auditEventId: string;
}> {
  const client = await input.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '2s'");
    await client.query("SET LOCAL statement_timeout = '2s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 1913770105))",
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
    const row = existing.rows[0];
    if (row) {
      if (
        row.status !== "completed" ||
        row.request_digest !== input.requestDigest ||
        (row.response_status !== 200 && row.response_status !== 201)
      ) {
        if (row.request_digest !== input.requestDigest) {
          throw new SafeError("idempotency_conflict", 409);
        }
        throw new SafeError("operation_unavailable", 503, true);
      }
      const outcome = parseStoredLifecycleOutcome(row.safe_outcome, input.operation);
      await client.query("COMMIT");
      return {
        responseStatus: row.response_status as 200 | 201,
        outcome,
        auditEventId: row.audit_event_id
      };
    }

    const prepared = await input.mutate(client);
    const auditEventId = await insertAudit(client, {
      traceId: input.traceId,
      operation: input.operation,
      actor: input.actor,
      namespaceId: input.namespaceId,
      metadata: prepared.auditMetadata
    });
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
       ) VALUES ($1, $2, $3, $4, 'completed', $5, $6, $7, 'infinity'::timestamptz, $8)`,
      [
        input.actor.credentialId,
        input.operation,
        input.idempotencyKey,
        input.requestDigest,
        prepared.responseStatus,
        JSON.stringify(prepared.outcome),
        auditEventId,
        new Date()
      ]
    );
    await client.query("COMMIT");
    return {
      responseStatus: prepared.responseStatus,
      outcome: prepared.outcome,
      auditEventId
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function insertAudit(
  client: pg.PoolClient,
  input: {
    traceId: string;
    operation: string;
    actor: AuthenticatedCredential;
    namespaceId: string;
    metadata: Record<string, string | number | boolean | null>;
  }
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
       metadata
     ) VALUES ($1, $2, $3, 'allowed', $4, $5, $6, $7, $8, $9)`,
    [
      eventId,
      input.traceId,
      input.operation,
      input.actor.credentialId,
      input.actor.actorIdentityId,
      input.actor.actorReference,
      input.actor.ownerId,
      input.namespaceId,
      JSON.stringify(input.metadata)
    ]
  );
  return eventId;
}

function parseStoredLifecycleOutcome(
  value: unknown,
  operation: "propose_memory_candidate" | "decide_memory_candidate"
): LifecycleOutcome {
  if (!value || typeof value !== "object") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const record = value as Record<string, unknown>;
  if (
    operation === "propose_memory_candidate" &&
    record.kind === "candidate_proposal" &&
    typeof record.candidateId === "string" &&
    UUID.test(record.candidateId) &&
    record.state === "pending" &&
    typeof record.createdAt === "string"
  ) {
    return record as ProposalOutcome;
  }
  if (
    operation === "decide_memory_candidate" &&
    record.kind === "candidate_decision" &&
    typeof record.candidateId === "string" &&
    UUID.test(record.candidateId) &&
    (record.state === "approved" || record.state === "rejected") &&
    typeof record.decidedAt === "string" &&
    (record.memoryId === null || (typeof record.memoryId === "string" && UUID.test(record.memoryId))) &&
    (record.revisionId === null ||
      (typeof record.revisionId === "string" && UUID.test(record.revisionId)))
  ) {
    return record as DecisionOutcome;
  }
  throw new SafeError("operation_unavailable", 503, true);
}

function encodeCursor(
  createdAt: string,
  candidateId: string,
  cursorKey: Buffer,
  ownerId: string,
  namespaceId: string,
  state: CandidateListOptions["state"]
): string {
  const payload = Buffer.alloc(25);
  payload.writeUInt8(1, 0);
  payload.writeBigInt64BE(BigInt(new Date(createdAt).getTime()), 1);
  uuidToBytes(candidateId).copy(payload, 9);
  const signature = cursorSignature(
    cursorKey,
    ownerId,
    namespaceId,
    state,
    payload
  );
  return Buffer.concat([payload, signature]).toString("base64url");
}

function decodeCursor(
  value: string,
  cursorKey: Buffer,
  ownerId: string,
  namespaceId: string,
  state: CandidateListOptions["state"]
): { createdAt: string; candidateId: string } {
  validateCursorText(value);
  let decoded: Buffer;
  try {
    decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value || decoded.length !== 57) {
      throw new Error("invalid");
    }
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  const payload = decoded.subarray(0, 25);
  const suppliedSignature = decoded.subarray(25);
  const expectedSignature = cursorSignature(
    cursorKey,
    ownerId,
    namespaceId,
    state,
    payload
  );
  if (
    payload.readUInt8(0) !== 1 ||
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const epochMilliseconds = payload.readBigInt64BE(1);
  const epochNumber = Number(epochMilliseconds);
  if (
    !Number.isSafeInteger(epochNumber) ||
    epochNumber < 0
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const createdAt = new Date(epochNumber);
  const candidateId = bytesToUuid(payload.subarray(9, 25));
  return {
    createdAt: createdAt.toISOString(),
    candidateId
  };
}

function cursorSignature(
  cursorKey: Buffer,
  ownerId: string,
  namespaceId: string,
  state: CandidateListOptions["state"],
  payload: Buffer
): Buffer {
  return createHmac("sha256", cursorKey)
    .update("source-wire.alpha1.story2.candidate-cursor.v1", "utf8")
    .update("\0", "utf8")
    .update(ownerId, "utf8")
    .update("\0", "utf8")
    .update(namespaceId, "utf8")
    .update("\0", "utf8")
    .update(state, "utf8")
    .update("\0", "utf8")
    .update(payload)
    .digest();
}

function uuidToBytes(value: string): Buffer {
  if (!UUID.test(value)) {
    throw new SafeError("validation_failed", 400);
  }
  return Buffer.from(value.replaceAll("-", ""), "hex");
}

function bytesToUuid(value: Buffer): string {
  if (value.length !== 16) {
    throw new SafeError("validation_failed", 400);
  }
  const hex = value.toString("hex");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  if (!UUID.test(uuid)) {
    throw new SafeError("validation_failed", 400);
  }
  return uuid;
}

function validateCursorText(value: string): void {
  if (
    Buffer.byteLength(value, "utf8") < 1 ||
    Buffer.byteLength(value, "utf8") > MAX_LIST_CURSOR_BYTES ||
    !ASCII_CURSOR.test(value)
  ) {
    throw new SafeError("validation_failed", 400);
  }
}
