import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateMcpAdapterContractFixtureMatrix } from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "mcp-contract",
  "mcp-adapter-contract-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const results = evaluateMcpAdapterContractFixtureMatrix(fixture);

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary.sourceWireHostsUserMemory, false, "boundary", "sourceWireHostsUserMemory");
assertEqual(fixture.boundary.mcpServerRuntimeIncluded, false, "boundary", "mcpServerRuntimeIncluded");
assertEqual(fixture.boundary.apiServerIncluded, false, "boundary", "apiServerIncluded");
assertEqual(fixture.boundary.routeHandlersIncluded, false, "boundary", "routeHandlersIncluded");
assertEqual(fixture.boundary.databaseIncluded, false, "boundary", "databaseIncluded");
assertEqual(fixture.boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
assertEqual(fixture.boundary.realDatabaseConnectionsIncluded, false, "boundary", "realDatabaseConnectionsIncluded");
assertEqual(fixture.boundary.postgresOrPgvectorSetupIncluded, false, "boundary", "postgresOrPgvectorSetupIncluded");
assertEqual(fixture.boundary.runtimeAdapterIncluded, false, "boundary", "runtimeAdapterIncluded");
assertEqual(fixture.boundary.liveConnectorsIncluded, false, "boundary", "liveConnectorsIncluded");
assertEqual(fixture.boundary.missionControlIncluded, false, "boundary", "missionControlIncluded");
assertEqual(fixture.boundary.deploymentIncluded, false, "boundary", "deploymentIncluded");
assertEqual(fixture.boundary.hostedServicesIncluded, false, "boundary", "hostedServicesIncluded");
assertEqual(fixture.boundary.managedHostingIncluded, false, "boundary", "managedHostingIncluded");
assertEqual(fixture.boundary.realDataIncluded, false, "boundary", "realDataIncluded");
assertEqual(fixture.boundary.clientDataIncluded, false, "boundary", "clientDataIncluded");
assertEqual(fixture.boundary.privateImplementationCodeIncluded, false, "boundary", "privateImplementationCodeIncluded");
assertEqual(fixture.boundary.agplCodeIncluded, false, "boundary", "agplCodeIncluded");
assertEqual(fixture.boundary.mcpMustRouteThroughApiPolicy, true, "boundary", "mcpMustRouteThroughApiPolicy");
assertEqual(fixture.boundary.mcpMayBypassApiPolicy, false, "boundary", "mcpMayBypassApiPolicy");
assertEqual(fixture.boundary.sourceEvidenceMayAutoPromoteToTrustedMemory, false, "boundary", "sourceEvidenceMayAutoPromoteToTrustedMemory");

const requiredToolNames = new Set([
  "search_trusted_memory",
  "search_source_evidence",
  "assemble_context",
  "review_candidates",
  "maintain_sources",
  "read_handoff_status",
  "approve_trusted_memory"
]);

for (const tool of fixture.toolDeclarations) {
  requiredToolNames.delete(tool.toolName);
  assertEqual(typeof tool.requiredCapability, "string", tool.toolName, "requiredCapability type");
  assertEqual(typeof tool.endpointGroup, "string", tool.toolName, "endpointGroup type");
  assertEqual(typeof tool.action, "string", tool.toolName, "action type");
}

if (requiredToolNames.size > 0) {
  throw new Error(`missing MCP tool declarations: ${[...requiredToolNames].join(", ")}`);
}

const requiredCaseIds = new Set([
  "search_trusted_memory_forwards_to_api_policy",
  "search_source_evidence_preserves_citation_and_gap",
  "assemble_context_preserves_citations_and_gap",
  "review_candidates_no_trusted_memory_approval",
  "maintain_sources_creates_no_trusted_memory",
  "read_handoff_status_preserves_audit_metadata",
  "missing_caller_denied",
  "missing_owner_denied",
  "missing_namespace_denied",
  "missing_capability_denied",
  "wrong_namespace_denied",
  "mcp_direct_database_access_denied",
  "mcp_direct_runtime_adapter_access_denied",
  "agent_trusted_memory_approval_denied",
  "owner_application_trusted_memory_approval_allowed"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.requestId === fixtureCase.request.input.requestId);

  if (!result) {
    throw new Error(`missing MCP contract result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");
  assertEqual(result.runtimeMode, "synthetic_mcp_adapter_contract", fixtureCase.caseId, "runtimeMode");
  assertEqual(result.apiPolicyBypassed, false, fixtureCase.caseId, "apiPolicyBypassed");
  assertEqual(result.sourceEvidencePromoted, false, fixtureCase.caseId, "sourceEvidencePromoted");
  assertEqual(result.automaticTrustedMemoryPromotion, false, fixtureCase.caseId, "automaticTrustedMemoryPromotion");
  assertEqual(result.secretReturned, false, fixtureCase.caseId, "secretReturned");
  assertEqual(result.audit.leakedContent, false, fixtureCase.caseId, "audit.leakedContent");
  assertEqual(result.audit.rawSecretReturned, false, fixtureCase.caseId, "audit.rawSecretReturned");
  assertEqual(result.audit.sourceEvidencePromoted, false, fixtureCase.caseId, "audit.sourceEvidencePromoted");
  assertEqual(result.audit.boundaryPath, "mcp_adapter_to_source_wire_api_policy", fixtureCase.caseId, "audit.boundaryPath");

  if (fixtureCase.caseId !== "owner_application_trusted_memory_approval_allowed") {
    assertEqual(result.trustedMemoryCreated, false, fixtureCase.caseId, "trustedMemoryCreated");
  }

  console.log(`ok mcp adapter contract case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing MCP adapter contract cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok mcp adapter contract smoke");

function assertExpectedSubset(actual, expected, caseId) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    assertEqual(actual[key], expectedValue, caseId, key);
  }
}

function assertEqual(actual, expected, caseId, field) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `mcp adapter contract smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/contracts/mcp-adapter.ts and examples/fixtures/mcp-contract/mcp-adapter-contract-fixture-matrix.json"
      ].join("\n")
    );
  }
}
