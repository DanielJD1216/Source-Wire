import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID
} from "node:crypto";

import {
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS,
  type SourceWireKnowledgeEvidenceV1,
  type SourceWireKnowledgeFreshnessV1,
  type SourceWireKnowledgeProviderCursorV1,
  type SourceWireKnowledgeProviderErrorCodeV1,
  type SourceWireKnowledgeProviderGapV1,
  type SourceWireKnowledgeProviderOperationV1,
  type SourceWireKnowledgeProviderRequestV1,
  type SourceWireKnowledgeProviderResultV1,
  type SourceWireKnowledgeProviderV1,
  type SourceWireKnowledgeSensitivityV1,
  type SourceWireSafeErrorV1
} from "@source-wire/contracts";

import {
  assertSourceWireIdentifier,
  MAX_LIST_CURSOR_BYTES,
  MAX_PROTECTED_READ_RESPONSE_BYTES,
  MAX_SOURCE_EVIDENCE_EXCERPT_BYTES,
  MAX_SOURCE_EVIDENCE_QUERY_BYTES,
  MAX_SOURCE_EVIDENCE_SEARCH_RESULTS,
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
const ORIGIN_VERIFIER_DOMAIN =
  "source-wire.alpha1.story5.provider-read-origin-process.v1";
const SEARCH_OPERATION = "search_evidence" as const;
const GET_OPERATION = "get_evidence" as const;
const MCP_OPERATION = "search_source_evidence" as const;
const MCP_GET_OPERATION = "get_source_evidence" as const;
const RECEIPT_FORMAT_VERSION = 1 as const;
const MAX_OPAQUE_PROVIDER_KEY_BYTES = 512;
type ProviderReadOperation = typeof SEARCH_OPERATION | typeof GET_OPERATION;
const REQUIRED_PROVIDER_CAPABILITIES: readonly SourceWireKnowledgeProviderOperationV1[] =
  ["describe", "health", SEARCH_OPERATION, GET_OPERATION];
const PROVIDER_PROFILE_KEYS = [
  "accessMode",
  "arbitraryTableMappingSupported",
  "capabilities",
  "contractId",
  "contractVersion",
  "credentialMode",
  "maximumExcerptBytes",
  "maximumResultCount",
  "noAutoPromotion",
  "providerFamily",
  "providerId",
  "providerScopeId",
  "requiredProvenance"
] as const;
const PROVIDER_CAPABILITY_KEYS = [
  "capability",
  "requirement",
  "supported"
] as const;
type ProviderRequestBase = Omit<
  SourceWireKnowledgeProviderRequestV1,
  "operation" | "requiredCapabilities" | "search" | "get"
>;

export type KnowledgeProviderExecutionContext = Readonly<{
  signal: AbortSignal;
}>;

export type RuntimeKnowledgeProvider = Omit<
  SourceWireKnowledgeProviderV1,
  "execute"
> & {
  execute(
    request: SourceWireKnowledgeProviderRequestV1,
    context?: KnowledgeProviderExecutionContext
  ): Promise<SourceWireKnowledgeProviderResultV1>;
};

export type KnowledgeProviderBinding = Readonly<{
  provider: RuntimeKnowledgeProvider;
  ownerId: string;
  namespaceId: string;
  providerScopeId: string;
  timeoutMs: number;
}>;

export type SourceEvidenceSearchInput = {
  namespaceId: string;
  query: string;
  queryByteCount: number;
  limit: number;
  cursor?: SourceWireKnowledgeProviderCursorV1;
  freshness?: SourceWireKnowledgeFreshnessV1;
  sensitivity?: SourceWireKnowledgeSensitivityV1;
};

export type SourceEvidenceGetInput = {
  namespaceId: string;
  sourceId: string;
  segmentId: string;
};

export type ProviderReadReceiptBinding = {
  receiptId: string;
  formatVersion: typeof RECEIPT_FORMAT_VERSION;
  traceId: string;
  requestId: string;
  actorReference: string;
  actorCredentialId: string;
  actorIdentityId: string;
  ownerId: string;
  namespaceId: string;
  providerId: string;
  providerScopeId: string;
  operation: ProviderReadOperation;
  policyDecision: "allowed";
  releaseBinding: string;
  requestDigest: string;
  resultDigest: string;
  targetOrderDigest: string;
  responseByteCount: number;
  coveredResultCount: number;
  issuedAt: string;
  expiresAt: string;
  originProcessId: string;
  auditEventId: string;
};

export interface ProviderReadAuditStore {
  issue(
    receipt: ProviderReadReceiptBinding,
    originProcessVerifier: string
  ): Promise<boolean>;
  consume(
    receipt: ProviderReadReceiptBinding,
    originProcessVerifier: string
  ): Promise<boolean>;
}

export type ProviderReadStage =
  | "after_provider_return"
  | "before_response_serialization"
  | "during_response_serialization"
  | "after_response_serialization"
  | "before_audit_commit"
  | "after_audit_commit"
  | "before_receipt_consumption"
  | "after_receipt_consumption"
  | "before_response_write"
  | "after_response_write";

export type ProviderReadStageHook = (stage: ProviderReadStage) => void;

export type AuditedEvidenceRelease = {
  serializedResponse: Buffer;
  auditEventId: string;
  releaseStatus: "release_attempted";
  clear(): void;
};

export type AuthorizedEvidenceReadContext = {
  actor: AuthenticatedCredential;
  traceId: string;
  startedAtMs: number;
  signal?: AbortSignal;
};

export type EvidenceReadCommand =
  | {
      operation: typeof SEARCH_OPERATION;
      namespaceId: string;
      query: string;
      queryByteCount: number;
      limit: number;
      cursor?: SourceWireKnowledgeProviderCursorV1;
      freshness?: SourceWireKnowledgeFreshnessV1;
      sensitivity?: SourceWireKnowledgeSensitivityV1;
    }
  | {
      operation: typeof GET_OPERATION;
      namespaceId: string;
      sourceId: string;
      segmentId: string;
    };

export interface KnowledgeProviderHost {
  execute(
    context: AuthorizedEvidenceReadContext,
    command: EvidenceReadCommand
  ): Promise<AuditedEvidenceRelease>;
}

export function releaseAuditedEvidenceResponse<T>(
  execution: AuditedEvidenceRelease,
  writeResponse: (serializedResponse: ArrayBuffer) => T,
  onStage?: ProviderReadStageHook
): T {
  const responseBytes = Uint8Array.from(execution.serializedResponse);
  try {
    const response = writeResponse(responseBytes.buffer);
    onStage?.("after_response_write");
    return response;
  } catch (error) {
    responseBytes.fill(0);
    throw error;
  } finally {
    execution.clear();
  }
}

export function parseSourceEvidenceSearch(
  value: unknown
): SourceEvidenceSearchInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeError("validation_failed", 400);
  }
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (key) =>
        key !== "namespaceId" &&
        key !== "query" &&
        key !== "limit" &&
        key !== "cursor" &&
        key !== "freshness" &&
        key !== "sensitivity"
    )
  ) {
    throw new SafeError("validation_failed", 400);
  }
  let namespaceId: string;
  try {
    namespaceId = assertSourceWireIdentifier(
      record.namespaceId,
      "namespaceId"
    );
  } catch {
    throw new SafeError("namespace_not_allowed", 403);
  }
  if (
    typeof record.query !== "string" ||
    record.query.trim().length === 0 ||
    record.query.includes("\0") ||
    hasUnpairedSurrogate(record.query)
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const queryByteCount = Buffer.byteLength(record.query, "utf8");
  if (
    queryByteCount < 1 ||
    queryByteCount > MAX_SOURCE_EVIDENCE_QUERY_BYTES
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const limit = record.limit ?? MAX_SOURCE_EVIDENCE_SEARCH_RESULTS;
  if (
    !Number.isInteger(limit) ||
    (limit as number) < 1 ||
    (limit as number) > MAX_SOURCE_EVIDENCE_SEARCH_RESULTS
  ) {
    throw new SafeError("validation_failed", 400);
  }
  const cursor =
    record.cursor === undefined
      ? undefined
      : parseProviderCursor(record.cursor);
  const freshness =
    record.freshness === undefined
      ? undefined
      : parseFreshness(record.freshness);
  const sensitivity =
    record.sensitivity === undefined
      ? undefined
      : parseSensitivity(record.sensitivity);
  return {
    namespaceId,
    query: record.query,
    queryByteCount,
    limit: limit as number,
    ...(cursor === undefined ? {} : { cursor }),
    ...(freshness === undefined ? {} : { freshness }),
    ...(sensitivity === undefined ? {} : { sensitivity })
  };
}

function parseFreshness(value: unknown): SourceWireKnowledgeFreshnessV1 {
  if (value === "fresh" || value === "stale" || value === "unknown") {
    return value;
  }
  throw new SafeError("validation_failed", 400);
}

function parseSensitivity(value: unknown): SourceWireKnowledgeSensitivityV1 {
  if (
    value === "public" ||
    value === "internal" ||
    value === "confidential" ||
    value === "restricted"
  ) {
    return value;
  }
  throw new SafeError("validation_failed", 400);
}

export function parseSourceEvidenceGet(value: unknown): SourceEvidenceGetInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeError("validation_failed", 400);
  }
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (key) =>
        key !== "namespaceId" && key !== "sourceId" && key !== "segmentId"
    )
  ) {
    throw new SafeError("validation_failed", 400);
  }
  try {
    return {
      namespaceId: assertSourceWireIdentifier(
        record.namespaceId,
        "namespaceId"
      ),
      sourceId: requireOpaqueProviderKey(record.sourceId),
      segmentId: requireOpaqueProviderKey(record.segmentId)
    };
  } catch {
    throw new SafeError("validation_failed", 400);
  }
}

function parseProviderCursor(value: unknown): SourceWireKnowledgeProviderCursorV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeError("validation_failed", 400);
  }
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (key) =>
        key !== "providerId" &&
        key !== "providerScopeId" &&
        key !== "value"
    ) ||
    !isProviderIdentifier(record.providerId) ||
    !isProviderIdentifier(record.providerScopeId) ||
    typeof record.value !== "string" ||
    record.value.length < 1 ||
    Buffer.byteLength(record.value, "utf8") > MAX_LIST_CURSOR_BYTES ||
    !/^[A-Za-z0-9_-]+$/u.test(record.value)
  ) {
    throw new SafeError("validation_failed", 400);
  }
  return {
    providerId: record.providerId,
    providerScopeId: record.providerScopeId,
    value: record.value
  };
}

export function createKnowledgeProviderHost(options: {
  binding?: KnowledgeProviderBinding;
  auditStore: ProviderReadAuditStore;
  processReleaseSecret: Buffer;
  onStage?: ProviderReadStageHook;
}): KnowledgeProviderHost {
  if (options.processReleaseSecret.length !== 32) {
    throw new Error("process_release_secret_invalid");
  }
  const originProcessId = randomUUID();
  const binding = options.binding
    ? validateKnowledgeProviderBinding(options.binding)
    : undefined;

  return Object.freeze({
    async execute(
      context: AuthorizedEvidenceReadContext,
      command: EvidenceReadCommand
    ): Promise<AuditedEvidenceRelease> {
      if (!binding) {
        throw new SafeError("operation_unavailable", 503, true);
      }
      requireEvidenceSearchAuthority(context.actor, command.namespaceId);
      if (
        context.actor.ownerId !== binding.ownerId ||
        command.namespaceId !== binding.namespaceId
      ) {
        throw new SafeError("namespace_not_allowed", 403);
      }
      if (
        command.operation === SEARCH_OPERATION &&
        command.cursor !== undefined &&
        (command.cursor.providerId !== binding.providerId ||
          command.cursor.providerScopeId !== binding.providerScopeId)
      ) {
        throw new SafeError("operation_unavailable", 503, true);
      }
      assertReadStillLive(context);
      const requestId = randomUUID();
      const requestDigest = canonicalRequestDigest({
        apiSchema: STORY1_API_SCHEMA,
        method: "POST",
        mcpOperation:
          command.operation === SEARCH_OPERATION
            ? MCP_OPERATION
            : MCP_GET_OPERATION,
        providerOperation: command.operation,
        actorCredentialId: context.actor.credentialId,
        actorIdentityId: context.actor.actorIdentityId,
        ownerId: context.actor.ownerId,
        namespaceId: command.namespaceId,
        providerId: binding.providerId,
        providerScopeId: binding.providerScopeId,
        selector:
          command.operation === SEARCH_OPERATION
            ? {
                query: command.query,
                limit: command.limit,
                ...(command.cursor === undefined
                  ? {}
                  : { cursor: command.cursor }),
                ...(command.freshness === undefined
                  ? {}
                  : { freshness: command.freshness }),
                ...(command.sensitivity === undefined
                  ? {}
                  : { sensitivity: command.sensitivity })
              }
            : {
                sourceId: command.sourceId,
                segmentId: command.segmentId
              }
      });
      const deadlineMs = Math.min(
        context.startedAtMs + STORY1_REQUEST_TIMEOUT_MS,
        Date.now() + binding.timeoutMs
      );
      if (deadlineMs <= Date.now()) {
        throw new SafeError("operation_unavailable", 503, true);
      }

      let providerResult: SourceWireKnowledgeProviderResultV1;
      try {
        const providerRequestBase: ProviderRequestBase = {
          contractId: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
          contractVersion: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
          requestId,
          traceId: context.traceId,
          providerId: binding.providerId,
          ownerId: binding.ownerId,
          namespaceId: binding.namespaceId,
          providerScopeId: binding.providerScopeId,
          deadlineAt: new Date(deadlineMs).toISOString()
        };
        const providerRequest: SourceWireKnowledgeProviderRequestV1 =
          command.operation === SEARCH_OPERATION
            ? {
                ...providerRequestBase,
                operation: SEARCH_OPERATION,
                requiredCapabilities: [
                  {
                    capability: SEARCH_OPERATION,
                    requirement: "required"
                  }
                ],
                search: {
                  query: command.query,
                  maximumResults: Math.min(
                    command.limit,
                    binding.maximumResultCount,
                    MAX_SOURCE_EVIDENCE_SEARCH_RESULTS
                  ),
                  ...(command.cursor === undefined
                    ? {}
                    : { cursor: { ...command.cursor } }),
                  ...(command.freshness === undefined
                    ? {}
                    : { freshness: command.freshness }),
                  ...(command.sensitivity === undefined
                    ? {}
                    : { sensitivity: command.sensitivity })
                }
              }
            : {
                ...providerRequestBase,
                operation: GET_OPERATION,
                requiredCapabilities: [
                  {
                    capability: GET_OPERATION,
                    requirement: "required"
                  }
                ],
                get: {
                  sourceId: command.sourceId,
                  segmentId: command.segmentId
                }
              };
        providerResult = await executeProviderWithDeadline(
          binding.provider,
          providerRequest,
          deadlineMs,
          context.signal
        );
        options.onStage?.("after_provider_return");
      } catch {
        throw new SafeError("operation_unavailable", 503, true);
      }
      if (Date.now() >= deadlineMs) {
        throw new SafeError("operation_unavailable", 503, true);
      }
      assertReadStillLive(context);

      let evidence: SourceWireKnowledgeEvidenceV1[] = [];
      let gaps: SourceWireKnowledgeProviderResultV1["gaps"] = [];
      let nextCursor: SourceWireKnowledgeProviderCursorV1 | undefined;
      let providerError: SourceWireSafeErrorV1<SourceWireKnowledgeProviderErrorCodeV1> | undefined;
      let serializedResponse: Buffer | undefined;
      try {
        evidence = validateAndCopyProviderResult(
          providerResult,
          binding,
          context,
          requestId,
          command
        );
        gaps = normalizeProviderGaps(providerResult.gaps);
        nextCursor = validateProviderNextCursor(
          providerResult.nextCursor,
          binding,
          command.operation
        );
        providerError = normalizeProviderError(
          providerResult.error,
          context.traceId
        );
        const auditEventId = randomUUID();
        options.onStage?.("before_response_serialization");
        serializedResponse = serializeEvidenceResponse(
          {
            traceId: context.traceId,
            status: providerResult.status,
            evidence,
            gaps,
            ...(nextCursor === undefined ? {} : { nextCursor }),
            ...(providerError === undefined ? {} : { error: providerError }),
            auditEventId
          },
          options.onStage
        );
        options.onStage?.("after_response_serialization");
        const resultDigest = createHash("sha256")
          .update(serializedResponse)
          .digest("hex");
        const targetOrderDigest = canonicalRequestDigest({
          domain: "source-wire.alpha1.story5.provider-result-order.v1",
          targets: evidence.map((item, index) => ({
            ordinal: index + 1,
            providerRecordId: item.providerRecordId,
            sourceId: item.sourceId,
            segmentId: item.segmentId,
            contentDigest: item.contentDigest.value
          }))
        });
        const issuedAt = new Date();
        const expiryTime = Math.min(
          context.startedAtMs + STORY1_REQUEST_TIMEOUT_MS,
          issuedAt.getTime() + PROTECTED_READ_RECEIPT_TTL_MS
        );
        if (expiryTime <= issuedAt.getTime()) {
          throw new SafeError("operation_unavailable", 503, true);
        }
        const receipt: ProviderReadReceiptBinding = {
          receiptId: randomUUID(),
          formatVersion: RECEIPT_FORMAT_VERSION,
          traceId: context.traceId,
          requestId,
          actorReference: context.actor.actorReference,
          actorCredentialId: context.actor.credentialId,
          actorIdentityId: context.actor.actorIdentityId,
          ownerId: binding.ownerId,
          namespaceId: binding.namespaceId,
          providerId: binding.providerId,
          providerScopeId: binding.providerScopeId,
          operation: command.operation,
          policyDecision: "allowed",
          releaseBinding: randomBytes(32).toString("base64url"),
          requestDigest,
          resultDigest,
          targetOrderDigest,
          responseByteCount: serializedResponse.byteLength,
          coveredResultCount: evidence.length,
          issuedAt: issuedAt.toISOString(),
          expiresAt: new Date(expiryTime).toISOString(),
          originProcessId,
          auditEventId
        };
        const originVerifier = computeProviderOriginProcessVerifier(
          options.processReleaseSecret,
          receipt
        );
        options.onStage?.("before_audit_commit");
        let issued: boolean;
        try {
          issued = await options.auditStore.issue(receipt, originVerifier);
        } catch {
          throw new SafeError("audit_unavailable", 503, true);
        }
        if (!issued) throw new SafeError("audit_unavailable", 503, true);
        options.onStage?.("after_audit_commit");
        assertReadStillLive(context);
        options.onStage?.("before_receipt_consumption");
        let consumed: boolean;
        try {
          consumed = await options.auditStore.consume(
            receipt,
            originVerifier
          );
        } catch {
          throw new SafeError("audit_unavailable", 503, true);
        }
        if (!consumed) {
          throw new SafeError("release_binding_invalid", 503, true);
        }
        options.onStage?.("after_receipt_consumption");
        if (
          serializedResponse.byteLength !== receipt.responseByteCount ||
          createHash("sha256").update(serializedResponse).digest("hex") !==
            receipt.resultDigest
        ) {
          throw new SafeError("release_binding_invalid", 503, true);
        }
        assertReadStillLive(context);
        options.onStage?.("before_response_write");
        const releaseBuffer = serializedResponse;
        let cleared = false;
        return {
          serializedResponse: releaseBuffer,
          auditEventId,
          releaseStatus: "release_attempted",
          clear() {
            if (cleared) return;
            cleared = true;
            evidence.length = 0;
            gaps.length = 0;
            releaseBuffer.fill(0);
          }
        };
      } catch (error) {
        evidence.length = 0;
        gaps.length = 0;
        serializedResponse?.fill(0);
        if (error instanceof SafeError) throw error;
        throw new SafeError("operation_unavailable", 503, true);
      }
    }
  });
}

export function computeProviderOriginProcessVerifier(
  processReleaseSecret: Buffer,
  receipt: ProviderReadReceiptBinding
): string {
  if (processReleaseSecret.length !== 32) {
    throw new Error("process_release_secret_invalid");
  }
  validateReceipt(receipt);
  return createHmac("sha256", processReleaseSecret)
    .update(ORIGIN_VERIFIER_DOMAIN, "utf8")
    .update("\0", "utf8")
    .update(canonicalRequestDigest(receipt), "ascii")
    .digest("hex");
}

export function validateKnowledgeProviderBinding(
  binding: KnowledgeProviderBinding
) {
  const profile = binding.provider.profile;
  const profileKeys =
    profile && typeof profile === "object"
      ? Object.keys(profile).sort()
      : [];
  const capabilityNames = Array.isArray(profile?.capabilities)
    ? profile.capabilities.map((entry) =>
        entry && typeof entry === "object"
          ? entry.capability
          : undefined
      )
    : [];
  if (
    JSON.stringify(profileKeys) !==
      JSON.stringify([...PROVIDER_PROFILE_KEYS].sort()) ||
    profile.contractId !== SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID ||
    profile.contractVersion !== SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION ||
    (profile.providerFamily !== "document_index" &&
      profile.providerFamily !== "relational_view" &&
      profile.providerFamily !== "custom") ||
    profile.accessMode !== "read_only" ||
    profile.credentialMode !== "out_of_band" ||
    profile.requiredProvenance !== true ||
    profile.noAutoPromotion !== true ||
    profile.arbitraryTableMappingSupported !== false ||
    !Array.isArray(profile.capabilities) ||
    profile.capabilities.length !== REQUIRED_PROVIDER_CAPABILITIES.length ||
    new Set(capabilityNames).size !== REQUIRED_PROVIDER_CAPABILITIES.length ||
    profile.capabilities.some(
      (entry) =>
        !entry ||
        typeof entry !== "object" ||
        JSON.stringify(Object.keys(entry).sort()) !==
          JSON.stringify([...PROVIDER_CAPABILITY_KEYS].sort())
    ) ||
    !REQUIRED_PROVIDER_CAPABILITIES.every((capability) =>
      profile.capabilities.some(
        (entry) =>
          entry.capability === capability &&
          entry.requirement === "required" &&
          entry.supported === true
      )
    ) ||
    profile.providerScopeId !== binding.providerScopeId ||
    !Number.isInteger(profile.maximumResultCount) ||
    profile.maximumResultCount < 1 ||
    profile.maximumResultCount > MAX_SOURCE_EVIDENCE_SEARCH_RESULTS ||
    !Number.isInteger(profile.maximumExcerptBytes) ||
    profile.maximumExcerptBytes < 1 ||
    profile.maximumExcerptBytes > MAX_SOURCE_EVIDENCE_EXCERPT_BYTES ||
    !Number.isInteger(binding.timeoutMs) ||
    binding.timeoutMs < 1 ||
    binding.timeoutMs > STORY1_REQUEST_TIMEOUT_MS
  ) {
    throw new Error("knowledge_provider_binding_invalid");
  }
  return Object.freeze({
    provider: binding.provider,
    ownerId: assertSourceWireIdentifier(binding.ownerId, "ownerId"),
    namespaceId: assertSourceWireIdentifier(
      binding.namespaceId,
      "namespaceId"
    ),
    providerId: assertSourceWireIdentifier(profile.providerId, "providerId"),
    providerScopeId: assertSourceWireIdentifier(
      binding.providerScopeId,
      "providerScopeId"
    ),
    maximumResultCount: profile.maximumResultCount,
    maximumExcerptBytes: Math.min(
      profile.maximumExcerptBytes,
      MAX_SOURCE_EVIDENCE_EXCERPT_BYTES
    ),
    timeoutMs: binding.timeoutMs
  });
}

function validateAndCopyProviderResult(
  result: SourceWireKnowledgeProviderResultV1,
  binding: ReturnType<typeof validateKnowledgeProviderBinding>,
  context: AuthorizedEvidenceReadContext,
  requestId: string,
  command: EvidenceReadCommand
): SourceWireKnowledgeEvidenceV1[] {
  const requestedLimit =
    command.operation === SEARCH_OPERATION ? command.limit : 1;
  if (
    result.requestId !== requestId ||
    result.traceId !== context.traceId ||
    result.providerId !== binding.providerId ||
    result.contractVersion !== SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION ||
    (result.status !== "allowed" &&
      result.status !== "partial_success" &&
      result.status !== "denied" &&
      result.status !== "unavailable") ||
    ((result.status === "allowed" ||
      result.status === "partial_success") &&
      result.error !== undefined) ||
    ((result.status === "denied" ||
      result.status === "unavailable") &&
      result.error === undefined) ||
    ((result.status === "denied" ||
      result.status === "unavailable") &&
      result.nextCursor !== undefined) ||
    result.providerMutationAttempted !== false ||
    result.memoryMutationAttempted !== false ||
    result.trustedMemoryCreated !== false ||
    result.noAutoPromotion !== true ||
    result.readAuditRequired !== true ||
    result.releaseState !== "internal_unreleased" ||
    !Array.isArray(result.evidence) ||
    ((result.status === "denied" || result.status === "unavailable") &&
      result.evidence.length !== 0) ||
    result.evidence.length >
      Math.min(
        command.operation === GET_OPERATION ? 1 : requestedLimit,
        binding.maximumResultCount,
        MAX_SOURCE_EVIDENCE_SEARCH_RESULTS
      ) ||
    !Array.isArray(result.gaps)
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }

  let aggregateExcerptBytes = 0;
  return (result.evidence as unknown[]).map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    const item = value as Record<string, unknown>;
    const contentDigest = item.contentDigest;
    const citationLocator = item.citationLocator;
    if (
      !contentDigest ||
      typeof contentDigest !== "object" ||
      Array.isArray(contentDigest) ||
      !citationLocator ||
      typeof citationLocator !== "object" ||
      Array.isArray(citationLocator) ||
      typeof item.excerpt !== "string"
    ) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    const digest = contentDigest as Record<string, unknown>;
    const locator = citationLocator as Record<string, unknown>;
    const excerptBytes = Buffer.byteLength(item.excerpt, "utf8");
    aggregateExcerptBytes += excerptBytes;
    if (
      item.providerId !== binding.providerId ||
      item.ownerId !== binding.ownerId ||
      item.namespaceId !== binding.namespaceId ||
      (command.operation === GET_OPERATION &&
        (item.sourceId !== command.sourceId ||
          item.segmentId !== command.segmentId)) ||
      item.aclDecision !== "allowed" ||
      !isOpaqueProviderKey(item.providerRecordId) ||
      !isOpaqueProviderKey(item.sourceId) ||
      !isOpaqueProviderKey(item.segmentId) ||
      !isBoundedText(item.sourceVersion, 256) ||
      digest.algorithm !== "sha256" ||
      typeof digest.value !== "string" ||
      !DIGEST.test(digest.value) ||
      locator.publicSafe !== true ||
      !isBoundedText(locator.value, 2_048) ||
      !isBoundedText(item.title, 1_024) ||
      !isBoundedText(item.mediaType, 128) ||
      typeof item.truncated !== "boolean" ||
      (item.sensitivity !== "public" &&
        item.sensitivity !== "internal" &&
        item.sensitivity !== "confidential" &&
        item.sensitivity !== "restricted") ||
      (item.freshness !== "fresh" &&
        item.freshness !== "stale" &&
        item.freshness !== "unknown") ||
      !isIsoDate(item.retrievedAt) ||
      (item.sourceModifiedAt !== undefined &&
        !isIsoDate(item.sourceModifiedAt)) ||
      item.instructionAuthority !== "none" ||
      excerptBytes < 1 ||
      excerptBytes > binding.maximumExcerptBytes ||
      aggregateExcerptBytes > MAX_SOURCE_EVIDENCE_EXCERPT_BYTES
    ) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    return {
      providerId: binding.providerId,
      providerRecordId: item.providerRecordId,
      sourceId: item.sourceId,
      segmentId: item.segmentId,
      ownerId: binding.ownerId,
      namespaceId: binding.namespaceId,
      aclDecision: "allowed" as const,
      sourceVersion: item.sourceVersion,
      contentDigest: {
        algorithm: "sha256" as const,
        value: digest.value
      },
      citationLocator: {
        value: locator.value,
        publicSafe: true as const
      },
      title: item.title,
      excerpt: item.excerpt,
      mediaType: item.mediaType,
      truncated: item.truncated,
      sensitivity: item.sensitivity,
      freshness: item.freshness,
      retrievedAt: item.retrievedAt,
      ...(item.sourceModifiedAt === undefined
        ? {}
        : { sourceModifiedAt: item.sourceModifiedAt }),
      instructionAuthority: "none" as const
    };
  });
}

function isProviderIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z][A-Za-z0-9_-]{0,63}$/u.test(value)
  );
}

function requireOpaqueProviderKey(value: unknown): string {
  if (!isOpaqueProviderKey(value)) {
    throw new SafeError("validation_failed", 400);
  }
  return value;
}

function isOpaqueProviderKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !hasUnpairedSurrogate(value) &&
    !/[\u0000-\u001F\u007F]/u.test(value) &&
    Buffer.byteLength(value, "utf8") <= MAX_OPAQUE_PROVIDER_KEY_BYTES
  );
}

function isBoundedText(value: unknown, maximumBytes: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.includes("\0") &&
    !hasUnpairedSurrogate(value) &&
    Buffer.byteLength(value, "utf8") <= maximumBytes
  );
}

function isIsoDate(value: unknown): value is string {
  return (
    isBoundedText(value, 64) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function normalizeProviderGaps(
  gaps: SourceWireKnowledgeProviderResultV1["gaps"]
): SourceWireKnowledgeProviderResultV1["gaps"] {
  if (!Array.isArray(gaps) || gaps.length > MAX_SOURCE_EVIDENCE_SEARCH_RESULTS) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const safeMessages = {
    no_evidence: "No evidence matched the request.",
    partial_evidence: "Some evidence could not be returned.",
    provider_unavailable: "Source evidence is temporarily unavailable.",
    rate_limited: "Source evidence is temporarily unavailable.",
    not_found: "Requested evidence is unavailable.",
    invalid_evidence: "Some evidence was withheld."
  } as const;
  return gaps.map((gap) => {
    if (
      !gap ||
      typeof gap !== "object" ||
      !(gap.code in safeMessages) ||
      typeof gap.retryable !== "boolean"
    ) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    return {
      code: gap.code,
      message: safeMessages[gap.code],
      retryable: gap.retryable
    };
  });
}

function normalizeProviderError(
  error: SourceWireSafeErrorV1<SourceWireKnowledgeProviderErrorCodeV1> | undefined,
  traceId: string
): SourceWireSafeErrorV1<SourceWireKnowledgeProviderErrorCodeV1> | undefined {
  if (error === undefined) return undefined;
  if (!error || typeof error !== "object" || Array.isArray(error)) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const record = error as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (key) =>
        key !== "code" &&
        key !== "message" &&
        key !== "traceId" &&
        key !== "retryable" &&
        key !== "retryAfterMs" &&
        key !== "detailsRedacted"
    ) ||
    typeof record.code !== "string" ||
    !(record.code in SAFE_PROVIDER_ERROR_MESSAGES) ||
    record.traceId !== traceId ||
    typeof record.retryable !== "boolean" ||
    record.detailsRedacted !== true ||
    (record.retryAfterMs !== undefined &&
      (!Number.isInteger(record.retryAfterMs) ||
        (record.retryAfterMs as number) < 0 ||
        (record.retryAfterMs as number) > SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS))
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const code = record.code as SourceWireKnowledgeProviderErrorCodeV1;
  return {
    code,
    message: SAFE_PROVIDER_ERROR_MESSAGES[code],
    traceId,
    retryable: record.retryable,
    ...(record.retryAfterMs === undefined
      ? {}
      : { retryAfterMs: record.retryAfterMs as number }),
    detailsRedacted: true
  };
}

const SAFE_PROVIDER_ERROR_MESSAGES: Record<
  SourceWireKnowledgeProviderErrorCodeV1,
  string
> = {
  invalid_request: "The request is not valid for this contract.",
  unsupported_contract_version:
    "The requested contract version is not supported.",
  unsupported_operation: "The requested operation is not supported.",
  incompatible_provider_authority:
    "The provider authority is incompatible with this contract.",
  scope_not_mapped: "The requested provider scope is not available.",
  scope_violation: "The request is not allowed for this scope.",
  not_found: "The requested item is not available.",
  provenance_incomplete: "Required provenance is incomplete.",
  rate_limited: "The request cannot be completed at this time.",
  deadline_exceeded: "The request deadline was exceeded.",
  temporarily_unavailable: "The service is temporarily unavailable.",
  provider_failure: "The provider could not complete the request."
};

function validateProviderNextCursor(
  cursor: SourceWireKnowledgeProviderCursorV1 | undefined,
  binding: ReturnType<typeof validateKnowledgeProviderBinding>,
  operation: ProviderReadOperation
): SourceWireKnowledgeProviderCursorV1 | undefined {
  if (cursor === undefined) return undefined;
  if (
    operation !== SEARCH_OPERATION ||
    cursor.providerId !== binding.providerId ||
    cursor.providerScopeId !== binding.providerScopeId
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return parseProviderCursor(cursor);
}

function serializeEvidenceResponse(
  input: {
    traceId: string;
    status: "allowed" | "partial_success" | "denied" | "unavailable";
    evidence: SourceWireKnowledgeEvidenceV1[];
    gaps: SourceWireKnowledgeProviderResultV1["gaps"];
    nextCursor?: SourceWireKnowledgeProviderCursorV1;
    error?: SourceWireSafeErrorV1<SourceWireKnowledgeProviderErrorCodeV1>;
    auditEventId: string;
  },
  onStage?: ProviderReadStageHook
): Buffer {
  const publicEvidence = input.evidence.map(
    ({ ownerId: _ownerId, namespaceId: _namespaceId, aclDecision: _acl, ...item }) =>
      item
  );
  let serializationStageObserved = false;
  const serialized = Buffer.from(
    JSON.stringify(
      {
        schema: STORY1_API_SCHEMA,
        traceId: input.traceId,
        data: {
          status: input.status,
          evidence: publicEvidence,
          gaps: input.gaps,
          ...(input.nextCursor === undefined
            ? {}
            : { nextCursor: input.nextCursor }),
          ...(input.error === undefined ? {} : { error: input.error })
        },
        audit: {
          eventId: input.auditEventId,
          releaseStatus: "release_attempted"
        }
      },
      (key, value) => {
        if (!serializationStageObserved && key === "evidence") {
          serializationStageObserved = true;
          onStage?.("during_response_serialization");
        }
        return value;
      }
    ),
    "utf8"
  );
  if (serialized.byteLength > MAX_PROTECTED_READ_RESPONSE_BYTES) {
    serialized.fill(0);
    throw new SafeError("operation_unavailable", 503, true);
  }
  return serialized;
}

function requireEvidenceSearchAuthority(
  actor: AuthenticatedCredential,
  namespaceId: string
): void {
  if (actor.status !== "active" || actor.credentialClass !== "harness") {
    throw new SafeError("capability_not_allowed", 403);
  }
  if (!actor.namespaceIds.includes(namespaceId)) {
    throw new SafeError("namespace_not_allowed", 403);
  }
  if (!actor.capabilities.includes("source_evidence.read")) {
    throw new SafeError("capability_not_allowed", 403);
  }
}

function assertReadStillLive(context: {
  startedAtMs: number;
  signal?: AbortSignal;
}): void {
  if (
    context.signal?.aborted === true ||
    Date.now() - context.startedAtMs >= STORY1_REQUEST_TIMEOUT_MS
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
}

async function executeProviderWithDeadline(
  provider: RuntimeKnowledgeProvider,
  request: SourceWireKnowledgeProviderRequestV1,
  deadlineMs: number,
  requestSignal?: AbortSignal
): Promise<SourceWireKnowledgeProviderResultV1> {
  if (deadlineMs <= Date.now() || requestSignal?.aborted === true) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const controller = new AbortController();
  const abortForRequest = () => controller.abort(requestSignal?.reason);
  const abortPromise = new Promise<never>((_resolve, reject) => {
    controller.signal.addEventListener(
      "abort",
      () => reject(new SafeError("operation_unavailable", 503, true)),
      { once: true }
    );
  });
  requestSignal?.addEventListener("abort", abortForRequest, { once: true });
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(0, deadlineMs - Date.now())
  );
  const providerExecution = Promise.resolve().then(() => {
    if (controller.signal.aborted || deadlineMs <= Date.now()) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    return provider.execute(request, { signal: controller.signal });
  });
  try {
    return await Promise.race([providerExecution, abortPromise]);
  } finally {
    clearTimeout(timeout);
    requestSignal?.removeEventListener("abort", abortForRequest);
  }
}

function validateReceipt(receipt: ProviderReadReceiptBinding): void {
  if (
    !UUID.test(receipt.receiptId) ||
    receipt.formatVersion !== RECEIPT_FORMAT_VERSION ||
    !UUID.test(receipt.traceId) ||
    !UUID.test(receipt.requestId) ||
    receipt.actorReference !== `credential:${receipt.actorCredentialId}` ||
    !UUID.test(receipt.actorCredentialId) ||
    !UUID.test(receipt.actorIdentityId) ||
    (receipt.operation !== SEARCH_OPERATION &&
      receipt.operation !== GET_OPERATION) ||
    receipt.policyDecision !== "allowed" ||
    !RELEASE_BINDING.test(receipt.releaseBinding) ||
    !DIGEST.test(receipt.requestDigest) ||
    !DIGEST.test(receipt.resultDigest) ||
    !DIGEST.test(receipt.targetOrderDigest) ||
    !Number.isInteger(receipt.responseByteCount) ||
    receipt.responseByteCount < 1 ||
    receipt.responseByteCount > MAX_PROTECTED_READ_RESPONSE_BYTES ||
    !Number.isInteger(receipt.coveredResultCount) ||
    receipt.coveredResultCount < 0 ||
    receipt.coveredResultCount > MAX_SOURCE_EVIDENCE_SEARCH_RESULTS ||
    !UUID.test(receipt.originProcessId) ||
    !UUID.test(receipt.auditEventId)
  ) {
    throw new Error("provider_read_receipt_invalid");
  }
  const issuedAt = Date.parse(receipt.issuedAt);
  const expiresAt = Date.parse(receipt.expiresAt);
  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > PROTECTED_READ_RECEIPT_TTL_MS
  ) {
    throw new Error("provider_read_receipt_invalid");
  }
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
