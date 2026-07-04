import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateApiPolicyContractFixtureMatrix } from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "api-contract",
  "api-policy-contract-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const results = evaluateApiPolicyContractFixtureMatrix(fixture);

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary.sourceWireHostsUserMemory, false, "boundary", "sourceWireHostsUserMemory");
assertEqual(fixture.boundary.apiServerIncluded, false, "boundary", "apiServerIncluded");
assertEqual(fixture.boundary.routeHandlersIncluded, false, "boundary", "routeHandlersIncluded");
assertEqual(fixture.boundary.mcpServerRuntimeIncluded, false, "boundary", "mcpServerRuntimeIncluded");
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
assertEqual(fixture.boundary.mcpMayBypassApiPolicy, false, "boundary", "mcpMayBypassApiPolicy");
assertEqual(
  fixture.boundary.sourceEvidenceMayAutoPromoteToTrustedMemory,
  false,
  "boundary",
  "sourceEvidenceMayAutoPromoteToTrustedMemory"
);

const requiredCaseIds = new Set([
  "missing_caller_denied",
  "wrong_namespace_denied",
  "missing_capability_denied",
  "trusted_memory_read_allowed",
  "source_evidence_search_with_citation_and_gap",
  "context_assembly_with_citations_and_gap",
  "source_maintenance_creates_candidate_no_memory",
  "candidate_creation_pending_review",
  "candidate_review_allowed_no_auto_promotion",
  "agent_trusted_memory_approval_denied",
  "owner_application_trusted_memory_approval_allowed",
  "handoff_status_evidence_allowed",
  "audit_summary_redacts_hidden_content",
  "mcp_policy_bypass_denied",
  "secret_like_input_denied"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.requestId === fixtureCase.request.requestId);

  if (!result) {
    throw new Error(`missing API contract result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");
  assertEqual(result.runtimeMode, "synthetic_api_policy_contract", fixtureCase.caseId, "runtimeMode");
  assertEqual(result.sourceEvidencePromoted, false, fixtureCase.caseId, "sourceEvidencePromoted");
  assertEqual(result.secretReturned, false, fixtureCase.caseId, "secretReturned");
  assertEqual(result.mcpBypassedApiPolicy, false, fixtureCase.caseId, "mcpBypassedApiPolicy");
  assertEqual(result.audit.leakedContent, false, fixtureCase.caseId, "audit.leakedContent");
  assertEqual(result.audit.rawSecretReturned, false, fixtureCase.caseId, "audit.rawSecretReturned");
  assertEqual(result.audit.sourceEvidencePromoted, false, fixtureCase.caseId, "audit.sourceEvidencePromoted");

  if (fixtureCase.request.viaMcp) {
    assertEqual(
      result.audit.boundaryPath,
      "mcp_adapter_to_source_wire_api_policy",
      fixtureCase.caseId,
      "audit.boundaryPath"
    );
  }

  if (fixtureCase.caseId !== "owner_application_trusted_memory_approval_allowed") {
    assertEqual(result.trustedMemoryCreated, false, fixtureCase.caseId, "trustedMemoryCreated");
  }

  console.log(`ok api policy contract case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing API policy contract cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok api policy contract smoke");

function assertExpectedSubset(actual, expected, caseId) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (key === "citationCount") {
      assertEqual(actual.citations.length, expectedValue, caseId, key);
      continue;
    }

    if (key === "gapCount") {
      assertEqual(actual.gaps.length, expectedValue, caseId, key);
      continue;
    }

    assertEqual(actual[key], expectedValue, caseId, key);
  }
}

function assertEqual(actual, expected, caseId, field) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `api policy contract smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/contracts/api-policy.ts and examples/fixtures/api-contract/api-policy-contract-fixture-matrix.json"
      ].join("\n")
    );
  }
}
