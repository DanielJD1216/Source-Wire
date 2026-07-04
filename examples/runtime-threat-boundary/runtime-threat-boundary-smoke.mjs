import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateRuntimeThreatBoundaryFixtureMatrix } from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "runtime-threat-boundary",
  "runtime-threat-boundary-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const results = evaluateRuntimeThreatBoundaryFixtureMatrix(fixture);

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary.sourceWireHostsUserMemory, false, "boundary", "sourceWireHostsUserMemory");
assertEqual(fixture.boundary.apiServerIncluded, false, "boundary", "apiServerIncluded");
assertEqual(fixture.boundary.mcpServerRuntimeIncluded, false, "boundary", "mcpServerRuntimeIncluded");
assertEqual(fixture.boundary.databaseIncluded, false, "boundary", "databaseIncluded");
assertEqual(fixture.boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
assertEqual(fixture.boundary.realDatabaseConnectionsIncluded, false, "boundary", "realDatabaseConnectionsIncluded");
assertEqual(fixture.boundary.liveConnectorsIncluded, false, "boundary", "liveConnectorsIncluded");
assertEqual(fixture.boundary.missionControlIncluded, false, "boundary", "missionControlIncluded");
assertEqual(fixture.boundary.deploymentIncluded, false, "boundary", "deploymentIncluded");
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
  "unauthorized_caller_denied",
  "cross_namespace_access_denied",
  "missing_capability_denied",
  "source_evidence_not_auto_promoted",
  "prompt_injection_cannot_override_policy",
  "secret_like_value_redacted",
  "audit_gap_denied",
  "backup_restore_namespace_drift_denied",
  "deployment_public_without_policy_blocked",
  "mcp_policy_bypass_denied",
  "agent_trusted_memory_approval_denied",
  "owner_application_trusted_memory_approval_allowed"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.caseId === fixtureCase.caseId);

  if (!result) {
    throw new Error(`missing runtime threat boundary result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");
  assertEqual(result.runtimeMode, "synthetic_trust_boundary_package", fixtureCase.caseId, "runtimeMode");
  assertEqual(result.sourceEvidencePromoted, false, fixtureCase.caseId, "sourceEvidencePromoted");
  assertEqual(result.secretReturned, false, fixtureCase.caseId, "secretReturned");

  if (fixtureCase.caseId !== "owner_application_trusted_memory_approval_allowed") {
    assertEqual(result.trustedMemoryCreated, false, fixtureCase.caseId, "trustedMemoryCreated");
  }

  console.log(`ok runtime threat boundary case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing runtime threat boundary cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok runtime threat boundary smoke");

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
        `runtime threat boundary smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/runtime-threat-boundary/index.ts and examples/fixtures/runtime-threat-boundary/runtime-threat-boundary-fixture-matrix.json"
      ].join("\n")
    );
  }
}
