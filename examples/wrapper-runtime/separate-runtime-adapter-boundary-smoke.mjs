import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "wrapper-runtime",
  "wrapper-runtime-fixture-matrix.json"
);

const wrapperRuntimeExampleDir = join(process.cwd(), "examples", "wrapper-runtime");
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

assertBoundary(fixture.boundary);
await assertNoDockerOrInstallerBundle(wrapperRuntimeExampleDir);

const shapedSearch = callSeparateRuntimeAdapter(fixture, "runtime_result_demo_search_001");
assertEqual(shapedSearch.status, "allowed", "runtime_result_demo_search_001", "status");
assertEqual(shapedSearch.rawRuntimePayloadReturnedToMcp, false, "runtime_result_demo_search_001", "rawRuntimePayloadReturnedToMcp");
assertEqual(shapedSearch.sourceWirePolicyApplied, true, "runtime_result_demo_search_001", "sourceWirePolicyApplied");
assertEqual(shapedSearch.runtimePolicyOwnership.auth, false, "runtime_result_demo_search_001", "runtimePolicyOwnership.auth");
assertEqual(shapedSearch.runtimePolicyOwnership.namespace, false, "runtime_result_demo_search_001", "runtimePolicyOwnership.namespace");
assertEqual(shapedSearch.runtimePolicyOwnership.approval, false, "runtime_result_demo_search_001", "runtimePolicyOwnership.approval");
assertEqual(shapedSearch.runtimePolicyOwnership.citation, false, "runtime_result_demo_search_001", "runtimePolicyOwnership.citation");
assertEqual(shapedSearch.runtimePolicyOwnership.deniedResult, false, "runtime_result_demo_search_001", "runtimePolicyOwnership.deniedResult");
assertEqual(shapedSearch.runtimePolicyOwnership.audit, false, "runtime_result_demo_search_001", "runtimePolicyOwnership.audit");
assertEqual(shapedSearch.response.citations[0].evidenceKind, "runtime_adapter_shaped_result", "runtime_result_demo_search_001", "citation.evidenceKind");
assertSafeResponse(shapedSearch, "runtime_result_demo_search_001");

const shapedDegraded = callSeparateRuntimeAdapter(fixture, "runtime_result_demo_degraded_001");
assertEqual(shapedDegraded.status, "partial", "runtime_result_demo_degraded_001", "status");
assertEqual(shapedDegraded.gapId, "gap_demo_runtime_degraded", "runtime_result_demo_degraded_001", "gapId");
assertEqual(shapedDegraded.rawRuntimePayloadReturnedToMcp, false, "runtime_result_demo_degraded_001", "rawRuntimePayloadReturnedToMcp");
assertEqual(shapedDegraded.audit.result, "partial", "runtime_result_demo_degraded_001", "audit.result");
assertSafeResponse(shapedDegraded, "runtime_result_demo_degraded_001");

console.log("ok wrapper runtime separate runtime adapter boundary smoke");

function callSeparateRuntimeAdapter(data, runtimeResultId) {
  const runtimeResult = data.syntheticRuntimeAdapterResults.find((candidate) => candidate.runtimeResultId === runtimeResultId);

  if (!runtimeResult) {
    throw new Error(`missing synthetic runtime result: ${runtimeResultId}`);
  }

  assertSyntheticRuntimeResult(runtimeResult);

  const runtimePolicyOwnership = {
    auth: runtimeResult.runtimeOwnsAuthPolicy,
    namespace: runtimeResult.runtimeOwnsNamespacePolicy,
    approval: runtimeResult.runtimeOwnsApprovalPolicy,
    citation: runtimeResult.runtimeOwnsCitationPolicy,
    deniedResult: runtimeResult.runtimeOwnsDeniedResultPolicy,
    audit: runtimeResult.runtimeOwnsAuditPolicy
  };

  if (runtimeResult.runtimeGap === "runtime_degraded") {
    return {
      status: "partial",
      gapId: "gap_demo_runtime_degraded",
      sourceWirePolicyApplied: true,
      rawRuntimePayloadReturnedToMcp: false,
      runtimePolicyOwnership,
      response: {
        answerShouldWarn: true,
        citations: []
      },
      audit: safeAudit("partial", 0, 0)
    };
  }

  return {
    status: "allowed",
    sourceWirePolicyApplied: true,
    rawRuntimePayloadReturnedToMcp: false,
    runtimePolicyOwnership,
    response: {
      shapedItemCount: runtimeResult.rawItems.length,
      citations: [
        {
          evidenceKind: "runtime_adapter_shaped_result",
          publicLocator: runtimeResult.runtimeResultId,
          sourceWireOwnedCitationPolicy: true
        }
      ]
    },
    audit: safeAudit("allowed", 1, 0)
  };
}

function assertBoundary(boundary) {
  assertEqual(boundary.agplCodeCopied, false, "boundary", "agplCodeCopied");
  assertEqual(boundary.runtimeIncludedInPackage, false, "boundary", "runtimeIncludedInPackage");
  assertEqual(boundary.realDataIncluded, false, "boundary", "realDataIncluded");
}

function assertSyntheticRuntimeResult(runtimeResult) {
  assertEqual(runtimeResult.fixtureSafety, "synthetic", runtimeResult.runtimeResultId, "fixtureSafety");

  if (!runtimeResult.runtimeResultId.includes("demo")) {
    throw new Error(`runtime adapter boundary smoke failed: ${runtimeResult.runtimeResultId}\nfield: runtimeResultId\nexpected synthetic demo id`);
  }

  for (const item of runtimeResult.rawItems) {
    if (!item.runtimeItemId.includes("demo") || !item.text.startsWith("Synthetic ")) {
      throw new Error(`runtime adapter boundary smoke failed: ${runtimeResult.runtimeResultId}\nfield: rawItems\nexpected synthetic item`);
    }
  }
}

async function assertNoDockerOrInstallerBundle(directory) {
  const entries = await readdir(directory);
  const forbidden = entries.filter((entry) => {
    const lower = entry.toLowerCase();
    return lower.includes("docker") || lower.includes("install") || lower.includes("compose");
  });

  if (forbidden.length > 0) {
    throw new Error(
      [
        "runtime adapter boundary smoke failed: bundling",
        `field: examples/wrapper-runtime`,
        `forbidden entries: ${forbidden.join(", ")}`,
        "next action: remove Docker or installer bundling from the wrapper runtime example boundary"
      ].join("\n")
    );
  }
}

function assertSafeResponse(result, caseId) {
  assertEqual(result.audit.leakedContent, false, caseId, "audit.leakedContent");
  assertEqual(result.audit.rawTokenReturned, false, caseId, "audit.rawTokenReturned");
  assertEqual(result.audit.privatePathReturned, false, caseId, "audit.privatePathReturned");
}

function safeAudit(result, citationCount, omittedCount) {
  return {
    ownerId: fixture.syntheticOwner.ownerId,
    namespaceId: "ns_demo_wrapper_project",
    adapterKind: "separate_runtime_adapter",
    result,
    citationCount,
    omittedCount,
    leakedContent: false,
    rawTokenReturned: false,
    privatePathReturned: false,
    traceId: "trace_runtime_adapter_demo"
  };
}

function assertEqual(actual, expected, caseId, field) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `runtime adapter boundary smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect examples/wrapper-runtime/separate-runtime-adapter-boundary-smoke.mjs and examples/fixtures/wrapper-runtime/wrapper-runtime-fixture-matrix.json"
      ].join("\n")
    );
  }
}
