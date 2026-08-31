import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

export type SourceWireRuntimeSkeletonStatus = "allowed" | "denied" | "partial_success" | "gap";

export type SourceWireRuntimeSkeletonCallerKind = "owner_hosted_api_client" | "mcp_tool" | "owner_controlled_application";

export type SourceWireRuntimeSkeletonCapability =
  | "read_trusted_memory"
  | "read_source_evidence"
  | "import_or_maintain_sources"
  | "prepare_candidates"
  | "approve_trusted_memory";

export type SourceWireRuntimeSkeletonContextEnvelope = {
  envelopeId: string;
  sourceKind:
    | "slack"
    | "email"
    | "meeting"
    | "document"
    | "code"
    | "operations"
    | "custom";
  sourceRecordId: string;
  sourceRevision: string;
  title: string;
  sourceLocator: string;
  sourceOccurredAt: string;
  capturedAt: string;
  sensitivity: "public" | "internal" | "confidential" | "restricted";
  content: string;
  fixtureSafety: "synthetic";
  instructionAuthority: "none";
};

export type SourceWireRuntimeSkeletonCitation = {
  evidenceKind: "trusted_memory" | "source_evidence";
  sourceId: string;
  segmentId: string;
  address: string;
};

export type SourceWireRuntimeSkeletonCaller = {
  callerId: string;
  ownerId?: string;
  kind: SourceWireRuntimeSkeletonCallerKind;
  allowedNamespaceIds: string[];
  capabilities: SourceWireRuntimeSkeletonCapability[];
};

export type SourceWireRuntimeSkeletonApiRequest = {
  requestId: string;
  route:
    | "POST /synthetic/v1/search/trusted-memory"
    | "POST /synthetic/v1/search/source-evidence"
    | "POST /synthetic/v1/context/capture"
    | "POST /synthetic/v1/sources/maintain"
    | "POST /synthetic/v1/candidates/prepare"
    | "POST /synthetic/v1/candidates/approve";
  namespaceId: string;
  action:
    | "search_trusted_memory"
    | "search_source_evidence"
    | "capture_context"
    | "maintain_source_connection"
    | "prepare_candidate"
    | "approve_trusted_memory";
  query?: string;
  envelope?: SourceWireRuntimeSkeletonContextEnvelope;
};

export type SourceWireRuntimeSkeletonMcpRequest = {
  requestId: string;
  tool:
    | "search_trusted_memory"
    | "search_source_evidence"
    | "capture_context"
    | "maintain_source_connection"
    | "prepare_candidate"
    | "approve_trusted_memory";
  namespaceId: string;
  query?: string;
  envelope?: SourceWireRuntimeSkeletonContextEnvelope;
};

export type SourceWireRuntimeSkeletonResponse = {
  status: SourceWireRuntimeSkeletonStatus;
  requestId: string;
  namespaceId: string;
  sourceWireHostsUserMemory: false;
  runtimeMode: "synthetic_owner_hosted_skeleton";
  trustedMemoryReturned: boolean;
  sourceEvidenceReturned: boolean;
  contextCaptured: boolean;
  captureDisposition?: "appended" | "idempotent" | "conflict";
  contentDigest?: string;
  envelopeDigest?: string;
  synchronizedThrough?: string;
  pendingCandidateCreated: boolean;
  trustedMemoryCreated: boolean;
  noAutoPromotion: boolean;
  citationCount: number;
  citations: SourceWireRuntimeSkeletonCitation[];
  omittedCount: number;
  gapKinds: string[];
  denialReason?: string;
  requiredCapability?: SourceWireRuntimeSkeletonCapability;
  approvalPath?: "owner_or_application_controlled";
  audit: {
    callerId: string;
    callerKind: SourceWireRuntimeSkeletonCallerKind;
    namespaceId: string;
    action: SourceWireRuntimeSkeletonApiRequest["action"] | "invalid_context_boundary";
    boundaryPath: "owner_hosted_api_policy" | "mcp_adapter_to_owner_hosted_api_policy";
    result: SourceWireRuntimeSkeletonStatus;
    leakedContent: false;
    rawTokenReturned: false;
    privatePathReturned: false;
  };
};

export type SourceWireRuntimeSkeletonContextInboxEntry = Readonly<{
  ownerId: string;
  namespaceId: string;
  captureRequestId: string;
  envelopeId: string;
  sourceKind: SourceWireRuntimeSkeletonContextEnvelope["sourceKind"];
  sourceRecordId: string;
  sourceRevision: string;
  title: string;
  sourceLocator: string;
  sourceOccurredAt: string;
  capturedAt: string;
  sensitivity: SourceWireRuntimeSkeletonContextEnvelope["sensitivity"];
  contentDigest: string;
  envelopeDigest: string;
  citation: SourceWireRuntimeSkeletonCitation;
}>;

export type SourceWireRuntimeSkeletonContextInboxState = Readonly<{
  contractVersion: "source-wire.context-inbox-state.v1";
  entries: readonly SourceWireRuntimeSkeletonContextInboxEntry[];
  synchronizedThrough?: string;
}>;

export type SourceWireRuntimeSkeletonContextCaptureResult =
  SourceWireRuntimeSkeletonResponse &
    Readonly<{
      state: SourceWireRuntimeSkeletonContextInboxState;
    }>;

export type SourceWireRuntimeSkeletonContextEvidence = Readonly<
  Omit<SourceWireRuntimeSkeletonContextInboxEntry, "ownerId" | "captureRequestId" | "namespaceId">
>;

export type SourceWireRuntimeSkeletonContextSearchRequest = Omit<
  SourceWireRuntimeSkeletonMcpRequest,
  "tool" | "envelope"
> &
  Readonly<{
    tool: "search_source_evidence";
  }>;

export type SourceWireRuntimeSkeletonContextSearchResult =
  SourceWireRuntimeSkeletonResponse &
    Readonly<{
      contextEvidence: readonly SourceWireRuntimeSkeletonContextEvidence[];
    }>;

export type SourceWireRuntimeSkeletonFixtureCase = {
  caseId: string;
  caller: SourceWireRuntimeSkeletonCaller;
  via: "api" | "mcp";
  request: SourceWireRuntimeSkeletonApiRequest | SourceWireRuntimeSkeletonMcpRequest;
  expected: Partial<
    Pick<
      SourceWireRuntimeSkeletonResponse,
      | "status"
      | "trustedMemoryReturned"
      | "sourceEvidenceReturned"
      | "contextCaptured"
      | "captureDisposition"
      | "contentDigest"
      | "envelopeDigest"
      | "synchronizedThrough"
      | "pendingCandidateCreated"
      | "trustedMemoryCreated"
      | "noAutoPromotion"
      | "citationCount"
      | "citations"
      | "omittedCount"
      | "denialReason"
      | "requiredCapability"
      | "approvalPath"
    >
  >;
};

export type SourceWireRuntimeSkeletonFixtureMatrix = {
  fixtureType: "source-wire-runtime-skeleton-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: typeof SOURCE_WIRE_RUNTIME_SKELETON_BOUNDARY;
  cases: SourceWireRuntimeSkeletonFixtureCase[];
};

export const SOURCE_WIRE_RUNTIME_SKELETON_BOUNDARY = {
  hosting: "owner_hosted",
  implementationMode: "synthetic_route_and_adapter_skeleton",
  sourceWireHostsUserMemory: false,
  apiServerIncluded: false,
  mcpServerIncluded: false,
  databaseIncluded: false,
  databaseMigrationsIncluded: false,
  realDataIncluded: false,
  deploymentIncluded: false,
  missionControlIncluded: false,
  memoryEngineIncluded: false,
  mcpBypassesApiPolicy: false,
  trustedMemoryPromotion: "owner_or_application_controlled"
} as const;

const syntheticTrustedCitation: SourceWireRuntimeSkeletonCitation = {
  evidenceKind: "trusted_memory",
  sourceId: "mem_demo_alpha_decision",
  segmentId: "tmr_demo_alpha_001",
  address: "synthetic://trusted-memory/project-alpha/onboarding-decision"
};

const syntheticSourceCitations: SourceWireRuntimeSkeletonCitation[] = [
  {
    evidenceKind: "source_evidence",
    sourceId: "src_demo_alpha_notes",
    segmentId: "seg_demo_alpha_001",
    address: "synthetic://source-evidence/project-alpha/onboarding-notes#1"
  },
  {
    evidenceKind: "source_evidence",
    sourceId: "src_demo_alpha_notes",
    segmentId: "seg_demo_alpha_002",
    address: "synthetic://source-evidence/project-alpha/onboarding-notes#2"
  }
];

const contextEnvelopeKeys = Object.freeze([
  "capturedAt",
  "content",
  "envelopeId",
  "fixtureSafety",
  "instructionAuthority",
  "sensitivity",
  "sourceKind",
  "sourceLocator",
  "sourceOccurredAt",
  "sourceRecordId",
  "sourceRevision",
  "title"
] as const);

const contextInboxStateKeys = Object.freeze(["contractVersion", "entries"] as const);
const contextInboxStateKeysWithFreshness = Object.freeze([
  "contractVersion",
  "entries",
  "synchronizedThrough"
] as const);
const contextInboxEntryKeys = Object.freeze([
  "captureRequestId",
  "capturedAt",
  "citation",
  "contentDigest",
  "envelopeDigest",
  "envelopeId",
  "namespaceId",
  "ownerId",
  "sensitivity",
  "sourceKind",
  "sourceLocator",
  "sourceOccurredAt",
  "sourceRecordId",
  "sourceRevision",
  "title"
] as const);
const contextCitationKeys = Object.freeze([
  "address",
  "evidenceKind",
  "segmentId",
  "sourceId"
] as const);
const contextCallerKeys = Object.freeze([
  "allowedNamespaceIds",
  "callerId",
  "capabilities",
  "kind"
] as const);
const contextCallerKeysWithOwner = Object.freeze([...contextCallerKeys, "ownerId"].sort());
const contextCaptureRequestKeys = Object.freeze([
  "envelope",
  "namespaceId",
  "requestId",
  "tool"
] as const);
const contextSearchRequestKeys = Object.freeze(["namespaceId", "requestId", "tool"] as const);
const contextSearchRequestKeysWithQuery = Object.freeze([...contextSearchRequestKeys, "query"].sort());
const contextCaptureApiRequestKeys = Object.freeze([
  "action",
  "envelope",
  "namespaceId",
  "requestId",
  "route"
] as const);
const contextSearchApiRequestKeys = Object.freeze([
  "action",
  "namespaceId",
  "requestId",
  "route"
] as const);
const contextSearchApiRequestKeysWithQuery = Object.freeze([
  ...contextSearchApiRequestKeys,
  "query"
].sort());

const contextSourceKinds = new Set([
  "slack",
  "email",
  "meeting",
  "document",
  "code",
  "operations",
  "custom"
]);

const contextSensitivities = new Set([
  "public",
  "internal",
  "confidential",
  "restricted"
]);
const contextCallerKinds = new Set<SourceWireRuntimeSkeletonCallerKind>([
  "owner_hosted_api_client",
  "mcp_tool",
  "owner_controlled_application"
]);
const contextCapabilities = new Set<SourceWireRuntimeSkeletonCapability>([
  "read_trusted_memory",
  "read_source_evidence",
  "import_or_maintain_sources",
  "prepare_candidates",
  "approve_trusted_memory"
]);
const trustedContextInboxStates = new WeakSet<object>();

function isValidContextEnvelope(
  value: unknown
): value is SourceWireRuntimeSkeletonContextEnvelope {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (
    keys.length !== contextEnvelopeKeys.length ||
    keys.some((key, index) => key !== contextEnvelopeKeys[index])
  ) {
    return false;
  }

  if (!isBoundedIdentifier(record.envelopeId)) return false;
  if (!isBoundedIdentifier(record.sourceRecordId)) return false;
  if (!isBoundedIdentifier(record.sourceRevision)) return false;
  if (!isBoundedText(record.title, 256)) return false;
  if (!isSyntheticLocator(record.sourceLocator)) return false;
  if (!isCanonicalTimestamp(record.sourceOccurredAt)) return false;
  if (!isCanonicalTimestamp(record.capturedAt)) return false;
  if (record.sourceOccurredAt > record.capturedAt) return false;
  if (typeof record.sourceKind !== "string" || !contextSourceKinds.has(record.sourceKind)) {
    return false;
  }
  if (
    typeof record.sensitivity !== "string" ||
    !contextSensitivities.has(record.sensitivity)
  ) {
    return false;
  }
  if (record.fixtureSafety !== "synthetic") return false;
  if (record.instructionAuthority !== "none") return false;
  if (typeof record.content !== "string") return false;
  const contentBytes = Buffer.byteLength(record.content, "utf8");
  return contentBytes > 0 && contentBytes <= 65_536;
}

function isBoundedIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 128 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  );
}

function isBoundedText(value: unknown, maxBytes: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Buffer.byteLength(value, "utf8") <= maxBytes &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.valueOf()) && timestamp.toISOString() === value;
}

function isSyntheticLocator(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return false;
  try {
    const locator = new URL(value);
    return (
      locator.protocol === "synthetic:" &&
      locator.username.length === 0 &&
      locator.password.length === 0
    );
  } catch {
    return false;
  }
}

function hasExactKeys(record: Record<string, unknown>, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(record).sort();
  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index])
  );
}

function snapshotPlainDataRecord(value: unknown): Record<string, unknown> | undefined {
  try {
    if (nodeUtilTypes.isProxy(value)) return undefined;
    if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (keys.some((key) => typeof key !== "string")) return undefined;

    const snapshot: Record<string, unknown> = Object.create(null);
    for (const key of keys as string[]) {
      const descriptor = descriptors[key];
      if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
        return undefined;
      }
      snapshot[key] = descriptor.value;
    }
    return snapshot;
  } catch {
    return undefined;
  }
}

function snapshotPlainDataArray(value: unknown): unknown[] | undefined {
  try {
    if (nodeUtilTypes.isProxy(value)) return undefined;
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const descriptorMap = descriptors as unknown as Record<string, PropertyDescriptor>;
    const keys = Reflect.ownKeys(descriptors);
    if (keys.some((key) => typeof key !== "string")) return undefined;
    const lengthDescriptor = descriptorMap.length;
    if (
      lengthDescriptor === undefined ||
      !("value" in lengthDescriptor) ||
      typeof lengthDescriptor.value !== "number" ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return undefined;
    }
    const length = lengthDescriptor.value as number;
    if (keys.length !== length + 1) return undefined;

    const snapshot: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
        return undefined;
      }
      snapshot.push(descriptor.value);
    }
    return snapshot;
  } catch {
    return undefined;
  }
}

function normalizeContextEnvelope(
  value: unknown
): SourceWireRuntimeSkeletonContextEnvelope | undefined {
  const snapshot = snapshotPlainDataRecord(value);
  if (snapshot === undefined || !hasExactKeys(snapshot, contextEnvelopeKeys)) return undefined;
  if (!isValidContextEnvelope(snapshot)) return undefined;
  return Object.freeze(snapshot) as unknown as SourceWireRuntimeSkeletonContextEnvelope;
}

function normalizeContextCaller(value: unknown): SourceWireRuntimeSkeletonCaller | undefined {
  const snapshot = snapshotPlainDataRecord(value);
  if (snapshot === undefined) return undefined;
  const expectedKeys = Object.hasOwn(snapshot, "ownerId")
    ? contextCallerKeysWithOwner
    : contextCallerKeys;
  if (!hasExactKeys(snapshot, expectedKeys)) return undefined;
  const allowedNamespaceIds = snapshotPlainDataArray(snapshot.allowedNamespaceIds);
  const capabilities = snapshotPlainDataArray(snapshot.capabilities);
  if (
    !isBoundedIdentifier(snapshot.callerId) ||
    typeof snapshot.kind !== "string" ||
    !contextCallerKinds.has(snapshot.kind as SourceWireRuntimeSkeletonCallerKind) ||
    allowedNamespaceIds === undefined ||
    allowedNamespaceIds.length > 64 ||
    !allowedNamespaceIds.every((namespaceId) => isBoundedIdentifier(namespaceId)) ||
    capabilities === undefined ||
    capabilities.length > contextCapabilities.size ||
    !capabilities.every(
      (capability) =>
        typeof capability === "string" &&
        contextCapabilities.has(capability as SourceWireRuntimeSkeletonCapability)
    ) ||
    (snapshot.ownerId !== undefined && !isBoundedIdentifier(snapshot.ownerId))
  ) {
    return undefined;
  }
  return Object.freeze({
    callerId: snapshot.callerId,
    ...(Object.hasOwn(snapshot, "ownerId") ? { ownerId: snapshot.ownerId } : {}),
    kind: snapshot.kind,
    allowedNamespaceIds: Object.freeze(allowedNamespaceIds),
    capabilities: Object.freeze(capabilities)
  }) as unknown as SourceWireRuntimeSkeletonCaller;
}

function normalizeContextMcpRequest(
  value: unknown,
  tool: "capture_context" | "search_source_evidence"
): SourceWireRuntimeSkeletonMcpRequest | undefined {
  const snapshot = snapshotPlainDataRecord(value);
  if (snapshot === undefined) return undefined;
  const expectedKeys =
    tool === "capture_context"
      ? contextCaptureRequestKeys
      : Object.hasOwn(snapshot, "query")
        ? contextSearchRequestKeysWithQuery
        : contextSearchRequestKeys;
  if (!hasExactKeys(snapshot, expectedKeys)) return undefined;
  if (
    snapshot.tool !== tool ||
    !isBoundedIdentifier(snapshot.requestId) ||
    !isBoundedIdentifier(snapshot.namespaceId) ||
    (Object.hasOwn(snapshot, "query") && !isBoundedText(snapshot.query, 4_096))
  ) {
    return undefined;
  }
  if (tool === "capture_context") {
    return Object.freeze({
      requestId: snapshot.requestId,
      tool,
      namespaceId: snapshot.namespaceId,
      envelope: snapshot.envelope
    }) as unknown as SourceWireRuntimeSkeletonMcpRequest;
  }
  return Object.freeze({
    requestId: snapshot.requestId,
    tool,
    namespaceId: snapshot.namespaceId,
    ...(Object.hasOwn(snapshot, "query") ? { query: snapshot.query } : {})
  }) as SourceWireRuntimeSkeletonMcpRequest;
}

function normalizeContextApiRequest(
  value: unknown,
  action: "capture_context" | "search_source_evidence"
): SourceWireRuntimeSkeletonApiRequest | undefined {
  const snapshot = snapshotPlainDataRecord(value);
  if (snapshot === undefined) return undefined;
  const expectedKeys =
    action === "capture_context"
      ? contextCaptureApiRequestKeys
      : Object.hasOwn(snapshot, "query")
        ? contextSearchApiRequestKeysWithQuery
        : contextSearchApiRequestKeys;
  if (!hasExactKeys(snapshot, expectedKeys)) return undefined;
  const expectedRoute =
    action === "capture_context"
      ? "POST /synthetic/v1/context/capture"
      : "POST /synthetic/v1/search/source-evidence";
  if (
    snapshot.action !== action ||
    snapshot.route !== expectedRoute ||
    !isBoundedIdentifier(snapshot.requestId) ||
    !isBoundedIdentifier(snapshot.namespaceId) ||
    (Object.hasOwn(snapshot, "query") && !isBoundedText(snapshot.query, 4_096))
  ) {
    return undefined;
  }
  if (action === "capture_context") {
    return Object.freeze({
      requestId: snapshot.requestId,
      route: expectedRoute,
      namespaceId: snapshot.namespaceId,
      action,
      envelope: snapshot.envelope
    }) as unknown as SourceWireRuntimeSkeletonApiRequest;
  }
  return Object.freeze({
    requestId: snapshot.requestId,
    route: expectedRoute,
    namespaceId: snapshot.namespaceId,
    action,
    ...(Object.hasOwn(snapshot, "query") ? { query: snapshot.query } : {})
  }) as SourceWireRuntimeSkeletonApiRequest;
}

function isValidContextInboxEntry(
  value: unknown
): value is SourceWireRuntimeSkeletonContextInboxEntry {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  if (!hasExactKeys(entry, contextInboxEntryKeys)) return false;
  if (!isBoundedIdentifier(entry.ownerId) || !isBoundedIdentifier(entry.namespaceId)) return false;
  if (!isBoundedIdentifier(entry.captureRequestId) || !isBoundedIdentifier(entry.envelopeId)) {
    return false;
  }
  if (!isBoundedIdentifier(entry.sourceRecordId) || !isBoundedIdentifier(entry.sourceRevision)) {
    return false;
  }
  if (!isBoundedText(entry.title, 256) || !isSyntheticLocator(entry.sourceLocator)) return false;
  if (!isCanonicalTimestamp(entry.sourceOccurredAt) || !isCanonicalTimestamp(entry.capturedAt)) {
    return false;
  }
  if (entry.sourceOccurredAt > entry.capturedAt) return false;
  if (typeof entry.sourceKind !== "string" || !contextSourceKinds.has(entry.sourceKind)) {
    return false;
  }
  if (
    typeof entry.sensitivity !== "string" ||
    !contextSensitivities.has(entry.sensitivity)
  ) {
    return false;
  }
  if (typeof entry.contentDigest !== "string" || !/^[a-f0-9]{64}$/.test(entry.contentDigest)) {
    return false;
  }
  if (typeof entry.envelopeDigest !== "string" || !/^[a-f0-9]{64}$/.test(entry.envelopeDigest)) {
    return false;
  }
  if (
    entry.envelopeDigest !==
    createContextEnvelopeDigest(
      entry as unknown as SourceWireRuntimeSkeletonContextInboxEntry,
      entry.contentDigest
    )
  ) {
    return false;
  }
  if (
    entry.citation === null ||
    typeof entry.citation !== "object" ||
    Array.isArray(entry.citation)
  ) {
    return false;
  }
  const citation = entry.citation as Record<string, unknown>;
  return (
    hasExactKeys(citation, contextCitationKeys) &&
    citation.evidenceKind === "source_evidence" &&
    citation.sourceId === entry.sourceRecordId &&
    citation.segmentId === entry.envelopeId &&
    citation.address === entry.sourceLocator
  );
}

function isValidContextInboxState(
  value: unknown
): value is SourceWireRuntimeSkeletonContextInboxState {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  const expectedKeys = Object.hasOwn(state, "synchronizedThrough")
    ? contextInboxStateKeysWithFreshness
    : contextInboxStateKeys;
  if (!hasExactKeys(state, expectedKeys)) return false;
  if (state.contractVersion !== "source-wire.context-inbox-state.v1") return false;
  if (!Array.isArray(state.entries) || !state.entries.every(isValidContextInboxEntry)) return false;

  const requestKeys = new Set<string>();
  const envelopeKeys = new Set<string>();
  const revisionKeys = new Set<string>();
  for (const entry of state.entries) {
    const requestKey = JSON.stringify([
      entry.ownerId,
      entry.namespaceId,
      entry.captureRequestId
    ]);
    const envelopeKey = JSON.stringify([entry.ownerId, entry.namespaceId, entry.envelopeId]);
    const revisionKey = JSON.stringify([
      entry.ownerId,
      entry.namespaceId,
      entry.sourceRecordId,
      entry.sourceRevision
    ]);
    if (
      requestKeys.has(requestKey) ||
      envelopeKeys.has(envelopeKey) ||
      revisionKeys.has(revisionKey)
    ) {
      return false;
    }
    requestKeys.add(requestKey);
    envelopeKeys.add(envelopeKey);
    revisionKeys.add(revisionKey);
  }

  if (state.entries.length === 0) return state.synchronizedThrough === undefined;
  if (!isCanonicalTimestamp(state.synchronizedThrough)) return false;
  const latestCapture = state.entries.reduce(
    (latest, entry) => (entry.capturedAt > latest ? entry.capturedAt : latest),
    state.entries[0].capturedAt
  );
  return state.synchronizedThrough === latestCapture;
}

function trustContextInboxState(
  state: SourceWireRuntimeSkeletonContextInboxState
): SourceWireRuntimeSkeletonContextInboxState {
  trustedContextInboxStates.add(state);
  return state;
}

function normalizeContextInboxState(
  value: unknown
): SourceWireRuntimeSkeletonContextInboxState | undefined {
  if (value !== null && typeof value === "object" && trustedContextInboxStates.has(value)) {
    return value as SourceWireRuntimeSkeletonContextInboxState;
  }

  const stateSnapshot = snapshotPlainDataRecord(value);
  if (stateSnapshot === undefined) return undefined;
  const expectedKeys = Object.hasOwn(stateSnapshot, "synchronizedThrough")
    ? contextInboxStateKeysWithFreshness
    : contextInboxStateKeys;
  if (!hasExactKeys(stateSnapshot, expectedKeys)) return undefined;
  const rawEntries = snapshotPlainDataArray(stateSnapshot.entries);
  if (rawEntries === undefined || rawEntries.length !== 0) return undefined;

  const entries: SourceWireRuntimeSkeletonContextInboxEntry[] = [];
  for (const rawEntry of rawEntries) {
    const entrySnapshot = snapshotPlainDataRecord(rawEntry);
    if (entrySnapshot === undefined || !hasExactKeys(entrySnapshot, contextInboxEntryKeys)) {
      return undefined;
    }
    const citationSnapshot = snapshotPlainDataRecord(entrySnapshot.citation);
    if (citationSnapshot === undefined || !hasExactKeys(citationSnapshot, contextCitationKeys)) {
      return undefined;
    }
    entries.push(
      Object.freeze({
        ...entrySnapshot,
        citation: Object.freeze(citationSnapshot)
      }) as unknown as SourceWireRuntimeSkeletonContextInboxEntry
    );
  }

  const frozenEntries = Object.freeze(entries);
  const normalizedState = Object.hasOwn(stateSnapshot, "synchronizedThrough")
    ? Object.freeze({
        contractVersion: stateSnapshot.contractVersion,
        entries: frozenEntries,
        synchronizedThrough: stateSnapshot.synchronizedThrough
      })
    : Object.freeze({
        contractVersion: stateSnapshot.contractVersion,
        entries: frozenEntries
      });
  if (!isValidContextInboxState(normalizedState)) return undefined;
  return trustContextInboxState(normalizedState);
}

function createContextSourceRevisionDigest(
  source: Pick<
    SourceWireRuntimeSkeletonContextEnvelope,
    | "sourceKind"
    | "sourceRecordId"
    | "sourceRevision"
    | "title"
    | "sourceLocator"
    | "sourceOccurredAt"
    | "sensitivity"
  >,
  contentDigest: string
): string {
  const canonicalSourceRevision = JSON.stringify({
    sourceKind: source.sourceKind,
    sourceRecordId: source.sourceRecordId,
    sourceRevision: source.sourceRevision,
    title: source.title,
    sourceLocator: source.sourceLocator,
    sourceOccurredAt: source.sourceOccurredAt,
    sensitivity: source.sensitivity,
    contentDigest,
    fixtureSafety: "synthetic",
    instructionAuthority: "none"
  });
  return createHash("sha256").update(canonicalSourceRevision, "utf8").digest("hex");
}

function createContextEnvelopeDigest(
  envelope: Pick<
    SourceWireRuntimeSkeletonContextEnvelope,
    | "envelopeId"
    | "sourceKind"
    | "sourceRecordId"
    | "sourceRevision"
    | "title"
    | "sourceLocator"
    | "sourceOccurredAt"
    | "capturedAt"
    | "sensitivity"
  >,
  contentDigest: string
): string {
  const canonicalEnvelope = JSON.stringify({
    envelopeId: envelope.envelopeId,
    sourceKind: envelope.sourceKind,
    sourceRecordId: envelope.sourceRecordId,
    sourceRevision: envelope.sourceRevision,
    title: envelope.title,
    sourceLocator: envelope.sourceLocator,
    sourceOccurredAt: envelope.sourceOccurredAt,
    capturedAt: envelope.capturedAt,
    sensitivity: envelope.sensitivity,
    contentDigest,
    fixtureSafety: "synthetic",
    instructionAuthority: "none"
  });
  return createHash("sha256").update(canonicalEnvelope, "utf8").digest("hex");
}

export function createRuntimeSkeletonContextInboxState(): SourceWireRuntimeSkeletonContextInboxState {
  return trustContextInboxState(
    Object.freeze({
      contractVersion: "source-wire.context-inbox-state.v1",
      entries: Object.freeze([] as SourceWireRuntimeSkeletonContextInboxEntry[])
    })
  );
}

function contextInboxStateForDeniedResult(
  state: SourceWireRuntimeSkeletonContextInboxState
): SourceWireRuntimeSkeletonContextInboxState {
  return typeof state === "object" && state !== null && trustedContextInboxStates.has(state)
    ? state
    : createRuntimeSkeletonContextInboxState();
}

function createContextBoundaryInvalidResponse(
  action: "capture_context" | "search_source_evidence" | "invalid_context_boundary",
  boundaryPath:
    | "owner_hosted_api_policy"
    | "mcp_adapter_to_owner_hosted_api_policy" = "mcp_adapter_to_owner_hosted_api_policy"
): SourceWireRuntimeSkeletonResponse {
  const requiredCapability =
    action === "capture_context"
      ? "import_or_maintain_sources"
      : action === "search_source_evidence"
        ? "read_source_evidence"
        : undefined;
  return Object.freeze({
    status: "denied",
    requestId: "invalid_context_request",
    namespaceId: "invalid_context_namespace",
    sourceWireHostsUserMemory: false,
    runtimeMode: "synthetic_owner_hosted_skeleton",
    trustedMemoryReturned: false,
    sourceEvidenceReturned: false,
    contextCaptured: false,
    pendingCandidateCreated: false,
    trustedMemoryCreated: false,
    noAutoPromotion: true,
    citationCount: 0,
    citations: Object.freeze([]) as unknown as SourceWireRuntimeSkeletonCitation[],
    omittedCount: 1,
    gapKinds: Object.freeze([]) as unknown as string[],
    denialReason: "context_boundary_invalid",
    ...(requiredCapability === undefined ? {} : { requiredCapability }),
    audit: Object.freeze({
      callerId: "invalid_context_caller",
      callerKind:
        boundaryPath === "owner_hosted_api_policy"
          ? ("owner_hosted_api_client" as const)
          : ("mcp_tool" as const),
      namespaceId: "invalid_context_namespace",
      action,
      boundaryPath,
      result: "denied" as const,
      leakedContent: false as const,
      rawTokenReturned: false as const,
      privatePathReturned: false as const
    })
  });
}

function freezeContextInboxResponseMetadata(
  response: SourceWireRuntimeSkeletonResponse
): SourceWireRuntimeSkeletonResponse {
  return {
    ...response,
    citations: Object.freeze(
      response.citations.map((citation) => Object.freeze({ ...citation }))
    ) as unknown as SourceWireRuntimeSkeletonCitation[],
    gapKinds: Object.freeze([...response.gapKinds]) as unknown as string[],
    audit: Object.freeze({ ...response.audit })
  };
}

function createContextCaptureConflictResult(
  response: SourceWireRuntimeSkeletonResponse,
  state: SourceWireRuntimeSkeletonContextInboxState,
  denialReason: "envelope_id_conflict" | "request_replay_conflict" | "source_revision_conflict"
): SourceWireRuntimeSkeletonContextCaptureResult {
  const {
    captureDisposition: _captureDisposition,
    contentDigest: _contentDigest,
    envelopeDigest: _envelopeDigest,
    synchronizedThrough: _synchronizedThrough,
    ...boundedResponse
  } = response;

  return Object.freeze({
    ...boundedResponse,
    status: "denied",
    contextCaptured: false,
    captureDisposition: "conflict",
    citationCount: 0,
    citations: Object.freeze([]) as unknown as SourceWireRuntimeSkeletonCitation[],
    omittedCount: 1,
    denialReason,
    audit: Object.freeze({
      ...response.audit,
      result: "denied" as const
    }),
    state
  });
}

function getContextInboxScopedFreshness(
  state: SourceWireRuntimeSkeletonContextInboxState,
  ownerId: string,
  namespaceId: string
): string | undefined {
  return state.entries.reduce<string | undefined>(
    (latest, entry) =>
      entry.ownerId === ownerId &&
      entry.namespaceId === namespaceId &&
      (latest === undefined || entry.capturedAt > latest)
        ? entry.capturedAt
        : latest,
    undefined
  );
}

function createContextCaptureIdempotentResult(
  response: SourceWireRuntimeSkeletonResponse,
  state: SourceWireRuntimeSkeletonContextInboxState,
  entry: SourceWireRuntimeSkeletonContextInboxEntry
): SourceWireRuntimeSkeletonContextCaptureResult {
  return Object.freeze({
    ...response,
    captureDisposition: "idempotent",
    contentDigest: entry.contentDigest,
    envelopeDigest: entry.envelopeDigest,
    synchronizedThrough:
      getContextInboxScopedFreshness(state, entry.ownerId, entry.namespaceId) ?? entry.capturedAt,
    citationCount: 1,
    citations: Object.freeze([entry.citation]) as unknown as SourceWireRuntimeSkeletonCitation[],
    state
  });
}

function createContextCaptureInvalidStateResult(
  response: SourceWireRuntimeSkeletonResponse
): SourceWireRuntimeSkeletonContextCaptureResult {
  const sanitizedState = createRuntimeSkeletonContextInboxState();
  if (response.status !== "allowed") {
    return Object.freeze({
      ...response,
      state: sanitizedState
    });
  }

  const {
    captureDisposition: _captureDisposition,
    contentDigest: _contentDigest,
    envelopeDigest: _envelopeDigest,
    synchronizedThrough: _synchronizedThrough,
    ...boundedResponse
  } = response;
  return Object.freeze({
    ...boundedResponse,
    status: "denied",
    contextCaptured: false,
    citationCount: 0,
    citations: Object.freeze([]) as unknown as SourceWireRuntimeSkeletonCitation[],
    omittedCount: 1,
    denialReason: "context_inbox_state_invalid",
    audit: Object.freeze({
      ...response.audit,
      result: "denied" as const
    }),
    state: sanitizedState
  });
}

function createContextCaptureInvalidEnvelopeResult(
  response: SourceWireRuntimeSkeletonResponse,
  state: SourceWireRuntimeSkeletonContextInboxState
): SourceWireRuntimeSkeletonContextCaptureResult {
  const {
    captureDisposition: _captureDisposition,
    contentDigest: _contentDigest,
    envelopeDigest: _envelopeDigest,
    synchronizedThrough: _synchronizedThrough,
    ...boundedResponse
  } = response;
  return Object.freeze({
    ...boundedResponse,
    status: "denied",
    contextCaptured: false,
    citationCount: 0,
    citations: Object.freeze([]) as unknown as SourceWireRuntimeSkeletonCitation[],
    omittedCount: 1,
    denialReason: "context_envelope_invalid",
    audit: Object.freeze({
      ...response.audit,
      result: "denied" as const
    }),
    state: contextInboxStateForDeniedResult(state)
  });
}

export function transitionRuntimeSkeletonContextCapture(
  state: SourceWireRuntimeSkeletonContextInboxState,
  caller: SourceWireRuntimeSkeletonCaller,
  request: SourceWireRuntimeSkeletonMcpRequest
): SourceWireRuntimeSkeletonContextCaptureResult {
  const callerSnapshot = snapshotPlainDataRecord(caller);
  const requestSnapshot = snapshotPlainDataRecord(request);
  const normalizedCaller = normalizeContextCaller(caller);
  const normalizedRequest = normalizeContextMcpRequest(request, "capture_context");
  if (normalizedCaller === undefined || normalizedRequest === undefined) {
    const boundaryAction =
      callerSnapshot === undefined || requestSnapshot === undefined
        ? "invalid_context_boundary"
        : "capture_context";
    return Object.freeze({
      ...createContextBoundaryInvalidResponse(boundaryAction),
      state: contextInboxStateForDeniedResult(state)
    });
  }
  caller = normalizedCaller;
  request = normalizedRequest;

  const response = freezeContextInboxResponseMetadata(
    callRuntimeSkeletonMcpAdapter(caller, request)
  );
  const submittedEnvelope = request.envelope;

  if (
    response.status !== "allowed" ||
    !response.contextCaptured ||
    submittedEnvelope === undefined ||
    caller.ownerId === undefined
  ) {
    return Object.freeze({
      ...response,
      state: contextInboxStateForDeniedResult(state)
    });
  }

  const envelope = normalizeContextEnvelope(submittedEnvelope);
  if (envelope === undefined) {
    return createContextCaptureInvalidEnvelopeResult(response, state);
  }

  const normalizedState = normalizeContextInboxState(state);
  if (normalizedState === undefined) {
    return createContextCaptureInvalidStateResult(response);
  }
  state = normalizedState;
  if (
    state.entries.some(
      (entry) => entry.ownerId !== caller.ownerId || entry.namespaceId !== request.namespaceId
    )
  ) {
    return createContextCaptureInvalidStateResult(response);
  }

  const contentDigest = createHash("sha256").update(envelope.content, "utf8").digest("hex");
  const sourceRevisionDigest = createContextSourceRevisionDigest(envelope, contentDigest);
  const envelopeDigest = createContextEnvelopeDigest(envelope, contentDigest);
  const existingRequest = state.entries.find(
    (entry) =>
      entry.ownerId === caller.ownerId &&
      entry.namespaceId === request.namespaceId &&
      entry.captureRequestId === request.requestId
  );
  const existingRevision = state.entries.find(
    (entry) =>
      entry.namespaceId === request.namespaceId &&
      entry.ownerId === caller.ownerId &&
      entry.sourceRecordId === envelope.sourceRecordId &&
      entry.sourceRevision === envelope.sourceRevision
  );
  const existingEnvelope = state.entries.find(
    (entry) =>
      entry.ownerId === caller.ownerId &&
      entry.namespaceId === request.namespaceId &&
      entry.envelopeId === envelope.envelopeId
  );

  const envelopeConflict =
    existingEnvelope !== undefined && existingEnvelope.envelopeDigest !== envelopeDigest;
  const requestConflict =
    existingRequest !== undefined && existingRequest.envelopeDigest !== envelopeDigest;
  const revisionConflict =
    existingRevision !== undefined &&
    createContextSourceRevisionDigest(existingRevision, existingRevision.contentDigest) !==
      sourceRevisionDigest;

  if (
    envelopeConflict &&
    (existingRevision === undefined || existingEnvelope !== existingRevision)
  ) {
    return createContextCaptureConflictResult(response, state, "envelope_id_conflict");
  }
  if (revisionConflict) {
    return createContextCaptureConflictResult(response, state, "source_revision_conflict");
  }
  if (envelopeConflict) {
    return createContextCaptureConflictResult(response, state, "envelope_id_conflict");
  }
  if (requestConflict) {
    return createContextCaptureConflictResult(response, state, "request_replay_conflict");
  }

  const idempotentEntry = existingRequest ?? existingRevision ?? existingEnvelope;
  if (idempotentEntry !== undefined) {
    return createContextCaptureIdempotentResult(response, state, idempotentEntry);
  }

  const citation = Object.freeze({
    evidenceKind: "source_evidence" as const,
    sourceId: envelope.sourceRecordId,
    segmentId: envelope.envelopeId,
    address: envelope.sourceLocator
  });
  const entry: SourceWireRuntimeSkeletonContextInboxEntry = Object.freeze({
    ownerId: caller.ownerId,
    namespaceId: request.namespaceId,
    captureRequestId: request.requestId,
    envelopeId: envelope.envelopeId,
    sourceKind: envelope.sourceKind,
    sourceRecordId: envelope.sourceRecordId,
    sourceRevision: envelope.sourceRevision,
    title: envelope.title,
    sourceLocator: envelope.sourceLocator,
    sourceOccurredAt: envelope.sourceOccurredAt,
    capturedAt: envelope.capturedAt,
    sensitivity: envelope.sensitivity,
    contentDigest,
    envelopeDigest,
    citation
  });
  const synchronizedThrough =
    state.synchronizedThrough === undefined || envelope.capturedAt > state.synchronizedThrough
      ? envelope.capturedAt
      : state.synchronizedThrough;
  const nextState = trustContextInboxState(
    Object.freeze({
      contractVersion: "source-wire.context-inbox-state.v1",
      entries: Object.freeze([...state.entries, entry]),
      synchronizedThrough
    })
  );

  const scopedSynchronizedThrough =
    getContextInboxScopedFreshness(nextState, caller.ownerId, request.namespaceId) ??
    envelope.capturedAt;

  return Object.freeze({
    ...response,
    synchronizedThrough: scopedSynchronizedThrough,
    state: nextState
  });
}

export function searchRuntimeSkeletonContextInbox(
  state: SourceWireRuntimeSkeletonContextInboxState,
  caller: SourceWireRuntimeSkeletonCaller,
  request: SourceWireRuntimeSkeletonContextSearchRequest
): SourceWireRuntimeSkeletonContextSearchResult {
  const callerSnapshot = snapshotPlainDataRecord(caller);
  const requestSnapshot = snapshotPlainDataRecord(request);
  const normalizedCaller = normalizeContextCaller(caller);
  const normalizedRequest = normalizeContextMcpRequest(request, "search_source_evidence");
  if (normalizedCaller === undefined || normalizedRequest === undefined) {
    const boundaryAction =
      callerSnapshot === undefined || requestSnapshot === undefined
        ? "invalid_context_boundary"
        : "search_source_evidence";
    return Object.freeze({
      ...createContextBoundaryInvalidResponse(boundaryAction),
      contextEvidence: Object.freeze([] as SourceWireRuntimeSkeletonContextEvidence[])
    });
  }
  caller = normalizedCaller;
  request = normalizedRequest as SourceWireRuntimeSkeletonContextSearchRequest;

  const response = freezeContextInboxResponseMetadata(
    callRuntimeSkeletonMcpAdapter(caller, request)
  );

  if (response.status !== "allowed") {
    return Object.freeze({
      ...response,
      contextEvidence: Object.freeze([] as SourceWireRuntimeSkeletonContextEvidence[])
    });
  }

  if (!isBoundedIdentifier(caller.ownerId)) {
    return Object.freeze({
      ...response,
      status: "denied",
      sourceEvidenceReturned: false,
      citationCount: 0,
      citations: Object.freeze([]) as unknown as SourceWireRuntimeSkeletonCitation[],
      omittedCount: 1,
      denialReason: "authenticated_owner_required",
      audit: Object.freeze({
        ...response.audit,
        result: "denied" as const
      }),
      contextEvidence: Object.freeze([] as SourceWireRuntimeSkeletonContextEvidence[])
    });
  }

  const normalizedState = normalizeContextInboxState(state);
  if (normalizedState === undefined) {
    const { synchronizedThrough: _synchronizedThrough, ...boundedResponse } = response;
    return Object.freeze({
      ...boundedResponse,
      status: "denied",
      sourceEvidenceReturned: false,
      citationCount: 0,
      citations: Object.freeze([]) as unknown as SourceWireRuntimeSkeletonCitation[],
      omittedCount: 1,
      denialReason: "context_inbox_state_invalid",
      audit: Object.freeze({
        ...response.audit,
        result: "denied" as const
      }),
      contextEvidence: Object.freeze([] as SourceWireRuntimeSkeletonContextEvidence[])
    });
  }
  state = normalizedState;
  if (
    state.entries.some(
      (entry) => entry.ownerId !== caller.ownerId || entry.namespaceId !== request.namespaceId
    )
  ) {
    const { synchronizedThrough: _synchronizedThrough, ...boundedResponse } = response;
    return Object.freeze({
      ...boundedResponse,
      status: "denied",
      sourceEvidenceReturned: false,
      citationCount: 0,
      citations: Object.freeze([]) as unknown as SourceWireRuntimeSkeletonCitation[],
      omittedCount: 1,
      denialReason: "context_inbox_state_invalid",
      audit: Object.freeze({
        ...response.audit,
        result: "denied" as const
      }),
      contextEvidence: Object.freeze([] as SourceWireRuntimeSkeletonContextEvidence[])
    });
  }

  const contextEvidence = Object.freeze(
    state.entries
      .filter(
        (entry) =>
          entry.ownerId === caller.ownerId && entry.namespaceId === request.namespaceId
      )
      .map((entry) =>
        Object.freeze({
          envelopeId: entry.envelopeId,
          sourceKind: entry.sourceKind,
          sourceRecordId: entry.sourceRecordId,
          sourceRevision: entry.sourceRevision,
          title: entry.title,
          sourceLocator: entry.sourceLocator,
          sourceOccurredAt: entry.sourceOccurredAt,
          capturedAt: entry.capturedAt,
          sensitivity: entry.sensitivity,
          contentDigest: entry.contentDigest,
          envelopeDigest: entry.envelopeDigest,
          citation: Object.freeze({ ...entry.citation })
        })
      )
  );
  const citations = Object.freeze(
    contextEvidence.map((entry) => entry.citation)
  ) as unknown as SourceWireRuntimeSkeletonCitation[];
  const synchronizedThrough = contextEvidence.reduce<string | undefined>(
    (latest, entry) =>
      latest === undefined || entry.capturedAt > latest ? entry.capturedAt : latest,
    undefined
  );

  const { synchronizedThrough: _synchronizedThrough, ...boundedResponse } = response;
  const searchResult: SourceWireRuntimeSkeletonContextSearchResult = {
    ...boundedResponse,
    sourceEvidenceReturned: contextEvidence.length > 0,
    citationCount: citations.length,
    citations,
    contextEvidence
  };

  if (synchronizedThrough !== undefined) {
    searchResult.synchronizedThrough = synchronizedThrough;
  }

  return Object.freeze(searchResult);
}

export function callRuntimeSkeletonApiPolicy(
  caller: SourceWireRuntimeSkeletonCaller,
  request: SourceWireRuntimeSkeletonApiRequest
): SourceWireRuntimeSkeletonResponse {
  const requestSnapshot = snapshotPlainDataRecord(request);
  if (requestSnapshot === undefined) {
    return createContextBoundaryInvalidResponse(
      "invalid_context_boundary",
      "owner_hosted_api_policy"
    );
  }
  if (
    requestSnapshot.action === "capture_context" ||
    requestSnapshot.action === "search_source_evidence"
  ) {
    const contextAction = requestSnapshot.action;
    const callerSnapshot = snapshotPlainDataRecord(caller);
    const normalizedCaller = normalizeContextCaller(caller);
    const normalizedRequest = normalizeContextApiRequest(request, contextAction);
    if (normalizedCaller === undefined || normalizedRequest === undefined) {
      const boundaryAction =
        callerSnapshot === undefined ? "invalid_context_boundary" : contextAction;
      return createContextBoundaryInvalidResponse(boundaryAction, "owner_hosted_api_policy");
    }
    caller = normalizedCaller;
    request = normalizedRequest;
  }

  const requiredCapability = capabilityForAction(request.action);

  if (!caller.allowedNamespaceIds.includes(request.namespaceId)) {
    return createResponse(caller, request, {
      status: "denied",
      requiredCapability,
      omittedCount: 1,
      denialReason: "namespace_not_allowed"
    });
  }

  if (!caller.capabilities.includes(requiredCapability)) {
    return createResponse(caller, request, {
      status: "denied",
      requiredCapability,
      omittedCount: 1,
      denialReason: `missing_${requiredCapability}_capability`
    });
  }

  if (
    request.action === "capture_context" &&
    !isBoundedIdentifier(caller.ownerId)
  ) {
    return createResponse(caller, request, {
      status: "denied",
      requiredCapability,
      omittedCount: 1,
      denialReason: "authenticated_owner_required"
    });
  }

  if (
    request.action === "capture_context" &&
    (!isBoundedIdentifier(request.namespaceId) || !isBoundedIdentifier(request.requestId))
  ) {
    return createResponse(caller, request, {
      status: "denied",
      requiredCapability,
      omittedCount: 1,
      denialReason: "context_capture_identity_invalid"
    });
  }

  const contextEnvelope =
    request.action === "capture_context"
      ? normalizeContextEnvelope(request.envelope)
      : undefined;
  if (request.action === "capture_context" && contextEnvelope === undefined) {
    return createResponse(caller, request, {
      status: "denied",
      requiredCapability,
      omittedCount: 1,
      denialReason: "context_envelope_invalid"
    });
  }

  if (request.action === "search_trusted_memory") {
    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      trustedMemoryReturned: true,
      citations: [syntheticTrustedCitation]
    });
  }

  if (request.action === "search_source_evidence") {
    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      sourceEvidenceReturned: true,
      citations: syntheticSourceCitations
    });
  }

  if (request.action === "capture_context" && contextEnvelope !== undefined) {
    const contentDigest = createHash("sha256")
      .update(contextEnvelope.content, "utf8")
      .digest("hex");
    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      contextCaptured: true,
      captureDisposition: "appended",
      contentDigest,
      envelopeDigest: createContextEnvelopeDigest(contextEnvelope, contentDigest),
      synchronizedThrough: contextEnvelope.capturedAt,
      citations: [
        {
          evidenceKind: "source_evidence",
          sourceId: contextEnvelope.sourceRecordId,
          segmentId: contextEnvelope.envelopeId,
          address: contextEnvelope.sourceLocator
        }
      ],
      noAutoPromotion: true
    });
  }

  if (request.action === "maintain_source_connection") {
    return createResponse(caller, request, {
      status: "partial_success",
      requiredCapability,
      pendingCandidateCreated: true,
      gapKinds: ["stale_evidence"],
      noAutoPromotion: true
    });
  }

  if (request.action === "prepare_candidate") {
    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      pendingCandidateCreated: true,
      noAutoPromotion: true
    });
  }

  if (request.action === "approve_trusted_memory") {
    if (caller.kind !== "owner_controlled_application") {
      return createResponse(caller, request, {
        status: "denied",
        requiredCapability,
        omittedCount: 1,
        denialReason: "approval_requires_owner_or_application_control"
      });
    }

    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      trustedMemoryCreated: true,
      noAutoPromotion: false,
      approvalPath: "owner_or_application_controlled"
    });
  }

  return createResponse(caller, request, {
    status: "denied",
    requiredCapability,
    omittedCount: 1,
    denialReason: "unsupported_synthetic_action"
  });
}

export function callRuntimeSkeletonMcpAdapter(
  caller: SourceWireRuntimeSkeletonCaller,
  request: SourceWireRuntimeSkeletonMcpRequest
): SourceWireRuntimeSkeletonResponse {
  const requestSnapshot = snapshotPlainDataRecord(request);
  if (requestSnapshot === undefined) {
    return createContextBoundaryInvalidResponse("invalid_context_boundary");
  }
  if (
    requestSnapshot.tool === "capture_context" ||
    requestSnapshot.tool === "search_source_evidence"
  ) {
    const contextTool = requestSnapshot.tool;
    const callerSnapshot = snapshotPlainDataRecord(caller);
    const normalizedCaller = normalizeContextCaller(caller);
    const normalizedRequest = normalizeContextMcpRequest(request, contextTool);
    if (normalizedCaller === undefined || normalizedRequest === undefined) {
      const boundaryAction =
        callerSnapshot === undefined ? "invalid_context_boundary" : contextTool;
      return createContextBoundaryInvalidResponse(boundaryAction);
    }
    caller = normalizedCaller;
    request = normalizedRequest;
  }

  const apiRequest = mapMcpToRuntimeSkeletonApiRequest(request);
  const response = callRuntimeSkeletonApiPolicy(caller, apiRequest);

  return Object.freeze({
    ...response,
    audit: Object.freeze({
      ...response.audit,
      boundaryPath: "mcp_adapter_to_owner_hosted_api_policy"
    })
  });
}

export function runRuntimeSkeletonFixtureCase(
  fixtureCase: SourceWireRuntimeSkeletonFixtureCase
): SourceWireRuntimeSkeletonResponse {
  if (fixtureCase.via === "mcp") {
    return callRuntimeSkeletonMcpAdapter(
      fixtureCase.caller,
      fixtureCase.request as SourceWireRuntimeSkeletonMcpRequest
    );
  }

  return callRuntimeSkeletonApiPolicy(
    fixtureCase.caller,
    fixtureCase.request as SourceWireRuntimeSkeletonApiRequest
  );
}

export function runRuntimeSkeletonFixtureMatrix(
  matrix: SourceWireRuntimeSkeletonFixtureMatrix
): SourceWireRuntimeSkeletonResponse[] {
  return matrix.cases.map((fixtureCase) => runRuntimeSkeletonFixtureCase(fixtureCase));
}

function mapMcpToRuntimeSkeletonApiRequest(
  request: SourceWireRuntimeSkeletonMcpRequest
): SourceWireRuntimeSkeletonApiRequest {
  const actionByTool = {
    search_trusted_memory: "search_trusted_memory",
    search_source_evidence: "search_source_evidence",
    capture_context: "capture_context",
    maintain_source_connection: "maintain_source_connection",
    prepare_candidate: "prepare_candidate",
    approve_trusted_memory: "approve_trusted_memory"
  } satisfies Record<SourceWireRuntimeSkeletonMcpRequest["tool"], SourceWireRuntimeSkeletonApiRequest["action"]>;

  const routeByTool = {
    search_trusted_memory: "POST /synthetic/v1/search/trusted-memory",
    search_source_evidence: "POST /synthetic/v1/search/source-evidence",
    capture_context: "POST /synthetic/v1/context/capture",
    maintain_source_connection: "POST /synthetic/v1/sources/maintain",
    prepare_candidate: "POST /synthetic/v1/candidates/prepare",
    approve_trusted_memory: "POST /synthetic/v1/candidates/approve"
  } satisfies Record<SourceWireRuntimeSkeletonMcpRequest["tool"], SourceWireRuntimeSkeletonApiRequest["route"]>;

  const apiRequest: SourceWireRuntimeSkeletonApiRequest = {
    requestId: request.requestId,
    route: routeByTool[request.tool],
    namespaceId: request.namespaceId,
    action: actionByTool[request.tool]
  };

  if (typeof request.query === "string") {
    apiRequest.query = request.query;
  }

  if (request.envelope !== undefined) {
    apiRequest.envelope = request.envelope;
  }

  return apiRequest;
}

function capabilityForAction(
  action: SourceWireRuntimeSkeletonApiRequest["action"]
): SourceWireRuntimeSkeletonCapability {
  if (action === "search_trusted_memory") return "read_trusted_memory";
  if (action === "search_source_evidence") return "read_source_evidence";
  if (action === "capture_context") return "import_or_maintain_sources";
  if (action === "maintain_source_connection") return "import_or_maintain_sources";
  if (action === "prepare_candidate") return "prepare_candidates";
  return "approve_trusted_memory";
}

function createResponse(
  caller: SourceWireRuntimeSkeletonCaller,
  request: SourceWireRuntimeSkeletonApiRequest,
  options: {
    status: SourceWireRuntimeSkeletonStatus;
    requiredCapability?: SourceWireRuntimeSkeletonCapability;
    trustedMemoryReturned?: boolean;
    sourceEvidenceReturned?: boolean;
    contextCaptured?: boolean;
    captureDisposition?: "appended" | "idempotent" | "conflict";
    contentDigest?: string;
    envelopeDigest?: string;
    synchronizedThrough?: string;
    pendingCandidateCreated?: boolean;
    trustedMemoryCreated?: boolean;
    noAutoPromotion?: boolean;
    citations?: SourceWireRuntimeSkeletonCitation[];
    omittedCount?: number;
    gapKinds?: string[];
    denialReason?: string;
    approvalPath?: "owner_or_application_controlled";
  }
): SourceWireRuntimeSkeletonResponse {
  const citations = Object.freeze(
    (options.citations ?? []).map((citation) => Object.freeze({ ...citation }))
  ) as unknown as SourceWireRuntimeSkeletonCitation[];

  const response: SourceWireRuntimeSkeletonResponse = {
    status: options.status,
    requestId: request.requestId,
    namespaceId: request.namespaceId,
    sourceWireHostsUserMemory: false,
    runtimeMode: "synthetic_owner_hosted_skeleton",
    trustedMemoryReturned: options.trustedMemoryReturned ?? false,
    sourceEvidenceReturned: options.sourceEvidenceReturned ?? false,
    contextCaptured: options.contextCaptured ?? false,
    pendingCandidateCreated: options.pendingCandidateCreated ?? false,
    trustedMemoryCreated: options.trustedMemoryCreated ?? false,
    noAutoPromotion: options.noAutoPromotion ?? true,
    citationCount: citations.length,
    citations,
    omittedCount: options.omittedCount ?? 0,
    gapKinds: Object.freeze([...(options.gapKinds ?? [])]) as unknown as string[],
    audit: Object.freeze({
      callerId: caller.callerId,
      callerKind: caller.kind,
      namespaceId: request.namespaceId,
      action: request.action,
      boundaryPath: "owner_hosted_api_policy",
      result: options.status,
      leakedContent: false,
      rawTokenReturned: false,
      privatePathReturned: false
    })
  };

  if (options.captureDisposition !== undefined) {
    response.captureDisposition = options.captureDisposition;
  }

  if (options.contentDigest !== undefined) {
    response.contentDigest = options.contentDigest;
  }

  if (options.envelopeDigest !== undefined) {
    response.envelopeDigest = options.envelopeDigest;
  }

  if (options.synchronizedThrough !== undefined) {
    response.synchronizedThrough = options.synchronizedThrough;
  }

  if (typeof options.denialReason === "string") {
    response.denialReason = options.denialReason;
  }

  if (typeof options.requiredCapability === "string") {
    response.requiredCapability = options.requiredCapability;
  }

  if (typeof options.approvalPath === "string") {
    response.approvalPath = options.approvalPath;
  }

  return Object.freeze(response);
}
