export type SourceWireHostedRuntimeFixtureCallerKind = "owner" | "owner_agent" | "external_agent" | "unknown";

export type SourceWireHostedRuntimeFixtureAction =
  | "read_trusted_memory"
  | "search_source_evidence"
  | "prepare_candidate"
  | "maintain_source"
  | "route_mcp_via_api_policy"
  | "approve_trusted_memory"
  | "read_stale_or_deleted_evidence";

export type SourceWireHostedRuntimeFixtureDataClass =
  | "caller_identity"
  | "namespace"
  | "source_evidence"
  | "memory_candidate"
  | "trusted_memory"
  | "denied_result"
  | "audit_event";

export type SourceWireHostedRuntimeFixtureStatus = "allowed" | "denied" | "partial_success" | "owner_review_required";

export type SourceWireHostedRuntimeFixtureCaller = {
  callerId: string;
  kind: SourceWireHostedRuntimeFixtureCallerKind;
  ownerId: string;
  namespaceId: string;
  capabilities: string[];
};

export type SourceWireHostedRuntimeFixtureAudit = {
  auditId: string;
  actorId: string;
  action: SourceWireHostedRuntimeFixtureAction;
  namespaceId: string;
  decision: SourceWireHostedRuntimeFixtureStatus;
  reason: string;
};

export type SourceWireHostedRuntimeFixtureCase = {
  caseId: string;
  action: SourceWireHostedRuntimeFixtureAction;
  dataClass: SourceWireHostedRuntimeFixtureDataClass;
  caller: SourceWireHostedRuntimeFixtureCaller;
  targetOwnerId: string;
  targetNamespaceId: string;
  sourceEvidenceIds: string[];
  candidateId?: string;
  trustedMemoryId?: string;
  requestedViaMcp: boolean;
  apiPolicyEnvelopePresent: boolean;
  explicitOwnerOrApplicationApproval: boolean;
  sourceEvidenceDeletedOrStale: boolean;
  expected: Partial<
    Pick<
      SourceWireHostedRuntimeFixtureResult,
      | "status"
      | "denialReason"
      | "namespaceIsolated"
      | "sourceEvidenceReturned"
      | "candidatePrepared"
      | "trustedMemoryReturned"
      | "trustedMemoryApproved"
      | "auditMetadataPresent"
      | "gapReturned"
      | "mcpRoutedThroughApiPolicy"
      | "mcpBypassedApiPolicy"
      | "trustedMemoryAutoPromoted"
      | "restrictedContentLeaked"
    >
  >;
};

export type SourceWireHostedRuntimeFixtureResult = {
  caseId: string;
  action: SourceWireHostedRuntimeFixtureAction;
  dataClass: SourceWireHostedRuntimeFixtureDataClass;
  status: SourceWireHostedRuntimeFixtureStatus;
  denialReason?: string;
  callerId: string;
  callerKind: SourceWireHostedRuntimeFixtureCallerKind;
  targetOwnerId: string;
  targetNamespaceId: string;
  namespaceIsolated: boolean;
  sourceEvidenceReturned: boolean;
  candidatePrepared: boolean;
  trustedMemoryReturned: boolean;
  trustedMemoryApproved: boolean;
  auditMetadataPresent: boolean;
  gapReturned: boolean;
  citationsPreserved: boolean;
  mcpRoutedThroughApiPolicy: boolean;
  mcpBypassedApiPolicy: false;
  trustedMemoryAutoPromoted: false;
  restrictedContentLeaked: false;
  databaseMigrationCreated: false;
  realDatabaseConnectionOpened: false;
  postgresOrPgvectorSetupCreated: false;
  apiServerStarted: false;
  mcpServerRuntimeStarted: false;
  sourceWireHostsUserMemory: false;
  runtimeMode: "synthetic_hosted_runtime_fixture_package";
  audit: SourceWireHostedRuntimeFixtureAudit;
  boundary: typeof SOURCE_WIRE_HOSTED_RUNTIME_FIXTURE_BOUNDARY;
};

export type SourceWireHostedRuntimeFixtureMatrix = {
  fixtureType: "source-wire-hosted-runtime-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: typeof SOURCE_WIRE_HOSTED_RUNTIME_FIXTURE_BOUNDARY;
  cases: SourceWireHostedRuntimeFixtureCase[];
};

export const SOURCE_WIRE_HOSTED_RUNTIME_FIXTURE_BOUNDARY = {
  implementationMode: "synthetic_hosted_runtime_fixture_package",
  sourceWireHostsUserMemory: false,
  databaseMigrationsIncluded: false,
  realDatabaseConnectionsIncluded: false,
  postgresOrPgvectorSetupIncluded: false,
  apiServerIncluded: false,
  mcpServerRuntimeIncluded: false,
  liveConnectorsIncluded: false,
  missionControlIncluded: false,
  deploymentIncluded: false,
  hostedServicesIncluded: false,
  managedHostingIncluded: false,
  npmPublishingIncluded: false,
  githubReleaseIncluded: false,
  packageVersionChangesIncluded: false,
  publicContributionAcceptanceIncluded: false,
  realDataIncluded: false,
  clientDataIncluded: false,
  privateImplementationCodeIncluded: false,
  agplCodeIncluded: false,
  privateProofContentIncluded: false,
  mcpMayBypassApiPolicy: false,
  sourceEvidenceMayAutoPromoteToTrustedMemory: false,
  trustedMemoryPromotion: "owner_or_application_controlled"
} as const;

export function evaluateHostedRuntimeFixtureCase(
  fixtureCase: SourceWireHostedRuntimeFixtureCase
): SourceWireHostedRuntimeFixtureResult {
  const hasTargetAccess =
    fixtureCase.caller.ownerId === fixtureCase.targetOwnerId &&
    fixtureCase.caller.namespaceId === fixtureCase.targetNamespaceId;

  if (fixtureCase.requestedViaMcp && !fixtureCase.apiPolicyEnvelopePresent) {
    return result(fixtureCase, "denied", {
      denialReason: "mcp_must_route_through_api_policy",
      namespaceIsolated: hasTargetAccess,
      mcpRoutedThroughApiPolicy: false
    });
  }

  if (!hasTargetAccess) {
    return result(fixtureCase, "denied", {
      denialReason: "caller_owner_or_namespace_not_allowed",
      namespaceIsolated: true,
      mcpRoutedThroughApiPolicy: fixtureCase.requestedViaMcp && fixtureCase.apiPolicyEnvelopePresent
    });
  }

  if (fixtureCase.sourceEvidenceDeletedOrStale) {
    return result(fixtureCase, "partial_success", {
      denialReason: "source_evidence_deleted_or_stale",
      gapReturned: true,
      citationsPreserved: true,
      mcpRoutedThroughApiPolicy: fixtureCase.requestedViaMcp && fixtureCase.apiPolicyEnvelopePresent
    });
  }

  if (fixtureCase.action === "search_source_evidence") {
    return result(fixtureCase, "allowed", {
      sourceEvidenceReturned: true,
      citationsPreserved: fixtureCase.sourceEvidenceIds.length > 0,
      mcpRoutedThroughApiPolicy: fixtureCase.requestedViaMcp && fixtureCase.apiPolicyEnvelopePresent
    });
  }

  if (fixtureCase.action === "prepare_candidate") {
    return result(fixtureCase, "owner_review_required", {
      candidatePrepared: true,
      sourceEvidenceReturned: fixtureCase.sourceEvidenceIds.length > 0,
      citationsPreserved: fixtureCase.sourceEvidenceIds.length > 0
    });
  }

  if (fixtureCase.action === "read_trusted_memory") {
    return result(fixtureCase, "allowed", {
      trustedMemoryReturned: Boolean(fixtureCase.trustedMemoryId)
    });
  }

  if (fixtureCase.action === "maintain_source") {
    return result(fixtureCase, "allowed", {
      sourceEvidenceReturned: true,
      citationsPreserved: fixtureCase.sourceEvidenceIds.length > 0
    });
  }

  if (fixtureCase.action === "route_mcp_via_api_policy") {
    return result(fixtureCase, "allowed", {
      mcpRoutedThroughApiPolicy: fixtureCase.requestedViaMcp && fixtureCase.apiPolicyEnvelopePresent
    });
  }

  if (fixtureCase.action === "approve_trusted_memory") {
    if (!fixtureCase.explicitOwnerOrApplicationApproval) {
      return result(fixtureCase, "owner_review_required", {
        denialReason: "trusted_memory_approval_requires_owner_or_application_control"
      });
    }

    return result(fixtureCase, "allowed", {
      trustedMemoryApproved: true
    });
  }

  return result(fixtureCase, "denied", {
    denialReason: "unsupported_synthetic_hosted_runtime_fixture_case"
  });
}

export function evaluateHostedRuntimeFixtureMatrix(
  matrix: SourceWireHostedRuntimeFixtureMatrix
): SourceWireHostedRuntimeFixtureResult[] {
  return matrix.cases.map((fixtureCase) => evaluateHostedRuntimeFixtureCase(fixtureCase));
}

function result(
  fixtureCase: SourceWireHostedRuntimeFixtureCase,
  status: SourceWireHostedRuntimeFixtureStatus,
  overrides: Partial<SourceWireHostedRuntimeFixtureResult> = {}
): SourceWireHostedRuntimeFixtureResult {
  const base: SourceWireHostedRuntimeFixtureResult = {
    caseId: fixtureCase.caseId,
    action: fixtureCase.action,
    dataClass: fixtureCase.dataClass,
    status,
    callerId: fixtureCase.caller.callerId,
    callerKind: fixtureCase.caller.kind,
    targetOwnerId: fixtureCase.targetOwnerId,
    targetNamespaceId: fixtureCase.targetNamespaceId,
    namespaceIsolated: fixtureCase.caller.ownerId === fixtureCase.targetOwnerId &&
      fixtureCase.caller.namespaceId === fixtureCase.targetNamespaceId,
    sourceEvidenceReturned: false,
    candidatePrepared: false,
    trustedMemoryReturned: false,
    trustedMemoryApproved: false,
    auditMetadataPresent: true,
    gapReturned: false,
    citationsPreserved: false,
    mcpRoutedThroughApiPolicy: false,
    mcpBypassedApiPolicy: false,
    trustedMemoryAutoPromoted: false,
    restrictedContentLeaked: false,
    databaseMigrationCreated: false,
    realDatabaseConnectionOpened: false,
    postgresOrPgvectorSetupCreated: false,
    apiServerStarted: false,
    mcpServerRuntimeStarted: false,
    sourceWireHostsUserMemory: false,
    runtimeMode: "synthetic_hosted_runtime_fixture_package",
    audit: {
      auditId: `audit_${fixtureCase.caseId}`,
      actorId: fixtureCase.caller.callerId,
      action: fixtureCase.action,
      namespaceId: fixtureCase.targetNamespaceId,
      decision: status,
      reason: overrides.denialReason ?? "synthetic_fixture_decision"
    },
    boundary: SOURCE_WIRE_HOSTED_RUNTIME_FIXTURE_BOUNDARY
  };

  return {
    ...base,
    ...overrides,
    auditMetadataPresent: true,
    mcpBypassedApiPolicy: false,
    trustedMemoryAutoPromoted: false,
    restrictedContentLeaked: false,
    databaseMigrationCreated: false,
    realDatabaseConnectionOpened: false,
    postgresOrPgvectorSetupCreated: false,
    apiServerStarted: false,
    mcpServerRuntimeStarted: false,
    sourceWireHostsUserMemory: false
  };
}
