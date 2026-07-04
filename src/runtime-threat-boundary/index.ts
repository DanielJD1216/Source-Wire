export type SourceWireRuntimeThreatActorKind =
  | "unknown_external_caller"
  | "mcp_tool"
  | "owner_hosted_api_client"
  | "owner_controlled_application";

export type SourceWireRuntimeThreatKind =
  | "unauthorized_caller"
  | "cross_namespace_access"
  | "source_to_memory_confusion"
  | "prompt_injection"
  | "secret_exposure"
  | "audit_gap"
  | "backup_restore_namespace_drift"
  | "deployment_misconfiguration"
  | "mcp_policy_bypass"
  | "trusted_memory_approval";

export type SourceWireRuntimeThreatControl =
  | "caller_authentication"
  | "namespace_isolation"
  | "source_trusted_memory_separation"
  | "instruction_boundary"
  | "secret_redaction"
  | "audit_required"
  | "restore_revalidation"
  | "deployment_stop_condition"
  | "mcp_api_policy_routing"
  | "owner_application_approval";

export type SourceWireRuntimeThreatDecision = "allow" | "deny" | "flag_for_owner_review";

export type SourceWireRuntimeThreatBoundaryCase = {
  caseId: string;
  threatKind: SourceWireRuntimeThreatKind;
  actorKind: SourceWireRuntimeThreatActorKind;
  namespaceId: string;
  requestedNamespaceId: string;
  hasValidAuth: boolean;
  hasRequiredCapability: boolean;
  sourceEvidenceOnly: boolean;
  containsPromptInjection: boolean;
  containsSecretLikeValue: boolean;
  auditMetadataPresent: boolean;
  backupRestoreContext: "none" | "same_namespace" | "cross_namespace";
  deploymentExposure: "local_only" | "public_without_policy";
  viaMcp: boolean;
  mcpRoutesThroughApiPolicy: boolean;
  explicitTrustedMemoryApproval: boolean;
  expected: Partial<
    Pick<
      SourceWireRuntimeThreatBoundaryResult,
      | "decision"
      | "control"
      | "denialReason"
      | "ownerReviewRequired"
      | "sourceEvidencePromoted"
      | "trustedMemoryCreated"
      | "secretReturned"
      | "auditAccepted"
      | "mcpBypassedApiPolicy"
    >
  >;
};

export type SourceWireRuntimeThreatBoundaryResult = {
  caseId: string;
  threatKind: SourceWireRuntimeThreatKind;
  decision: SourceWireRuntimeThreatDecision;
  control: SourceWireRuntimeThreatControl;
  denialReason?: string;
  ownerReviewRequired: boolean;
  sourceEvidencePromoted: boolean;
  trustedMemoryCreated: boolean;
  secretReturned: boolean;
  auditAccepted: boolean;
  mcpBypassedApiPolicy: boolean;
  sourceWireHostsUserMemory: false;
  runtimeMode: "synthetic_trust_boundary_package";
  boundary: typeof SOURCE_WIRE_RUNTIME_THREAT_BOUNDARY;
};

export type SourceWireRuntimeThreatBoundaryFixtureMatrix = {
  fixtureType: "source-wire-runtime-threat-boundary-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: typeof SOURCE_WIRE_RUNTIME_THREAT_BOUNDARY;
  cases: SourceWireRuntimeThreatBoundaryCase[];
};

export const SOURCE_WIRE_RUNTIME_THREAT_BOUNDARY = {
  implementationMode: "synthetic_trust_boundary_package",
  sourceWireHostsUserMemory: false,
  apiServerIncluded: false,
  mcpServerRuntimeIncluded: false,
  databaseIncluded: false,
  databaseMigrationsIncluded: false,
  realDatabaseConnectionsIncluded: false,
  postgresOrPgvectorSetupIncluded: false,
  liveConnectorsIncluded: false,
  missionControlIncluded: false,
  deploymentIncluded: false,
  hostedServicesIncluded: false,
  managedHostingIncluded: false,
  realDataIncluded: false,
  clientDataIncluded: false,
  privateImplementationCodeIncluded: false,
  agplCodeIncluded: false,
  mcpMayBypassApiPolicy: false,
  sourceEvidenceMayAutoPromoteToTrustedMemory: false,
  trustedMemoryPromotion: "owner_or_application_controlled"
} as const;

export function evaluateRuntimeThreatBoundaryCase(
  threatCase: SourceWireRuntimeThreatBoundaryCase
): SourceWireRuntimeThreatBoundaryResult {
  if (!threatCase.hasValidAuth) {
    return deny(threatCase, "caller_authentication", "invalid_or_missing_authentication");
  }

  if (threatCase.namespaceId !== threatCase.requestedNamespaceId) {
    return deny(threatCase, "namespace_isolation", "requested_namespace_not_allowed");
  }

  if (!threatCase.hasRequiredCapability) {
    return deny(threatCase, "caller_authentication", "missing_required_capability");
  }

  if (threatCase.viaMcp && !threatCase.mcpRoutesThroughApiPolicy) {
    return deny(threatCase, "mcp_api_policy_routing", "mcp_policy_bypass_blocked", {
      mcpBypassedApiPolicy: true
    });
  }

  if (threatCase.containsPromptInjection) {
    return deny(threatCase, "instruction_boundary", "prompt_injection_cannot_override_policy", {
      ownerReviewRequired: true
    });
  }

  if (threatCase.containsSecretLikeValue) {
    return deny(threatCase, "secret_redaction", "secret_like_value_redacted");
  }

  if (!threatCase.auditMetadataPresent) {
    return deny(threatCase, "audit_required", "audit_metadata_required", {
      auditAccepted: false
    });
  }

  if (threatCase.backupRestoreContext === "cross_namespace") {
    return deny(threatCase, "restore_revalidation", "backup_restore_requires_namespace_revalidation");
  }

  if (threatCase.deploymentExposure === "public_without_policy") {
    return deny(threatCase, "deployment_stop_condition", "public_exposure_without_policy_blocked");
  }

  if (threatCase.sourceEvidenceOnly) {
    return {
      ...baseResult(threatCase, "flag_for_owner_review", "source_trusted_memory_separation"),
      ownerReviewRequired: true
    };
  }

  if (threatCase.threatKind === "trusted_memory_approval") {
    if (
      threatCase.actorKind !== "owner_controlled_application" ||
      !threatCase.explicitTrustedMemoryApproval
    ) {
      return deny(threatCase, "owner_application_approval", "trusted_memory_approval_requires_owner_or_application");
    }

    return {
      ...baseResult(threatCase, "allow", "owner_application_approval"),
      trustedMemoryCreated: true,
      auditAccepted: true
    };
  }

  return baseResult(threatCase, "allow", controlForThreatKind(threatCase.threatKind));
}

export function evaluateRuntimeThreatBoundaryFixtureMatrix(
  matrix: SourceWireRuntimeThreatBoundaryFixtureMatrix
): SourceWireRuntimeThreatBoundaryResult[] {
  return matrix.cases.map((threatCase) => evaluateRuntimeThreatBoundaryCase(threatCase));
}

function deny(
  threatCase: SourceWireRuntimeThreatBoundaryCase,
  control: SourceWireRuntimeThreatControl,
  denialReason: string,
  overrides: Partial<SourceWireRuntimeThreatBoundaryResult> = {}
): SourceWireRuntimeThreatBoundaryResult {
  return {
    ...baseResult(threatCase, "deny", control),
    denialReason,
    ...overrides
  };
}

function baseResult(
  threatCase: SourceWireRuntimeThreatBoundaryCase,
  decision: SourceWireRuntimeThreatDecision,
  control: SourceWireRuntimeThreatControl
): SourceWireRuntimeThreatBoundaryResult {
  return {
    caseId: threatCase.caseId,
    threatKind: threatCase.threatKind,
    decision,
    control,
    ownerReviewRequired: false,
    sourceEvidencePromoted: false,
    trustedMemoryCreated: false,
    secretReturned: false,
    auditAccepted: threatCase.auditMetadataPresent,
    mcpBypassedApiPolicy: false,
    sourceWireHostsUserMemory: false,
    runtimeMode: "synthetic_trust_boundary_package",
    boundary: SOURCE_WIRE_RUNTIME_THREAT_BOUNDARY
  };
}

function controlForThreatKind(threatKind: SourceWireRuntimeThreatKind): SourceWireRuntimeThreatControl {
  if (threatKind === "unauthorized_caller") return "caller_authentication";
  if (threatKind === "cross_namespace_access") return "namespace_isolation";
  if (threatKind === "source_to_memory_confusion") return "source_trusted_memory_separation";
  if (threatKind === "prompt_injection") return "instruction_boundary";
  if (threatKind === "secret_exposure") return "secret_redaction";
  if (threatKind === "audit_gap") return "audit_required";
  if (threatKind === "backup_restore_namespace_drift") return "restore_revalidation";
  if (threatKind === "deployment_misconfiguration") return "deployment_stop_condition";
  if (threatKind === "mcp_policy_bypass") return "mcp_api_policy_routing";
  return "owner_application_approval";
}
