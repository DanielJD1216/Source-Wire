export type SourceWireApiContractCallerKind =
  | "unknown"
  | "owner_hosted_api_client"
  | "mcp_tool"
  | "owner_controlled_application";

export type SourceWireApiContractCapability =
  | "read_trusted_memory"
  | "read_source_evidence"
  | "assemble_context"
  | "maintain_sources"
  | "create_candidates"
  | "review_candidates"
  | "approve_trusted_memory"
  | "read_handoff_status"
  | "write_handoff_status"
  | "read_audit_summary";

export type SourceWireApiContractEndpointGroup =
  | "trusted_memory_read"
  | "source_evidence_search"
  | "context_assembly"
  | "source_maintenance"
  | "candidate_creation"
  | "candidate_review"
  | "trusted_memory_approval"
  | "handoff_status_evidence"
  | "audit_summary";

export type SourceWireApiContractAction =
  | "read_trusted_memory"
  | "search_source_evidence"
  | "assemble_context"
  | "maintain_source"
  | "create_candidate"
  | "review_candidate"
  | "approve_trusted_memory"
  | "read_handoff_status"
  | "write_handoff_status"
  | "read_audit_summary";

export type SourceWireApiContractStatus = "allowed" | "denied" | "partial_success" | "pending_review";

export type SourceWireApiContractCitation = {
  citationKind: "trusted_memory" | "source_evidence" | "handoff_status";
  sourceId: string;
  segmentId: string;
  address: string;
};

export type SourceWireApiContractGap = {
  gapKind:
    | "missing_trusted_memory"
    | "stale_source_evidence"
    | "owner_review_required"
    | "audit_summary_redacted"
    | "partial_context";
  message: string;
};

export type SourceWireApiContractCaller = {
  callerId?: string;
  callerKind: SourceWireApiContractCallerKind;
  ownerId: string;
  allowedNamespaceIds: string[];
  capabilities: SourceWireApiContractCapability[];
};

export type SourceWireApiContractRequest = {
  requestId: string;
  traceId: string;
  ownerId: string;
  namespaceId: string;
  endpointGroup: SourceWireApiContractEndpointGroup;
  action: SourceWireApiContractAction;
  requiredCapability: SourceWireApiContractCapability;
  viaMcp: boolean;
  mcpRoutesThroughApiPolicy: boolean;
  explicitTrustedMemoryApproval: boolean;
  includesSecretLikeInput: boolean;
  auditMetadata: {
    actorId?: string;
    reason: string;
    source: "api" | "mcp_adapter" | "owner_application";
  };
};

export type SourceWireApiContractResponse = {
  requestId: string;
  traceId: string;
  status: SourceWireApiContractStatus;
  endpointGroup: SourceWireApiContractEndpointGroup;
  action: SourceWireApiContractAction;
  ownerId: string;
  namespaceId: string;
  requiredCapability: SourceWireApiContractCapability;
  denialReason?: string;
  citations: SourceWireApiContractCitation[];
  gaps: SourceWireApiContractGap[];
  trustedMemoryReturned: boolean;
  sourceEvidenceReturned: boolean;
  contextAssembled: boolean;
  sourceMaintenanceAccepted: boolean;
  candidateCreated: boolean;
  candidateReviewed: boolean;
  trustedMemoryCreated: boolean;
  handoffStatusAccepted: boolean;
  auditSummaryReturned: boolean;
  sourceEvidencePromoted: false;
  secretReturned: false;
  mcpBypassedApiPolicy: false;
  sourceWireHostsUserMemory: false;
  runtimeMode: "synthetic_api_policy_contract";
  boundary: typeof SOURCE_WIRE_API_POLICY_CONTRACT_BOUNDARY;
  audit: {
    callerId: string;
    callerKind: SourceWireApiContractCallerKind;
    ownerId: string;
    namespaceId: string;
    endpointGroup: SourceWireApiContractEndpointGroup;
    action: SourceWireApiContractAction;
    result: SourceWireApiContractStatus;
    leakedContent: false;
    rawSecretReturned: false;
    sourceEvidencePromoted: false;
    boundaryPath: "source_wire_api_policy" | "mcp_adapter_to_source_wire_api_policy";
  };
};

export type SourceWireApiContractFixtureCase = {
  caseId: string;
  caller: SourceWireApiContractCaller;
  request: SourceWireApiContractRequest;
  expected: Partial<
    Pick<
      SourceWireApiContractResponse,
      | "status"
      | "denialReason"
      | "trustedMemoryReturned"
      | "sourceEvidenceReturned"
      | "contextAssembled"
      | "sourceMaintenanceAccepted"
      | "candidateCreated"
      | "candidateReviewed"
      | "trustedMemoryCreated"
      | "handoffStatusAccepted"
      | "auditSummaryReturned"
      | "sourceEvidencePromoted"
      | "secretReturned"
      | "mcpBypassedApiPolicy"
    >
  > & {
    citationCount?: number;
    gapCount?: number;
  };
};

export type SourceWireApiContractFixtureMatrix = {
  fixtureType: "source-wire-api-policy-contract-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: typeof SOURCE_WIRE_API_POLICY_CONTRACT_BOUNDARY;
  cases: SourceWireApiContractFixtureCase[];
};

export const SOURCE_WIRE_API_POLICY_CONTRACT_BOUNDARY = {
  implementationMode: "synthetic_api_policy_contract",
  sourceWireHostsUserMemory: false,
  apiServerIncluded: false,
  routeHandlersIncluded: false,
  mcpServerRuntimeIncluded: false,
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
  mcpMayBypassApiPolicy: false,
  sourceEvidenceMayAutoPromoteToTrustedMemory: false,
  trustedMemoryPromotion: "owner_or_application_controlled"
} as const;

const trustedMemoryCitation: SourceWireApiContractCitation = {
  citationKind: "trusted_memory",
  sourceId: "mem_demo_alpha_strategy",
  segmentId: "tmr_demo_alpha_strategy_001",
  address: "synthetic://trusted-memory/ns-demo-alpha/strategy#decision"
};

const sourceEvidenceCitation: SourceWireApiContractCitation = {
  citationKind: "source_evidence",
  sourceId: "src_demo_alpha_notes",
  segmentId: "seg_demo_alpha_notes_001",
  address: "synthetic://source-evidence/ns-demo-alpha/notes#1"
};

const handoffStatusCitation: SourceWireApiContractCitation = {
  citationKind: "handoff_status",
  sourceId: "handoff_demo_alpha_unit",
  segmentId: "handoff_demo_alpha_001",
  address: "synthetic://handoff-status/ns-demo-alpha/unit#latest"
};

export function evaluateApiPolicyContractCase(
  fixtureCase: SourceWireApiContractFixtureCase
): SourceWireApiContractResponse {
  const { caller, request } = fixtureCase;

  if (!caller.callerId || caller.callerKind === "unknown") {
    return createApiContractResponse(caller, request, {
      status: "denied",
      denialReason: "caller_identity_required"
    });
  }

  if (caller.ownerId !== request.ownerId) {
    return createApiContractResponse(caller, request, {
      status: "denied",
      denialReason: "owner_mismatch"
    });
  }

  if (!caller.allowedNamespaceIds.includes(request.namespaceId)) {
    return createApiContractResponse(caller, request, {
      status: "denied",
      denialReason: "namespace_not_allowed"
    });
  }

  if (!caller.capabilities.includes(request.requiredCapability)) {
    return createApiContractResponse(caller, request, {
      status: "denied",
      denialReason: `missing_${request.requiredCapability}_capability`
    });
  }

  if (request.viaMcp && !request.mcpRoutesThroughApiPolicy) {
    return createApiContractResponse(caller, request, {
      status: "denied",
      denialReason: "mcp_policy_bypass_blocked"
    });
  }

  if (!request.auditMetadata.actorId) {
    return createApiContractResponse(caller, request, {
      status: "denied",
      denialReason: "audit_actor_required"
    });
  }

  if (request.includesSecretLikeInput) {
    return createApiContractResponse(caller, request, {
      status: "denied",
      denialReason: "secret_like_input_redacted"
    });
  }

  if (request.action === "read_trusted_memory") {
    return createApiContractResponse(caller, request, {
      status: "allowed",
      trustedMemoryReturned: true,
      citations: [trustedMemoryCitation]
    });
  }

  if (request.action === "search_source_evidence") {
    return createApiContractResponse(caller, request, {
      status: "allowed",
      sourceEvidenceReturned: true,
      citations: [sourceEvidenceCitation],
      gaps: [staleSourceGap()]
    });
  }

  if (request.action === "assemble_context") {
    return createApiContractResponse(caller, request, {
      status: "partial_success",
      contextAssembled: true,
      citations: [trustedMemoryCitation, sourceEvidenceCitation],
      gaps: [partialContextGap()]
    });
  }

  if (request.action === "maintain_source") {
    return createApiContractResponse(caller, request, {
      status: "partial_success",
      sourceMaintenanceAccepted: true,
      candidateCreated: true,
      gaps: [staleSourceGap(), ownerReviewGap()]
    });
  }

  if (request.action === "create_candidate") {
    return createApiContractResponse(caller, request, {
      status: "pending_review",
      candidateCreated: true,
      gaps: [ownerReviewGap()]
    });
  }

  if (request.action === "review_candidate") {
    return createApiContractResponse(caller, request, {
      status: "allowed",
      candidateReviewed: true,
      gaps: [ownerReviewGap()]
    });
  }

  if (request.action === "approve_trusted_memory") {
    if (
      caller.callerKind !== "owner_controlled_application" ||
      !request.explicitTrustedMemoryApproval
    ) {
      return createApiContractResponse(caller, request, {
        status: "denied",
        denialReason: "trusted_memory_approval_requires_owner_or_application"
      });
    }

    return createApiContractResponse(caller, request, {
      status: "allowed",
      trustedMemoryCreated: true
    });
  }

  if (request.action === "read_handoff_status" || request.action === "write_handoff_status") {
    return createApiContractResponse(caller, request, {
      status: "allowed",
      handoffStatusAccepted: true,
      citations: [handoffStatusCitation]
    });
  }

  if (request.action === "read_audit_summary") {
    return createApiContractResponse(caller, request, {
      status: "partial_success",
      auditSummaryReturned: true,
      gaps: [auditSummaryRedactedGap()]
    });
  }

  return createApiContractResponse(caller, request, {
    status: "denied",
    denialReason: "unsupported_synthetic_api_action"
  });
}

export function evaluateApiPolicyContractFixtureMatrix(
  matrix: SourceWireApiContractFixtureMatrix
): SourceWireApiContractResponse[] {
  return matrix.cases.map((fixtureCase) => evaluateApiPolicyContractCase(fixtureCase));
}

function createApiContractResponse(
  caller: SourceWireApiContractCaller,
  request: SourceWireApiContractRequest,
  overrides: Partial<SourceWireApiContractResponse>
): SourceWireApiContractResponse {
  const status = overrides.status ?? "denied";
  const boundaryPath = request.viaMcp
    ? "mcp_adapter_to_source_wire_api_policy"
    : "source_wire_api_policy";

  const response: SourceWireApiContractResponse = {
    requestId: request.requestId,
    traceId: request.traceId,
    status,
    endpointGroup: request.endpointGroup,
    action: request.action,
    ownerId: request.ownerId,
    namespaceId: request.namespaceId,
    requiredCapability: request.requiredCapability,
    citations: [],
    gaps: [],
    trustedMemoryReturned: false,
    sourceEvidenceReturned: false,
    contextAssembled: false,
    sourceMaintenanceAccepted: false,
    candidateCreated: false,
    candidateReviewed: false,
    trustedMemoryCreated: false,
    handoffStatusAccepted: false,
    auditSummaryReturned: false,
    sourceEvidencePromoted: false,
    secretReturned: false,
    mcpBypassedApiPolicy: false,
    sourceWireHostsUserMemory: false,
    runtimeMode: "synthetic_api_policy_contract",
    boundary: SOURCE_WIRE_API_POLICY_CONTRACT_BOUNDARY,
    audit: {
      callerId: caller.callerId ?? "unknown_synthetic_caller",
      callerKind: caller.callerKind,
      ownerId: request.ownerId,
      namespaceId: request.namespaceId,
      endpointGroup: request.endpointGroup,
      action: request.action,
      result: status,
      leakedContent: false,
      rawSecretReturned: false,
      sourceEvidencePromoted: false,
      boundaryPath
    },
    ...overrides
  };

  return {
    ...response,
    sourceEvidencePromoted: false,
    secretReturned: false,
    mcpBypassedApiPolicy: false,
    sourceWireHostsUserMemory: false
  };
}

function staleSourceGap(): SourceWireApiContractGap {
  return {
    gapKind: "stale_source_evidence",
    message: "Synthetic source evidence needs refresh before it can become trusted memory."
  };
}

function ownerReviewGap(): SourceWireApiContractGap {
  return {
    gapKind: "owner_review_required",
    message: "Synthetic candidate remains pending owner or application review."
  };
}

function partialContextGap(): SourceWireApiContractGap {
  return {
    gapKind: "partial_context",
    message: "Synthetic context assembly returned cited evidence plus a gap."
  };
}

function auditSummaryRedactedGap(): SourceWireApiContractGap {
  return {
    gapKind: "audit_summary_redacted",
    message: "Synthetic audit summary omits raw secrets and hidden content."
  };
}
