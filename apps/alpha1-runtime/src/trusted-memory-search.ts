import { createHmac, randomBytes, randomUUID } from "node:crypto";

import type pg from "pg";

import {
  assertSourceWireIdentifier,
  MAX_CANDIDATE_CONTENT_BYTES,
  MAX_PROTECTED_READ_RESPONSE_BYTES,
  MAX_TRUSTED_MEMORY_QUERY_BYTES,
  MAX_TRUSTED_MEMORY_RESULT_CONTENT_BYTES,
  MAX_TRUSTED_MEMORY_SEARCH_RESULTS,
  PROTECTED_READ_RECEIPT_TTL_MS,
  STORY1_API_SCHEMA,
  STORY1_REQUEST_TIMEOUT_MS
} from "./config.js";
import { SafeError } from "./errors.js";
import { canonicalRequestDigest } from "./idempotency.js";
import type { AuthenticatedCredential } from "./repository.js";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const DIGEST = /^[0-9a-f]{64}$/u;
const RELEASE_BINDING = /^[A-Za-z0-9_-]{43}$/u;
const CANONICAL_RANK = /^[0-9]+\.[0-9]{6}$/u;
const ORIGIN_VERIFIER_DOMAIN =
  "source-wire.alpha1.story3.origin-process-verifier.v1";
const RECEIPT_FORMAT_VERSION = 1 as const;
const SEARCH_OPERATION = "search_trusted_memory" as const;
const RESPONSE_AUDIT_ID_PLACEHOLDER =
  "00000000-0000-4000-8000-000000000000";

export type TrustedMemorySearchInput = {
  namespaceId: string;
  query: string;
  queryByteCount: number;
  limit: number;
};

export type TrustedMemorySearchResult = {
  memoryId: string;
  revisionId: string;
  content: string;
  rank: string;
  provenance: {
    kind: "owner_assertion" | "prior_memory";
  };
};

export type TrustedMemoryRequestDigestInput = {
  apiSchema: typeof STORY1_API_SCHEMA;
  method: "POST";
  operation: typeof SEARCH_OPERATION;
  actorCredentialId: string;
  ownerId: string;
  namespaceId: string;
  query: string;
  limit: number;
};

export type ProtectedReadReceiptBinding = {
  receiptId: string;
  formatVersion: typeof RECEIPT_FORMAT_VERSION;
  traceId: string;
  requestId: string;
  actorReference: string;
  actorCredentialId: string;
  ownerId: string;
  namespaceId: string;
  operation: typeof SEARCH_OPERATION;
  policyDecision: "allowed";
  releaseBinding: string;
  requestDigest: string;
  resultDigest: string;
  coveredResultCount: number;
  issuedAt: string;
  expiresAt: string;
};

export type ProtectedReadStage =
  | "before_query"
  | "after_query"
  | "before_receipt_and_audit_commit"
  | "after_durable_commit"
  | "before_receipt_consumption"
  | "after_receipt_consumption"
  | "before_response_serialization"
  | "during_response_serialization";

export type ProtectedReadStageHook = (stage: ProtectedReadStage) => void;

export type TrustedMemorySearchExecution = {
  results: TrustedMemorySearchResult[];
  auditEventId: string;
  releaseStatus: "release_attempted";
  receipt: ProtectedReadReceiptBinding;
  clear(): void;
};

export type PreparedTrustedMemorySearch = Omit<
  TrustedMemorySearchExecution,
  "releaseStatus"
> & {
  releaseStatus: "release_authorized";
};

type TrustedMemorySearchExecutionOptions = {
  processReleaseSecret: Buffer;
  startedAtMs: number;
  signal?: AbortSignal;
  onStage?: ProtectedReadStageHook;
  receiptTtlMs?: number;
};

type SearchRow = {
  memory_id: string;
  revision_id: string;
  content: string;
  content_byte_count: number;
  provenance_kind: string;
  rank: string;
};

export function parseTrustedMemorySearch(value: unknown): TrustedMemorySearchInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeError("validation_failed", 400);
  }
  const record = value as Record<string, unknown>;
  if (!hasExactKeys(record, ["namespaceId", "query"], ["limit"])) {
    throw new SafeError("validation_failed", 400);
  }

  let namespaceId: string;
  try {
    namespaceId = assertSourceWireIdentifier(record.namespaceId, "namespaceId");
  } catch {
    throw new SafeError(
      record.namespaceId === undefined ||
        record.namespaceId === null ||
        record.namespaceId === ""
        ? "namespace_required"
        : "namespace_not_allowed",
      record.namespaceId === undefined ||
        record.namespaceId === null ||
        record.namespaceId === ""
        ? 400
        : 403
    );
  }

  if (
    typeof record.query !== "string" ||
    record.query.includes("\0") ||
    hasUnpairedSurrogate(record.query) ||
    record.query.trim().length === 0
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const queryByteCount = Buffer.byteLength(record.query, "utf8");
  if (queryByteCount < 1 || queryByteCount > MAX_TRUSTED_MEMORY_QUERY_BYTES) {
    throw new SafeError("validation_failed", 400);
  }

  const limit = record.limit === undefined ? MAX_TRUSTED_MEMORY_SEARCH_RESULTS : record.limit;
  if (
    typeof limit !== "number" ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_TRUSTED_MEMORY_SEARCH_RESULTS
  ) {
    throw new SafeError("validation_failed", 400);
  }

  return {
    namespaceId,
    query: record.query,
    queryByteCount,
    limit
  };
}

export function canonicalTrustedMemoryRequestDigest(
  input: TrustedMemoryRequestDigestInput
): string {
  return canonicalRequestDigest(input);
}

export function canonicalTrustedMemoryResultDigest(
  results: readonly TrustedMemorySearchResult[]
): string {
  return canonicalRequestDigest({
    apiSchema: STORY1_API_SCHEMA,
    operation: SEARCH_OPERATION,
    results
  });
}

export function createProcessReleaseSecret(): Buffer {
  return randomBytes(32);
}

export function computeOriginProcessVerifier(
  processReleaseSecret: Buffer,
  binding: ProtectedReadReceiptBinding
): string {
  if (processReleaseSecret.length !== 32) {
    throw new Error("process_release_secret_invalid");
  }
  validateReceiptBinding(binding);
  const preimageDigest = canonicalRequestDigest({
    domain: ORIGIN_VERIFIER_DOMAIN,
    binding
  });
  return createHmac("sha256", processReleaseSecret)
    .update(ORIGIN_VERIFIER_DOMAIN, "utf8")
    .update("\0", "utf8")
    .update(preimageDigest, "ascii")
    .digest("hex");
}

export async function executeTrustedMemorySearch(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  input: TrustedMemorySearchInput,
  traceId: string,
  options: TrustedMemorySearchExecutionOptions
): Promise<TrustedMemorySearchExecution> {
  const prepared = await prepareTrustedMemorySearch(
    pool,
    actor,
    input,
    traceId,
    options
  );
  try {
    assertReadStillLive(options);
    options.onStage?.("before_receipt_consumption");
    const consumed = await consumeProtectedReadReceipt(
      pool,
      options.processReleaseSecret,
      prepared.receipt
    );
    if (!consumed) {
      throw new SafeError("release_binding_invalid", 503, true);
    }
    options.onStage?.("after_receipt_consumption");
    assertReadStillLive(options);

    return {
      ...prepared,
      releaseStatus: "release_attempted"
    };
  } catch (error) {
    prepared.clear();
    throw error;
  }
}

export async function prepareTrustedMemorySearch(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  input: TrustedMemorySearchInput,
  traceId: string,
  options: TrustedMemorySearchExecutionOptions
): Promise<PreparedTrustedMemorySearch> {
  requireSearchAuthority(actor, input.namespaceId);
  if (!UUID.test(traceId) || options.processReleaseSecret.length !== 32) {
    throw new SafeError("operation_unavailable", 503, true);
  }

  const requestDigest = canonicalTrustedMemoryRequestDigest({
    apiSchema: STORY1_API_SCHEMA,
    method: "POST",
    operation: SEARCH_OPERATION,
    actorCredentialId: actor.credentialId,
    ownerId: actor.ownerId,
    namespaceId: input.namespaceId,
    query: input.query,
    limit: input.limit
  });
  const requestId = randomUUID();
  const receiptId = randomUUID();
  const releaseBinding = randomBytes(32).toString("base64url");
  const auditEventId = randomUUID();
  const client = await pool.connect();
  const results: TrustedMemorySearchResult[] = [];
  let committed = false;

  try {
    assertReadStillLive(options);
    options.onStage?.("before_query");
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '2s'");
    await client.query("SET LOCAL statement_timeout = '2s'");

    const queryResult = await client.query<SearchRow>(
      `WITH eligible AS MATERIALIZED (
         SELECT
           revision.memory_id,
           revision.revision_id,
           revision.content,
           revision.content_byte_count,
           provenance.provenance_kind,
           pg_catalog.to_tsvector(
             'pg_catalog.simple'::regconfig,
             revision.content
           ) AS search_vector
         FROM source_wire_memory.trusted_memory_revisions AS revision
         JOIN source_wire_memory.trusted_memories AS memory
           ON memory.memory_id = revision.memory_id
          AND memory.owner_id = revision.owner_id
          AND memory.namespace_id = revision.namespace_id
         JOIN source_wire_memory.trusted_memory_provenance AS provenance
           ON provenance.revision_id = revision.revision_id
          AND provenance.memory_id = revision.memory_id
          AND provenance.owner_id = revision.owner_id
          AND provenance.namespace_id = revision.namespace_id
        WHERE revision.owner_id = $1
          AND revision.namespace_id = $2
          AND revision.status = 'active'
          AND memory.state = 'active'
       ),
       ranked AS (
         SELECT
           memory_id,
           revision_id,
           content,
           content_byte_count,
           provenance_kind,
           pg_catalog.ts_rank_cd(
             search_vector,
             pg_catalog.websearch_to_tsquery(
               'pg_catalog.simple'::regconfig,
               $3
             ),
             32
           ) AS raw_rank
         FROM eligible
        WHERE search_vector @@ pg_catalog.websearch_to_tsquery(
          'pg_catalog.simple'::regconfig,
          $3
        )
       )
       SELECT
         memory_id,
         revision_id,
         content,
         content_byte_count,
         provenance_kind,
         pg_catalog.to_char(
           pg_catalog.round(raw_rank::numeric, 6),
           'FM999999990.000000'
         ) AS rank
       FROM ranked
       ORDER BY raw_rank DESC, revision_id ASC
       LIMIT $4`,
      [actor.ownerId, input.namespaceId, input.query, input.limit]
    );
    appendBoundedResults(results, queryResult.rows, traceId);
    queryResult.rows.length = 0;
    assertReadStillLive(options);
    options.onStage?.("after_query");

    const resultDigest = canonicalTrustedMemoryResultDigest(results);
    const issuedAt = new Date();
    const absoluteDeadline = options.startedAtMs + STORY1_REQUEST_TIMEOUT_MS;
    const requestedTtl = options.receiptTtlMs ?? PROTECTED_READ_RECEIPT_TTL_MS;
    if (
      !Number.isInteger(requestedTtl) ||
      requestedTtl < 1 ||
      requestedTtl > PROTECTED_READ_RECEIPT_TTL_MS
    ) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    const expiryTime = Math.min(
      absoluteDeadline,
      issuedAt.getTime() + requestedTtl
    );
    if (expiryTime <= issuedAt.getTime()) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    const binding: ProtectedReadReceiptBinding = {
      receiptId,
      formatVersion: RECEIPT_FORMAT_VERSION,
      traceId,
      requestId,
      actorReference: actor.actorReference,
      actorCredentialId: actor.credentialId,
      ownerId: actor.ownerId,
      namespaceId: input.namespaceId,
      operation: SEARCH_OPERATION,
      policyDecision: "allowed",
      releaseBinding,
      requestDigest,
      resultDigest,
      coveredResultCount: results.length,
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(expiryTime).toISOString()
    };
    const originProcessVerifier = computeOriginProcessVerifier(
      options.processReleaseSecret,
      binding
    );

    options.onStage?.("before_receipt_and_audit_commit");
    const issued = await client.query<{ audit_event_id: string }>(
      `SELECT source_wire_memory.issue_protected_read_receipt(
         $1::uuid,
         $2::smallint,
         $3::uuid,
         $4::uuid,
         $5::varchar,
         $6::uuid,
         $7::varchar,
         $8::varchar,
         $9::varchar,
         $10::varchar,
         $11::varchar,
         $12::varchar,
         $13::varchar,
         $14::smallint,
         $15::timestamptz,
         $16::timestamptz,
         $17::varchar,
         $18::uuid
       ) AS audit_event_id`,
      [
        binding.receiptId,
        binding.formatVersion,
        binding.traceId,
        binding.requestId,
        binding.actorReference,
        binding.actorCredentialId,
        binding.ownerId,
        binding.namespaceId,
        binding.operation,
        binding.policyDecision,
        binding.releaseBinding,
        binding.requestDigest,
        binding.resultDigest,
        binding.coveredResultCount,
        binding.issuedAt,
        binding.expiresAt,
        originProcessVerifier,
        auditEventId
      ]
    );
    if (issued.rows[0]?.audit_event_id !== auditEventId) {
      throw new SafeError("audit_unavailable", 503, true);
    }
    await client.query("COMMIT");
    committed = true;
    options.onStage?.("after_durable_commit");
    assertReadStillLive(options);

    return {
      results,
      auditEventId,
      releaseStatus: "release_authorized",
      receipt: binding,
      clear() {
        results.length = 0;
      }
    };
  } catch (error) {
    if (!committed) {
      await client.query("ROLLBACK").catch(() => undefined);
    }
    results.length = 0;
    throw error;
  } finally {
    client.release();
  }
}

export async function consumeProtectedReadReceipt(
  pool: pg.Pool,
  processReleaseSecret: Buffer,
  binding: ProtectedReadReceiptBinding
): Promise<boolean> {
  const originProcessVerifier = computeOriginProcessVerifier(
    processReleaseSecret,
    binding
  );
  const result = await pool.query<{ consumed: boolean }>(
    `SELECT source_wire_memory.consume_protected_read_receipt(
       $1::uuid,
       $2::smallint,
       $3::uuid,
       $4::uuid,
       $5::varchar,
       $6::uuid,
       $7::varchar,
       $8::varchar,
       $9::varchar,
       $10::varchar,
       $11::varchar,
       $12::varchar,
       $13::varchar,
       $14::smallint,
       $15::timestamptz,
       $16::timestamptz,
       $17::varchar
     ) AS consumed`,
    [
      binding.receiptId,
      binding.formatVersion,
      binding.traceId,
      binding.requestId,
      binding.actorReference,
      binding.actorCredentialId,
      binding.ownerId,
      binding.namespaceId,
      binding.operation,
      binding.policyDecision,
      binding.releaseBinding,
      binding.requestDigest,
      binding.resultDigest,
      binding.coveredResultCount,
      binding.issuedAt,
      binding.expiresAt,
      originProcessVerifier
    ]
  );
  return result.rows[0]?.consumed === true;
}

export function createTrustedMemorySearchResponse(input: {
  traceId: string;
  results: readonly TrustedMemorySearchResult[];
  auditEventId: string;
  releaseStatus: "release_attempted";
}) {
  return {
    schema: STORY1_API_SCHEMA,
    traceId: input.traceId,
    data: {
      results: input.results
    },
    audit: {
      eventId: input.auditEventId,
      releaseStatus: input.releaseStatus
    }
  };
}

export function serializeTrustedMemorySearchResponse(
  response: ReturnType<typeof createTrustedMemorySearchResponse>,
  onStage?: ProtectedReadStageHook
): string {
  let serializationStageObserved = false;
  const serialized = JSON.stringify(response, (key, value) => {
    if (!serializationStageObserved && key === "content") {
      serializationStageObserved = true;
      onStage?.("during_response_serialization");
    }
    return value;
  });
  if (Buffer.byteLength(serialized, "utf8") > MAX_PROTECTED_READ_RESPONSE_BYTES) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return serialized;
}

function appendBoundedResults(
  target: TrustedMemorySearchResult[],
  rows: SearchRow[],
  traceId: string
): void {
  let aggregateContentBytes = 0;
  for (const row of rows) {
    const item = parseSearchRow(row);
    const nextAggregate =
      aggregateContentBytes + Buffer.byteLength(item.content, "utf8");
    if (nextAggregate > MAX_TRUSTED_MEMORY_RESULT_CONTENT_BYTES) {
      break;
    }
    const prospective = [...target, item];
    const prospectiveResponse = createTrustedMemorySearchResponse({
      traceId,
      results: prospective,
      auditEventId: RESPONSE_AUDIT_ID_PLACEHOLDER,
      releaseStatus: "release_attempted"
    });
    if (
      Buffer.byteLength(JSON.stringify(prospectiveResponse), "utf8") >
      MAX_PROTECTED_READ_RESPONSE_BYTES
    ) {
      break;
    }
    target.push(item);
    aggregateContentBytes = nextAggregate;
  }
}

function parseSearchRow(row: SearchRow): TrustedMemorySearchResult {
  const contentBytes = Buffer.byteLength(row.content, "utf8");
  if (
    !UUID.test(row.memory_id) ||
    !UUID.test(row.revision_id) ||
    contentBytes < 1 ||
    contentBytes > MAX_CANDIDATE_CONTENT_BYTES ||
    row.content_byte_count !== contentBytes ||
    !CANONICAL_RANK.test(row.rank) ||
    (row.provenance_kind !== "owner_assertion" &&
      row.provenance_kind !== "prior_memory")
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return {
    memoryId: row.memory_id,
    revisionId: row.revision_id,
    content: row.content,
    rank: row.rank,
    provenance: {
      kind: row.provenance_kind
    }
  };
}

function requireSearchAuthority(
  actor: AuthenticatedCredential,
  namespaceId: string
): void {
  if (actor.status !== "active" || actor.credentialClass !== "harness") {
    throw new SafeError("capability_not_allowed", 403);
  }
  if (!actor.namespaceIds.includes(namespaceId)) {
    throw new SafeError("namespace_not_allowed", 403);
  }
  if (!actor.capabilities.includes("trusted_memory.search")) {
    throw new SafeError("capability_not_allowed", 403);
  }
}

function assertReadStillLive(options: {
  startedAtMs: number;
  signal?: AbortSignal;
}): void {
  if (
    options.signal?.aborted === true ||
    Date.now() - options.startedAtMs >= STORY1_REQUEST_TIMEOUT_MS
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
}

function validateReceiptBinding(binding: ProtectedReadReceiptBinding): void {
  if (
    !UUID.test(binding.receiptId) ||
    binding.formatVersion !== RECEIPT_FORMAT_VERSION ||
    !UUID.test(binding.traceId) ||
    !UUID.test(binding.requestId) ||
    binding.actorReference !== `credential:${binding.actorCredentialId}` ||
    !UUID.test(binding.actorCredentialId) ||
    binding.operation !== SEARCH_OPERATION ||
    binding.policyDecision !== "allowed" ||
    !RELEASE_BINDING.test(binding.releaseBinding) ||
    !DIGEST.test(binding.requestDigest) ||
    !DIGEST.test(binding.resultDigest) ||
    !Number.isInteger(binding.coveredResultCount) ||
    binding.coveredResultCount < 0 ||
    binding.coveredResultCount > MAX_TRUSTED_MEMORY_SEARCH_RESULTS
  ) {
    throw new Error("protected_read_receipt_invalid");
  }
  const issuedAt = Date.parse(binding.issuedAt);
  const expiresAt = Date.parse(binding.expiresAt);
  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > PROTECTED_READ_RECEIPT_TTL_MS
  ) {
    throw new Error("protected_read_receipt_invalid");
  }
}

function hasExactKeys(
  value: Record<string, unknown>,
  required: string[],
  optional: string[]
): boolean {
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
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
