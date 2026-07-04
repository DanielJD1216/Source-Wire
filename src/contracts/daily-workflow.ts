export type SourceWireDailyWorkflowStatus = "synthetic_contract";

export type SourceWireDailyWorkflowPhase =
  | "ask"
  | "bounded_update"
  | "owner_review"
  | "follow_up_answer"
  | "mission_control_state";

export type SourceWireDailyWorkflowCaseStatus = "ready" | "blocked";

export type SourceWireDailyWorkflowEvidenceLabel =
  | "trusted_memory"
  | "source_only"
  | "pending_candidate"
  | "rejected_candidate"
  | "gap";

export type SourceWireDailyWorkflowGapKind =
  | "missing_evidence"
  | "stale_evidence"
  | "weak_evidence"
  | "restricted_evidence";

export type SourceWireDailyWorkflowFailureRecord = {
  failurePoint: string;
  observedError: string;
  supportedCause: string;
  impact: string;
  nextAction: string;
};

export type SourceWireDailyWorkflowBoundary = {
  fixtureSafety: "synthetic";
  runtimeIncluded: false;
  apiServerRuntimeIncluded: false;
  mcpServerRuntimeIncluded: false;
  databaseMigrationsIncluded: false;
  realDatabaseConnectionIncluded: false;
  liveConnectorsIncluded: false;
  localPathCrawlingAllowed: false;
  realUserDataIncluded: false;
  privateImplementationCodeCopied: false;
  agplCodeCopied: false;
  automaticTrustedMemoryPromotionAllowed: false;
  mcpCanApproveTrustedMemory: false;
  packageVersionChangeRequired: false;
};

export type SourceWireDailyWorkflowCase = {
  caseId: string;
  phase: SourceWireDailyWorkflowPhase;
  status: SourceWireDailyWorkflowCaseStatus;
  ownerFacingSummary: string;
  checks: {
    trustedMemoryRecordDelta: number;
    noAutoPromotion: true;
    callerSuppliedSnapshotRequired?: boolean;
    callerSuppliedSnapshotProvided?: boolean;
    folderCrawlingRequested?: boolean;
    folderCrawlingAllowed?: false;
    ownerReviewRequired?: boolean;
    ownerApprovalCreatesTrustedMemoryRecords?: number;
    ownerRejectionCreatesTrustedMemoryRecords?: number;
    mcpApprovalAllowed?: false;
    approvedTrustedCitationCount?: number;
    pendingCandidateTrustedCitationCount?: number;
    rejectedCandidateTrustedCitationCount?: number;
    evidenceLabels: readonly SourceWireDailyWorkflowEvidenceLabel[];
    gapKinds?: readonly SourceWireDailyWorkflowGapKind[];
  };
  expected: {
    canContinue: boolean;
    ownerNextAction: string;
    failureRecords: readonly SourceWireDailyWorkflowFailureRecord[];
  };
};

export type SourceWireDailyWorkflowContract = {
  contractVersion: "source-wire-daily-workflow.v1";
  status: SourceWireDailyWorkflowStatus;
  summary: string;
  phases: readonly SourceWireDailyWorkflowPhase[];
  boundary: SourceWireDailyWorkflowBoundary;
  requiredCases: readonly string[];
};

export type SourceWireDailyWorkflowFixtureMatrix = {
  fixtureType: "source-wire-daily-workflow-fixture-matrix";
  fixtureSafety: "synthetic";
  contractVersion: SourceWireDailyWorkflowContract["contractVersion"];
  boundary: SourceWireDailyWorkflowBoundary;
  cases: readonly SourceWireDailyWorkflowCase[];
};

export type SourceWireDailyWorkflowSummary = {
  contractVersion: SourceWireDailyWorkflowContract["contractVersion"];
  status: SourceWireDailyWorkflowContract["status"];
  phaseCount: number;
  requiredCaseCount: number;
  runtimeIncluded: false;
  safeForPublicFixtures: true;
  automaticTrustedMemoryPromotionAllowed: false;
  mcpCanApproveTrustedMemory: false;
};

export const SOURCE_WIRE_DAILY_WORKFLOW_PHASES = [
  "ask",
  "bounded_update",
  "owner_review",
  "follow_up_answer",
  "mission_control_state"
] as const satisfies readonly SourceWireDailyWorkflowPhase[];

export const SOURCE_WIRE_DAILY_WORKFLOW_BOUNDARY: SourceWireDailyWorkflowBoundary = {
  fixtureSafety: "synthetic",
  runtimeIncluded: false,
  apiServerRuntimeIncluded: false,
  mcpServerRuntimeIncluded: false,
  databaseMigrationsIncluded: false,
  realDatabaseConnectionIncluded: false,
  liveConnectorsIncluded: false,
  localPathCrawlingAllowed: false,
  realUserDataIncluded: false,
  privateImplementationCodeCopied: false,
  agplCodeCopied: false,
  automaticTrustedMemoryPromotionAllowed: false,
  mcpCanApproveTrustedMemory: false,
  packageVersionChangeRequired: false
};

export const SOURCE_WIRE_DAILY_WORKFLOW_REQUIRED_CASES = [
  "daily_ask_trusted_citation",
  "daily_ask_missing_evidence_gap",
  "bounded_update_pending_review",
  "bounded_update_missing_snapshot_blocked",
  "bounded_update_folder_crawl_blocked",
  "owner_review_approval",
  "owner_review_rejection",
  "owner_review_mcp_bypass_denied",
  "follow_up_uses_approved_memory",
  "follow_up_excludes_pending_candidate",
  "follow_up_excludes_rejected_candidate",
  "mission_control_daily_summary"
] as const;

export const SOURCE_WIRE_DAILY_WORKFLOW_CONTRACT: SourceWireDailyWorkflowContract = {
  contractVersion: "source-wire-daily-workflow.v1",
  status: "synthetic_contract",
  summary:
    "Source-Wire daily workflow models read-only asks, bounded updates, owner review, follow-up answers, and Mission Control state using synthetic fixtures only.",
  phases: SOURCE_WIRE_DAILY_WORKFLOW_PHASES,
  boundary: SOURCE_WIRE_DAILY_WORKFLOW_BOUNDARY,
  requiredCases: SOURCE_WIRE_DAILY_WORKFLOW_REQUIRED_CASES
};

export function summarizeDailyWorkflowContract(
  contract: SourceWireDailyWorkflowContract = SOURCE_WIRE_DAILY_WORKFLOW_CONTRACT
): SourceWireDailyWorkflowSummary {
  return {
    contractVersion: contract.contractVersion,
    status: contract.status,
    phaseCount: contract.phases.length,
    requiredCaseCount: contract.requiredCases.length,
    runtimeIncluded: contract.boundary.runtimeIncluded,
    safeForPublicFixtures: true,
    automaticTrustedMemoryPromotionAllowed: contract.boundary.automaticTrustedMemoryPromotionAllowed,
    mcpCanApproveTrustedMemory: contract.boundary.mcpCanApproveTrustedMemory
  };
}
