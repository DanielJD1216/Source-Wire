import {
  SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS,
  createSourceWireSafeErrorV1,
  type SourceWireCapabilityRequestV1,
  type SourceWireCapabilityRequirementV1,
  type SourceWireSafeErrorV1
} from "./knowledge-provider.js";

export const SOURCE_WIRE_MEMORY_STORE_CONTRACT_ID = "source-wire.memory-store" as const;
export const SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION = "memory-store.v1" as const;
export const SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME = "source_wire_memory" as const;

export type SourceWireMemoryStoreOperationV1 =
  | "describe"
  | "health"
  | "search_trusted_memory"
  | "get_trusted_memory"
  | "list_candidates"
  | "append_read_audit"
  | "create_candidate"
  | "decide_candidate"
  | "revoke_trusted_memory";

export type SourceWireMemoryStoreCapabilityV1 = {
  capability: SourceWireMemoryStoreOperationV1;
  requirement: SourceWireCapabilityRequirementV1;
  supported: boolean;
};

export type SourceWireMemoryStoreProfileV1 = {
  contractId: typeof SOURCE_WIRE_MEMORY_STORE_CONTRACT_ID;
  contractVersion: typeof SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION;
  backend: "postgresql";
  infrastructureOwner: "adopter";
  logicalSchemaOwner: "source_wire";
  dedicatedSchema: true;
  defaultSchemaName: typeof SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME;
  migrationDefinitionsOwner: "source_wire";
  migrationExecutionOwner: "adopter";
  arbitraryTableMappingSupported: false;
  additionalBackendsSupported: false;
  mutationAuditAtomic: true;
  sourceWireHostsUserMemory: false;
  noAutoPromotion: true;
  databaseConnectionIncluded: false;
  migrationArtifactIncluded: false;
  credentialsIncluded: false;
  capabilities: SourceWireMemoryStoreCapabilityV1[];
  observedSchemaVersion: number;
  minimumSupportedSchemaVersion: number;
  maximumSupportedSchemaVersion: number;
};

export type SourceWireMemoryStoreActorKindV1 =
  | "owner"
  | "owner_application"
  | "agent_harness"
  | "system";

export type SourceWireMemoryCandidateStateV1 = "pending" | "approved" | "rejected";
export type SourceWireTrustedMemoryStateV1 = "active" | "superseded" | "revoked";

export type SourceWireKnowledgeEvidenceReferenceV1 = {
  kind: "knowledge_provider";
  providerId: string;
  sourceId: string;
  segmentId: string;
  sourceVersion: string;
  contentDigest: string;
  citationLocator: string;
};

export type SourceWireOwnerAssertionV1 = {
  kind: "owner_assertion";
  actorId: string;
  assertedAt: string;
  reason: string;
};

export type SourceWirePriorMemoryReferenceV1 = {
  kind: "prior_memory";
  memoryId: string;
  revision: number;
};

export type SourceWireMemoryProvenanceV1 =
  | SourceWireKnowledgeEvidenceReferenceV1
  | SourceWireOwnerAssertionV1
  | SourceWirePriorMemoryReferenceV1;

export type SourceWireExplicitApprovalV1 = {
  explicit: true;
  authority: "owner" | "owner_application";
  approvedByActorId: string;
  approvedAt: string;
  policyDecisionId: string;
};

export type SourceWireMemoryStoreRequestV1 = {
  contractId: typeof SOURCE_WIRE_MEMORY_STORE_CONTRACT_ID;
  contractVersion: typeof SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION;
  requestId: string;
  traceId: string;
  ownerId: string;
  namespaceId: string;
  operation: SourceWireMemoryStoreOperationV1;
  requiredCapabilities: SourceWireCapabilityRequestV1[];
  actorId: string;
  actorKind: SourceWireMemoryStoreActorKindV1;
  policyDecisionId: string;
  reason: string;
  idempotencyKey?: string;
  expectedRevision?: number;
  provenance?: SourceWireMemoryProvenanceV1[];
  approval?: SourceWireExplicitApprovalV1;
  readAudit?: SourceWireReadAuditRequestV1;
};

export type SourceWireMemoryCandidateV1 = {
  candidateId: string;
  ownerId: string;
  namespaceId: string;
  state: SourceWireMemoryCandidateStateV1;
  revision: number;
  content: string;
  provenance: SourceWireMemoryProvenanceV1[];
};

export type SourceWireTrustedMemoryV1 = {
  memoryId: string;
  ownerId: string;
  namespaceId: string;
  state: SourceWireTrustedMemoryStateV1;
  revision: number;
  content: string;
  provenance: SourceWireMemoryProvenanceV1[];
};

export type SourceWireMutationReceiptV1 = {
  transactionId: string;
  committed: true;
  idempotencyKey: string;
  replayed: boolean;
  memoryMutationCount: number;
  auditEventId: string;
  auditCommitted: true;
};

export type SourceWireReadKindV1 =
  | "provider_search"
  | "provider_fetch"
  | "memory_search"
  | "memory_fetch"
  | "candidate_list";

export type SourceWireReadAuditRequestV1 = {
  requestId: string;
  traceId: string;
  policyDecisionId: string;
  actorId: string;
  actorKind: SourceWireMemoryStoreActorKindV1;
  ownerId: string;
  namespaceId: string;
  readKind: SourceWireReadKindV1;
  providerId?: string;
  releaseBindingId: string;
  resultSetDigest: string;
  outcome: "allowed" | "partial_success";
  aggregateResultCount: number;
  contentIncluded: false;
  rawQueryIncluded: false;
  restrictedLocatorIncluded: false;
  credentialsIncluded: false;
};

export type SourceWireReadAuditReceiptV1 = {
  auditEventId: string;
  auditCommitted: true;
  requestId: string;
  traceId: string;
  ownerId: string;
  namespaceId: string;
  readKind: SourceWireReadKindV1;
  providerId?: string;
  releaseBindingId: string;
  resultSetDigest: string;
  coveredResultCount: number;
  singleUse: true;
};

export type SourceWireMemoryStoreStatusV1 =
  | "allowed"
  | "pending_review"
  | "denied"
  | "conflict"
  | "unavailable";

export type SourceWireMemoryStoreErrorCodeV1 =
  | "invalid_request"
  | "unsupported_contract_version"
  | "scope_violation"
  | "not_found"
  | "conflict"
  | "invalid_lifecycle_transition"
  | "provenance_required"
  | "explicit_approval_required"
  | "audit_unavailable"
  | "audit_receipt_invalid"
  | "transaction_failed"
  | "backend_incompatible"
  | "schema_incompatible"
  | "schema_too_old"
  | "schema_too_new"
  | "temporarily_unavailable";

export type SourceWireMemoryStoreGapV1 = {
  code: "audit_unavailable" | "record_unavailable" | "store_unavailable";
  message: string;
  retryable: boolean;
};

export type SourceWireMemoryStoreResultV1 = {
  requestId: string;
  traceId: string;
  status: SourceWireMemoryStoreStatusV1;
  memories: SourceWireTrustedMemoryV1[];
  candidates: SourceWireMemoryCandidateV1[];
  gaps: SourceWireMemoryStoreGapV1[];
  transactionReceipt?: SourceWireMutationReceiptV1;
  readAuditReceipt?: SourceWireReadAuditReceiptV1;
  error?: SourceWireSafeErrorV1<SourceWireMemoryStoreErrorCodeV1>;
  mutationApplied: boolean;
  auditCommitted: boolean;
  protectedContentReleased: boolean;
  sourceEvidencePromoted: false;
  noAutoPromotion: true;
  sourceWireHostsUserMemory: false;
};

export interface SourceWireMemoryStoreV1 {
  readonly profile: SourceWireMemoryStoreProfileV1;
  execute(request: SourceWireMemoryStoreRequestV1): Promise<SourceWireMemoryStoreResultV1>;
}

export type SourceWirePostgresRoleNameV1 =
  | "source_wire_schema_owner"
  | "source_wire_migrator"
  | "source_wire_runtime"
  | "source_wire_kb_reader"
  | "source_wire_observer";

export type SourceWirePostgresRolePostureV1 = {
  roleName: SourceWirePostgresRoleNameV1;
  login: boolean;
  credentialPosture: "none" | "temporary" | "persistent";
  approvedUse:
    | "schema_ownership"
    | "approved_migration_only"
    | "runtime_only"
    | "knowledge_read_only"
    | "health_only";
  runtimeUseAllowed: boolean;
  migrationUseAllowed: boolean;
  dataReadAllowed: boolean;
  contentAccessAllowed: boolean;
  healthOnly: boolean;
  roleAssumptionRequiresApprovedMigration: boolean;
  assumableRoles: string[];
  ownsSchemaObjects: boolean;
  ownedSchemas: string[];
  ownsDatabase: boolean;
  superuser: boolean;
  createRole: boolean;
  createDatabase: boolean;
  replication: boolean;
  bypassRls: boolean;
  allowedSchemas: string[];
  createSchema: boolean;
  readRows: boolean;
  insertRows: boolean;
  updateRows: boolean;
  deleteRows: boolean;
  truncateRows: boolean;
  insertAuditRows: boolean;
  updateAuditRows: boolean;
  deleteAuditRows: boolean;
};

export type SourceWirePostgresQuerySafetyPostureV1 = {
  fixedSearchPath: true;
  safeSearchPath: [typeof SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME, "pg_catalog"];
  publicSchemaCreateRevoked: true;
  unsafeFunctionExecutionRevoked: true;
  objectsFullyQualified: true;
  parameterizedQueriesRequired: true;
  modelGeneratedSqlAllowed: false;
};

export const SOURCE_WIRE_MEMORY_STORE_BOUNDARY = {
  sqlIncluded: false,
  migrationArtifactIncluded: false,
  databaseDriverIncluded: false,
  databaseConnectionIncluded: false,
  credentialsIncluded: false,
  provisioningIncluded: false,
  deploymentIncluded: false,
  managedHostingIncluded: false,
  providerSdkIncluded: false,
  liveConnectorIncluded: false,
  publicationIncluded: false,
  realDataIncluded: false,
  arbitraryTableMappingSupported: false,
  additionalBackendsSupported: false,
  sourceWireHostsUserMemory: false,
  noAutoPromotion: true
} as const;

const MEMORY_STORE_OPERATIONS: SourceWireMemoryStoreOperationV1[] = [
  "describe",
  "health",
  "search_trusted_memory",
  "get_trusted_memory",
  "list_candidates",
  "append_read_audit",
  "create_candidate",
  "decide_candidate",
  "revoke_trusted_memory"
];

export const SOURCE_WIRE_POSTGRES_MEMORY_STORE_PROFILE: SourceWireMemoryStoreProfileV1 = {
  contractId: SOURCE_WIRE_MEMORY_STORE_CONTRACT_ID,
  contractVersion: SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION,
  backend: "postgresql",
  infrastructureOwner: "adopter",
  logicalSchemaOwner: "source_wire",
  dedicatedSchema: true,
  defaultSchemaName: SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME,
  migrationDefinitionsOwner: "source_wire",
  migrationExecutionOwner: "adopter",
  arbitraryTableMappingSupported: false,
  additionalBackendsSupported: false,
  mutationAuditAtomic: true,
  sourceWireHostsUserMemory: false,
  noAutoPromotion: true,
  databaseConnectionIncluded: false,
  migrationArtifactIncluded: false,
  credentialsIncluded: false,
  capabilities: MEMORY_STORE_OPERATIONS.map((capability) => ({
    capability,
    requirement: "required",
    supported: true
  })),
  observedSchemaVersion: 1,
  minimumSupportedSchemaVersion: 1,
  maximumSupportedSchemaVersion: 1
};

export const SOURCE_WIRE_POSTGRES_ROLE_POSTURE: SourceWirePostgresRolePostureV1[] = [
  rolePosture("source_wire_schema_owner", {
    login: false,
    credentialPosture: "none",
    approvedUse: "schema_ownership",
    ownsSchemaObjects: true,
    ownedSchemas: [SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME]
  }),
  rolePosture("source_wire_migrator", {
    login: true,
    credentialPosture: "temporary",
    approvedUse: "approved_migration_only",
    migrationUseAllowed: true,
    roleAssumptionRequiresApprovedMigration: true,
    assumableRoles: ["source_wire_schema_owner"],
    allowedSchemas: [SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME]
  }),
  rolePosture("source_wire_runtime", {
    login: true,
    credentialPosture: "persistent",
    approvedUse: "runtime_only",
    runtimeUseAllowed: true,
    dataReadAllowed: true,
    contentAccessAllowed: true,
    allowedSchemas: [SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME],
    readRows: true,
    insertRows: true,
    updateRows: true,
    deleteRows: true,
    insertAuditRows: true
  }),
  rolePosture("source_wire_kb_reader", {
    login: true,
    credentialPosture: "persistent",
    approvedUse: "knowledge_read_only",
    dataReadAllowed: true,
    contentAccessAllowed: true,
    allowedSchemas: ["synthetic_knowledge_views"],
    readRows: true
  }),
  rolePosture("source_wire_observer", {
    login: true,
    credentialPosture: "persistent",
    approvedUse: "health_only",
    healthOnly: true
  })
];

export const SOURCE_WIRE_POSTGRES_QUERY_SAFETY_POSTURE: SourceWirePostgresQuerySafetyPostureV1 = {
  fixedSearchPath: true,
  safeSearchPath: [SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME, "pg_catalog"],
  publicSchemaCreateRevoked: true,
  unsafeFunctionExecutionRevoked: true,
  objectsFullyQualified: true,
  parameterizedQueriesRequired: true,
  modelGeneratedSqlAllowed: false
};

export const SOURCE_WIRE_SYNTHETIC_POSTGRES_MEMORY_STORE_POSTURE = {
  profile: SOURCE_WIRE_POSTGRES_MEMORY_STORE_PROFILE,
  roles: SOURCE_WIRE_POSTGRES_ROLE_POSTURE,
  querySafety: SOURCE_WIRE_POSTGRES_QUERY_SAFETY_POSTURE,
  logicalDataClasses: [
    "schema_migrations",
    "namespaces",
    "memory_candidates",
    "trusted_memories",
    "memory_revisions",
    "evidence_receipts",
    "memory_provenance",
    "memory_embeddings",
    "idempotency_keys",
    "audit_events"
  ],
  canonicalKnowledgeCorpusIncluded: false,
  sourceWireHostsUserMemory: false,
  runtimeMode: "synthetic_postgres_memory_store_posture"
} as const;

export type SourceWireMemoryStoreConformanceCheckV1 =
  | "read_audit"
  | "read"
  | "profile"
  | "role"
  | "query_safety"
  | "candidate"
  | "decision"
  | "revoke"
  | "compatibility"
  | "safe_error"
  | "fixture"
  | "boundary";

export type SourceWireMemoryStoreConformanceInputV1 = {
  readKind?: SourceWireReadKindV1;
  providerId?: string;
  auditAvailable?: boolean;
  releaseAfterReceipt?: boolean;
  receiptOverride?: Partial<SourceWireReadAuditReceiptV1>;
  receiptConsumed?: boolean;
  operation?: string;
  providerConfigured?: boolean;
  requestedOwnerId?: string;
  requestedNamespaceId?: string;
  profileOverride?: Record<string, unknown>;
  roleName?: SourceWirePostgresRoleNameV1;
  roleOverride?: Partial<SourceWirePostgresRolePostureV1>;
  querySafetyOverride?: Record<string, unknown>;
  provenanceKind?: "knowledge_provider" | "owner_assertion" | "prior_memory" | "none";
  directSourceToTrusted?: boolean;
  decision?: "approve" | "reject";
  actorKind?: SourceWireMemoryStoreActorKindV1;
  explicitApproval?: boolean;
  supersedesMemoryId?: string;
  expectedRevision?: number;
  currentRevision?: number;
  idempotentReplay?: boolean;
  requiredCapabilities?: SourceWireCapabilityRequestV1[];
  profileCapabilityOverride?: {
    capability: string;
    supported: boolean;
  };
  contractVersion?: string | null;
  observedSchemaVersion?: number;
  downgradeRequested?: boolean;
  forceError?: SourceWireMemoryStoreErrorCodeV1;
  retryAfterMs?: number;
};

export type SourceWireMemoryStoreConformanceCaseV1 = {
  caseId: string;
  check: SourceWireMemoryStoreConformanceCheckV1;
  input?: SourceWireMemoryStoreConformanceInputV1;
  expected: Record<string, unknown>;
};

export type SourceWireMemoryStoreConformanceFixtureMatrixV1 = {
  fixtureType: "source-wire-memory-store-v1-fixture-matrix";
  fixtureSafety: "synthetic";
  contractId: string;
  contractVersion: string;
  boundary: typeof SOURCE_WIRE_MEMORY_STORE_BOUNDARY;
  profile: SourceWireMemoryStoreProfileV1;
  rolePosture: SourceWirePostgresRolePostureV1[];
  querySafety: SourceWirePostgresQuerySafetyPostureV1;
  cases: SourceWireMemoryStoreConformanceCaseV1[];
};

export type SourceWireMemoryStoreConformanceResultV1 = SourceWireMemoryStoreResultV1 & {
  caseId: string;
  profileConformant: boolean;
  postureConformant: boolean;
  receiptBindingValid: boolean;
  safeErrorShape: boolean;
  fixtureSynthetic: boolean;
  forbiddenScopeFlagsFalse: boolean;
  trustedMemoryCreated: boolean;
  candidateState?: SourceWireMemoryCandidateStateV1;
  priorMemorySuperseded: boolean;
  revokedMemoryExcluded: boolean;
  downgradePerformed: false;
};

export function validateSourceWireReadAuditReceiptV1(
  request: SourceWireReadAuditRequestV1,
  receipt: SourceWireReadAuditReceiptV1,
  consumed: boolean
): boolean {
  return !consumed &&
    receipt.auditCommitted === true &&
    receipt.singleUse === true &&
    receipt.requestId === request.requestId &&
    receipt.traceId === request.traceId &&
    receipt.ownerId === request.ownerId &&
    receipt.namespaceId === request.namespaceId &&
    receipt.readKind === request.readKind &&
    receipt.providerId === request.providerId &&
    receipt.releaseBindingId === request.releaseBindingId &&
    receipt.resultSetDigest === request.resultSetDigest &&
    receipt.coveredResultCount === request.aggregateResultCount;
}

export function evaluateMemoryStoreConformanceCase(
  fixtureCase: SourceWireMemoryStoreConformanceCaseV1,
  profile: SourceWireMemoryStoreProfileV1 = SOURCE_WIRE_POSTGRES_MEMORY_STORE_PROFILE,
  roles: SourceWirePostgresRolePostureV1[] = SOURCE_WIRE_POSTGRES_ROLE_POSTURE,
  querySafety: SourceWirePostgresQuerySafetyPostureV1 = SOURCE_WIRE_POSTGRES_QUERY_SAFETY_POSTURE,
  fixtureSafety: "synthetic" = "synthetic",
  boundary: typeof SOURCE_WIRE_MEMORY_STORE_BOUNDARY = SOURCE_WIRE_MEMORY_STORE_BOUNDARY
): SourceWireMemoryStoreConformanceResultV1 {
  const input = fixtureCase.input ?? {};
  const traceId = `trace_${fixtureCase.caseId}`;

  if (fixtureCase.check === "fixture") {
    return memoryResult(fixtureCase, "allowed", { fixtureSynthetic: fixtureSafety === "synthetic" });
  }

  if (fixtureCase.check === "boundary") {
    return memoryResult(fixtureCase, "allowed", {
      forbiddenScopeFlagsFalse: hasClosedMemoryStoreBoundary(boundary)
    });
  }

  if (fixtureCase.check === "profile") {
    const effectiveProfile = {
      ...profile,
      ...(input.profileOverride ?? {})
    } as SourceWireMemoryStoreProfileV1;
    const profileConformant = isMemoryStoreProfileConformant(effectiveProfile);
    return profileConformant
      ? memoryResult(fixtureCase, "allowed", { profileConformant: true })
      : memoryResult(fixtureCase, "denied", {
          profileConformant: false,
          error: createSourceWireSafeErrorV1("backend_incompatible", traceId)
        });
  }

  if (fixtureCase.check === "role") {
    const role = roles.find((candidate) => candidate.roleName === input.roleName);
    if (role === undefined) {
      return memoryResult(fixtureCase, "denied", {
        error: createSourceWireSafeErrorV1("backend_incompatible", traceId)
      });
    }
    const effectiveRole = { ...role, ...(input.roleOverride ?? {}) } as SourceWirePostgresRolePostureV1;
    const postureConformant = isRolePostureConformant(effectiveRole);
    return memoryResult(fixtureCase, postureConformant ? "allowed" : "denied", {
      postureConformant
    });
  }

  if (fixtureCase.check === "query_safety") {
    const effectiveQuerySafety = {
      ...querySafety,
      ...(input.querySafetyOverride ?? {})
    } as SourceWirePostgresQuerySafetyPostureV1;
    const postureConformant = isQuerySafetyConformant(effectiveQuerySafety);
    return memoryResult(fixtureCase, postureConformant ? "allowed" : "denied", {
      postureConformant
    });
  }

  if (fixtureCase.check === "compatibility") {
    return evaluateCompatibility(fixtureCase, profile);
  }

  if (fixtureCase.check === "safe_error") {
    const code = input.forceError ?? "invalid_request";
    const status: SourceWireMemoryStoreStatusV1 = code === "temporarily_unavailable"
      ? "unavailable"
      : "denied";
    return memoryResult(fixtureCase, status, {
      safeErrorShape: true,
      error: createSourceWireSafeErrorV1(
        code,
        traceId,
        code === "temporarily_unavailable",
        input.retryAfterMs
      )
    });
  }

  if (fixtureCase.check === "read_audit") {
    return evaluateReadAudit(fixtureCase);
  }

  if (fixtureCase.check === "read") {
    return evaluateProtectedRead(fixtureCase);
  }

  if (fixtureCase.check === "candidate") {
    return evaluateCandidateMutation(fixtureCase);
  }

  if (fixtureCase.check === "decision") {
    return evaluateCandidateDecision(fixtureCase);
  }

  if (fixtureCase.check === "revoke") {
    return evaluateRevocation(fixtureCase);
  }

  return memoryResult(fixtureCase, "denied", {
    error: createSourceWireSafeErrorV1("invalid_request", traceId)
  });
}

export function evaluateMemoryStoreConformanceFixtureMatrix(
  matrix: SourceWireMemoryStoreConformanceFixtureMatrixV1
): SourceWireMemoryStoreConformanceResultV1[] {
  return matrix.cases.map((fixtureCase) =>
    evaluateMemoryStoreConformanceCase(
      fixtureCase,
      matrix.profile,
      matrix.rolePosture,
      matrix.querySafety,
      matrix.fixtureSafety,
      matrix.boundary
    )
  );
}

function evaluateCompatibility(
  fixtureCase: SourceWireMemoryStoreConformanceCaseV1,
  profile: SourceWireMemoryStoreProfileV1
): SourceWireMemoryStoreConformanceResultV1 {
  const input = fixtureCase.input ?? {};
  const traceId = `trace_${fixtureCase.caseId}`;
  const requestedVersion = Object.prototype.hasOwnProperty.call(input, "contractVersion")
    ? input.contractVersion
    : SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION;

  if (requestedVersion !== SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("unsupported_contract_version", traceId)
    });
  }

  const capabilities = profile.capabilities.map((descriptor) =>
    descriptor.capability === input.profileCapabilityOverride?.capability
      ? { ...descriptor, supported: input.profileCapabilityOverride.supported }
      : descriptor
  );
  const required = input.requiredCapabilities ?? [];
  const capabilitiesValid = required.every((requirement) => {
    const descriptor = capabilities.find((candidate) => candidate.capability === requirement.capability);
    if (descriptor === undefined && requirement.requirement === "optional") {
      return true;
    }
    return descriptor?.supported === true;
  });
  if (!capabilitiesValid) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("invalid_request", traceId)
    });
  }

  const observed: unknown = Object.prototype.hasOwnProperty.call(input, "observedSchemaVersion")
    ? input.observedSchemaVersion
    : profile.observedSchemaVersion;
  if (!Number.isInteger(observed)) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("schema_incompatible", traceId),
      downgradePerformed: false
    });
  }
  const observedVersion = observed as number;
  if (observedVersion < profile.minimumSupportedSchemaVersion) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("schema_too_old", traceId),
      downgradePerformed: false
    });
  }
  if (observedVersion > profile.maximumSupportedSchemaVersion) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("schema_too_new", traceId),
      downgradePerformed: false
    });
  }

  return memoryResult(fixtureCase, "allowed");
}

function evaluateReadAudit(
  fixtureCase: SourceWireMemoryStoreConformanceCaseV1
): SourceWireMemoryStoreConformanceResultV1 {
  const input = fixtureCase.input ?? {};
  const traceId = `trace_${fixtureCase.caseId}`;
  const readKind: unknown = input.readKind;
  if (
    !isReadKind(readKind) ||
    ((readKind === "provider_search" || readKind === "provider_fetch") &&
      (typeof input.providerId !== "string" || input.providerId.length === 0))
  ) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("invalid_request", traceId),
      protectedContentReleased: false
    });
  }
  const request = syntheticReadAuditRequest(fixtureCase.caseId, readKind, input.providerId);

  if (input.auditAvailable === false) {
    return memoryResult(fixtureCase, "unavailable", {
      gaps: [memoryGap("audit_unavailable", true)],
      error: createSourceWireSafeErrorV1("audit_unavailable", traceId, true),
      auditCommitted: false,
      protectedContentReleased: false
    });
  }

  const expectedReceipt = readAuditReceipt(request);
  const receipt = {
    ...expectedReceipt,
    ...(input.receiptOverride ?? {})
  } as SourceWireReadAuditReceiptV1;

  if (input.releaseAfterReceipt) {
    const receiptBindingValid = validateSourceWireReadAuditReceiptV1(
      request,
      receipt,
      input.receiptConsumed === true
    );
    if (!receiptBindingValid) {
      return memoryResult(fixtureCase, "denied", {
        error: createSourceWireSafeErrorV1("audit_receipt_invalid", traceId),
        receiptBindingValid: false,
        auditCommitted: true,
        protectedContentReleased: false
      });
    }
    return memoryResult(fixtureCase, "allowed", {
      readAuditReceipt: receipt,
      receiptBindingValid: true,
      auditCommitted: true,
      protectedContentReleased: true
    });
  }

  return memoryResult(fixtureCase, "allowed", {
    readAuditReceipt: receipt,
    receiptBindingValid: true,
    auditCommitted: true,
    protectedContentReleased: false
  });
}

function evaluateProtectedRead(
  fixtureCase: SourceWireMemoryStoreConformanceCaseV1
): SourceWireMemoryStoreConformanceResultV1 {
  const input = fixtureCase.input ?? {};
  const traceId = `trace_${fixtureCase.caseId}`;

  if (
    (input.requestedOwnerId !== undefined && input.requestedOwnerId !== "owner_synthetic") ||
    (input.requestedNamespaceId !== undefined && input.requestedNamespaceId !== "ns_synthetic_alpha")
  ) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("scope_violation", traceId)
    });
  }

  if (input.auditAvailable === false) {
    return memoryResult(fixtureCase, "unavailable", {
      gaps: [memoryGap("audit_unavailable", true)],
      error: createSourceWireSafeErrorV1("audit_unavailable", traceId, true)
    });
  }

  const operation = input.operation;
  if (!isProtectedReadOperation(operation)) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("invalid_request", traceId)
    });
  }
  const readKind: SourceWireReadKindV1 = operation === "get_trusted_memory"
    ? "memory_fetch"
    : operation === "list_candidates"
      ? "candidate_list"
      : "memory_search";
  const request = syntheticReadAuditRequest(fixtureCase.caseId, readKind);
  const receipt = readAuditReceipt(request);

  if (operation === "list_candidates") {
    return memoryResult(fixtureCase, "allowed", {
      candidates: [syntheticCandidate("pending", "owner_assertion")],
      readAuditReceipt: receipt,
      auditCommitted: true,
      protectedContentReleased: true,
      receiptBindingValid: true
    });
  }

  return memoryResult(fixtureCase, "allowed", {
    memories: [syntheticMemory("active")],
    readAuditReceipt: receipt,
    auditCommitted: true,
    protectedContentReleased: true,
    receiptBindingValid: true
  });
}

function evaluateCandidateMutation(
  fixtureCase: SourceWireMemoryStoreConformanceCaseV1
): SourceWireMemoryStoreConformanceResultV1 {
  const input = fixtureCase.input ?? {};
  const traceId = `trace_${fixtureCase.caseId}`;
  const provenanceKind = input.provenanceKind;

  if (provenanceKind === undefined || provenanceKind === "none") {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("provenance_required", traceId)
    });
  }
  if (!isProvenanceKind(provenanceKind)) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("invalid_request", traceId)
    });
  }

  if (input.auditAvailable === false) {
    return memoryResult(fixtureCase, "unavailable", {
      error: createSourceWireSafeErrorV1("audit_unavailable", traceId, true),
      auditCommitted: false,
      mutationApplied: false
    });
  }

  const replayed = input.idempotentReplay === true;
  return memoryResult(fixtureCase, "pending_review", {
    candidates: [syntheticCandidate("pending", provenanceKind)],
    candidateState: "pending",
    mutationApplied: !replayed,
    auditCommitted: true,
    transactionReceipt: mutationReceipt(fixtureCase.caseId, replayed, replayed ? 0 : 1)
  });
}

function evaluateCandidateDecision(
  fixtureCase: SourceWireMemoryStoreConformanceCaseV1
): SourceWireMemoryStoreConformanceResultV1 {
  const input = fixtureCase.input ?? {};
  const traceId = `trace_${fixtureCase.caseId}`;

  if (input.decision !== "approve" && input.decision !== "reject") {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("invalid_lifecycle_transition", traceId)
    });
  }

  if (input.directSourceToTrusted) {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("invalid_lifecycle_transition", traceId)
    });
  }

  if (
    input.expectedRevision !== undefined &&
    input.currentRevision !== undefined &&
    input.expectedRevision !== input.currentRevision
  ) {
    return memoryResult(fixtureCase, "conflict", {
      error: createSourceWireSafeErrorV1("conflict", traceId)
    });
  }

  if (input.decision === "approve") {
    const ownerControlled = input.actorKind === "owner" || input.actorKind === "owner_application";
    if (!ownerControlled || input.explicitApproval !== true) {
      return memoryResult(fixtureCase, "denied", {
        error: createSourceWireSafeErrorV1("explicit_approval_required", traceId)
      });
    }
  }

  if (input.auditAvailable === false) {
    return memoryResult(fixtureCase, "unavailable", {
      error: createSourceWireSafeErrorV1("audit_unavailable", traceId, true)
    });
  }

  if (input.decision === "reject") {
    return memoryResult(fixtureCase, "allowed", {
      candidates: [syntheticCandidate("rejected", "owner_assertion")],
      candidateState: "rejected",
      mutationApplied: true,
      auditCommitted: true,
      transactionReceipt: mutationReceipt(fixtureCase.caseId, false, 1)
    });
  }

  const priorMemorySuperseded = input.supersedesMemoryId !== undefined;
  return memoryResult(fixtureCase, "allowed", {
    candidates: [syntheticCandidate("approved", "owner_assertion")],
    memories: [syntheticMemory("active")],
    candidateState: "approved",
    trustedMemoryCreated: true,
    priorMemorySuperseded,
    mutationApplied: true,
    auditCommitted: true,
    transactionReceipt: mutationReceipt(fixtureCase.caseId, false, priorMemorySuperseded ? 3 : 2)
  });
}

function evaluateRevocation(
  fixtureCase: SourceWireMemoryStoreConformanceCaseV1
): SourceWireMemoryStoreConformanceResultV1 {
  const input = fixtureCase.input ?? {};
  const traceId = `trace_${fixtureCase.caseId}`;
  if (input.actorKind !== "owner" && input.actorKind !== "owner_application") {
    return memoryResult(fixtureCase, "denied", {
      error: createSourceWireSafeErrorV1("explicit_approval_required", traceId)
    });
  }
  if (input.auditAvailable === false) {
    return memoryResult(fixtureCase, "unavailable", {
      error: createSourceWireSafeErrorV1("audit_unavailable", traceId, true),
      revokedMemoryExcluded: false
    });
  }
  return memoryResult(fixtureCase, "allowed", {
    memories: [],
    mutationApplied: true,
    auditCommitted: true,
    revokedMemoryExcluded: true,
    transactionReceipt: mutationReceipt(fixtureCase.caseId, false, 1)
  });
}

function memoryResult(
  fixtureCase: SourceWireMemoryStoreConformanceCaseV1,
  status: SourceWireMemoryStoreStatusV1,
  overrides: Partial<SourceWireMemoryStoreConformanceResultV1> = {}
): SourceWireMemoryStoreConformanceResultV1 {
  const base: SourceWireMemoryStoreConformanceResultV1 = {
    caseId: fixtureCase.caseId,
    requestId: `request_${fixtureCase.caseId}`,
    traceId: `trace_${fixtureCase.caseId}`,
    status,
    memories: [],
    candidates: [],
    gaps: [],
    mutationApplied: false,
    auditCommitted: false,
    protectedContentReleased: false,
    sourceEvidencePromoted: false,
    noAutoPromotion: true,
    sourceWireHostsUserMemory: false,
    profileConformant: false,
    postureConformant: false,
    receiptBindingValid: false,
    safeErrorShape: false,
    fixtureSynthetic: false,
    forbiddenScopeFlagsFalse: false,
    trustedMemoryCreated: false,
    priorMemorySuperseded: false,
    revokedMemoryExcluded: false,
    downgradePerformed: false
  };
  return {
    ...base,
    ...overrides,
    sourceEvidencePromoted: false,
    noAutoPromotion: true,
    sourceWireHostsUserMemory: false,
    downgradePerformed: false
  };
}

function syntheticReadAuditRequest(
  caseId: string,
  readKind: SourceWireReadKindV1,
  providerId?: string
): SourceWireReadAuditRequestV1 {
  const base = {
    requestId: `request_${caseId}`,
    traceId: `trace_${caseId}`,
    policyDecisionId: `policy_${caseId}`,
    actorId: "actor_synthetic_owner_app",
    actorKind: "owner_application" as const,
    ownerId: "owner_synthetic",
    namespaceId: "ns_synthetic_alpha",
    readKind,
    releaseBindingId: `release_${caseId}`,
    resultSetDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    outcome: "allowed" as const,
    aggregateResultCount: 1,
    contentIncluded: false as const,
    rawQueryIncluded: false as const,
    restrictedLocatorIncluded: false as const,
    credentialsIncluded: false as const
  };
  return providerId === undefined ? base : { ...base, providerId };
}

function readAuditReceipt(request: SourceWireReadAuditRequestV1): SourceWireReadAuditReceiptV1 {
  const base = {
    auditEventId: `audit_${request.requestId}`,
    auditCommitted: true as const,
    requestId: request.requestId,
    traceId: request.traceId,
    ownerId: request.ownerId,
    namespaceId: request.namespaceId,
    readKind: request.readKind,
    releaseBindingId: request.releaseBindingId,
    resultSetDigest: request.resultSetDigest,
    coveredResultCount: request.aggregateResultCount,
    singleUse: true as const
  };
  return request.providerId === undefined ? base : { ...base, providerId: request.providerId };
}

function mutationReceipt(caseId: string, replayed: boolean, mutationCount: number): SourceWireMutationReceiptV1 {
  return {
    transactionId: `transaction_${caseId}`,
    committed: true,
    idempotencyKey: `idempotency_${caseId}`,
    replayed,
    memoryMutationCount: mutationCount,
    auditEventId: `audit_${caseId}`,
    auditCommitted: true
  };
}

function syntheticCandidate(
  state: SourceWireMemoryCandidateStateV1,
  provenanceKind: Exclude<SourceWireMemoryStoreConformanceInputV1["provenanceKind"], "none" | undefined>
): SourceWireMemoryCandidateV1 {
  return {
    candidateId: "candidate_synthetic_001",
    ownerId: "owner_synthetic",
    namespaceId: "ns_synthetic_alpha",
    state,
    revision: 1,
    content: "Synthetic candidate content.",
    provenance: [syntheticProvenance(provenanceKind)]
  };
}

function syntheticMemory(state: SourceWireTrustedMemoryStateV1): SourceWireTrustedMemoryV1 {
  return {
    memoryId: "memory_synthetic_001",
    ownerId: "owner_synthetic",
    namespaceId: "ns_synthetic_alpha",
    state,
    revision: 1,
    content: "Synthetic trusted memory content.",
    provenance: [syntheticProvenance("owner_assertion")]
  };
}

function syntheticProvenance(
  kind: "knowledge_provider" | "owner_assertion" | "prior_memory"
): SourceWireMemoryProvenanceV1 {
  if (kind === "knowledge_provider") {
    return {
      kind,
      providerId: "synthetic_document_index",
      sourceId: "source_synthetic_001",
      segmentId: "segment_synthetic_001",
      sourceVersion: "version_synthetic_001",
      contentDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      citationLocator: "synthetic/source/001#segment-001"
    };
  }
  if (kind === "prior_memory") {
    return {
      kind,
      memoryId: "memory_synthetic_prior",
      revision: 1
    };
  }
  return {
    kind,
    actorId: "actor_synthetic_owner",
    assertedAt: "2026-01-01T00:00:00.000Z",
    reason: "Synthetic owner assertion for conformance."
  };
}

function rolePosture(
  roleName: SourceWirePostgresRoleNameV1,
  overrides: Partial<SourceWirePostgresRolePostureV1>
): SourceWirePostgresRolePostureV1 {
  return {
    roleName,
    login: false,
    credentialPosture: "none",
    approvedUse: "schema_ownership",
    runtimeUseAllowed: false,
    migrationUseAllowed: false,
    dataReadAllowed: false,
    contentAccessAllowed: false,
    healthOnly: false,
    roleAssumptionRequiresApprovedMigration: false,
    assumableRoles: [],
    ownsSchemaObjects: false,
    ownedSchemas: [],
    ownsDatabase: false,
    superuser: false,
    createRole: false,
    createDatabase: false,
    replication: false,
    bypassRls: false,
    allowedSchemas: [],
    createSchema: false,
    readRows: false,
    insertRows: false,
    updateRows: false,
    deleteRows: false,
    truncateRows: false,
    insertAuditRows: false,
    updateAuditRows: false,
    deleteAuditRows: false,
    ...overrides
  };
}

function isMemoryStoreProfileConformant(profile: SourceWireMemoryStoreProfileV1): boolean {
  return profile.contractId === SOURCE_WIRE_MEMORY_STORE_CONTRACT_ID &&
    profile.contractVersion === SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION &&
    profile.backend === "postgresql" &&
    profile.infrastructureOwner === "adopter" &&
    profile.logicalSchemaOwner === "source_wire" &&
    profile.dedicatedSchema === true &&
    profile.defaultSchemaName === SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME &&
    profile.migrationDefinitionsOwner === "source_wire" &&
    profile.migrationExecutionOwner === "adopter" &&
    profile.arbitraryTableMappingSupported === false &&
    profile.additionalBackendsSupported === false &&
    profile.mutationAuditAtomic === true &&
    profile.sourceWireHostsUserMemory === false &&
    profile.noAutoPromotion === true &&
    profile.databaseConnectionIncluded === false &&
    profile.migrationArtifactIncluded === false &&
    profile.credentialsIncluded === false &&
    Number.isInteger(profile.observedSchemaVersion) && profile.observedSchemaVersion > 0 &&
    Number.isInteger(profile.minimumSupportedSchemaVersion) && profile.minimumSupportedSchemaVersion > 0 &&
    Number.isInteger(profile.maximumSupportedSchemaVersion) && profile.maximumSupportedSchemaVersion > 0 &&
    profile.minimumSupportedSchemaVersion <= profile.observedSchemaVersion &&
    profile.observedSchemaVersion <= profile.maximumSupportedSchemaVersion;
}

function isRolePostureConformant(role: SourceWirePostgresRolePostureV1): boolean {
  const noAdministration = !role.ownsDatabase && !role.superuser && !role.createRole &&
    !role.createDatabase && !role.replication && !role.bypassRls && !role.createSchema &&
    !role.truncateRows && !role.updateAuditRows && !role.deleteAuditRows;
  if (!noAdministration) {
    return false;
  }

  if (role.roleName === "source_wire_schema_owner") {
    return role.login === false && role.credentialPosture === "none" &&
      role.approvedUse === "schema_ownership" && !role.runtimeUseAllowed &&
      !role.migrationUseAllowed && !role.dataReadAllowed && !role.contentAccessAllowed &&
      !role.healthOnly && !role.roleAssumptionRequiresApprovedMigration &&
      role.assumableRoles.length === 0 && role.ownsSchemaObjects &&
      sameStrings(role.ownedSchemas, [SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME]) &&
      role.allowedSchemas.length === 0 && noRowAuthority(role);
  }

  if (role.roleName === "source_wire_migrator") {
    return role.login && role.credentialPosture === "temporary" &&
      role.approvedUse === "approved_migration_only" && !role.runtimeUseAllowed &&
      role.migrationUseAllowed && !role.dataReadAllowed && !role.contentAccessAllowed &&
      !role.healthOnly && role.roleAssumptionRequiresApprovedMigration &&
      sameStrings(role.assumableRoles, ["source_wire_schema_owner"]) &&
      !role.ownsSchemaObjects && role.ownedSchemas.length === 0 &&
      sameStrings(role.allowedSchemas, [SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME]) && noRowAuthority(role);
  }

  if (role.roleName === "source_wire_runtime") {
    return role.login && role.credentialPosture === "persistent" &&
      role.approvedUse === "runtime_only" && role.runtimeUseAllowed && !role.migrationUseAllowed &&
      role.dataReadAllowed && role.contentAccessAllowed && !role.healthOnly &&
      !role.roleAssumptionRequiresApprovedMigration && role.assumableRoles.length === 0 &&
      !role.ownsSchemaObjects && role.ownedSchemas.length === 0 &&
      sameStrings(role.allowedSchemas, [SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME]) &&
      role.readRows && role.insertRows && role.updateRows && role.deleteRows && role.insertAuditRows;
  }

  if (role.roleName === "source_wire_kb_reader") {
    return role.login && role.credentialPosture === "persistent" &&
      role.approvedUse === "knowledge_read_only" && !role.runtimeUseAllowed &&
      !role.migrationUseAllowed && role.dataReadAllowed && role.contentAccessAllowed &&
      !role.healthOnly && !role.roleAssumptionRequiresApprovedMigration &&
      role.assumableRoles.length === 0 && !role.ownsSchemaObjects && role.ownedSchemas.length === 0 &&
      sameStrings(role.allowedSchemas, ["synthetic_knowledge_views"]) && role.readRows &&
      !role.insertRows && !role.updateRows && !role.deleteRows && !role.insertAuditRows;
  }

  return role.login && role.credentialPosture === "persistent" &&
    role.approvedUse === "health_only" && !role.runtimeUseAllowed && !role.migrationUseAllowed &&
    !role.dataReadAllowed && !role.contentAccessAllowed && role.healthOnly &&
    !role.roleAssumptionRequiresApprovedMigration && role.assumableRoles.length === 0 &&
    !role.ownsSchemaObjects && role.ownedSchemas.length === 0 && role.allowedSchemas.length === 0 &&
    noRowAuthority(role);
}

function isQuerySafetyConformant(posture: SourceWirePostgresQuerySafetyPostureV1): boolean {
  return posture.fixedSearchPath === true &&
    sameStrings(posture.safeSearchPath, [SOURCE_WIRE_MEMORY_STORE_SCHEMA_NAME, "pg_catalog"]) &&
    posture.publicSchemaCreateRevoked === true &&
    posture.unsafeFunctionExecutionRevoked === true &&
    posture.objectsFullyQualified === true &&
    posture.parameterizedQueriesRequired === true &&
    posture.modelGeneratedSqlAllowed === false;
}

function isReadKind(value: unknown): value is SourceWireReadKindV1 {
  return value === "provider_search" ||
    value === "provider_fetch" ||
    value === "memory_search" ||
    value === "memory_fetch" ||
    value === "candidate_list";
}

function isProtectedReadOperation(
  value: unknown
): value is "search_trusted_memory" | "get_trusted_memory" | "list_candidates" {
  return value === "search_trusted_memory" ||
    value === "get_trusted_memory" ||
    value === "list_candidates";
}

function isProvenanceKind(
  value: unknown
): value is "knowledge_provider" | "owner_assertion" | "prior_memory" {
  return value === "knowledge_provider" ||
    value === "owner_assertion" ||
    value === "prior_memory";
}

function noRowAuthority(role: SourceWirePostgresRolePostureV1): boolean {
  return !role.readRows && !role.insertRows && !role.updateRows && !role.deleteRows &&
    !role.insertAuditRows && !role.updateAuditRows && !role.deleteAuditRows;
}

function sameStrings(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function memoryGap(code: SourceWireMemoryStoreGapV1["code"], retryable: boolean): SourceWireMemoryStoreGapV1 {
  return {
    code,
    message: "Protected content is not available.",
    retryable
  };
}

function hasClosedMemoryStoreBoundary(boundary: typeof SOURCE_WIRE_MEMORY_STORE_BOUNDARY): boolean {
  return Object.entries(boundary).every(([key, value]) =>
    key === "noAutoPromotion" ? value === true : value === false
  );
}

export { SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS };
