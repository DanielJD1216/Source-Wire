import {
  SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY,
  runMinimalRuntimeProofCases
} from "@source-wire/contracts";

import type { SourceWireOwnerHostedApiMcpProofCase } from "@source-wire/contracts";

const syntheticProofCases: SourceWireOwnerHostedApiMcpProofCase[] = [
  {
    caseId: "adopter_authorized_read",
    actor: {
      kind: "mcp_tool",
      syntheticTokenRef: "token_demo_read_project_alpha",
      allowedNamespaceIds: ["ns_demo_project_alpha"],
      capabilities: ["read_trusted_memory"]
    },
    request: {
      tool: "search_memory",
      namespaceId: "ns_demo_project_alpha",
      query: "What is the current onboarding decision?"
    },
    expectedResult: {
      status: "allowed",
      trustedMemoryReturned: true,
      sourceEvidenceReturned: false,
      omittedCount: 0,
      citationCount: 1,
      noAutoPromotion: true
    },
    audit: {
      eventType: "trusted_memory_read",
      result: "allowed",
      syntheticTraceId: "trace_adopter_001"
    }
  },
  {
    caseId: "adopter_wrong_namespace_denied",
    actor: {
      kind: "mcp_tool",
      syntheticTokenRef: "token_demo_project_alpha_only",
      allowedNamespaceIds: ["ns_demo_project_alpha"],
      capabilities: ["read_source_evidence"]
    },
    request: {
      tool: "search_sources",
      namespaceId: "ns_demo_client_beta",
      query: "Find client beta source evidence."
    },
    expectedResult: {
      status: "denied",
      trustedMemoryReturned: false,
      sourceEvidenceReturned: false,
      omittedCount: 1,
      denialReason: "namespace_not_allowed",
      noAutoPromotion: true
    },
    audit: {
      eventType: "source_evidence_read",
      result: "denied",
      syntheticTraceId: "trace_adopter_002"
    }
  }
];

export const minimalRuntimeBoundarySummary = {
  hosting: SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY.hosting,
  implementationMode: SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY.implementationMode,
  sourceWireHostsUserMemory: SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY.sourceWireHostsUserMemory,
  databaseIncluded: SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY.databaseIncluded
};

export const minimalRuntimeProofResults = runMinimalRuntimeProofCases(syntheticProofCases);

export const deniedNamespaceProof = minimalRuntimeProofResults.find(
  (result) => result.caseId === "adopter_wrong_namespace_denied"
);
