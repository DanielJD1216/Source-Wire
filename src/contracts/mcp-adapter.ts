import type {
  SourceWireApiContractAction,
  SourceWireApiContractCaller,
  SourceWireApiContractCapability,
  SourceWireApiContractEndpointGroup,
  SourceWireApiContractFixtureCase,
  SourceWireApiContractResponse,
  SourceWireApiContractStatus
} from "./api-policy.js";
import { evaluateApiPolicyContractCase } from "./api-policy.js";

export type SourceWireMcpContractToolName =
  | "search_trusted_memory"
  | "search_source_evidence"
  | "assemble_context"
  | "review_candidates"
  | "maintain_sources"
  | "read_handoff_status"
  | "approve_trusted_memory"
  | "direct_database_access"
  | "direct_runtime_adapter_access";

export type SourceWireMcpContractStatus = SourceWireApiContractStatus;

export type SourceWireMcpContractToolDeclaration = {
  toolName: SourceWireMcpContractToolName;
  requiredCapability: SourceWireApiContractCapability;
  endpointGroup: SourceWireApiContractEndpointGroup;
  action: SourceWireApiContractAction;
  mutationAuthority: "read_only" | "source_maintenance" | "candidate_review" | "owner_or_application_controlled";
};

export type SourceWireMcpContractCaller = SourceWireApiContractCaller;

export type SourceWireMcpContractInput = {
  requestId: string;
  traceId: string;
  ownerId?: string;
  namespaceId?: string;
  query?: string;
  candidateId?: string;
  explicitTrustedMemoryApproval?: boolean;
  mcpRoutesThroughApiPolicy?: boolean;
  includesSecretLikeInput?: boolean;
  auditMetadata: {
    actorId?: string;
    reason: string;
  };
};

export type SourceWireMcpContractRequest = {
  requestId: string;
  toolName: SourceWireMcpContractToolName;
  caller: SourceWireMcpContractCaller;
  input: SourceWireMcpContractInput;
};

export type SourceWireMcpContractResponse = {
  requestId: string;
  traceId: string;
  toolName: SourceWireMcpContractToolName;
  status: SourceWireMcpContractStatus;
  denialReason?: string;
  requiredCapability: SourceWireApiContractCapability;
  endpointGroup: SourceWireApiContractEndpointGroup;
  action: SourceWireApiContractAction;
  ownerId: string;
  namespaceId: string;
  toolDeclarationFound: boolean;
  inputValidated: boolean;
  capabilityMapped: boolean;
  namespaceForwarded: boolean;
  apiPolicyRouted: boolean;
  apiPolicyBypassed: false;
  directDatabaseAccessAttempted: boolean;
  directRuntimeAdapterAccessAttempted: boolean;
  citationsPreserved: boolean;
  gapsPreserved: boolean;
  citationCount: number;
  gapCount: number;
  trustedMemoryReturned: boolean;
  sourceEvidenceReturned: boolean;
  contextAssembled: boolean;
  sourceMaintenanceAccepted: boolean;
  candidateReviewed: boolean;
  trustedMemoryCreated: boolean;
  sourceEvidencePromoted: false;
  automaticTrustedMemoryPromotion: false;
  secretReturned: false;
  sourceWireHostsUserMemory: false;
  runtimeMode: "synthetic_mcp_adapter_contract";
  boundary: typeof SOURCE_WIRE_MCP_ADAPTER_CONTRACT_BOUNDARY;
  apiPolicyResult?: SourceWireApiContractResponse;
  audit: {
    callerId: string;
    callerKind: SourceWireMcpContractCaller["callerKind"];
    ownerId: string;
    namespaceId: string;
    toolName: SourceWireMcpContractToolName;
    result: SourceWireMcpContractStatus;
    boundaryPath: "mcp_adapter_to_source_wire_api_policy";
    leakedContent: false;
    rawSecretReturned: false;
    sourceEvidencePromoted: false;
  };
};

export type SourceWireMcpContractFixtureCase = {
  caseId: string;
  request: SourceWireMcpContractRequest;
  expected: Partial<
    Pick<
      SourceWireMcpContractResponse,
      | "status"
      | "denialReason"
      | "toolDeclarationFound"
      | "inputValidated"
      | "capabilityMapped"
      | "namespaceForwarded"
      | "apiPolicyRouted"
      | "apiPolicyBypassed"
      | "directDatabaseAccessAttempted"
      | "directRuntimeAdapterAccessAttempted"
      | "citationsPreserved"
      | "gapsPreserved"
      | "trustedMemoryReturned"
      | "sourceEvidenceReturned"
      | "contextAssembled"
      | "sourceMaintenanceAccepted"
      | "candidateReviewed"
      | "trustedMemoryCreated"
      | "sourceEvidencePromoted"
      | "automaticTrustedMemoryPromotion"
      | "secretReturned"
    >
  > & {
    citationCount?: number;
    gapCount?: number;
  };
};

export type SourceWireMcpContractFixtureMatrix = {
  fixtureType: "source-wire-mcp-adapter-contract-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: typeof SOURCE_WIRE_MCP_ADAPTER_CONTRACT_BOUNDARY;
  toolDeclarations: SourceWireMcpContractToolDeclaration[];
  cases: SourceWireMcpContractFixtureCase[];
};

export const SOURCE_WIRE_MCP_ADAPTER_CONTRACT_BOUNDARY = {
  implementationMode: "synthetic_mcp_adapter_contract",
  sourceWireHostsUserMemory: false,
  mcpServerRuntimeIncluded: false,
  apiServerIncluded: false,
  routeHandlersIncluded: false,
  databaseIncluded: false,
  databaseMigrationsIncluded: false,
  realDatabaseConnectionsIncluded: false,
  postgresOrPgvectorSetupIncluded: false,
  runtimeAdapterIncluded: false,
  liveConnectorsIncluded: false,
  missionControlIncluded: false,
  deploymentIncluded: false,
  hostedServicesIncluded: false,
  managedHostingIncluded: false,
  realDataIncluded: false,
  clientDataIncluded: false,
  privateImplementationCodeIncluded: false,
  agplCodeIncluded: false,
  mcpMustRouteThroughApiPolicy: true,
  mcpMayBypassApiPolicy: false,
  sourceEvidenceMayAutoPromoteToTrustedMemory: false,
  trustedMemoryPromotion: "owner_or_application_controlled"
} as const;

export const SOURCE_WIRE_MCP_ADAPTER_TOOL_DECLARATIONS: SourceWireMcpContractToolDeclaration[] = [
  {
    toolName: "search_trusted_memory",
    requiredCapability: "read_trusted_memory",
    endpointGroup: "trusted_memory_read",
    action: "read_trusted_memory",
    mutationAuthority: "read_only"
  },
  {
    toolName: "search_source_evidence",
    requiredCapability: "read_source_evidence",
    endpointGroup: "source_evidence_search",
    action: "search_source_evidence",
    mutationAuthority: "read_only"
  },
  {
    toolName: "assemble_context",
    requiredCapability: "assemble_context",
    endpointGroup: "context_assembly",
    action: "assemble_context",
    mutationAuthority: "read_only"
  },
  {
    toolName: "review_candidates",
    requiredCapability: "review_candidates",
    endpointGroup: "candidate_review",
    action: "review_candidate",
    mutationAuthority: "candidate_review"
  },
  {
    toolName: "maintain_sources",
    requiredCapability: "maintain_sources",
    endpointGroup: "source_maintenance",
    action: "maintain_source",
    mutationAuthority: "source_maintenance"
  },
  {
    toolName: "read_handoff_status",
    requiredCapability: "read_handoff_status",
    endpointGroup: "handoff_status_evidence",
    action: "read_handoff_status",
    mutationAuthority: "read_only"
  },
  {
    toolName: "approve_trusted_memory",
    requiredCapability: "approve_trusted_memory",
    endpointGroup: "trusted_memory_approval",
    action: "approve_trusted_memory",
    mutationAuthority: "owner_or_application_controlled"
  },
  {
    toolName: "direct_database_access",
    requiredCapability: "read_source_evidence",
    endpointGroup: "source_evidence_search",
    action: "search_source_evidence",
    mutationAuthority: "read_only"
  },
  {
    toolName: "direct_runtime_adapter_access",
    requiredCapability: "read_source_evidence",
    endpointGroup: "source_evidence_search",
    action: "search_source_evidence",
    mutationAuthority: "read_only"
  }
];

const toolDeclarationByName = new Map(
  SOURCE_WIRE_MCP_ADAPTER_TOOL_DECLARATIONS.map((tool) => [tool.toolName, tool])
);

export function evaluateMcpAdapterContractCase(
  fixtureCase: SourceWireMcpContractFixtureCase
): SourceWireMcpContractResponse {
  const { request } = fixtureCase;
  const toolDeclaration = toolDeclarationByName.get(request.toolName);

  if (!toolDeclaration) {
    return createMcpContractResponse(request, fallbackDeclaration(request.toolName), {
      status: "denied",
      denialReason: "unsupported_mcp_tool",
      toolDeclarationFound: false
    });
  }

  if (request.toolName === "direct_database_access") {
    return createMcpContractResponse(request, toolDeclaration, {
      status: "denied",
      denialReason: "mcp_direct_database_access_blocked",
      directDatabaseAccessAttempted: true
    });
  }

  if (request.toolName === "direct_runtime_adapter_access") {
    return createMcpContractResponse(request, toolDeclaration, {
      status: "denied",
      denialReason: "mcp_direct_runtime_adapter_access_blocked",
      directRuntimeAdapterAccessAttempted: true
    });
  }

  if (!request.caller.callerId || request.caller.callerKind === "unknown") {
    return createMcpContractResponse(request, toolDeclaration, {
      status: "denied",
      denialReason: "caller_identity_required"
    });
  }

  if (!request.input.ownerId) {
    return createMcpContractResponse(request, toolDeclaration, {
      status: "denied",
      denialReason: "owner_required"
    });
  }

  if (!request.input.namespaceId) {
    return createMcpContractResponse(request, toolDeclaration, {
      status: "denied",
      denialReason: "namespace_required"
    });
  }

  const apiPolicyRequest = toApiPolicyFixtureCase(request, toolDeclaration);
  const apiPolicyResult = evaluateApiPolicyContractCase(apiPolicyRequest);

  const routedOverrides: Partial<SourceWireMcpContractResponse> = {
    status: apiPolicyResult.status,
    apiPolicyResult,
    inputValidated: true,
    capabilityMapped: true,
    namespaceForwarded: request.input.namespaceId === apiPolicyResult.namespaceId,
    apiPolicyRouted: true,
    citationsPreserved: apiPolicyResult.citations.length > 0,
    gapsPreserved: apiPolicyResult.gaps.length > 0,
    citationCount: apiPolicyResult.citations.length,
    gapCount: apiPolicyResult.gaps.length,
    trustedMemoryReturned: apiPolicyResult.trustedMemoryReturned,
    sourceEvidenceReturned: apiPolicyResult.sourceEvidenceReturned,
    contextAssembled: apiPolicyResult.contextAssembled,
    sourceMaintenanceAccepted: apiPolicyResult.sourceMaintenanceAccepted,
    candidateReviewed: apiPolicyResult.candidateReviewed,
    trustedMemoryCreated: apiPolicyResult.trustedMemoryCreated
  };

  if (apiPolicyResult.denialReason) {
    routedOverrides.denialReason = apiPolicyResult.denialReason;
  }

  return createMcpContractResponse(request, toolDeclaration, routedOverrides);
}

export function evaluateMcpAdapterContractFixtureMatrix(
  matrix: SourceWireMcpContractFixtureMatrix
): SourceWireMcpContractResponse[] {
  return matrix.cases.map((fixtureCase) => evaluateMcpAdapterContractCase(fixtureCase));
}

function toApiPolicyFixtureCase(
  request: SourceWireMcpContractRequest,
  toolDeclaration: SourceWireMcpContractToolDeclaration
): SourceWireApiContractFixtureCase {
  return {
    caseId: `api_policy_${request.requestId}`,
    caller: request.caller,
    request: {
      requestId: request.input.requestId,
      traceId: request.input.traceId,
      ownerId: request.input.ownerId ?? "",
      namespaceId: request.input.namespaceId ?? "",
      endpointGroup: toolDeclaration.endpointGroup,
      action: toolDeclaration.action,
      requiredCapability: toolDeclaration.requiredCapability,
      viaMcp: true,
      mcpRoutesThroughApiPolicy: request.input.mcpRoutesThroughApiPolicy ?? true,
      explicitTrustedMemoryApproval: request.input.explicitTrustedMemoryApproval ?? false,
      includesSecretLikeInput: request.input.includesSecretLikeInput ?? false,
      auditMetadata: {
        ...(request.input.auditMetadata.actorId ? { actorId: request.input.auditMetadata.actorId } : {}),
        reason: request.input.auditMetadata.reason,
        source: "mcp_adapter"
      }
    },
    expected: {}
  };
}

function createMcpContractResponse(
  request: SourceWireMcpContractRequest,
  toolDeclaration: SourceWireMcpContractToolDeclaration,
  overrides: Partial<SourceWireMcpContractResponse>
): SourceWireMcpContractResponse {
  const status = overrides.status ?? "denied";
  const response: SourceWireMcpContractResponse = {
    requestId: request.input.requestId,
    traceId: request.input.traceId,
    toolName: request.toolName,
    status,
    requiredCapability: toolDeclaration.requiredCapability,
    endpointGroup: toolDeclaration.endpointGroup,
    action: toolDeclaration.action,
    ownerId: request.input.ownerId ?? "",
    namespaceId: request.input.namespaceId ?? "",
    toolDeclarationFound: true,
    inputValidated: false,
    capabilityMapped: false,
    namespaceForwarded: false,
    apiPolicyRouted: false,
    apiPolicyBypassed: false,
    directDatabaseAccessAttempted: false,
    directRuntimeAdapterAccessAttempted: false,
    citationsPreserved: false,
    gapsPreserved: false,
    citationCount: 0,
    gapCount: 0,
    trustedMemoryReturned: false,
    sourceEvidenceReturned: false,
    contextAssembled: false,
    sourceMaintenanceAccepted: false,
    candidateReviewed: false,
    trustedMemoryCreated: false,
    sourceEvidencePromoted: false,
    automaticTrustedMemoryPromotion: false,
    secretReturned: false,
    sourceWireHostsUserMemory: false,
    runtimeMode: "synthetic_mcp_adapter_contract",
    boundary: SOURCE_WIRE_MCP_ADAPTER_CONTRACT_BOUNDARY,
    audit: {
      callerId: request.caller.callerId ?? "unknown_synthetic_mcp_caller",
      callerKind: request.caller.callerKind,
      ownerId: request.input.ownerId ?? "",
      namespaceId: request.input.namespaceId ?? "",
      toolName: request.toolName,
      result: status,
      boundaryPath: "mcp_adapter_to_source_wire_api_policy",
      leakedContent: false,
      rawSecretReturned: false,
      sourceEvidencePromoted: false
    },
    ...overrides
  };

  return {
    ...response,
    apiPolicyBypassed: false,
    sourceEvidencePromoted: false,
    automaticTrustedMemoryPromotion: false,
    secretReturned: false,
    sourceWireHostsUserMemory: false,
    audit: {
      ...response.audit,
      result: response.status,
      leakedContent: false,
      rawSecretReturned: false,
      sourceEvidencePromoted: false,
      boundaryPath: "mcp_adapter_to_source_wire_api_policy"
    }
  };
}

function fallbackDeclaration(toolName: SourceWireMcpContractToolName): SourceWireMcpContractToolDeclaration {
  return {
    toolName,
    requiredCapability: "read_source_evidence",
    endpointGroup: "source_evidence_search",
    action: "search_source_evidence",
    mutationAuthority: "read_only"
  };
}
