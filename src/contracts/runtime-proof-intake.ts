export type SourceWireRuntimeProofIntakeCategory =
  | "private_proof"
  | "api_policy"
  | "mcp_policy"
  | "database_posture"
  | "source_update"
  | "memory_engine_boundary"
  | "release_boundary";

export type SourceWireRuntimeProofIntakeEvidenceKind =
  | "private_runtime_proof"
  | "public_extraction_notes"
  | "policy_contract"
  | "setup_readiness"
  | "source_update_safety"
  | "license_boundary"
  | "release_boundary";

export type SourceWireRuntimeProofIntakeBoundary = {
  fixtureSafety: "synthetic";
  proofMetadataOnly: true;
  redactedProofOnly: true;
  privateRepoPathIncluded: false;
  rawPrivateContentIncluded: false;
  realUserDataIncluded: false;
  clientDataIncluded: false;
  tokenOrSecretIncluded: false;
  privateImplementationCodeCopied: false;
  agplCodeCopied: false;
  runtimeImplementationIncluded: false;
  databaseMigrationIncluded: false;
  deploymentIncluded: false;
};

export type SourceWireRuntimeProofIntakeProof = {
  proofId: string;
  category: SourceWireRuntimeProofIntakeCategory;
  evidenceKind: SourceWireRuntimeProofIntakeEvidenceKind;
  satisfiesReadinessCase: string;
  redactedEvidenceRef: string;
  status: "available" | "blocked";
  noPrivateData: true;
};

export type SourceWireRuntimeProofIntakeDecision = {
  privateProofBaselineAccepted: boolean;
  runtimePrdRefreshAllowed: boolean;
  runtimeImplementationAllowed: false;
  allowedNextAction: string;
};

export type SourceWireRuntimeProofIntakeManifest = {
  fixtureType: "source-wire-runtime-proof-intake-manifest";
  fixtureSafety: "synthetic";
  contractVersion: "source-wire-runtime-proof-intake.v1";
  boundary: SourceWireRuntimeProofIntakeBoundary;
  proofs: readonly SourceWireRuntimeProofIntakeProof[];
  decision: SourceWireRuntimeProofIntakeDecision;
};

export type SourceWireRuntimeProofIntakeSummary = {
  contractVersion: SourceWireRuntimeProofIntakeManifest["contractVersion"];
  proofCount: number;
  privateProofBaselineAccepted: boolean;
  runtimePrdRefreshAllowed: boolean;
  runtimeImplementationAllowed: false;
  safeForPublicRepo: true;
};

export const SOURCE_WIRE_RUNTIME_PROOF_INTAKE_BOUNDARY: SourceWireRuntimeProofIntakeBoundary = {
  fixtureSafety: "synthetic",
  proofMetadataOnly: true,
  redactedProofOnly: true,
  privateRepoPathIncluded: false,
  rawPrivateContentIncluded: false,
  realUserDataIncluded: false,
  clientDataIncluded: false,
  tokenOrSecretIncluded: false,
  privateImplementationCodeCopied: false,
  agplCodeCopied: false,
  runtimeImplementationIncluded: false,
  databaseMigrationIncluded: false,
  deploymentIncluded: false
};

export const SOURCE_WIRE_RUNTIME_PROOF_INTAKE_REQUIRED_CASES = [
  "private_daily_workflow_proof_ready",
  "api_policy_contract_ready",
  "mcp_policy_bypass_blocked",
  "database_posture_unapproved_blocked",
  "source_update_safety_ready",
  "memory_engine_license_boundary_ready",
  "release_mutation_blocked"
] as const;

export const SOURCE_WIRE_RUNTIME_PROOF_INTAKE_CONTRACT = {
  contractVersion: "source-wire-runtime-proof-intake.v1",
  status: "synthetic_contract",
  summary:
    "Source-Wire runtime proof intake records redacted private-proof metadata that can inform public runtime PRD refresh without importing private data or approving runtime implementation.",
  boundary: SOURCE_WIRE_RUNTIME_PROOF_INTAKE_BOUNDARY,
  requiredCases: SOURCE_WIRE_RUNTIME_PROOF_INTAKE_REQUIRED_CASES
} as const;

export function summarizeRuntimeProofIntakeManifest(
  manifest: SourceWireRuntimeProofIntakeManifest
): SourceWireRuntimeProofIntakeSummary {
  return {
    contractVersion: manifest.contractVersion,
    proofCount: manifest.proofs.length,
    privateProofBaselineAccepted: manifest.decision.privateProofBaselineAccepted,
    runtimePrdRefreshAllowed: manifest.decision.runtimePrdRefreshAllowed,
    runtimeImplementationAllowed: manifest.decision.runtimeImplementationAllowed,
    safeForPublicRepo: true
  };
}
