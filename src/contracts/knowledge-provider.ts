export const SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID = "source-wire.knowledge-provider" as const;
export const SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION = "knowledge-provider.v1" as const;
export const SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS = 30_000 as const;

export type SourceWireCapabilityRequirementV1 = "required" | "optional";

export type SourceWireCapabilityRequestV1 = {
  capability: string;
  requirement: SourceWireCapabilityRequirementV1;
};

export type SourceWireSafeErrorV1<TCode extends string = string> = {
  code: TCode;
  message: string;
  traceId: string;
  retryable: boolean;
  retryAfterMs?: number;
  detailsRedacted: true;
};

export type SourceWireKnowledgeProviderOperationV1 =
  | "describe"
  | "health"
  | "search_evidence"
  | "get_evidence";

export type SourceWireKnowledgeProviderFamilyV1 =
  | "document_index"
  | "relational_view"
  | "custom";

export type SourceWireKnowledgeProviderCapabilityV1 = {
  capability: SourceWireKnowledgeProviderOperationV1;
  requirement: SourceWireCapabilityRequirementV1;
  supported: boolean;
};

export type SourceWireKnowledgeProviderProfileV1 = {
  contractId: typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID;
  contractVersion: typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION;
  providerId: string;
  providerScopeId: string;
  providerFamily: SourceWireKnowledgeProviderFamilyV1;
  accessMode: "read_only";
  credentialMode: "out_of_band";
  capabilities: SourceWireKnowledgeProviderCapabilityV1[];
  requiredProvenance: true;
  noAutoPromotion: true;
  arbitraryTableMappingSupported: false;
  maximumResultCount: number;
  maximumExcerptBytes: number;
};

export type SourceWireKnowledgeProviderSearchInputV1 = {
  query: string;
  maximumResults: number;
  cursor?: SourceWireKnowledgeProviderCursorV1;
  freshness?: SourceWireKnowledgeFreshnessV1;
  sensitivity?: SourceWireKnowledgeSensitivityV1;
};

export type SourceWireKnowledgeProviderGetInputV1 = {
  sourceId: string;
  segmentId: string;
};

export type SourceWireKnowledgeProviderRequestV1 = {
  contractId: typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID;
  contractVersion: typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION;
  requestId: string;
  traceId: string;
  providerId: string;
  ownerId: string;
  namespaceId: string;
  providerScopeId: string;
  operation: SourceWireKnowledgeProviderOperationV1;
  requiredCapabilities: SourceWireCapabilityRequestV1[];
  deadlineAt: string;
  search?: SourceWireKnowledgeProviderSearchInputV1;
  get?: SourceWireKnowledgeProviderGetInputV1;
};

export type SourceWireKnowledgeFreshnessV1 = "fresh" | "stale" | "unknown";
export type SourceWireKnowledgeSensitivityV1 = "public" | "internal" | "confidential" | "restricted";

export type SourceWireKnowledgeProviderCursorV1 = {
  providerId: string;
  providerScopeId: string;
  value: string;
};

export type SourceWireKnowledgeEvidenceV1 = {
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
  sensitivity: SourceWireKnowledgeSensitivityV1;
  freshness: SourceWireKnowledgeFreshnessV1;
  retrievedAt: string;
  sourceModifiedAt?: string;
  instructionAuthority: "none";
};

export type SourceWireKnowledgeProviderGapV1 = {
  code:
    | "no_evidence"
    | "partial_evidence"
    | "provider_unavailable"
    | "rate_limited"
    | "not_found"
    | "invalid_evidence";
  message: string;
  retryable: boolean;
};

export type SourceWireKnowledgeProviderStatusV1 =
  | "allowed"
  | "partial_success"
  | "denied"
  | "unavailable";

export type SourceWireKnowledgeProviderErrorCodeV1 =
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

export type SourceWireKnowledgeProviderResultV1 = {
  requestId: string;
  traceId: string;
  providerId: string;
  contractVersion: typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION;
  status: SourceWireKnowledgeProviderStatusV1;
  evidence: SourceWireKnowledgeEvidenceV1[];
  gaps: SourceWireKnowledgeProviderGapV1[];
  nextCursor?: SourceWireKnowledgeProviderCursorV1;
  providerMutationAttempted: false;
  memoryMutationAttempted: false;
  trustedMemoryCreated: false;
  noAutoPromotion: true;
  readAuditRequired: true;
  releaseState: "internal_unreleased";
  error?: SourceWireSafeErrorV1<SourceWireKnowledgeProviderErrorCodeV1>;
};

export interface SourceWireKnowledgeProviderV1 {
  readonly profile: SourceWireKnowledgeProviderProfileV1;
  execute(request: SourceWireKnowledgeProviderRequestV1): Promise<SourceWireKnowledgeProviderResultV1>;
}

export const SOURCE_WIRE_KNOWLEDGE_PROVIDER_BOUNDARY = {
  providerConnectionIncluded: false,
  providerSdkIncluded: false,
  liveConnectorIncluded: false,
  providerWriteIncluded: false,
  arbitraryQueryIncluded: false,
  memoryMutationIncluded: false,
  trustedMemoryPromotionIncluded: false,
  databaseConnectionIncluded: false,
  credentialsIncluded: false,
  deploymentIncluded: false,
  managedHostingIncluded: false,
  publicationIncluded: false,
  realDataIncluded: false,
  noAutoPromotion: true
} as const;

const REQUIRED_PROVIDER_CAPABILITIES: SourceWireKnowledgeProviderOperationV1[] = [
  "describe",
  "health",
  "search_evidence",
  "get_evidence"
];

function providerProfile(
  providerId: string,
  providerScopeId: string,
  providerFamily: SourceWireKnowledgeProviderFamilyV1
): SourceWireKnowledgeProviderProfileV1 {
  return {
    contractId: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
    contractVersion: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
    providerId,
    providerScopeId,
    providerFamily,
    accessMode: "read_only",
    credentialMode: "out_of_band",
    capabilities: REQUIRED_PROVIDER_CAPABILITIES.map((capability) => ({
      capability,
      requirement: "required",
      supported: true
    })),
    requiredProvenance: true,
    noAutoPromotion: true,
    arbitraryTableMappingSupported: false,
    maximumResultCount: 20,
    maximumExcerptBytes: 65_536
  };
}

export const SOURCE_WIRE_SYNTHETIC_DOCUMENT_INDEX_PROFILE: SourceWireKnowledgeProviderProfileV1 =
  providerProfile("synthetic_document_index", "scope_docs_alpha", "document_index");

export const SOURCE_WIRE_SYNTHETIC_RELATIONAL_VIEW_PROFILE: SourceWireKnowledgeProviderProfileV1 =
  providerProfile("synthetic_relational_view", "scope_views_alpha", "relational_view");

export type SourceWireKnowledgeProviderConformanceCheckV1 =
  | "profile"
  | "request"
  | "fixture"
  | "boundary";

export type SourceWireKnowledgeProviderConformanceInputV1 = {
  contractVersion?: string | null;
  operation?: string;
  requiredCapabilities?: SourceWireCapabilityRequestV1[];
  profileCapabilityOverride?: {
    capability: string;
    supported: boolean;
  };
  advertisedAuthority?: string;
  returnedOwnerId?: string;
  returnedNamespaceId?: string;
  requestedProviderScopeId?: string;
  aclDecision?: string;
  omitEvidenceField?: string;
  evidenceMode?: "normal" | "empty" | "partial";
  availability?: "available" | "unavailable" | "rate_limited" | "not_found";
  retryAfterMs?: number;
  cursor?: SourceWireKnowledgeProviderCursorV1;
  forceError?: SourceWireKnowledgeProviderErrorCodeV1;
  instructionShapedContent?: boolean;
  instructionShapedMetadata?: boolean;
};

export type SourceWireKnowledgeProviderConformanceCaseV1 = {
  caseId: string;
  profileId: string;
  check: SourceWireKnowledgeProviderConformanceCheckV1;
  input?: SourceWireKnowledgeProviderConformanceInputV1;
  expected: Record<string, unknown>;
};

export type SourceWireKnowledgeProviderConformanceFixtureMatrixV1 = {
  fixtureType: "source-wire-knowledge-provider-v1-fixture-matrix";
  fixtureSafety: "synthetic";
  contractId: string;
  contractVersion: string;
  boundary: typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_BOUNDARY;
  profiles: SourceWireKnowledgeProviderProfileV1[];
  cases: SourceWireKnowledgeProviderConformanceCaseV1[];
};

export type SourceWireKnowledgeProviderConformanceResultV1 = SourceWireKnowledgeProviderResultV1 & {
  caseId: string;
  profileConformant: boolean;
  completeProvenance: boolean;
  cursorAccepted: boolean;
  safeErrorShape: boolean;
  instructionAuthority: "none";
  fixtureSynthetic: boolean;
  forbiddenScopeFlagsFalse: boolean;
};

export function createSourceWireSafeErrorV1<TCode extends string>(
  code: TCode,
  traceId: string,
  retryable = false,
  retryAfterMs?: number
): SourceWireSafeErrorV1<TCode> {
  const base: SourceWireSafeErrorV1<TCode> = {
    code,
    message: safeErrorMessage(code),
    traceId,
    retryable,
    detailsRedacted: true
  };

  if (retryAfterMs === undefined || !Number.isFinite(retryAfterMs) || retryAfterMs < 0) {
    return base;
  }

  return {
    ...base,
    retryAfterMs: Math.min(Math.floor(retryAfterMs), SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS)
  };
}

export function evaluateKnowledgeProviderConformanceCase(
  fixtureCase: SourceWireKnowledgeProviderConformanceCaseV1,
  profile: SourceWireKnowledgeProviderProfileV1 = SOURCE_WIRE_SYNTHETIC_DOCUMENT_INDEX_PROFILE,
  fixtureSafety: "synthetic" = "synthetic",
  boundary: typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_BOUNDARY = SOURCE_WIRE_KNOWLEDGE_PROVIDER_BOUNDARY
): SourceWireKnowledgeProviderConformanceResultV1 {
  const input = fixtureCase.input ?? {};
  const effectiveProfile = withCapabilityOverride(profile, input.profileCapabilityOverride);
  const traceId = `trace_${fixtureCase.caseId}`;

  if (fixtureCase.check === "fixture") {
    return conformanceResult(fixtureCase, profile, "allowed", {
      fixtureSynthetic: fixtureSafety === "synthetic"
    });
  }

  if (fixtureCase.check === "boundary") {
    return conformanceResult(fixtureCase, profile, "allowed", {
      forbiddenScopeFlagsFalse: hasClosedProviderBoundary(boundary)
    });
  }

  const profileConformant = isKnowledgeProviderProfileConformant(
    effectiveProfile,
    input.advertisedAuthority
  );

  if (!profileConformant) {
    const code: SourceWireKnowledgeProviderErrorCodeV1 = input.advertisedAuthority === undefined
      ? "invalid_request"
      : "incompatible_provider_authority";
    return conformanceResult(fixtureCase, profile, "denied", {
      profileConformant: false,
      error: createSourceWireSafeErrorV1(code, traceId)
    });
  }

  if (fixtureCase.check === "profile") {
    return conformanceResult(fixtureCase, profile, "allowed", { profileConformant: true });
  }

  const requestedVersion = Object.prototype.hasOwnProperty.call(input, "contractVersion")
    ? input.contractVersion
    : SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION;

  if (requestedVersion !== SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION) {
    return conformanceResult(fixtureCase, profile, "denied", {
      error: createSourceWireSafeErrorV1("unsupported_contract_version", traceId)
    });
  }

  const operation = input.operation ?? "search_evidence";
  if (!isKnowledgeProviderOperation(operation)) {
    return conformanceResult(fixtureCase, profile, "denied", {
      error: createSourceWireSafeErrorV1("unsupported_operation", traceId)
    });
  }

  const requiredCapabilities = input.requiredCapabilities ?? [
    { capability: operation, requirement: "required" as const }
  ];
  if (!capabilitiesSatisfied(effectiveProfile, requiredCapabilities)) {
    return conformanceResult(fixtureCase, profile, "denied", {
      error: createSourceWireSafeErrorV1("invalid_request", traceId)
    });
  }

  if (input.requestedProviderScopeId !== undefined && input.requestedProviderScopeId !== profile.providerScopeId) {
    return conformanceResult(fixtureCase, profile, "denied", {
      error: createSourceWireSafeErrorV1("scope_not_mapped", traceId)
    });
  }

  if (input.cursor !== undefined) {
    const cursorAccepted = input.cursor.providerId === profile.providerId &&
      input.cursor.providerScopeId === profile.providerScopeId;
    if (!cursorAccepted) {
      return conformanceResult(fixtureCase, profile, "denied", {
        cursorAccepted: false,
        error: createSourceWireSafeErrorV1("scope_violation", traceId)
      });
    }
  }

  if (input.forceError !== undefined) {
    return conformanceResult(fixtureCase, profile, "denied", {
      safeErrorShape: true,
      error: createSourceWireSafeErrorV1(input.forceError, traceId)
    });
  }

  if (input.availability === "unavailable") {
    return conformanceResult(fixtureCase, profile, "unavailable", {
      gaps: [providerGap("provider_unavailable", true)],
      error: createSourceWireSafeErrorV1("temporarily_unavailable", traceId, true)
    });
  }

  if (input.availability === "rate_limited") {
    return conformanceResult(fixtureCase, profile, "unavailable", {
      gaps: [providerGap("rate_limited", true)],
      error: createSourceWireSafeErrorV1("rate_limited", traceId, true, input.retryAfterMs)
    });
  }

  if (input.availability === "not_found") {
    return conformanceResult(fixtureCase, profile, "denied", {
      gaps: [providerGap("not_found", false)],
      error: createSourceWireSafeErrorV1("not_found", traceId)
    });
  }

  if (operation === "describe" || operation === "health") {
    return conformanceResult(fixtureCase, profile, "allowed", {
      cursorAccepted: input.cursor !== undefined
    });
  }

  if (input.evidenceMode === "empty") {
    return conformanceResult(fixtureCase, profile, "allowed", {
      gaps: [providerGap("no_evidence", false)]
    });
  }

  const evidenceCandidate = createSyntheticEvidence(profile, input);
  if (input.omitEvidenceField !== undefined) {
    delete evidenceCandidate[input.omitEvidenceField];
  }

  if (!isCompleteKnowledgeEvidence(evidenceCandidate, profile)) {
    const code: SourceWireKnowledgeProviderErrorCodeV1 =
      evidenceCandidate.aclDecision !== "allowed" ||
      evidenceCandidate.ownerId !== "owner_synthetic" ||
      evidenceCandidate.namespaceId !== "ns_synthetic_alpha"
        ? "scope_violation"
        : "provenance_incomplete";
    return conformanceResult(fixtureCase, profile, "denied", {
      gaps: [providerGap("invalid_evidence", false)],
      error: createSourceWireSafeErrorV1(code, traceId)
    });
  }

  const evidence = [evidenceCandidate];
  const status: SourceWireKnowledgeProviderStatusV1 =
    input.evidenceMode === "partial" ? "partial_success" : "allowed";

  return conformanceResult(fixtureCase, profile, status, {
    evidence,
    gaps: input.evidenceMode === "partial" ? [providerGap("partial_evidence", true)] : [],
    completeProvenance: true,
    cursorAccepted: input.cursor !== undefined,
    instructionAuthority: evidenceCandidate.instructionAuthority
  });
}

export function evaluateKnowledgeProviderConformanceFixtureMatrix(
  matrix: SourceWireKnowledgeProviderConformanceFixtureMatrixV1
): SourceWireKnowledgeProviderConformanceResultV1[] {
  return matrix.cases.map((fixtureCase) => {
    const profile = matrix.profiles.find((candidate) => candidate.providerId === fixtureCase.profileId);
    if (profile === undefined) {
      return conformanceResult(
        fixtureCase,
        SOURCE_WIRE_SYNTHETIC_DOCUMENT_INDEX_PROFILE,
        "denied",
        {
          providerId: fixtureCase.profileId,
          profileConformant: false,
          error: createSourceWireSafeErrorV1(
            "invalid_request",
            `trace_${fixtureCase.caseId}`
          )
        }
      );
    }
    return evaluateKnowledgeProviderConformanceCase(
      fixtureCase,
      profile,
      matrix.fixtureSafety,
      matrix.boundary
    );
  });
}

function conformanceResult(
  fixtureCase: SourceWireKnowledgeProviderConformanceCaseV1,
  profile: SourceWireKnowledgeProviderProfileV1,
  status: SourceWireKnowledgeProviderStatusV1,
  overrides: Partial<SourceWireKnowledgeProviderConformanceResultV1> = {}
): SourceWireKnowledgeProviderConformanceResultV1 {
  const base: SourceWireKnowledgeProviderConformanceResultV1 = {
    caseId: fixtureCase.caseId,
    requestId: `request_${fixtureCase.caseId}`,
    traceId: `trace_${fixtureCase.caseId}`,
    providerId: profile.providerId,
    contractVersion: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
    status,
    evidence: [],
    gaps: [],
    providerMutationAttempted: false,
    memoryMutationAttempted: false,
    trustedMemoryCreated: false,
    noAutoPromotion: true,
    readAuditRequired: true,
    releaseState: "internal_unreleased",
    profileConformant: true,
    completeProvenance: false,
    cursorAccepted: false,
    safeErrorShape: false,
    instructionAuthority: "none",
    fixtureSynthetic: false,
    forbiddenScopeFlagsFalse: false
  };

  return {
    ...base,
    ...overrides,
    providerMutationAttempted: false,
    memoryMutationAttempted: false,
    trustedMemoryCreated: false,
    noAutoPromotion: true,
    readAuditRequired: true,
    releaseState: "internal_unreleased"
  };
}

function withCapabilityOverride(
  profile: SourceWireKnowledgeProviderProfileV1,
  override: SourceWireKnowledgeProviderConformanceInputV1["profileCapabilityOverride"]
): SourceWireKnowledgeProviderProfileV1 {
  if (override === undefined) {
    return profile;
  }

  const capabilities = profile.capabilities.map((descriptor) =>
    descriptor.capability === override.capability
      ? { ...descriptor, supported: override.supported }
      : descriptor
  );
  return { ...profile, capabilities };
}

function isKnowledgeProviderProfileConformant(
  profile: SourceWireKnowledgeProviderProfileV1,
  advertisedAuthority?: string
): boolean {
  if (
    profile.contractId !== SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID ||
    profile.contractVersion !== SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION ||
    profile.accessMode !== "read_only" ||
    profile.credentialMode !== "out_of_band" ||
    profile.requiredProvenance !== true ||
    profile.noAutoPromotion !== true ||
    profile.arbitraryTableMappingSupported !== false ||
    profile.maximumResultCount < 1 ||
    profile.maximumExcerptBytes < 1
  ) {
    return false;
  }

  if (advertisedAuthority !== undefined && !isKnowledgeProviderOperation(advertisedAuthority)) {
    return false;
  }

  return REQUIRED_PROVIDER_CAPABILITIES.every((required) =>
    profile.capabilities.some(
      (descriptor) =>
        descriptor.capability === required &&
        descriptor.requirement === "required" &&
        descriptor.supported
    )
  );
}

function capabilitiesSatisfied(
  profile: SourceWireKnowledgeProviderProfileV1,
  requested: SourceWireCapabilityRequestV1[]
): boolean {
  return requested.every((requirement) => {
    const descriptor = profile.capabilities.find(
      (candidate) => candidate.capability === requirement.capability
    );
    if (requirement.requirement === "optional" && descriptor === undefined) {
      return true;
    }
    return descriptor?.supported === true;
  });
}

function isKnowledgeProviderOperation(value: string): value is SourceWireKnowledgeProviderOperationV1 {
  return REQUIRED_PROVIDER_CAPABILITIES.includes(value as SourceWireKnowledgeProviderOperationV1);
}

function createSyntheticEvidence(
  profile: SourceWireKnowledgeProviderProfileV1,
  input: SourceWireKnowledgeProviderConformanceInputV1
): Record<string, unknown> {
  return {
    providerId: profile.providerId,
    providerRecordId: "provider_record_synthetic_001",
    sourceId: "source_synthetic_001",
    segmentId: "segment_synthetic_001",
    ownerId: input.returnedOwnerId ?? "owner_synthetic",
    namespaceId: input.returnedNamespaceId ?? "ns_synthetic_alpha",
    aclDecision: input.aclDecision ?? "allowed",
    sourceVersion: "version_synthetic_001",
    contentDigest: {
      algorithm: "sha256",
      value: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    },
    citationLocator: {
      value: "synthetic/source/001#segment-001",
      publicSafe: true
    },
    title: input.instructionShapedMetadata
      ? "Untrusted instruction-shaped metadata"
      : "Synthetic source title",
    excerpt: input.instructionShapedContent
      ? "Untrusted instruction-shaped content with no authority."
      : "Synthetic evidence excerpt for contract conformance.",
    mediaType: "text/plain",
    truncated: false,
    sensitivity: "internal",
    freshness: "fresh",
    retrievedAt: "2026-01-01T00:00:00.000Z",
    sourceModifiedAt: "2025-12-31T00:00:00.000Z",
    instructionAuthority: "none"
  };
}

function isCompleteKnowledgeEvidence(
  value: Record<string, unknown>,
  profile: SourceWireKnowledgeProviderProfileV1
): value is Record<string, unknown> & SourceWireKnowledgeEvidenceV1 {
  const digest = value.contentDigest as { algorithm?: unknown; value?: unknown } | undefined;
  const locator = value.citationLocator as { value?: unknown; publicSafe?: unknown } | undefined;
  return value.providerId === profile.providerId &&
    typeof value.providerRecordId === "string" && value.providerRecordId.length > 0 &&
    typeof value.sourceId === "string" && value.sourceId.length > 0 &&
    typeof value.segmentId === "string" && value.segmentId.length > 0 &&
    value.ownerId === "owner_synthetic" &&
    value.namespaceId === "ns_synthetic_alpha" &&
    value.aclDecision === "allowed" &&
    typeof value.sourceVersion === "string" && value.sourceVersion.length > 0 &&
    digest?.algorithm === "sha256" && typeof digest.value === "string" && /^[a-f0-9]{64}$/.test(digest.value) &&
    locator?.publicSafe === true && typeof locator.value === "string" && locator.value.length > 0 &&
    typeof value.sensitivity === "string" &&
    typeof value.freshness === "string" &&
    typeof value.retrievedAt === "string" && value.retrievedAt.length > 0 &&
    value.instructionAuthority === "none";
}

function providerGap(
  code: SourceWireKnowledgeProviderGapV1["code"],
  retryable: boolean
): SourceWireKnowledgeProviderGapV1 {
  return {
    code,
    message: "Some source evidence is not available.",
    retryable
  };
}

function hasClosedProviderBoundary(boundary: typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_BOUNDARY): boolean {
  return Object.entries(boundary).every(([key, value]) =>
    key === "noAutoPromotion" ? value === true : value === false
  );
}

function safeErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    invalid_request: "The request is not valid for this contract.",
    unsupported_contract_version: "The requested contract version is not supported.",
    unsupported_operation: "The requested operation is not supported.",
    incompatible_provider_authority: "The provider authority is incompatible with this contract.",
    scope_not_mapped: "The requested provider scope is not available.",
    scope_violation: "The request is not allowed for this scope.",
    not_found: "The requested item is not available.",
    provenance_incomplete: "Required provenance is incomplete.",
    rate_limited: "The request cannot be completed at this time.",
    deadline_exceeded: "The request deadline was exceeded.",
    temporarily_unavailable: "The service is temporarily unavailable.",
    provider_failure: "The provider could not complete the request.",
    conflict: "The request conflicts with the current record version.",
    invalid_lifecycle_transition: "The requested lifecycle transition is not allowed.",
    provenance_required: "Required provenance is missing.",
    explicit_approval_required: "Explicit owner-controlled approval is required.",
    audit_unavailable: "Durable audit is unavailable.",
    audit_receipt_invalid: "The durable audit receipt is not valid for release.",
    transaction_failed: "The transaction could not be committed.",
    backend_incompatible: "The storage backend is incompatible with this contract.",
    schema_incompatible: "The storage schema is incompatible with this contract.",
    schema_too_old: "The storage schema is older than the supported range.",
    schema_too_new: "The storage schema is newer than the supported range."
  };
  return messages[code] ?? "The request could not be completed safely.";
}
