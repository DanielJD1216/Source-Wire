import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  SOURCE_WIRE_OWNER_HOSTED_RUNTIME_BOUNDARY,
  evaluateOwnerHostedRuntimeFixtureMatrix,
  getOwnerHostedMcpServerRuntimeToolDeclarations
} from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "owner-hosted-runtime",
  "owner-hosted-runtime-fixture-matrix.json"
);

const fixtureContent = await readFile(fixturePath, "utf8");
const fixture = JSON.parse(fixtureContent);
const results = evaluateOwnerHostedRuntimeFixtureMatrix(fixture);
const toolDeclarations = getOwnerHostedMcpServerRuntimeToolDeclarations();

assertNoPrivateDataMarkers(fixtureContent);
assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary, SOURCE_WIRE_OWNER_HOSTED_RUNTIME_BOUNDARY, "boundary", "exported boundary");
assertEqual(fixture.boundary.ownerHosted, true, "boundary", "ownerHosted");
assertEqual(fixture.boundary.sourceWireHostsUserMemory, false, "boundary", "sourceWireHostsUserMemory");
assertEqual(fixture.boundary.apiServerRuntimeSkeletonIncluded, true, "boundary", "apiServerRuntimeSkeletonIncluded");
assertEqual(fixture.boundary.mcpServerRuntimeSkeletonIncluded, true, "boundary", "mcpServerRuntimeSkeletonIncluded");
assertEqual(fixture.boundary.productionRuntimeIncluded, false, "boundary", "productionRuntimeIncluded");
assertEqual(fixture.boundary.networkServerIncluded, false, "boundary", "networkServerIncluded");
assertEqual(fixture.boundary.databaseIncluded, false, "boundary", "databaseIncluded");
assertEqual(fixture.boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
assertEqual(fixture.boundary.realDatabaseConnectionsIncluded, false, "boundary", "realDatabaseConnectionsIncluded");
assertEqual(fixture.boundary.postgresOrPgvectorSetupIncluded, false, "boundary", "postgresOrPgvectorSetupIncluded");
assertEqual(fixture.boundary.liveConnectorsIncluded, false, "boundary", "liveConnectorsIncluded");
assertEqual(fixture.boundary.localFolderCrawlingIncluded, false, "boundary", "localFolderCrawlingIncluded");
assertEqual(fixture.boundary.wholeVaultImportIncluded, false, "boundary", "wholeVaultImportIncluded");
assertEqual(fixture.boundary.missionControlIncluded, false, "boundary", "missionControlIncluded");
assertEqual(fixture.boundary.deploymentConfigIncluded, false, "boundary", "deploymentConfigIncluded");
assertEqual(fixture.boundary.managedHostingIncluded, false, "boundary", "managedHostingIncluded");
assertEqual(fixture.boundary.realDataIncluded, false, "boundary", "realDataIncluded");
assertEqual(fixture.boundary.clientDataIncluded, false, "boundary", "clientDataIncluded");
assertEqual(fixture.boundary.sourceWireMemoryEngineCodeMerged, false, "boundary", "sourceWireMemoryEngineCodeMerged");
assertEqual(fixture.boundary.agplCodeIncluded, false, "boundary", "agplCodeIncluded");
assertEqual(fixture.boundary.privateImplementationCodeIncluded, false, "boundary", "privateImplementationCodeIncluded");
assertEqual(fixture.boundary.mcpMayBypassApiPolicy, false, "boundary", "mcpMayBypassApiPolicy");
assertEqual(
  fixture.boundary.sourceEvidenceMayAutoPromoteToTrustedMemory,
  false,
  "boundary",
  "sourceEvidenceMayAutoPromoteToTrustedMemory"
);
assertEqual(fixture.boundary.trustedMemoryPromotion, "owner_or_application_controlled", "boundary", "trustedMemoryPromotion");

const exposedToolNames = new Set(toolDeclarations.map((tool) => tool.toolName));
assertEqual(exposedToolNames.has("direct_database_access"), false, "tool declarations", "direct_database_access");
assertEqual(exposedToolNames.has("direct_runtime_adapter_access"), false, "tool declarations", "direct_runtime_adapter_access");

const requiredCaseIds = new Set([
  "api_authorized_trusted_memory_read",
  "api_source_evidence_search",
  "api_missing_capability_denied",
  "api_wrong_namespace_denied",
  "api_source_maintenance_no_auto_promotion",
  "api_candidate_review_not_promoted",
  "mcp_policy_bypass_blocked",
  "mcp_source_evidence_preserves_citation_and_gap",
  "mcp_source_maintenance_no_auto_promotion",
  "mcp_agent_trusted_memory_approval_denied",
  "mcp_owner_application_approval_allowed",
  "mcp_handoff_status_audit_metadata_present"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.requestId === requestIdForCase(fixtureCase));

  if (!result) {
    throw new Error(`missing owner-hosted runtime result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.runtimeMode, "synthetic_owner_hosted_runtime_skeleton", fixtureCase.caseId, "runtimeMode");
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");
  assertEqual(result.sourceEvidencePromoted, false, fixtureCase.caseId, "sourceEvidencePromoted");
  assertEqual(result.secretReturned, false, fixtureCase.caseId, "secretReturned");
  assertEqual(result.apiPolicyBypassed, false, fixtureCase.caseId, "apiPolicyBypassed");
  assertEqual(result.runtimeDirectCall, false, fixtureCase.caseId, "runtimeDirectCall");
  assertEqual(result.networkListenerStarted, false, fixtureCase.caseId, "networkListenerStarted");
  assertEqual(result.databaseTouched, false, fixtureCase.caseId, "databaseTouched");
  assertEqual(result.liveConnectorTouched, false, fixtureCase.caseId, "liveConnectorTouched");
  assertEqual(result.privateDataTouched, false, fixtureCase.caseId, "privateDataTouched");
  assertEqual(result.audit.leakedContent, false, fixtureCase.caseId, "audit.leakedContent");
  assertEqual(result.audit.rawSecretReturned, false, fixtureCase.caseId, "audit.rawSecretReturned");
  assertEqual(result.audit.sourceEvidencePromoted, false, fixtureCase.caseId, "audit.sourceEvidencePromoted");
  assertEqual(result.audit.databaseTouched, false, fixtureCase.caseId, "audit.databaseTouched");
  assertEqual(result.audit.liveConnectorTouched, false, fixtureCase.caseId, "audit.liveConnectorTouched");
  assertEqual(result.audit.privateDataTouched, false, fixtureCase.caseId, "audit.privateDataTouched");

  if (fixtureCase.path === "mcp") {
    assertEqual(result.mcpAdapterUsed, true, fixtureCase.caseId, "mcpAdapterUsed");
    assertEqual(
      result.audit.boundaryPath,
      "owner_hosted_mcp_server_skeleton_to_source_wire_api_policy",
      fixtureCase.caseId,
      "audit.boundaryPath"
    );
  } else {
    assertEqual(result.mcpAdapterUsed, false, fixtureCase.caseId, "mcpAdapterUsed");
    assertEqual(
      result.audit.boundaryPath,
      "owner_hosted_api_server_skeleton_to_source_wire_api_policy",
      fixtureCase.caseId,
      "audit.boundaryPath"
    );
  }

  if (fixtureCase.caseId !== "mcp_owner_application_approval_allowed") {
    assertEqual(result.trustedMemoryCreated, false, fixtureCase.caseId, "trustedMemoryCreated");
  }

  console.log(`ok owner-hosted runtime case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing owner-hosted runtime cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok owner-hosted runtime smoke");

function requestIdForCase(fixtureCase) {
  if (fixtureCase.path === "api") {
    return fixtureCase.api.request.requestId;
  }

  return fixtureCase.mcp.request.input.requestId;
}

function assertExpectedSubset(actual, expected, caseId) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    assertEqual(actual[key], expectedValue, caseId, key);
  }
}

function assertNoPrivateDataMarkers(content) {
  const privatePatterns = [
    /\/Users\//,
    /\/home\//,
    /C:\\Users\\/i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /postgres(?:ql)?:\/\//i,
    /\b(?:token|secret|password|api[_-]?key)\s*[:=]\s*["']?[^"'\s]{8,}/i
  ];

  for (const pattern of privatePatterns) {
    if (pattern.test(content)) {
      throw new Error(
        [
          "owner-hosted runtime smoke failed: fixture contains private-data-shaped marker",
          `pattern: ${pattern}`,
          "next action: replace the fixture value with synthetic placeholder data"
        ].join("\n")
      );
    }
  }
}

function assertEqual(actual, expected, caseId, field) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `owner-hosted runtime smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/owner-hosted-runtime/index.ts and examples/fixtures/owner-hosted-runtime/owner-hosted-runtime-fixture-matrix.json"
      ].join("\n")
    );
  }
}
