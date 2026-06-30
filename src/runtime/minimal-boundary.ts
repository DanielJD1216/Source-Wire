import type { SourceWireOwnerHostedApiMcpProofCase } from "../contracts/fixtures.js";

export type SourceWireMinimalRuntimeStatus = "allowed" | "denied" | "partial_success";

export type SourceWireMinimalRuntimeCitation = {
  sourceId: string;
  segmentId: string;
  address: string;
};

export type SourceWireMinimalRuntimeResult = {
  status: SourceWireMinimalRuntimeStatus;
  trustedMemoryReturned: boolean;
  sourceEvidenceReturned: boolean;
  noAutoPromotion: boolean;
  citationCount?: number;
  citations?: SourceWireMinimalRuntimeCitation[];
  omittedCount?: number;
  denialReason?: string;
  importedCount?: number;
  changedCount?: number;
  staleCount?: number;
  skippedCount?: number;
  errorCount?: number;
  pendingCandidateCount?: number;
  pendingCandidateCreated?: boolean;
  pendingCandidateClosed?: boolean;
  trustedMemoryCreatedCount?: number;
  requiresOwnerReview?: boolean;
  approvalPath?: "owner_or_application_controlled";
};

export type SourceWireMinimalRuntimeAudit = {
  eventType: string;
  result: SourceWireMinimalRuntimeStatus;
  syntheticTraceId: string;
  actorKind: SourceWireOwnerHostedApiMcpProofCase["actor"]["kind"];
  namespaceId: string;
  boundaryPath: "owner_hosted_api_policy" | "mcp_tool_to_owner_hosted_api_policy";
  leakedContent: false;
};

export type SourceWireMinimalRuntimeProofResult = {
  caseId: string;
  result: SourceWireMinimalRuntimeResult;
  audit: SourceWireMinimalRuntimeAudit;
};

export const SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY = {
  hosting: "owner_hosted",
  implementationMode: "synthetic_in_memory",
  sourceWireHostsUserMemory: false,
  apiServerIncluded: false,
  mcpServerIncluded: false,
  databaseIncluded: false,
  noAutoPromotionByDefault: true
} as const;

const sourceEvidenceCitations: SourceWireMinimalRuntimeCitation[] = [
  {
    sourceId: "src_demo_alpha_notes",
    segmentId: "seg_demo_alpha_001",
    address: "synthetic://project-alpha/onboarding-notes#section-1"
  },
  {
    sourceId: "src_demo_alpha_notes",
    segmentId: "seg_demo_alpha_002",
    address: "synthetic://project-alpha/onboarding-notes#section-2"
  }
];

export function runMinimalRuntimeProofCase(
  proofCase: SourceWireOwnerHostedApiMcpProofCase
): SourceWireMinimalRuntimeProofResult {
  const apiRequest = mapMcpToApiPolicyRequest(proofCase);
  const result = callOwnerHostedApiPolicy(apiRequest);

  return {
    caseId: proofCase.caseId,
    result,
    audit: {
      eventType: proofCase.audit.eventType,
      result: result.status,
      syntheticTraceId: proofCase.audit.syntheticTraceId,
      actorKind: proofCase.actor.kind,
      namespaceId: proofCase.request.namespaceId,
      boundaryPath:
        proofCase.actor.kind === "mcp_tool"
          ? "mcp_tool_to_owner_hosted_api_policy"
          : "owner_hosted_api_policy",
      leakedContent: false
    }
  };
}

export function runMinimalRuntimeProofCases(
  proofCases: SourceWireOwnerHostedApiMcpProofCase[]
): SourceWireMinimalRuntimeProofResult[] {
  return proofCases.map((proofCase) => runMinimalRuntimeProofCase(proofCase));
}

type ApiPolicyRequest = {
  proofCase: SourceWireOwnerHostedApiMcpProofCase;
  requiredCapability: string;
};

function mapMcpToApiPolicyRequest(proofCase: SourceWireOwnerHostedApiMcpProofCase): ApiPolicyRequest {
  return {
    proofCase,
    requiredCapability: requiredCapabilityFor(proofCase)
  };
}

function callOwnerHostedApiPolicy(request: ApiPolicyRequest): SourceWireMinimalRuntimeResult {
  const { proofCase, requiredCapability } = request;

  if (!proofCase.actor.allowedNamespaceIds.includes(proofCase.request.namespaceId)) {
    return deny("namespace_not_allowed");
  }

  if (!proofCase.actor.capabilities.includes(requiredCapability)) {
    return deny(`missing_${requiredCapability}_capability`);
  }

  if (proofCase.request.tool === "search_memory") {
    return {
      status: "allowed",
      trustedMemoryReturned: true,
      sourceEvidenceReturned: false,
      omittedCount: 0,
      citationCount: 1,
      noAutoPromotion: true
    };
  }

  if (proofCase.request.tool === "search_sources") {
    return {
      status: "allowed",
      trustedMemoryReturned: false,
      sourceEvidenceReturned: true,
      citationCount: sourceEvidenceCitations.length,
      citations: sourceEvidenceCitations,
      noAutoPromotion: true
    };
  }

  if (proofCase.request.tool === "maintain_source_connection") {
    return {
      status: "partial_success",
      trustedMemoryReturned: false,
      sourceEvidenceReturned: false,
      importedCount: 1,
      changedCount: 2,
      staleCount: 0,
      skippedCount: 1,
      errorCount: 0,
      pendingCandidateCount: 2,
      trustedMemoryCreatedCount: 0,
      noAutoPromotion: true
    };
  }

  if (proofCase.request.apiRoute === "POST /synthetic/v1/candidates/prepare") {
    return {
      status: "allowed",
      trustedMemoryReturned: false,
      sourceEvidenceReturned: false,
      pendingCandidateCreated: true,
      trustedMemoryCreatedCount: 0,
      requiresOwnerReview: true,
      noAutoPromotion: true
    };
  }

  if (proofCase.request.apiRoute === "POST /synthetic/v1/candidates/cand_demo_alpha_001/approve") {
    if (proofCase.actor.kind !== "owner_controlled_application") {
      return deny("approval_requires_owner_controlled_application");
    }

    return {
      status: "allowed",
      trustedMemoryReturned: false,
      sourceEvidenceReturned: false,
      pendingCandidateClosed: true,
      trustedMemoryCreatedCount: 1,
      approvalPath: "owner_or_application_controlled",
      noAutoPromotion: false
    };
  }

  return deny("unsupported_synthetic_request");
}

function requiredCapabilityFor(proofCase: SourceWireOwnerHostedApiMcpProofCase): string {
  if (proofCase.request.tool === "search_memory") {
    return "read_trusted_memory";
  }

  if (proofCase.request.tool === "search_sources") {
    return "read_source_evidence";
  }

  if (proofCase.request.tool === "maintain_source_connection") {
    return "import_or_maintain_sources";
  }

  if (proofCase.request.apiRoute === "POST /synthetic/v1/candidates/prepare") {
    return "prepare_candidates";
  }

  if (proofCase.request.apiRoute === "POST /synthetic/v1/candidates/cand_demo_alpha_001/approve") {
    return "approve_trusted_memory";
  }

  return "unsupported_capability";
}

function deny(denialReason: string): SourceWireMinimalRuntimeResult {
  return {
    status: "denied",
    trustedMemoryReturned: false,
    sourceEvidenceReturned: false,
    omittedCount: 1,
    denialReason,
    noAutoPromotion: true
  };
}
