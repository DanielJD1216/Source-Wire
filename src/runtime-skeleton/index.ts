export type SourceWireRuntimeSkeletonStatus = "allowed" | "denied" | "partial_success" | "gap";

export type SourceWireRuntimeSkeletonCallerKind = "owner_hosted_api_client" | "mcp_tool" | "owner_controlled_application";

export type SourceWireRuntimeSkeletonCapability =
  | "read_trusted_memory"
  | "read_source_evidence"
  | "import_or_maintain_sources"
  | "prepare_candidates"
  | "approve_trusted_memory";

export type SourceWireRuntimeSkeletonCitation = {
  evidenceKind: "trusted_memory" | "source_evidence";
  sourceId: string;
  segmentId: string;
  address: string;
};

export type SourceWireRuntimeSkeletonCaller = {
  callerId: string;
  kind: SourceWireRuntimeSkeletonCallerKind;
  allowedNamespaceIds: string[];
  capabilities: SourceWireRuntimeSkeletonCapability[];
};

export type SourceWireRuntimeSkeletonApiRequest = {
  requestId: string;
  route:
    | "POST /synthetic/v1/search/trusted-memory"
    | "POST /synthetic/v1/search/source-evidence"
    | "POST /synthetic/v1/sources/maintain"
    | "POST /synthetic/v1/candidates/prepare"
    | "POST /synthetic/v1/candidates/approve";
  namespaceId: string;
  action:
    | "search_trusted_memory"
    | "search_source_evidence"
    | "maintain_source_connection"
    | "prepare_candidate"
    | "approve_trusted_memory";
  query?: string;
};

export type SourceWireRuntimeSkeletonMcpRequest = {
  requestId: string;
  tool:
    | "search_trusted_memory"
    | "search_source_evidence"
    | "maintain_source_connection"
    | "prepare_candidate"
    | "approve_trusted_memory";
  namespaceId: string;
  query?: string;
};

export type SourceWireRuntimeSkeletonResponse = {
  status: SourceWireRuntimeSkeletonStatus;
  requestId: string;
  namespaceId: string;
  sourceWireHostsUserMemory: false;
  runtimeMode: "synthetic_owner_hosted_skeleton";
  trustedMemoryReturned: boolean;
  sourceEvidenceReturned: boolean;
  pendingCandidateCreated: boolean;
  trustedMemoryCreated: boolean;
  noAutoPromotion: boolean;
  citationCount: number;
  citations: SourceWireRuntimeSkeletonCitation[];
  omittedCount: number;
  gapKinds: string[];
  denialReason?: string;
  requiredCapability?: SourceWireRuntimeSkeletonCapability;
  approvalPath?: "owner_or_application_controlled";
  audit: {
    callerId: string;
    callerKind: SourceWireRuntimeSkeletonCallerKind;
    namespaceId: string;
    action: SourceWireRuntimeSkeletonApiRequest["action"];
    boundaryPath: "owner_hosted_api_policy" | "mcp_adapter_to_owner_hosted_api_policy";
    result: SourceWireRuntimeSkeletonStatus;
    leakedContent: false;
    rawTokenReturned: false;
    privatePathReturned: false;
  };
};

export type SourceWireRuntimeSkeletonFixtureCase = {
  caseId: string;
  caller: SourceWireRuntimeSkeletonCaller;
  via: "api" | "mcp";
  request: SourceWireRuntimeSkeletonApiRequest | SourceWireRuntimeSkeletonMcpRequest;
  expected: Partial<
    Pick<
      SourceWireRuntimeSkeletonResponse,
      | "status"
      | "trustedMemoryReturned"
      | "sourceEvidenceReturned"
      | "pendingCandidateCreated"
      | "trustedMemoryCreated"
      | "noAutoPromotion"
      | "citationCount"
      | "omittedCount"
      | "denialReason"
      | "requiredCapability"
      | "approvalPath"
    >
  >;
};

export type SourceWireRuntimeSkeletonFixtureMatrix = {
  fixtureType: "source-wire-runtime-skeleton-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: typeof SOURCE_WIRE_RUNTIME_SKELETON_BOUNDARY;
  cases: SourceWireRuntimeSkeletonFixtureCase[];
};

export const SOURCE_WIRE_RUNTIME_SKELETON_BOUNDARY = {
  hosting: "owner_hosted",
  implementationMode: "synthetic_route_and_adapter_skeleton",
  sourceWireHostsUserMemory: false,
  apiServerIncluded: false,
  mcpServerIncluded: false,
  databaseIncluded: false,
  databaseMigrationsIncluded: false,
  realDataIncluded: false,
  deploymentIncluded: false,
  missionControlIncluded: false,
  memoryEngineIncluded: false,
  mcpBypassesApiPolicy: false,
  trustedMemoryPromotion: "owner_or_application_controlled"
} as const;

const syntheticTrustedCitation: SourceWireRuntimeSkeletonCitation = {
  evidenceKind: "trusted_memory",
  sourceId: "mem_demo_alpha_decision",
  segmentId: "tmr_demo_alpha_001",
  address: "synthetic://trusted-memory/project-alpha/onboarding-decision"
};

const syntheticSourceCitations: SourceWireRuntimeSkeletonCitation[] = [
  {
    evidenceKind: "source_evidence",
    sourceId: "src_demo_alpha_notes",
    segmentId: "seg_demo_alpha_001",
    address: "synthetic://source-evidence/project-alpha/onboarding-notes#1"
  },
  {
    evidenceKind: "source_evidence",
    sourceId: "src_demo_alpha_notes",
    segmentId: "seg_demo_alpha_002",
    address: "synthetic://source-evidence/project-alpha/onboarding-notes#2"
  }
];

export function callRuntimeSkeletonApiPolicy(
  caller: SourceWireRuntimeSkeletonCaller,
  request: SourceWireRuntimeSkeletonApiRequest
): SourceWireRuntimeSkeletonResponse {
  const requiredCapability = capabilityForAction(request.action);

  if (!caller.allowedNamespaceIds.includes(request.namespaceId)) {
    return createResponse(caller, request, {
      status: "denied",
      requiredCapability,
      omittedCount: 1,
      denialReason: "namespace_not_allowed"
    });
  }

  if (!caller.capabilities.includes(requiredCapability)) {
    return createResponse(caller, request, {
      status: "denied",
      requiredCapability,
      omittedCount: 1,
      denialReason: `missing_${requiredCapability}_capability`
    });
  }

  if (request.action === "search_trusted_memory") {
    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      trustedMemoryReturned: true,
      citations: [syntheticTrustedCitation]
    });
  }

  if (request.action === "search_source_evidence") {
    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      sourceEvidenceReturned: true,
      citations: syntheticSourceCitations
    });
  }

  if (request.action === "maintain_source_connection") {
    return createResponse(caller, request, {
      status: "partial_success",
      requiredCapability,
      pendingCandidateCreated: true,
      gapKinds: ["stale_evidence"],
      noAutoPromotion: true
    });
  }

  if (request.action === "prepare_candidate") {
    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      pendingCandidateCreated: true,
      noAutoPromotion: true
    });
  }

  if (request.action === "approve_trusted_memory") {
    if (caller.kind !== "owner_controlled_application") {
      return createResponse(caller, request, {
        status: "denied",
        requiredCapability,
        omittedCount: 1,
        denialReason: "approval_requires_owner_or_application_control"
      });
    }

    return createResponse(caller, request, {
      status: "allowed",
      requiredCapability,
      trustedMemoryCreated: true,
      noAutoPromotion: false,
      approvalPath: "owner_or_application_controlled"
    });
  }

  return createResponse(caller, request, {
    status: "denied",
    requiredCapability,
    omittedCount: 1,
    denialReason: "unsupported_synthetic_action"
  });
}

export function callRuntimeSkeletonMcpAdapter(
  caller: SourceWireRuntimeSkeletonCaller,
  request: SourceWireRuntimeSkeletonMcpRequest
): SourceWireRuntimeSkeletonResponse {
  const apiRequest = mapMcpToRuntimeSkeletonApiRequest(request);
  const response = callRuntimeSkeletonApiPolicy(caller, apiRequest);

  return {
    ...response,
    audit: {
      ...response.audit,
      boundaryPath: "mcp_adapter_to_owner_hosted_api_policy"
    }
  };
}

export function runRuntimeSkeletonFixtureCase(
  fixtureCase: SourceWireRuntimeSkeletonFixtureCase
): SourceWireRuntimeSkeletonResponse {
  if (fixtureCase.via === "mcp") {
    return callRuntimeSkeletonMcpAdapter(
      fixtureCase.caller,
      fixtureCase.request as SourceWireRuntimeSkeletonMcpRequest
    );
  }

  return callRuntimeSkeletonApiPolicy(
    fixtureCase.caller,
    fixtureCase.request as SourceWireRuntimeSkeletonApiRequest
  );
}

export function runRuntimeSkeletonFixtureMatrix(
  matrix: SourceWireRuntimeSkeletonFixtureMatrix
): SourceWireRuntimeSkeletonResponse[] {
  return matrix.cases.map((fixtureCase) => runRuntimeSkeletonFixtureCase(fixtureCase));
}

function mapMcpToRuntimeSkeletonApiRequest(
  request: SourceWireRuntimeSkeletonMcpRequest
): SourceWireRuntimeSkeletonApiRequest {
  const actionByTool = {
    search_trusted_memory: "search_trusted_memory",
    search_source_evidence: "search_source_evidence",
    maintain_source_connection: "maintain_source_connection",
    prepare_candidate: "prepare_candidate",
    approve_trusted_memory: "approve_trusted_memory"
  } satisfies Record<SourceWireRuntimeSkeletonMcpRequest["tool"], SourceWireRuntimeSkeletonApiRequest["action"]>;

  const routeByTool = {
    search_trusted_memory: "POST /synthetic/v1/search/trusted-memory",
    search_source_evidence: "POST /synthetic/v1/search/source-evidence",
    maintain_source_connection: "POST /synthetic/v1/sources/maintain",
    prepare_candidate: "POST /synthetic/v1/candidates/prepare",
    approve_trusted_memory: "POST /synthetic/v1/candidates/approve"
  } satisfies Record<SourceWireRuntimeSkeletonMcpRequest["tool"], SourceWireRuntimeSkeletonApiRequest["route"]>;

  const apiRequest: SourceWireRuntimeSkeletonApiRequest = {
    requestId: request.requestId,
    route: routeByTool[request.tool],
    namespaceId: request.namespaceId,
    action: actionByTool[request.tool]
  };

  if (typeof request.query === "string") {
    apiRequest.query = request.query;
  }

  return apiRequest;
}

function capabilityForAction(
  action: SourceWireRuntimeSkeletonApiRequest["action"]
): SourceWireRuntimeSkeletonCapability {
  if (action === "search_trusted_memory") return "read_trusted_memory";
  if (action === "search_source_evidence") return "read_source_evidence";
  if (action === "maintain_source_connection") return "import_or_maintain_sources";
  if (action === "prepare_candidate") return "prepare_candidates";
  return "approve_trusted_memory";
}

function createResponse(
  caller: SourceWireRuntimeSkeletonCaller,
  request: SourceWireRuntimeSkeletonApiRequest,
  options: {
    status: SourceWireRuntimeSkeletonStatus;
    requiredCapability?: SourceWireRuntimeSkeletonCapability;
    trustedMemoryReturned?: boolean;
    sourceEvidenceReturned?: boolean;
    pendingCandidateCreated?: boolean;
    trustedMemoryCreated?: boolean;
    noAutoPromotion?: boolean;
    citations?: SourceWireRuntimeSkeletonCitation[];
    omittedCount?: number;
    gapKinds?: string[];
    denialReason?: string;
    approvalPath?: "owner_or_application_controlled";
  }
): SourceWireRuntimeSkeletonResponse {
  const citations = options.citations ?? [];

  const response: SourceWireRuntimeSkeletonResponse = {
    status: options.status,
    requestId: request.requestId,
    namespaceId: request.namespaceId,
    sourceWireHostsUserMemory: false,
    runtimeMode: "synthetic_owner_hosted_skeleton",
    trustedMemoryReturned: options.trustedMemoryReturned ?? false,
    sourceEvidenceReturned: options.sourceEvidenceReturned ?? false,
    pendingCandidateCreated: options.pendingCandidateCreated ?? false,
    trustedMemoryCreated: options.trustedMemoryCreated ?? false,
    noAutoPromotion: options.noAutoPromotion ?? true,
    citationCount: citations.length,
    citations,
    omittedCount: options.omittedCount ?? 0,
    gapKinds: options.gapKinds ?? [],
    audit: {
      callerId: caller.callerId,
      callerKind: caller.kind,
      namespaceId: request.namespaceId,
      action: request.action,
      boundaryPath: "owner_hosted_api_policy",
      result: options.status,
      leakedContent: false,
      rawTokenReturned: false,
      privatePathReturned: false
    }
  };

  if (typeof options.denialReason === "string") {
    response.denialReason = options.denialReason;
  }

  if (typeof options.requiredCapability === "string") {
    response.requiredCapability = options.requiredCapability;
  }

  if (typeof options.approvalPath === "string") {
    response.approvalPath = options.approvalPath;
  }

  return response;
}
