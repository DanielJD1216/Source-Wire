import type {
  SourceWireApiContractCaller,
  SourceWireApiContractCitation,
  SourceWireApiContractFixtureCase,
  SourceWireApiContractGap,
  SourceWireApiContractRequest,
  SourceWireApiContractResponse,
  SourceWireApiContractStatus
} from "../contracts/api-policy.js";
import { evaluateApiPolicyContractCase } from "../contracts/api-policy.js";
import type {
  SourceWireMcpContractRequest,
  SourceWireMcpContractResponse,
  SourceWireMcpContractToolDeclaration,
  SourceWireMcpContractToolName
} from "../contracts/mcp-adapter.js";
import {
  SOURCE_WIRE_MCP_ADAPTER_TOOL_DECLARATIONS,
  evaluateMcpAdapterContractCase
} from "../contracts/mcp-adapter.js";

export type SourceWireOwnerHostedRuntimeStatus = SourceWireApiContractStatus;

export type SourceWireOwnerHostedRuntimeBoundary = typeof SOURCE_WIRE_OWNER_HOSTED_RUNTIME_BOUNDARY;

export type SourceWireOwnerHostedApiServerRuntimeRequest = {
  caseId: string;
  caller: SourceWireApiContractCaller;
  request: SourceWireApiContractRequest;
};

export type SourceWireOwnerHostedMcpServerRuntimeRequest = {
  caseId: string;
  request: SourceWireMcpContractRequest;
};

export type SourceWireOwnerHostedRuntimeResponse = {
  runtimeKind: "owner_hosted_api_server_skeleton" | "owner_hosted_mcp_server_skeleton";
  runtimeMode: "synthetic_owner_hosted_runtime_skeleton";
  status: SourceWireOwnerHostedRuntimeStatus;
  requestId: string;
  traceId: string;
  ownerId: string;
  namespaceId: string;
  toolName?: SourceWireMcpContractToolName;
  denialReason?: string;
  apiPolicyRouted: boolean;
  apiPolicyBypassed: false;
  mcpAdapterUsed: boolean;
  mcpToolDeclarationExposed: boolean;
  runtimeDirectCall: false;
  networkListenerStarted: false;
  databaseTouched: false;
  liveConnectorTouched: false;
  privateDataTouched: false;
  sourceWireHostsUserMemory: false;
  sourceEvidencePromoted: false;
  secretReturned: false;
  automaticTrustedMemoryPromotion: false;
  sourceEvidenceSeparatedFromTrustedMemory: true;
  trustedMemoryPromotionControlled: boolean;
  trustedMemoryReturned: boolean;
  sourceEvidenceReturned: boolean;
  contextAssembled: boolean;
  sourceMaintenanceAccepted: boolean;
  candidateCreated: boolean;
  candidateReviewed: boolean;
  trustedMemoryCreated: boolean;
  handoffStatusAccepted: boolean;
  auditSummaryReturned: boolean;
  citationCount: number;
  gapCount: number;
  citations: SourceWireApiContractCitation[];
  gaps: SourceWireApiContractGap[];
  boundary: SourceWireOwnerHostedRuntimeBoundary;
  apiPolicyResult?: SourceWireApiContractResponse;
  mcpAdapterResult?: SourceWireMcpContractResponse;
  audit: {
    callerId: string;
    callerKind: SourceWireApiContractCaller["callerKind"];
    ownerId: string;
    namespaceId: string;
    result: SourceWireOwnerHostedRuntimeStatus;
    boundaryPath:
      | "owner_hosted_api_server_skeleton_to_source_wire_api_policy"
      | "owner_hosted_mcp_server_skeleton_to_source_wire_api_policy";
    apiPolicyBoundaryPath?: SourceWireApiContractResponse["audit"]["boundaryPath"];
    leakedContent: false;
    rawSecretReturned: false;
    sourceEvidencePromoted: false;
    databaseTouched: false;
    liveConnectorTouched: false;
    privateDataTouched: false;
  };
};

export type SourceWireOwnerHostedRuntimeFixtureCase = {
  caseId: string;
  path: "api" | "mcp";
  category: string;
  api?: SourceWireOwnerHostedApiServerRuntimeRequest;
  mcp?: SourceWireOwnerHostedMcpServerRuntimeRequest;
  expected: Partial<
    Pick<
      SourceWireOwnerHostedRuntimeResponse,
      | "status"
      | "denialReason"
      | "apiPolicyRouted"
      | "apiPolicyBypassed"
      | "mcpAdapterUsed"
      | "runtimeDirectCall"
      | "networkListenerStarted"
      | "trustedMemoryReturned"
      | "sourceEvidenceReturned"
      | "contextAssembled"
      | "sourceMaintenanceAccepted"
      | "candidateCreated"
      | "candidateReviewed"
      | "trustedMemoryCreated"
      | "handoffStatusAccepted"
      | "sourceEvidencePromoted"
      | "automaticTrustedMemoryPromotion"
      | "sourceEvidenceSeparatedFromTrustedMemory"
      | "trustedMemoryPromotionControlled"
      | "secretReturned"
      | "sourceWireHostsUserMemory"
      | "citationCount"
      | "gapCount"
    >
  >;
};

export type SourceWireOwnerHostedRuntimeFixtureMatrix = {
  fixtureType: "source-wire-owner-hosted-runtime-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: SourceWireOwnerHostedRuntimeBoundary;
  toolDeclarations: SourceWireMcpContractToolDeclaration[];
  cases: SourceWireOwnerHostedRuntimeFixtureCase[];
};

export const SOURCE_WIRE_OWNER_HOSTED_RUNTIME_BOUNDARY = {
  implementationMode: "synthetic_owner_hosted_api_mcp_runtime_skeleton",
  ownerHosted: true,
  sourceWireHostsUserMemory: false,
  syntheticFixturesOnly: true,
  apiServerRuntimeSkeletonIncluded: true,
  mcpServerRuntimeSkeletonIncluded: true,
  productionRuntimeIncluded: false,
  networkServerIncluded: false,
  productionRouteHandlersIncluded: false,
  inProcessRouteSkeletonIncluded: true,
  databaseIncluded: false,
  databaseMigrationsIncluded: false,
  realDatabaseConnectionsIncluded: false,
  postgresOrPgvectorSetupIncluded: false,
  liveConnectorsIncluded: false,
  localFolderCrawlingIncluded: false,
  wholeVaultImportIncluded: false,
  missionControlIncluded: false,
  deploymentConfigIncluded: false,
  managedHostingIncluded: false,
  npmPublishingIncluded: false,
  githubReleaseIncluded: false,
  packageVersionChangesIncluded: false,
  publicContributionAcceptanceIncluded: false,
  sourceWireMemoryEngineCodeMerged: false,
  agplCodeIncluded: false,
  privateImplementationCodeIncluded: false,
  realDataIncluded: false,
  clientDataIncluded: false,
  mcpMayBypassApiPolicy: false,
  sourceEvidenceMayAutoPromoteToTrustedMemory: false,
  trustedMemoryPromotion: "owner_or_application_controlled"
} as const;

export function getOwnerHostedMcpServerRuntimeToolDeclarations(): SourceWireMcpContractToolDeclaration[] {
  return SOURCE_WIRE_MCP_ADAPTER_TOOL_DECLARATIONS.filter(
    (tool) => tool.toolName !== "direct_database_access" && tool.toolName !== "direct_runtime_adapter_access"
  );
}

export function handleOwnerHostedApiServerRuntimeRequest(
  envelope: SourceWireOwnerHostedApiServerRuntimeRequest
): SourceWireOwnerHostedRuntimeResponse {
  const apiPolicyResult = evaluateApiPolicyContractCase({
    caseId: envelope.caseId,
    caller: envelope.caller,
    request: {
      ...envelope.request,
      viaMcp: false,
      mcpRoutesThroughApiPolicy: true
    },
    expected: {}
  });

  return fromApiPolicyResult({
    runtimeKind: "owner_hosted_api_server_skeleton",
    mcpAdapterUsed: false,
    apiPolicyResult
  });
}

export function handleOwnerHostedMcpServerRuntimeRequest(
  envelope: SourceWireOwnerHostedMcpServerRuntimeRequest
): SourceWireOwnerHostedRuntimeResponse {
  const mcpAdapterResult = evaluateMcpAdapterContractCase({
    caseId: envelope.caseId,
    request: envelope.request,
    expected: {}
  });

  const apiPolicyResult = mcpAdapterResult.apiPolicyResult;
  const responseInput: Parameters<typeof fromApiPolicyResult>[0] = {
    runtimeKind: "owner_hosted_mcp_server_skeleton",
    mcpAdapterUsed: true,
    mcpAdapterResult,
    fallback: mcpAdapterResult
  };

  if (apiPolicyResult) {
    responseInput.apiPolicyResult = apiPolicyResult;
  }

  const response = fromApiPolicyResult(responseInput);

  return {
    ...response,
    toolName: mcpAdapterResult.toolName,
    mcpToolDeclarationExposed: mcpAdapterResult.toolDeclarationFound,
    apiPolicyRouted: mcpAdapterResult.apiPolicyRouted,
    apiPolicyBypassed: false,
    audit: {
      ...response.audit,
      boundaryPath: "owner_hosted_mcp_server_skeleton_to_source_wire_api_policy"
    }
  };
}

export function evaluateOwnerHostedRuntimeFixtureCase(
  fixtureCase: SourceWireOwnerHostedRuntimeFixtureCase
): SourceWireOwnerHostedRuntimeResponse {
  if (fixtureCase.path === "api") {
    if (!fixtureCase.api) {
      throw new Error(`missing API fixture envelope: ${fixtureCase.caseId}`);
    }

    return handleOwnerHostedApiServerRuntimeRequest(fixtureCase.api);
  }

  if (!fixtureCase.mcp) {
    throw new Error(`missing MCP fixture envelope: ${fixtureCase.caseId}`);
  }

  return handleOwnerHostedMcpServerRuntimeRequest(fixtureCase.mcp);
}

export function evaluateOwnerHostedRuntimeFixtureMatrix(
  matrix: SourceWireOwnerHostedRuntimeFixtureMatrix
): SourceWireOwnerHostedRuntimeResponse[] {
  return matrix.cases.map((fixtureCase) => evaluateOwnerHostedRuntimeFixtureCase(fixtureCase));
}

function fromApiPolicyResult(input: {
  runtimeKind: SourceWireOwnerHostedRuntimeResponse["runtimeKind"];
  mcpAdapterUsed: boolean;
  apiPolicyResult?: SourceWireApiContractResponse;
  mcpAdapterResult?: SourceWireMcpContractResponse;
  fallback?: SourceWireMcpContractResponse;
}): SourceWireOwnerHostedRuntimeResponse {
  const result = input.apiPolicyResult;
  const fallback = input.fallback;
  const status = result?.status ?? fallback?.status ?? "denied";
  const ownerId = result?.ownerId ?? fallback?.ownerId ?? "";
  const namespaceId = result?.namespaceId ?? fallback?.namespaceId ?? "";
  const requestId = result?.requestId ?? fallback?.requestId ?? "";
  const traceId = result?.traceId ?? fallback?.traceId ?? "";
  const callerId = result?.audit.callerId ?? fallback?.audit.callerId ?? "unknown_synthetic_caller";
  const callerKind = result?.audit.callerKind ?? fallback?.audit.callerKind ?? "unknown";
  const trustedMemoryCreated = result?.trustedMemoryCreated ?? fallback?.trustedMemoryCreated ?? false;
  const automaticTrustedMemoryPromotion = false;

  const response: SourceWireOwnerHostedRuntimeResponse = {
    runtimeKind: input.runtimeKind,
    runtimeMode: "synthetic_owner_hosted_runtime_skeleton",
    status,
    requestId,
    traceId,
    ownerId,
    namespaceId,
    apiPolicyRouted: Boolean(result),
    apiPolicyBypassed: false,
    mcpAdapterUsed: input.mcpAdapterUsed,
    mcpToolDeclarationExposed: false,
    runtimeDirectCall: false,
    networkListenerStarted: false,
    databaseTouched: false,
    liveConnectorTouched: false,
    privateDataTouched: false,
    sourceWireHostsUserMemory: false,
    sourceEvidencePromoted: false,
    secretReturned: false,
    automaticTrustedMemoryPromotion,
    sourceEvidenceSeparatedFromTrustedMemory: true,
    trustedMemoryPromotionControlled: trustedMemoryCreated ? isOwnerControlledApproval(result) : true,
    trustedMemoryReturned: result?.trustedMemoryReturned ?? fallback?.trustedMemoryReturned ?? false,
    sourceEvidenceReturned: result?.sourceEvidenceReturned ?? fallback?.sourceEvidenceReturned ?? false,
    contextAssembled: result?.contextAssembled ?? fallback?.contextAssembled ?? false,
    sourceMaintenanceAccepted: result?.sourceMaintenanceAccepted ?? fallback?.sourceMaintenanceAccepted ?? false,
    candidateCreated: result?.candidateCreated ?? false,
    candidateReviewed: result?.candidateReviewed ?? fallback?.candidateReviewed ?? false,
    trustedMemoryCreated,
    handoffStatusAccepted: result?.handoffStatusAccepted ?? false,
    auditSummaryReturned: result?.auditSummaryReturned ?? false,
    citationCount: result?.citations.length ?? fallback?.citationCount ?? 0,
    gapCount: result?.gaps.length ?? fallback?.gapCount ?? 0,
    citations: result?.citations ?? [],
    gaps: result?.gaps ?? [],
    boundary: SOURCE_WIRE_OWNER_HOSTED_RUNTIME_BOUNDARY,
    audit: {
      callerId,
      callerKind,
      ownerId,
      namespaceId,
      result: status,
      boundaryPath: "owner_hosted_api_server_skeleton_to_source_wire_api_policy",
      leakedContent: false,
      rawSecretReturned: false,
      sourceEvidencePromoted: false,
      databaseTouched: false,
      liveConnectorTouched: false,
      privateDataTouched: false
    }
  };

  if (result?.denialReason) {
    response.denialReason = result.denialReason;
  } else if (fallback?.denialReason) {
    response.denialReason = fallback.denialReason;
  }

  if (result) {
    response.apiPolicyResult = result;
    response.audit.apiPolicyBoundaryPath = result.audit.boundaryPath;
  }

  if (input.mcpAdapterResult) {
    response.mcpAdapterResult = input.mcpAdapterResult;
  }

  return response;
}

function isOwnerControlledApproval(result?: SourceWireApiContractResponse): boolean {
  if (!result) {
    return false;
  }

  if (!result.trustedMemoryCreated) {
    return true;
  }

  return result.action === "approve_trusted_memory" && result.audit.callerKind === "owner_controlled_application";
}
