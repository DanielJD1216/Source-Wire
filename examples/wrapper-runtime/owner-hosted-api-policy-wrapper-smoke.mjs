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
const proofCases = fixture.proofCases.map((proofCase) => {
  const result = callOwnerHostedApiPolicyWrapper(fixture, proofCase.request);
  return {
    caseId: proofCase.caseId,
    category: proofCase.category,
    result,
    expected: proofCase.expected
  };
});

assertBoundary(fixture.boundary);
assertProofCase("authorized_trusted_memory_read", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.caseId, "status");
  assertEqual(proof.result.trustedMemoryReturned, true, proof.caseId, "trustedMemoryReturned");
  assertEqual(proof.result.sourceEvidenceReturned, false, proof.caseId, "sourceEvidenceReturned");
  assertEqual(proof.result.citationCount, 1, proof.caseId, "citationCount");
  assertEqual(proof.result.audit.result, "allowed", proof.caseId, "audit.result");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

assertProofCase("missing_capability_denied", (proof) => {
  assertEqual(proof.result.status, "denied", proof.caseId, "status");
  assertEqual(proof.result.denialReason, "missing_approve_trusted_memory_capability", proof.caseId, "denialReason");
  assertEqual(proof.result.omittedCount, 1, proof.caseId, "omittedCount");
  assertEqual(proof.result.leaksRestrictedContent, false, proof.caseId, "leaksRestrictedContent");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

assertProofCase("wrong_namespace_denied", (proof) => {
  assertEqual(proof.result.status, "denied", proof.caseId, "status");
  assertEqual(proof.result.denialReason, "namespace_not_allowed", proof.caseId, "denialReason");
  assertEqual(proof.result.namespaceId, "ns_demo_wrapper_client", proof.caseId, "namespaceId");
  assertEqual(proof.result.omittedCount, 1, proof.caseId, "omittedCount");
  assertEqual(proof.result.leaksRestrictedContent, false, proof.caseId, "leaksRestrictedContent");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

assertProofCase("source_evidence_with_citation", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.caseId, "status");
  assertEqual(proof.result.sourceEvidenceReturned, true, proof.caseId, "sourceEvidenceReturned");
  assertEqual(proof.result.trustedMemoryReturned, false, proof.caseId, "trustedMemoryReturned");
  assertEqual(proof.result.trustedMemoryCreated, false, proof.caseId, "trustedMemoryCreated");
  assertEqual(proof.result.citations[0].evidenceKind, "source_evidence", proof.caseId, "citation.evidenceKind");
  assertEqual(proof.result.noAutoPromotion, true, proof.caseId, "noAutoPromotion");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

assertProofCase("pending_candidate_no_promotion", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.caseId, "status");
  assertEqual(proof.result.candidateStatus, "pending", proof.caseId, "candidateStatus");
  assertEqual(proof.result.pendingCandidateCreated, true, proof.caseId, "pendingCandidateCreated");
  assertEqual(proof.result.trustedMemoryCreated, false, proof.caseId, "trustedMemoryCreated");
  assertEqual(proof.result.noAutoPromotion, true, proof.caseId, "noAutoPromotion");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

assertProofCase("owner_application_approval_path", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.caseId, "status");
  assertEqual(proof.result.approvalPath, "owner_or_application_controlled", proof.caseId, "approvalPath");
  assertEqual(proof.result.candidateStatus, "approved", proof.caseId, "candidateStatus");
  assertEqual(proof.result.trustedMemoryCreated, true, proof.caseId, "trustedMemoryCreated");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

assertProofCase("mcp_routes_through_api_policy", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.caseId, "status");
  assertEqual(proof.result.path, "mcp_adapter_to_source_wire_api_policy", proof.caseId, "path");
  assertEqual(proof.result.runtimeDirectCall, false, proof.caseId, "runtimeDirectCall");
  assertEqual(proof.result.memoryEngineSaveDeleteExposed, false, proof.caseId, "memoryEngineSaveDeleteExposed");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

assertProofCase("runtime_adapter_result_shaped", (proof) => {
  assertEqual(proof.result.status, "allowed", proof.caseId, "status");
  assertEqual(proof.result.sourceWirePolicyApplied, true, proof.caseId, "sourceWirePolicyApplied");
  assertEqual(proof.result.rawRuntimePayloadReturnedToMcp, false, proof.caseId, "rawRuntimePayloadReturnedToMcp");
  assertEqual(proof.result.citationPolicyApplied, true, proof.caseId, "citationPolicyApplied");
  assertEqual(proof.result.auditPolicyApplied, true, proof.caseId, "auditPolicyApplied");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

assertProofCase("stale_source_gap", (proof) => {
  assertEqual(proof.result.status, "partial", proof.caseId, "status");
  assertEqual(proof.result.gapId, "gap_demo_stale_source", proof.caseId, "gapId");
  assertEqual(proof.result.gapReason, "stale_source_evidence", proof.caseId, "gapReason");
  assertEqual(proof.result.answerShouldWarn, true, proof.caseId, "answerShouldWarn");
  assertSafeAudit(proof.result.audit, proof.caseId);
});

for (const proof of proofCases) {
  console.log(`ok wrapper runtime api policy case ${proof.caseId}`);
}

console.log("ok wrapper runtime owner-hosted api policy smoke");

function callOwnerHostedApiPolicyWrapper(data, request) {
  const harness = data.syntheticHarnesses.find((candidate) => candidate.harnessId === request.caller);
  const requiredCapability = request.capability ?? capabilityForTool(request.tool);
  const baseAudit = {
    ownerId: data.syntheticOwner.ownerId,
    namespaceId: request.namespaceId,
    caller: request.caller,
    callerKind: harness?.kind ?? "unknown",
    requiredCapability,
    leakedContent: false,
    rawTokenReturned: false,
    privatePathReturned: false,
    traceId: syntheticTraceId(request)
  };

  if (!harness) {
    return deny("caller_not_registered", request, baseAudit);
  }

  if (!harness.allowedNamespaceIds.includes(request.namespaceId)) {
    return deny("namespace_not_allowed", request, baseAudit);
  }

  if (requiredCapability && !harness.capabilities.includes(requiredCapability)) {
    return deny(`missing_${requiredCapability}_capability`, request, baseAudit);
  }

  if (request.tool === "search_memory") {
    const trustedMemory = data.syntheticTrustedMemory.find((memory) => memory.namespaceId === request.namespaceId);
    return {
      status: "allowed",
      namespaceId: request.namespaceId,
      caller: request.caller,
      trustedMemoryReturned: Boolean(trustedMemory),
      sourceEvidenceReturned: false,
      trustedMemoryCreated: false,
      citationCount: trustedMemory ? 1 : 0,
      citations: trustedMemory ? [trustedMemory.citation] : [],
      noAutoPromotion: true,
      audit: { ...baseAudit, result: "allowed", citationCount: trustedMemory ? 1 : 0, omittedCount: 0 }
    };
  }

  if (request.tool === "search_sources") {
    const sourceEvidence = data.syntheticSourceEvidence.find((source) => source.namespaceId === request.namespaceId);
    return {
      status: "allowed",
      namespaceId: request.namespaceId,
      caller: request.caller,
      trustedMemoryReturned: false,
      sourceEvidenceReturned: Boolean(sourceEvidence),
      trustedMemoryCreated: false,
      citationCount: sourceEvidence ? 1 : 0,
      citations: sourceEvidence ? [sourceEvidence.citation] : [],
      noAutoPromotion: true,
      audit: { ...baseAudit, result: "allowed", citationCount: sourceEvidence ? 1 : 0, omittedCount: 0 }
    };
  }

  if (requiredCapability === "prepare_candidates") {
    const candidate = data.syntheticCandidates.find((item) => item.namespaceId === request.namespaceId);
    return {
      status: "allowed",
      namespaceId: request.namespaceId,
      caller: request.caller,
      pendingCandidateCreated: Boolean(candidate),
      candidateStatus: candidate?.status ?? "missing",
      trustedMemoryCreated: false,
      noAutoPromotion: true,
      audit: { ...baseAudit, result: "allowed", citationCount: 0, omittedCount: 0 }
    };
  }

  if (requiredCapability === "approve_trusted_memory") {
    return {
      status: "allowed",
      namespaceId: request.namespaceId,
      caller: request.caller,
      approvalPath: "owner_or_application_controlled",
      candidateStatus: "approved",
      trustedMemoryCreated: true,
      noAutoPromotion: false,
      audit: { ...baseAudit, result: "allowed", citationCount: 0, omittedCount: 0 }
    };
  }

  if (request.tool === "search_memory" || request.tool === "search_sources") {
    return deny("unsupported_policy_request", request, baseAudit);
  }

  if (request.tool === "mcp_route_check") {
    const mcpCall = data.syntheticMcpCalls[0];
    return {
      status: "allowed",
      namespaceId: request.namespaceId,
      caller: request.caller,
      path: mcpCall.path,
      runtimeDirectCall: mcpCall.runtimeDirectCall,
      memoryEngineSaveDeleteExposed: false,
      audit: { ...baseAudit, result: "allowed", citationCount: 0, omittedCount: 0 }
    };
  }

  if (request.adapterInput === "runtime_result_demo_search_001") {
    const runtimeResult = data.syntheticRuntimeAdapterResults[0];
    return {
      status: "allowed",
      namespaceId: request.namespaceId,
      caller: "runtime_adapter",
      sourceWirePolicyApplied: runtimeResult.sourceWirePolicyApplied,
      rawRuntimePayloadReturnedToMcp: runtimeResult.rawRuntimePayloadReturnedToMcp,
      citationPolicyApplied: true,
      auditPolicyApplied: true,
      audit: { ...baseAudit, caller: "runtime_adapter", result: "allowed", citationCount: 0, omittedCount: 0 }
    };
  }

  if (request.gapId === "gap_demo_stale_source") {
    const gap = data.syntheticGaps[0];
    return {
      status: "partial",
      namespaceId: request.namespaceId,
      caller: request.caller,
      gapId: gap.gapId,
      gapReason: gap.reason,
      answerShouldWarn: gap.answerShouldWarn,
      audit: { ...baseAudit, result: "partial", citationCount: 0, omittedCount: 0 }
    };
  }

  return deny("unsupported_policy_request", request, baseAudit);
}

function deny(denialReason, request, audit) {
  return {
    status: "denied",
    namespaceId: request.namespaceId,
    caller: request.caller,
    denialReason,
    omittedCount: 1,
    trustedMemoryReturned: false,
    sourceEvidenceReturned: false,
    trustedMemoryCreated: false,
    leaksRestrictedContent: false,
    noAutoPromotion: true,
    audit: { ...audit, result: "denied", citationCount: 0, omittedCount: 1 }
  };
}

function capabilityForTool(tool) {
  if (tool === "search_memory") {
    return "read_trusted_memory";
  }

  if (tool === "search_sources") {
    return "read_source_evidence";
  }

  if (tool === "mcp_route_check") {
    return "assemble_context";
  }

  return undefined;
}

function syntheticTraceId(request) {
  return `trace_${request.namespaceId}_${request.caller ?? "runtime_adapter"}`.replaceAll("-", "_");
}

function assertBoundary(boundary) {
  assertEqual(boundary.hosting, "owner_hosted", "boundary", "hosting");
  assertEqual(boundary.sourceWireHostsUserMemory, false, "boundary", "sourceWireHostsUserMemory");
  assertEqual(boundary.runtimeIncludedInPackage, false, "boundary", "runtimeIncludedInPackage");
  assertEqual(boundary.mcpBypassAllowed, false, "boundary", "mcpBypassAllowed");
  assertEqual(boundary.agplCodeCopied, false, "boundary", "agplCodeCopied");
  assertEqual(boundary.realDataIncluded, false, "boundary", "realDataIncluded");
}

function assertProofCase(caseId, fn) {
  const proof = proofCases.find((candidate) => candidate.caseId === caseId);

  if (!proof) {
    throw new Error(`missing wrapper runtime proof case: ${caseId}`);
  }

  fn(proof);
}

function assertSafeAudit(audit, caseId) {
  assertEqual(audit.leakedContent, false, caseId, "audit.leakedContent");
  assertEqual(audit.rawTokenReturned, false, caseId, "audit.rawTokenReturned");
  assertEqual(audit.privatePathReturned, false, caseId, "audit.privatePathReturned");

  if (!audit.ownerId || !audit.namespaceId || !audit.requiredCapability || !audit.traceId) {
    throw new Error(`wrapper runtime smoke check failed: ${caseId}\nfield: audit metadata\nnext action: inspect owner-hosted API policy wrapper shaping`);
  }
}

function assertEqual(actual, expected, caseId, field) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `wrapper runtime smoke check failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect examples/wrapper-runtime/owner-hosted-api-policy-wrapper-smoke.mjs and examples/fixtures/wrapper-runtime/wrapper-runtime-fixture-matrix.json"
      ].join("\n")
    );
  }
}
