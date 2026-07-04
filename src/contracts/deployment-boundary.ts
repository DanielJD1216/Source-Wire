export type SourceWireDeploymentBoundaryArea =
  | "local_development"
  | "owner_hosted_runtime"
  | "managed_hosted_deferral"
  | "stop_condition"
  | "rollback_evidence"
  | "claim_boundary"
  | "no_hosted_service_proof";

export type SourceWireDeploymentBoundaryCheck =
  | "verify_local_development"
  | "verify_owner_hosted_runtime"
  | "defer_managed_hosting"
  | "evaluate_stop_condition"
  | "verify_rollback_evidence"
  | "validate_claim_boundary"
  | "prove_no_hosted_service";

export type SourceWireDeploymentBoundaryStatus = "allowed" | "blocked" | "deferred" | "owner_review_required";

export type SourceWireDeploymentBoundaryCase = {
  caseId: string;
  area: SourceWireDeploymentBoundaryArea;
  check: SourceWireDeploymentBoundaryCheck;
  requestedViaMcp: boolean;
  apiPolicyEnvelopePresent: boolean;
  ownerInfrastructureSelected: boolean;
  managedHostedRequested: boolean;
  stopConditionTriggered: boolean;
  rollbackEvidencePresent: boolean;
  claimBoundaryPreserved: boolean;
  hostedServiceCreated: boolean;
  deploymentConfigCreated: boolean;
  trustedMemoryPromotionOwnerControlled: boolean;
  expected: Partial<
    Pick<
      SourceWireDeploymentBoundaryResult,
      | "status"
      | "reason"
      | "localDevelopmentReady"
      | "ownerHostedRuntimeAllowed"
      | "managedHostedDeferred"
      | "stopConditionBlocked"
      | "rollbackEvidenceVerified"
      | "claimBoundaryPreserved"
      | "noHostedServiceProved"
      | "mcpRoutedThroughApiPolicy"
      | "mcpBypassedApiPolicy"
      | "sourceWireHostsUserMemory"
      | "trustedMemoryAutoPromoted"
    >
  >;
};

export type SourceWireDeploymentBoundaryResult = {
  caseId: string;
  area: SourceWireDeploymentBoundaryArea;
  check: SourceWireDeploymentBoundaryCheck;
  status: SourceWireDeploymentBoundaryStatus;
  reason: string;
  localDevelopmentReady: boolean;
  ownerHostedRuntimeAllowed: boolean;
  managedHostedDeferred: boolean;
  stopConditionBlocked: boolean;
  rollbackEvidenceVerified: boolean;
  claimBoundaryPreserved: boolean;
  noHostedServiceProved: boolean;
  auditMetadataPresent: boolean;
  mcpRoutedThroughApiPolicy: boolean;
  mcpBypassedApiPolicy: false;
  sourceWireHostsUserMemory: false;
  deploymentConfigCreated: false;
  cloudProviderConfigCreated: false;
  dockerOrContainerRuntimeConfigCreated: false;
  hostedServiceCreated: false;
  managedHostingCreated: false;
  databaseMigrationCreated: false;
  realDatabaseConnectionOpened: false;
  postgresOrPgvectorSetupCreated: false;
  apiServerStarted: false;
  mcpServerRuntimeStarted: false;
  liveConnectorStarted: false;
  missionControlStarted: false;
  npmPublished: false;
  githubReleaseCreated: false;
  packageVersionChanged: false;
  publicContributionAccepted: false;
  realDataIncluded: false;
  clientDataIncluded: false;
  privateImplementationCodeIncluded: false;
  agplCodeIncluded: false;
  trustedMemoryAutoPromoted: false;
  trustedMemoryPromotion: "owner_or_application_controlled";
  runtimeMode: "synthetic_deployment_boundary_package";
  audit: {
    auditId: string;
    caseId: string;
    decision: SourceWireDeploymentBoundaryStatus;
    reason: string;
  };
  boundary: typeof SOURCE_WIRE_DEPLOYMENT_BOUNDARY;
};

export type SourceWireDeploymentBoundaryFixtureMatrix = {
  fixtureType: "source-wire-deployment-boundary-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: typeof SOURCE_WIRE_DEPLOYMENT_BOUNDARY;
  cases: SourceWireDeploymentBoundaryCase[];
};

export const SOURCE_WIRE_DEPLOYMENT_BOUNDARY = {
  implementationMode: "synthetic_deployment_boundary_package",
  sourceWireHostsUserMemory: false,
  deploymentConfigIncluded: false,
  cloudProviderConfigIncluded: false,
  dockerOrContainerRuntimeConfigIncluded: false,
  hostedServicesIncluded: false,
  managedHostingIncluded: false,
  databaseMigrationsIncluded: false,
  realDatabaseConnectionsIncluded: false,
  postgresOrPgvectorSetupIncluded: false,
  apiServerIncluded: false,
  mcpServerRuntimeIncluded: false,
  liveConnectorsIncluded: false,
  missionControlIncluded: false,
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

export function evaluateDeploymentBoundaryCase(
  fixtureCase: SourceWireDeploymentBoundaryCase
): SourceWireDeploymentBoundaryResult {
  if (fixtureCase.requestedViaMcp && !fixtureCase.apiPolicyEnvelopePresent) {
    return result(fixtureCase, "blocked", {
      reason: "mcp_must_route_through_api_policy",
      mcpRoutedThroughApiPolicy: false
    });
  }

  if (!fixtureCase.trustedMemoryPromotionOwnerControlled) {
    return result(fixtureCase, "blocked", {
      reason: "trusted_memory_promotion_must_remain_owner_or_application_controlled"
    });
  }

  if (fixtureCase.deploymentConfigCreated || fixtureCase.hostedServiceCreated) {
    return result(fixtureCase, "blocked", {
      reason: "deployment_config_or_hosted_service_is_out_of_scope"
    });
  }

  if (fixtureCase.stopConditionTriggered) {
    return result(fixtureCase, "blocked", {
      reason: "stop_condition_triggered",
      stopConditionBlocked: true
    });
  }

  if (!fixtureCase.claimBoundaryPreserved) {
    return result(fixtureCase, "blocked", {
      reason: "unsafe_hosting_or_runtime_claim"
    });
  }

  if (fixtureCase.managedHostedRequested) {
    return result(fixtureCase, "deferred", {
      reason: "managed_hosting_deferred",
      managedHostedDeferred: true
    });
  }

  if (fixtureCase.check === "verify_local_development") {
    return result(fixtureCase, "allowed", {
      reason: "local_development_ready",
      localDevelopmentReady: true
    });
  }

  if (fixtureCase.check === "verify_owner_hosted_runtime") {
    return result(fixtureCase, "owner_review_required", {
      reason: fixtureCase.ownerInfrastructureSelected
        ? "owner_hosted_runtime_requires_owner_review"
        : "owner_must_select_infrastructure",
      ownerHostedRuntimeAllowed: fixtureCase.ownerInfrastructureSelected
    });
  }

  if (fixtureCase.check === "verify_rollback_evidence") {
    return result(fixtureCase, fixtureCase.rollbackEvidencePresent ? "allowed" : "owner_review_required", {
      reason: fixtureCase.rollbackEvidencePresent
        ? "rollback_evidence_present"
        : "rollback_evidence_missing_requires_owner_review",
      rollbackEvidenceVerified: fixtureCase.rollbackEvidencePresent
    });
  }

  if (fixtureCase.check === "validate_claim_boundary") {
    return result(fixtureCase, "allowed", {
      reason: "claim_boundary_preserved",
      claimBoundaryPreserved: true
    });
  }

  if (fixtureCase.check === "prove_no_hosted_service") {
    return result(fixtureCase, "allowed", {
      reason: "no_hosted_service_created",
      noHostedServiceProved: true
    });
  }

  if (fixtureCase.check === "defer_managed_hosting") {
    return result(fixtureCase, "deferred", {
      reason: "managed_hosting_deferred",
      managedHostedDeferred: true
    });
  }

  return result(fixtureCase, "blocked", {
    reason: "unsupported_synthetic_deployment_boundary_case"
  });
}

export function evaluateDeploymentBoundaryFixtureMatrix(
  matrix: SourceWireDeploymentBoundaryFixtureMatrix
): SourceWireDeploymentBoundaryResult[] {
  return matrix.cases.map((fixtureCase) => evaluateDeploymentBoundaryCase(fixtureCase));
}

function result(
  fixtureCase: SourceWireDeploymentBoundaryCase,
  status: SourceWireDeploymentBoundaryStatus,
  overrides: Partial<SourceWireDeploymentBoundaryResult> = {}
): SourceWireDeploymentBoundaryResult {
  const base: SourceWireDeploymentBoundaryResult = {
    caseId: fixtureCase.caseId,
    area: fixtureCase.area,
    check: fixtureCase.check,
    status,
    reason: "synthetic_deployment_boundary_decision",
    localDevelopmentReady: false,
    ownerHostedRuntimeAllowed: false,
    managedHostedDeferred: false,
    stopConditionBlocked: false,
    rollbackEvidenceVerified: false,
    claimBoundaryPreserved: fixtureCase.claimBoundaryPreserved,
    noHostedServiceProved: false,
    auditMetadataPresent: true,
    mcpRoutedThroughApiPolicy: fixtureCase.requestedViaMcp && fixtureCase.apiPolicyEnvelopePresent,
    mcpBypassedApiPolicy: false,
    sourceWireHostsUserMemory: false,
    deploymentConfigCreated: false,
    cloudProviderConfigCreated: false,
    dockerOrContainerRuntimeConfigCreated: false,
    hostedServiceCreated: false,
    managedHostingCreated: false,
    databaseMigrationCreated: false,
    realDatabaseConnectionOpened: false,
    postgresOrPgvectorSetupCreated: false,
    apiServerStarted: false,
    mcpServerRuntimeStarted: false,
    liveConnectorStarted: false,
    missionControlStarted: false,
    npmPublished: false,
    githubReleaseCreated: false,
    packageVersionChanged: false,
    publicContributionAccepted: false,
    realDataIncluded: false,
    clientDataIncluded: false,
    privateImplementationCodeIncluded: false,
    agplCodeIncluded: false,
    trustedMemoryAutoPromoted: false,
    trustedMemoryPromotion: "owner_or_application_controlled",
    runtimeMode: "synthetic_deployment_boundary_package",
    audit: {
      auditId: `audit_${fixtureCase.caseId}`,
      caseId: fixtureCase.caseId,
      decision: status,
      reason: overrides.reason ?? "synthetic_deployment_boundary_decision"
    },
    boundary: SOURCE_WIRE_DEPLOYMENT_BOUNDARY
  };

  const merged: SourceWireDeploymentBoundaryResult = {
    ...base,
    ...overrides,
    auditMetadataPresent: true,
    mcpBypassedApiPolicy: false as false,
    sourceWireHostsUserMemory: false as false,
    deploymentConfigCreated: false as false,
    cloudProviderConfigCreated: false as false,
    dockerOrContainerRuntimeConfigCreated: false as false,
    hostedServiceCreated: false as false,
    managedHostingCreated: false as false,
    databaseMigrationCreated: false as false,
    realDatabaseConnectionOpened: false as false,
    postgresOrPgvectorSetupCreated: false as false,
    apiServerStarted: false as false,
    mcpServerRuntimeStarted: false as false,
    liveConnectorStarted: false as false,
    missionControlStarted: false as false,
    npmPublished: false as false,
    githubReleaseCreated: false as false,
    packageVersionChanged: false as false,
    publicContributionAccepted: false as false,
    realDataIncluded: false as false,
    clientDataIncluded: false as false,
    privateImplementationCodeIncluded: false as false,
    agplCodeIncluded: false as false,
    trustedMemoryAutoPromoted: false as false,
    trustedMemoryPromotion: "owner_or_application_controlled" as const,
    runtimeMode: "synthetic_deployment_boundary_package" as const,
    boundary: SOURCE_WIRE_DEPLOYMENT_BOUNDARY
  };

  return {
    ...merged,
    audit: {
      auditId: `audit_${fixtureCase.caseId}`,
      caseId: fixtureCase.caseId,
      decision: merged.status,
      reason: merged.reason
    }
  };
}
