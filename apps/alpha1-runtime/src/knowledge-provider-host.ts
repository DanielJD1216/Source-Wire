import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID
} from "node:crypto";

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
const CONTRACT_ID = "source-wire.knowledge-provider" as const;
const CONTRACT_VERSION = "knowledge-provider.v1" as const;
const SEARCH_OPERATION = "search_evidence" as const;
const GET_OPERATION = "get_evidence" as const;
const MCP_OPERATION = "search_source_evidence" as const;
const MCP_GET_OPERATION = "get_source_evidence" as const;
const RECEIPT_FORMAT_VERSION = 1 as const;
type ProviderReadOperation = typeof SEARCH_OPERATION | typeof GET_OPERATION;
const MAX_SAFE_RETRY_AFTER_MS = 30_000;

type RuntimeKnowledgeProviderErrorCode =
  | "invalid_request"
  | "unsupported_contract_version"
  | "unsupported_operation"
  | "incompatible_provider_authority"
  | "scope_not_mapped"
  | "scope_violation"
  | "not_found"
  | "provenance_incomplete"
  | "rate_limited"
  | "deadline_exceeded"
  | "temporarily_unavailable"
  | "provider_failure";

type RuntimeKnowledgeProviderSafeError = {
  code: RuntimeKnowledgeProviderErrorCode;
  message: string;
  traceId: string;
  retryable: boolean;
  retryAfterMs?: number;
  detailsRedacted: true;
};

export type RuntimeKnowledgeProviderCursor = {
  providerId: string;
  providerScopeId: string;
  value: string;
};

export type RuntimeKnowledgeProviderProfile = Readonly<{
  contractId: typeof CONTRACT_ID;
  contractVersion: typeof CONTRACT_VERSION;
  providerId: string;
  providerScopeId: string;
  accessMode: "read_only";
  credentialMode: "out_of_band";
  capabilities: ReadonlyArray<
    Readonly<{
      capability: "search_evidence" | "get_evidence" | "describe" | "health";
      requirement: "required" | "optional";
      supported: boolean;
    }>
  >;
  requiredProvenance: true;
  noAutoPromotion: true;
  arbitraryTableMappingSupported: false;
  maximumResultCount: number;
  maximumExcerptBytes: number;
}>;

export type RuntimeKnowledgeProviderEvidence = {
  providerId: string;
  providerRecordId: string;
  sourceId: string;
  segmentId: string;
  ownerId: string;
  namespaceId: string;
  aclDecision: "allowed";
  sourceVersion: string;
  contentDigest: {
    algorithm: "sha256";
    value: string;
  };
  citationLocator: {
    value: string;
    publicSafe: true;
  };
  title: string;
  excerpt: string;
  mediaType: string;
  truncated: boolean;
  sensitivity: "public" | "internal" | "confidential" | "restricted";
  freshness: "fresh" | "stale" | "unknown";
  retrievedAt: string;
  sourceModifiedAt?: string;
  instructionAuthority: "none";
};

type RuntimeKnowledgeProviderRequestBase = {
  contractId: typeof CONTRACT_ID;
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  traceId: string;
  providerId: string;
  ownerId: string;
  namespaceId: string;
  providerScopeId: string;
  deadlineAt: string;
};

export type RuntimeKnowledgeProviderRequest =
  RuntimeKnowledgeProviderRequestBase &
    (
      | {
          operation: typeof SEARCH_OPERATION;
          requiredCapabilities: Array<{
            capability: typeof SEARCH_OPERATION;
            requirement: "required";
          }>;
          search: {
            query: string;
            maximumResults: number;
            cursor?: RuntimeKnowledgeProviderCursor;
          };
        }
      | {
          operation: typeof GET_OPERATION;
          requiredCapabilities: Array<{
            capability: typeof GET_OPERATION;
            requirement: "required";
          }>;
          get: {
            sourceId: string;
            segmentId: string;
          };
        }
    );

export type RuntimeKnowledgeProviderResult = {
  requestId: string;
  traceId: string;
  providerId: string;
  contractVersion: typeof CONTRACT_VERSION;
  status: "allowed" | "partial_success" | "denied" | "unavailable";
  evidence: RuntimeKnowledgeProviderEvidence[];
  gaps: Array<{
    code:
      | "no_evidence"
      | "partial_evidence"
      | "provider_unavailable"
      | "rate_limited"
      | "not_found"
      | "invalid_evidence";
    message: string;
    retryable: boolean;
  }>;
  nextCursor?: RuntimeKnowledgeProviderCursor;
  error?: RuntimeKnowledgeProviderSafeError;
  providerMutationAttempted: false;
  memoryMutationAttempted: false;
  trustedMemoryCreated: false;
  noAutoPromotion: true;
  readAuditRequired: true;
  releaseState: "internal_unreleased";
};

export interface RuntimeKnowledgeProvider {
  readonly profile: RuntimeKnowledgeProviderProfile;
  execute(
    request: RuntimeKnowledgeProviderRequest
  ): Promise<RuntimeKnowledgeProviderResult>;
}

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
  cursor?: RuntimeKnowledgeProviderCursor;
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
      cursor?: RuntimeKnowledgeProviderCursor;
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
        key !== "cursor"
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
  return {
    namespaceId,
    query: record.query,
    queryByteCount,
    limit: limit as number,
    ...(cursor === undefined ? {} : { cursor })
  };
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
      sourceId: assertSourceWireIdentifier(record.sourceId, "sourceId"),
      segmentId: assertSourceWireIdentifier(record.segmentId, "segmentId")
    };
  } catch {
    throw new SafeError("validation_failed", 400);
  }
}

function parseProviderCursor(value: unknown): RuntimeKnowledgeProviderCursor {
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
}): KnowledgeProviderHost {
  if (options.processReleaseSecret.length !== 32) {
    throw new Error("process_release_secret_invalid");
  }
  const originProcessId = randomUUID();
  const binding = options.binding
    ? freezeAndValidateBinding(options.binding)
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
                  : { cursor: command.cursor })
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

      let providerResult: RuntimeKnowledgeProviderResult;
      try {
        const providerRequestBase: RuntimeKnowledgeProviderRequestBase = {
          contractId: CONTRACT_ID,
          contractVersion: CONTRACT_VERSION,
          requestId,
          traceId: context.traceId,
          providerId: binding.providerId,
          ownerId: binding.ownerId,
          namespaceId: binding.namespaceId,
          providerScopeId: binding.providerScopeId,
          deadlineAt: new Date(deadlineMs).toISOString()
        };
        const providerRequest: RuntimeKnowledgeProviderRequest =
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
                    : { cursor: { ...command.cursor } })
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
        providerResult = await binding.provider.execute(providerRequest);
      } catch {
        throw new SafeError("operation_unavailable", 503, true);
      }
      if (Date.now() >= deadlineMs) {
        throw new SafeError("operation_unavailable", 503, true);
      }
      assertReadStillLive(context);

      let evidence: RuntimeKnowledgeProviderEvidence[];
      let gaps: RuntimeKnowledgeProviderResult["gaps"];
      let nextCursor: RuntimeKnowledgeProviderCursor | undefined;
      let providerError: RuntimeKnowledgeProviderSafeError | undefined;
      let providerStatus: RuntimeKnowledgeProviderResult["status"];
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
        providerStatus = providerResult.status;
      } catch (error) {
        if (error instanceof SafeError) throw error;
        throw new SafeError("operation_unavailable", 503, true);
      }
      const auditEventId = randomUUID();
      let serializedResponse = serializeEvidenceResponse({
        traceId: context.traceId,
        status: providerStatus,
        evidence,
        gaps,
        ...(nextCursor === undefined ? {} : { nextCursor }),
        ...(providerError === undefined ? {} : { error: providerError }),
        auditEventId
      });
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
        serializedResponse.fill(0);
        evidence.length = 0;
        gaps.length = 0;
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
      try {
        if (!(await options.auditStore.issue(receipt, originVerifier))) {
          throw new SafeError("audit_unavailable", 503, true);
        }
        assertReadStillLive(context);
        if (!(await options.auditStore.consume(receipt, originVerifier))) {
          throw new SafeError("release_binding_invalid", 503, true);
        }
        if (
          serializedResponse.byteLength !== receipt.responseByteCount ||
          createHash("sha256").update(serializedResponse).digest("hex") !==
            receipt.resultDigest
        ) {
          throw new SafeError("release_binding_invalid", 503, true);
        }
        return {
          serializedResponse,
          auditEventId,
          releaseStatus: "release_attempted",
          clear() {
            evidence.length = 0;
            gaps.length = 0;
            serializedResponse.fill(0);
          }
        };
      } catch (error) {
        evidence.length = 0;
        gaps.length = 0;
        serializedResponse.fill(0);
        throw error;
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

function freezeAndValidateBinding(binding: KnowledgeProviderBinding) {
  const profile = binding.provider.profile;
  if (
    profile.contractId !== CONTRACT_ID ||
    profile.contractVersion !== CONTRACT_VERSION ||
    profile.accessMode !== "read_only" ||
    profile.credentialMode !== "out_of_band" ||
    profile.requiredProvenance !== true ||
    profile.noAutoPromotion !== true ||
    profile.arbitraryTableMappingSupported !== false ||
    !profile.capabilities.some(
      (entry) =>
        entry.capability === SEARCH_OPERATION &&
        entry.supported === true
    ) ||
    !profile.capabilities.some(
      (entry) =>
        entry.capability === GET_OPERATION &&
        entry.supported === true
    ) ||
    profile.providerScopeId !== binding.providerScopeId ||
    !Number.isInteger(profile.maximumResultCount) ||
    profile.maximumResultCount < 1 ||
    !Number.isInteger(profile.maximumExcerptBytes) ||
    profile.maximumExcerptBytes < 1 ||
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
  result: RuntimeKnowledgeProviderResult,
  binding: ReturnType<typeof freezeAndValidateBinding>,
  context: AuthorizedEvidenceReadContext,
  requestId: string,
  command: EvidenceReadCommand
): RuntimeKnowledgeProviderEvidence[] {
  const requestedLimit =
    command.operation === SEARCH_OPERATION ? command.limit : 1;
  if (
    result.requestId !== requestId ||
    result.traceId !== context.traceId ||
    result.providerId !== binding.providerId ||
    result.contractVersion !== CONTRACT_VERSION ||
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
      !isProviderIdentifier(item.providerRecordId) ||
      !isProviderIdentifier(item.sourceId) ||
      !isProviderIdentifier(item.segmentId) ||
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
  gaps: RuntimeKnowledgeProviderResult["gaps"]
): RuntimeKnowledgeProviderResult["gaps"] {
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
  error: RuntimeKnowledgeProviderSafeError | undefined,
  traceId: string
): RuntimeKnowledgeProviderSafeError | undefined {
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
        (record.retryAfterMs as number) > MAX_SAFE_RETRY_AFTER_MS))
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const code = record.code as RuntimeKnowledgeProviderErrorCode;
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
  RuntimeKnowledgeProviderErrorCode,
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
  cursor: RuntimeKnowledgeProviderCursor | undefined,
  binding: ReturnType<typeof freezeAndValidateBinding>,
  operation: ProviderReadOperation
): RuntimeKnowledgeProviderCursor | undefined {
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

function serializeEvidenceResponse(input: {
  traceId: string;
  status: "allowed" | "partial_success" | "denied" | "unavailable";
  evidence: RuntimeKnowledgeProviderEvidence[];
  gaps: RuntimeKnowledgeProviderResult["gaps"];
  nextCursor?: RuntimeKnowledgeProviderCursor;
  error?: RuntimeKnowledgeProviderSafeError;
  auditEventId: string;
}): Buffer {
  const publicEvidence = input.evidence.map(
    ({ ownerId: _ownerId, namespaceId: _namespaceId, aclDecision: _acl, ...item }) =>
      item
  );
  const serialized = Buffer.from(
    JSON.stringify({
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
    }),
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
