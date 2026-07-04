/**
 * Source-Wire public contract package.
 *
 * Unit 23 intentionally exposes package shape before runtime behavior.
 * Runtime services, database migrations, live connectors, and memory-engine
 * integration are out of scope until a later public PRD opens them.
 */
export const SOURCE_WIRE_PACKAGE_VERSION = "0.1.0";

export type SourceWireRuntimeBoundary = {
  packageKind: "contract_skeleton";
  runtimeIncluded: false;
  databaseIncluded: false;
  memoryEngineIncluded: false;
  missionControlIncluded: false;
};

export const SOURCE_WIRE_RUNTIME_BOUNDARY: SourceWireRuntimeBoundary = {
  packageKind: "contract_skeleton",
  runtimeIncluded: false,
  databaseIncluded: false,
  memoryEngineIncluded: false,
  missionControlIncluded: false
};

export type {
  SourceWireDailyWorkflowBoundary,
  SourceWireDailyWorkflowCase,
  SourceWireDailyWorkflowCaseStatus,
  SourceWireDailyWorkflowContract,
  SourceWireDailyWorkflowEvidenceLabel,
  SourceWireDailyWorkflowFailureRecord,
  SourceWireDailyWorkflowFixtureMatrix,
  SourceWireDailyWorkflowGapKind,
  SourceWireDailyWorkflowPhase,
  SourceWireDailyWorkflowStatus,
  SourceWireDailyWorkflowSummary
} from "./contracts/daily-workflow.js";
export {
  SOURCE_WIRE_DAILY_WORKFLOW_BOUNDARY,
  SOURCE_WIRE_DAILY_WORKFLOW_CONTRACT,
  SOURCE_WIRE_DAILY_WORKFLOW_PHASES,
  SOURCE_WIRE_DAILY_WORKFLOW_REQUIRED_CASES,
  summarizeDailyWorkflowContract
} from "./contracts/daily-workflow.js";
export type {
  SourceWireRuntimeReadinessBoundary,
  SourceWireRuntimeReadinessCase,
  SourceWireRuntimeReadinessCategory,
  SourceWireRuntimeReadinessContract,
  SourceWireRuntimeReadinessFailureRecord,
  SourceWireRuntimeReadinessFixtureMatrix,
  SourceWireRuntimeReadinessStatus,
  SourceWireRuntimeReadinessSummary
} from "./contracts/runtime-readiness.js";
export {
  SOURCE_WIRE_RUNTIME_READINESS_BOUNDARY,
  SOURCE_WIRE_RUNTIME_READINESS_CONTRACT,
  SOURCE_WIRE_RUNTIME_READINESS_REQUIRED_CASES,
  summarizeRuntimeReadinessContract
} from "./contracts/runtime-readiness.js";
export type {
  SourceWireRuntimeProofIntakeBoundary,
  SourceWireRuntimeProofIntakeCategory,
  SourceWireRuntimeProofIntakeDecision,
  SourceWireRuntimeProofIntakeEvidenceKind,
  SourceWireRuntimeProofIntakeManifest,
  SourceWireRuntimeProofIntakeProof,
  SourceWireRuntimeProofIntakeSummary
} from "./contracts/runtime-proof-intake.js";
export {
  SOURCE_WIRE_RUNTIME_PROOF_INTAKE_BOUNDARY,
  SOURCE_WIRE_RUNTIME_PROOF_INTAKE_CONTRACT,
  SOURCE_WIRE_RUNTIME_PROOF_INTAKE_REQUIRED_CASES,
  summarizeRuntimeProofIntakeManifest
} from "./contracts/runtime-proof-intake.js";
export type {
  SourceWireMinimalRuntimeAudit,
  SourceWireMinimalRuntimeCitation,
  SourceWireMinimalRuntimeProofResult,
  SourceWireMinimalRuntimeResult,
  SourceWireMinimalRuntimeStatus
} from "./runtime/minimal-boundary.js";
export {
  SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY,
  runMinimalRuntimeProofCase,
  runMinimalRuntimeProofCases
} from "./runtime/minimal-boundary.js";
export type {
  SourceWireRuntimeSkeletonApiRequest,
  SourceWireRuntimeSkeletonCaller,
  SourceWireRuntimeSkeletonCallerKind,
  SourceWireRuntimeSkeletonCapability,
  SourceWireRuntimeSkeletonCitation,
  SourceWireRuntimeSkeletonFixtureCase,
  SourceWireRuntimeSkeletonFixtureMatrix,
  SourceWireRuntimeSkeletonMcpRequest,
  SourceWireRuntimeSkeletonResponse,
  SourceWireRuntimeSkeletonStatus
} from "./runtime-skeleton/index.js";
export {
  SOURCE_WIRE_RUNTIME_SKELETON_BOUNDARY,
  callRuntimeSkeletonApiPolicy,
  callRuntimeSkeletonMcpAdapter,
  runRuntimeSkeletonFixtureCase,
  runRuntimeSkeletonFixtureMatrix
} from "./runtime-skeleton/index.js";
export type {
  SourceWireRuntimeThreatActorKind,
  SourceWireRuntimeThreatBoundaryCase,
  SourceWireRuntimeThreatBoundaryFixtureMatrix,
  SourceWireRuntimeThreatBoundaryResult,
  SourceWireRuntimeThreatControl,
  SourceWireRuntimeThreatDecision,
  SourceWireRuntimeThreatKind
} from "./runtime-threat-boundary/index.js";
export {
  SOURCE_WIRE_RUNTIME_THREAT_BOUNDARY,
  evaluateRuntimeThreatBoundaryCase,
  evaluateRuntimeThreatBoundaryFixtureMatrix
} from "./runtime-threat-boundary/index.js";
export type {
  SourceWireApiContractAction,
  SourceWireApiContractCaller,
  SourceWireApiContractCallerKind,
  SourceWireApiContractCapability,
  SourceWireApiContractCitation,
  SourceWireApiContractEndpointGroup,
  SourceWireApiContractFixtureCase,
  SourceWireApiContractFixtureMatrix,
  SourceWireApiContractGap,
  SourceWireApiContractRequest,
  SourceWireApiContractResponse,
  SourceWireApiContractStatus
} from "./contracts/api-policy.js";
export {
  SOURCE_WIRE_API_POLICY_CONTRACT_BOUNDARY,
  evaluateApiPolicyContractCase,
  evaluateApiPolicyContractFixtureMatrix
} from "./contracts/api-policy.js";
export type {
  SourceWireMcpContractCaller,
  SourceWireMcpContractFixtureCase,
  SourceWireMcpContractFixtureMatrix,
  SourceWireMcpContractInput,
  SourceWireMcpContractRequest,
  SourceWireMcpContractResponse,
  SourceWireMcpContractStatus,
  SourceWireMcpContractToolDeclaration,
  SourceWireMcpContractToolName
} from "./contracts/mcp-adapter.js";
export {
  SOURCE_WIRE_MCP_ADAPTER_CONTRACT_BOUNDARY,
  SOURCE_WIRE_MCP_ADAPTER_TOOL_DECLARATIONS,
  evaluateMcpAdapterContractCase,
  evaluateMcpAdapterContractFixtureMatrix
} from "./contracts/mcp-adapter.js";
export type {
  SourceWireDatabasePostureCase,
  SourceWireDatabasePostureDataClass,
  SourceWireDatabasePostureDataClassDefinition,
  SourceWireDatabasePostureFixtureMatrix,
  SourceWireDatabasePostureLifecycleState,
  SourceWireDatabasePostureOperation,
  SourceWireDatabasePostureResult,
  SourceWireDatabasePostureStatus,
  SourceWireDatabasePostureTrustLevel
} from "./contracts/database-posture.js";
export {
  SOURCE_WIRE_DATABASE_POSTURE_BOUNDARY,
  SOURCE_WIRE_DATABASE_POSTURE_DATA_CLASSES,
  evaluateDatabasePostureCase,
  evaluateDatabasePostureFixtureMatrix
} from "./contracts/database-posture.js";
export type {
  SourceWireHostedRuntimeFixtureAction,
  SourceWireHostedRuntimeFixtureAudit,
  SourceWireHostedRuntimeFixtureCaller,
  SourceWireHostedRuntimeFixtureCallerKind,
  SourceWireHostedRuntimeFixtureCase,
  SourceWireHostedRuntimeFixtureDataClass,
  SourceWireHostedRuntimeFixtureMatrix,
  SourceWireHostedRuntimeFixtureResult,
  SourceWireHostedRuntimeFixtureStatus
} from "./contracts/hosted-runtime-fixtures.js";
export {
  SOURCE_WIRE_HOSTED_RUNTIME_FIXTURE_BOUNDARY,
  evaluateHostedRuntimeFixtureCase,
  evaluateHostedRuntimeFixtureMatrix
} from "./contracts/hosted-runtime-fixtures.js";
export type * from "./contracts/fixtures.js";
export type * from "./contracts/mcp-tools.js";
export type * from "./contracts/owner-hosted-setup.js";
export type * from "./contracts/second-brain.js";
export type * from "./contracts/source-connection.js";
export type * from "./contracts/source-graph.js";
export {
  SOURCE_WIRE_OWNER_HOSTED_SETUP_BOUNDARY,
  SOURCE_WIRE_OWNER_HOSTED_SETUP_CONTRACT,
  SOURCE_WIRE_OWNER_HOSTED_SETUP_REQUIREMENTS,
  SOURCE_WIRE_OWNER_HOSTED_SETUP_STOP_CONDITIONS,
  summarizeOwnerHostedSetupContract
} from "./contracts/owner-hosted-setup.js";
export * from "./schemas.js";
export type {
  SourceWireValidationResult,
  SourceWireValidationSchemaName
} from "./validation.js";
export {
  SOURCE_WIRE_VALIDATION_SCHEMA_NAMES,
  isSourceWireValidationSchemaName,
  validateSourceWireFile
} from "./validation.js";
