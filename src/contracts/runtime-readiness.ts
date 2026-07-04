export type SourceWireRuntimeReadinessStatus = "ready" | "blocked";

export type SourceWireRuntimeReadinessCategory =
  | "private_proof"
  | "api_policy"
  | "mcp_policy"
  | "database_posture"
  | "source_update"
  | "memory_engine_boundary"
  | "release_boundary";

export type SourceWireRuntimeReadinessBoundary = {
  fixtureSafety: "synthetic";
  runtimeImplementationIncluded: false;
  apiServerRuntimeIncluded: false;
  mcpServerRuntimeIncluded: false;
  databaseMigrationsIncluded: false;
  databaseConnectionAttempted: false;
  liveConnectorsIncluded: false;
  deploymentIncluded: false;
  managedHostingIncluded: false;
  realUserDataIncluded: false;
  privateImplementationCodeCopied: false;
  agplCodeCopied: false;
  automaticTrustedMemoryPromotionAllowed: false;
  packageVersionChangeRequired: false;
};

export type SourceWireRuntimeReadinessFailureRecord = {
  failurePoint: string;
  observedError: string;
  supportedCause: string;
  impact: string;
  nextAction: string;
};

export type SourceWireRuntimeReadinessCase = {
  caseId: string;
  category: SourceWireRuntimeReadinessCategory;
  status: SourceWireRuntimeReadinessStatus;
  plainEnglish: string;
  checks: {
    privateBehaviorProofAvailable?: boolean;
    publicExtractionNotesAvailable?: boolean;
    apiPolicyDefined?: boolean;
    mcpRoutesThroughApiPolicy?: boolean;
    mcpDirectRuntimeBypassAllowed?: false;
    databasePostureApproved?: boolean;
    migrationApproved?: boolean;
    callerSuppliedSnapshotRequired?: boolean;
    localPathCrawlingAllowed?: false;
    broadImportAllowed?: false;
    noAutoPromotion?: true;
    sourceWireMemoryEngineSeparate?: true;
    agplCodeCopied?: false;
    privateImplementationCodeCopied?: false;
    releaseMutationApproved?: boolean;
    deploymentApproved?: boolean;
  };
  expected: {
    runtimeWorkCanStart: boolean;
    allowedNextAction: string;
    failureRecords: readonly SourceWireRuntimeReadinessFailureRecord[];
  };
};

export type SourceWireRuntimeReadinessContract = {
  contractVersion: "source-wire-runtime-readiness.v1";
  status: "synthetic_contract";
  summary: string;
  boundary: SourceWireRuntimeReadinessBoundary;
  requiredCases: readonly string[];
};

export type SourceWireRuntimeReadinessFixtureMatrix = {
  fixtureType: "source-wire-runtime-readiness-fixture-matrix";
  fixtureSafety: "synthetic";
  contractVersion: SourceWireRuntimeReadinessContract["contractVersion"];
  boundary: SourceWireRuntimeReadinessBoundary;
  cases: readonly SourceWireRuntimeReadinessCase[];
};

export type SourceWireRuntimeReadinessSummary = {
  contractVersion: SourceWireRuntimeReadinessContract["contractVersion"];
  requiredCaseCount: number;
  runtimeImplementationIncluded: false;
  databaseMigrationsIncluded: false;
  safeForPublicFixtures: true;
  automaticTrustedMemoryPromotionAllowed: false;
};

export const SOURCE_WIRE_RUNTIME_READINESS_BOUNDARY: SourceWireRuntimeReadinessBoundary = {
  fixtureSafety: "synthetic",
  runtimeImplementationIncluded: false,
  apiServerRuntimeIncluded: false,
  mcpServerRuntimeIncluded: false,
  databaseMigrationsIncluded: false,
  databaseConnectionAttempted: false,
  liveConnectorsIncluded: false,
  deploymentIncluded: false,
  managedHostingIncluded: false,
  realUserDataIncluded: false,
  privateImplementationCodeCopied: false,
  agplCodeCopied: false,
  automaticTrustedMemoryPromotionAllowed: false,
  packageVersionChangeRequired: false
};

export const SOURCE_WIRE_RUNTIME_READINESS_REQUIRED_CASES = [
  "private_daily_workflow_proof_ready",
  "private_proof_missing_blocked",
  "api_policy_contract_ready",
  "mcp_policy_bypass_blocked",
  "database_posture_unapproved_blocked",
  "source_update_safety_ready",
  "memory_engine_license_boundary_ready",
  "release_mutation_blocked"
] as const;

export const SOURCE_WIRE_RUNTIME_READINESS_CONTRACT: SourceWireRuntimeReadinessContract = {
  contractVersion: "source-wire-runtime-readiness.v1",
  status: "synthetic_contract",
  summary:
    "Source-Wire runtime readiness records what must be true before public owner-hosted API, MCP, database, and adapter runtime work can start.",
  boundary: SOURCE_WIRE_RUNTIME_READINESS_BOUNDARY,
  requiredCases: SOURCE_WIRE_RUNTIME_READINESS_REQUIRED_CASES
};

export function summarizeRuntimeReadinessContract(
  contract: SourceWireRuntimeReadinessContract = SOURCE_WIRE_RUNTIME_READINESS_CONTRACT
): SourceWireRuntimeReadinessSummary {
  return {
    contractVersion: contract.contractVersion,
    requiredCaseCount: contract.requiredCases.length,
    runtimeImplementationIncluded: contract.boundary.runtimeImplementationIncluded,
    databaseMigrationsIncluded: contract.boundary.databaseMigrationsIncluded,
    safeForPublicFixtures: true,
    automaticTrustedMemoryPromotionAllowed: contract.boundary.automaticTrustedMemoryPromotionAllowed
  };
}
