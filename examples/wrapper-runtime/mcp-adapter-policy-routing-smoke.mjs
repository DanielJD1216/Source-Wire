import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "wrapper-runtime",
  "wrapper-runtime-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

const results = fixture.syntheticMcpCalls.map((toolCall) => ({
  mcpCallId: toolCall.mcpCallId,
  result: callMcpAdapter(fixture, toolCall)
}));

assertMcpCall("mcp_call_demo_search_memory", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.mcpCallId, "status");
  assertEqual(proof.result.apiPolicyRequest.requiredCapability, "read_trusted_memory", proof.mcpCallId, "requiredCapability");
  assertEqual(proof.result.runtimeDirectCall, false, proof.mcpCallId, "runtimeDirectCall");
  assertEqual(proof.result.response.citationCount, 1, proof.mcpCallId, "citationCount");
  assertEqual(proof.result.response.citations[0].evidenceKind, "trusted_memory", proof.mcpCallId, "citation.evidenceKind");
  assertPreservedMetadata(proof.result, proof.mcpCallId);
});

assertMcpCall("mcp_call_demo_search_sources", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.mcpCallId, "status");
  assertEqual(proof.result.apiPolicyRequest.requiredCapability, "read_source_evidence", proof.mcpCallId, "requiredCapability");
  assertEqual(proof.result.response.citations[0].evidenceKind, "source_evidence", proof.mcpCallId, "citation.evidenceKind");
  assertPreservedMetadata(proof.result, proof.mcpCallId);
});

assertMcpCall("mcp_call_demo_maintain_source", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.mcpCallId, "status");
  assertEqual(proof.result.apiPolicyRequest.requiredCapability, "prepare_candidates", proof.mcpCallId, "requiredCapability");
  assertEqual(proof.result.response.noAutoPromotion, true, proof.mcpCallId, "noAutoPromotion");
  assertEqual(proof.result.response.trustedMemoryCreated, false, proof.mcpCallId, "trustedMemoryCreated");
  assertPreservedMetadata(proof.result, proof.mcpCallId);
});

assertMcpCall("mcp_call_demo_approve_trusted_memory_denied", (proof) => {
  assertEqual(proof.result.status, "denied", proof.mcpCallId, "status");
  assertEqual(proof.result.denialReason, "mcp_approval_not_allowed_by_default", proof.mcpCallId, "denialReason");
  assertEqual(proof.result.omittedCount, 1, proof.mcpCallId, "omittedCount");
  assertEqual(proof.result.runtimeDirectCall, false, proof.mcpCallId, "runtimeDirectCall");
  assertPreservedMetadata(proof.result, proof.mcpCallId);
});

assertMcpCall("mcp_call_demo_save_memory_forbidden", (proof) => {
  assertEqual(proof.result.status, "denied", proof.mcpCallId, "status");
  assertEqual(proof.result.denialReason, "mcp_direct_memory_engine_tool_forbidden", proof.mcpCallId, "denialReason");
  assertEqual(proof.result.memoryEngineSaveDeleteExposed, false, proof.mcpCallId, "memoryEngineSaveDeleteExposed");
  assertEqual(proof.result.runtimeDirectCall, false, proof.mcpCallId, "runtimeDirectCall");
});

assertMcpCall("mcp_call_demo_delete_memory_forbidden", (proof) => {
  assertEqual(proof.result.status, "denied", proof.mcpCallId, "status");
  assertEqual(proof.result.denialReason, "mcp_direct_memory_engine_tool_forbidden", proof.mcpCallId, "denialReason");
  assertEqual(proof.result.memoryEngineSaveDeleteExposed, false, proof.mcpCallId, "memoryEngineSaveDeleteExposed");
  assertEqual(proof.result.runtimeDirectCall, false, proof.mcpCallId, "runtimeDirectCall");
});

for (const proof of results) {
  console.log(`ok wrapper runtime mcp adapter case ${proof.mcpCallId}`);
}

console.log("ok wrapper runtime mcp adapter policy routing smoke");

function callMcpAdapter(data, toolCall) {
  if (toolCall.tool === "save_memory" || toolCall.tool === "delete_memory") {
    return {
      status: "denied",
      denialReason: "mcp_direct_memory_engine_tool_forbidden",
      namespaceId: toolCall.namespaceId,
      caller: toolCall.caller,
      omittedCount: 1,
      runtimeDirectCall: false,
      memoryEngineSaveDeleteExposed: false
    };
  }

  const apiPolicyRequest = mapMcpToolCallToApiPolicyRequest(toolCall);

  if (toolCall.tool === "approve_trusted_memory") {
    return {
      status: "denied",
      denialReason: "mcp_approval_not_allowed_by_default",
      namespaceId: toolCall.namespaceId,
      caller: toolCall.caller,
      omittedCount: 1,
      runtimeDirectCall: false,
      memoryEngineSaveDeleteExposed: false,
      apiPolicyRequest,
      audit: safeAudit(toolCall, "denied", 0, 1)
    };
  }

  return {
    status: "allowed",
    namespaceId: toolCall.namespaceId,
    caller: toolCall.caller,
    runtimeDirectCall: false,
    memoryEngineSaveDeleteExposed: false,
    apiPolicyRequest,
    response: callApiPolicyWrapper(data, toolCall),
    audit: safeAudit(toolCall, "allowed", 1, 0)
  };
}

function mapMcpToolCallToApiPolicyRequest(toolCall) {
  return {
    route: routeForTool(toolCall.tool),
    requiredCapability: toolCall.requiredCapability,
    namespaceId: toolCall.namespaceId,
    caller: toolCall.caller,
    via: "mcp_adapter_to_source_wire_api_policy",
    runtimeDirectCall: false
  };
}

function callApiPolicyWrapper(data, toolCall) {
  if (toolCall.tool === "search_memory") {
    const trustedMemory = data.syntheticTrustedMemory.find((memory) => memory.namespaceId === toolCall.namespaceId);
    return {
      citationCount: trustedMemory ? 1 : 0,
      citations: trustedMemory ? [trustedMemory.citation] : [],
      noAutoPromotion: true
    };
  }

  if (toolCall.tool === "search_sources") {
    const sourceEvidence = data.syntheticSourceEvidence.find((source) => source.namespaceId === toolCall.namespaceId);
    return {
      citationCount: sourceEvidence ? 1 : 0,
      citations: sourceEvidence ? [sourceEvidence.citation] : [],
      noAutoPromotion: true
    };
  }

  if (toolCall.tool === "maintain_source_connection") {
    return {
      candidateStatus: "pending",
      trustedMemoryCreated: false,
      noAutoPromotion: true,
      gapId: undefined
    };
  }

  return {
    citationCount: 0,
    citations: [],
    noAutoPromotion: true
  };
}

function routeForTool(tool) {
  if (tool === "search_memory") {
    return "POST /synthetic/v1/policy/search/trusted-memory";
  }

  if (tool === "search_sources") {
    return "POST /synthetic/v1/policy/search/source-evidence";
  }

  if (tool === "maintain_source_connection") {
    return "POST /synthetic/v1/policy/source-maintenance";
  }

  if (tool === "approve_trusted_memory") {
    return "POST /synthetic/v1/policy/trusted-memory/approve";
  }

  return "POST /synthetic/v1/policy/unsupported";
}

function safeAudit(toolCall, result, citationCount, omittedCount) {
  return {
    ownerId: fixture.syntheticOwner.ownerId,
    namespaceId: toolCall.namespaceId,
    caller: toolCall.caller,
    callerKind: "mcp_tool",
    tool: toolCall.tool,
    result,
    citationCount,
    omittedCount,
    leakedContent: false,
    rawTokenReturned: false,
    privatePathReturned: false,
    traceId: `trace_${toolCall.mcpCallId}`
  };
}

function assertMcpCall(mcpCallId, fn) {
  const proof = results.find((candidate) => candidate.mcpCallId === mcpCallId);

  if (!proof) {
    throw new Error(`missing wrapper runtime MCP adapter case: ${mcpCallId}`);
  }

  fn(proof);
}

function assertPreservedMetadata(result, caseId) {
  if (!result.apiPolicyRequest) {
    throw new Error(`wrapper runtime MCP adapter smoke failed: ${caseId}\nfield: apiPolicyRequest`);
  }

  assertEqual(result.apiPolicyRequest.namespaceId, result.namespaceId, caseId, "apiPolicyRequest.namespaceId");
  assertEqual(result.apiPolicyRequest.caller, result.caller, caseId, "apiPolicyRequest.caller");
  assertEqual(result.apiPolicyRequest.via, "mcp_adapter_to_source_wire_api_policy", caseId, "apiPolicyRequest.via");
  assertEqual(result.audit.leakedContent, false, caseId, "audit.leakedContent");
  assertEqual(result.audit.rawTokenReturned, false, caseId, "audit.rawTokenReturned");
  assertEqual(result.audit.privatePathReturned, false, caseId, "audit.privatePathReturned");
}

function assertEqual(actual, expected, caseId, field) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `wrapper runtime MCP adapter smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect examples/wrapper-runtime/mcp-adapter-policy-routing-smoke.mjs and examples/fixtures/wrapper-runtime/wrapper-runtime-fixture-matrix.json"
      ].join("\n")
    );
  }
}
