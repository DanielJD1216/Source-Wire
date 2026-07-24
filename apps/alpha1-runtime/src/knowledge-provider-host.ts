import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID
} from "node:crypto";

import {
  assertSourceWireIdentifier,
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
const MCP_OPERATION = "search_source_evidence" as const;
const RECEIPT_FORMAT_VERSION = 1 as const;

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

export type RuntimeKnowledgeProviderRequest = {
  contractId: typeof CONTRACT_ID;
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  traceId: string;
  providerId: string;
  ownerId: string;
  namespaceId: string;
  providerScopeId: string;
  operation: typeof SEARCH_OPERATION;
  requiredCapabilities: Array<{
    capability: typeof SEARCH_OPERATION;
    requirement: "required";
  }>;
  deadlineAt: string;
  search: {
    query: string;
    maximumResults: number;
  };
};

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
  operation: typeof SEARCH_OPERATION;
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

export type EvidenceReadCommand = {
  operation: typeof SEARCH_OPERATION;
  namespaceId: string;
  query: string;
  queryByteCount: number;
  limit: number;
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
      (key) => key !== "namespaceId" && key !== "query" && key !== "limit"
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
  return {
    namespaceId,
    query: record.query,
    queryByteCount,
    limit: limit as number
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
      assertReadStillLive(context);
      const requestId = randomUUID();
      const requestDigest = canonicalRequestDigest({
        apiSchema: STORY1_API_SCHEMA,
        method: "POST",
        mcpOperation: MCP_OPERATION,
        providerOperation: SEARCH_OPERATION,
        actorCredentialId: context.actor.credentialId,
        actorIdentityId: context.actor.actorIdentityId,
        ownerId: context.actor.ownerId,
        namespaceId: command.namespaceId,
        providerId: binding.providerId,
        providerScopeId: binding.providerScopeId,
        query: command.query,
        limit: command.limit
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
        providerResult = await binding.provider.execute({
          contractId: CONTRACT_ID,
          contractVersion: CONTRACT_VERSION,
          requestId,
          traceId: context.traceId,
          providerId: binding.providerId,
          ownerId: binding.ownerId,
          namespaceId: binding.namespaceId,
          providerScopeId: binding.providerScopeId,
          operation: SEARCH_OPERATION,
          requiredCapabilities: [
            {
              capability: SEARCH_OPERATION,
              requirement: "required"
            }
          ],
          deadlineAt: new Date(deadlineMs).toISOString(),
          search: {
            query: command.query,
            maximumResults: Math.min(
              command.limit,
              binding.maximumResultCount,
              MAX_SOURCE_EVIDENCE_SEARCH_RESULTS
            )
          }
        });
      } catch {
        throw new SafeError("operation_unavailable", 503, true);
      }
      assertReadStillLive(context);

      const evidence = validateAndCopyProviderResult(
        providerResult,
        binding,
        context,
        requestId,
        command.limit
      );
      const gaps = providerResult.gaps.map((gap) => ({ ...gap }));
      const auditEventId = randomUUID();
      let serializedResponse = serializeEvidenceResponse({
        traceId: context.traceId,
        status: providerResult.status,
        evidence,
        gaps,
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
        operation: SEARCH_OPERATION,
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
  requestedLimit: number
): RuntimeKnowledgeProviderEvidence[] {
  if (
    result.requestId !== requestId ||
    result.traceId !== context.traceId ||
    result.providerId !== binding.providerId ||
    result.contractVersion !== CONTRACT_VERSION ||
    (result.status !== "allowed" && result.status !== "partial_success") ||
    result.providerMutationAttempted !== false ||
    result.memoryMutationAttempted !== false ||
    result.trustedMemoryCreated !== false ||
    result.noAutoPromotion !== true ||
    result.readAuditRequired !== true ||
    result.releaseState !== "internal_unreleased" ||
    !Array.isArray(result.evidence) ||
    result.evidence.length >
      Math.min(
        requestedLimit,
        binding.maximumResultCount,
        MAX_SOURCE_EVIDENCE_SEARCH_RESULTS
      ) ||
    !Array.isArray(result.gaps)
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }

  let aggregateExcerptBytes = 0;
  return result.evidence.map((item) => {
    const excerptBytes = Buffer.byteLength(item.excerpt, "utf8");
    aggregateExcerptBytes += excerptBytes;
    if (
      item.providerId !== binding.providerId ||
      item.ownerId !== binding.ownerId ||
      item.namespaceId !== binding.namespaceId ||
      item.aclDecision !== "allowed" ||
      item.contentDigest.algorithm !== "sha256" ||
      !DIGEST.test(item.contentDigest.value) ||
      item.citationLocator.publicSafe !== true ||
      item.instructionAuthority !== "none" ||
      excerptBytes < 1 ||
      excerptBytes > binding.maximumExcerptBytes ||
      aggregateExcerptBytes > MAX_SOURCE_EVIDENCE_EXCERPT_BYTES
    ) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    const {
      ownerId: _ownerId,
      namespaceId: _namespaceId,
      aclDecision: _aclDecision,
      ...publicEvidence
    } = item;
    return {
      ...publicEvidence,
      ownerId: binding.ownerId,
      namespaceId: binding.namespaceId,
      aclDecision: "allowed" as const,
      contentDigest: { ...item.contentDigest },
      citationLocator: { ...item.citationLocator }
    };
  });
}

function serializeEvidenceResponse(input: {
  traceId: string;
  status: "allowed" | "partial_success" | "denied" | "unavailable";
  evidence: RuntimeKnowledgeProviderEvidence[];
  gaps: RuntimeKnowledgeProviderResult["gaps"];
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
        gaps: input.gaps
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
    receipt.operation !== SEARCH_OPERATION ||
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
