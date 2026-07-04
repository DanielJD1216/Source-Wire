import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateHostedRuntimeFixtureMatrix } from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "hosted-runtime",
  "hosted-runtime-fixture-matrix.json"
);

const fixtureText = await readFile(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const results = evaluateHostedRuntimeFixtureMatrix(fixture);

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
assertEqual(fixture.boundary.realDatabaseConnectionsIncluded, false, "boundary", "realDatabaseConnectionsIncluded");
assertEqual(fixture.boundary.postgresOrPgvectorSetupIncluded, false, "boundary", "postgresOrPgvectorSetupIncluded");
assertEqual(fixture.boundary.apiServerIncluded, false, "boundary", "apiServerIncluded");
assertEqual(fixture.boundary.mcpServerRuntimeIncluded, false, "boundary", "mcpServerRuntimeIncluded");
assertEqual(fixture.boundary.liveConnectorsIncluded, false, "boundary", "liveConnectorsIncluded");
assertEqual(fixture.boundary.missionControlIncluded, false, "boundary", "missionControlIncluded");
assertEqual(fixture.boundary.deploymentIncluded, false, "boundary", "deploymentIncluded");
assertEqual(fixture.boundary.hostedServicesIncluded, false, "boundary", "hostedServicesIncluded");
assertEqual(fixture.boundary.managedHostingIncluded, false, "boundary", "managedHostingIncluded");
assertEqual(fixture.boundary.realDataIncluded, false, "boundary", "realDataIncluded");
assertEqual(fixture.boundary.clientDataIncluded, false, "boundary", "clientDataIncluded");
assertEqual(fixture.boundary.privateImplementationCodeIncluded, false, "boundary", "privateImplementationCodeIncluded");
assertEqual(fixture.boundary.agplCodeIncluded, false, "boundary", "agplCodeIncluded");
assertEqual(fixture.boundary.privateProofContentIncluded, false, "boundary", "privateProofContentIncluded");
assertEqual(fixture.boundary.mcpMayBypassApiPolicy, false, "boundary", "mcpMayBypassApiPolicy");
assertEqual(fixture.boundary.sourceEvidenceMayAutoPromoteToTrustedMemory, false, "boundary", "sourceEvidenceMayAutoPromoteToTrustedMemory");

const unsafePatterns = [
  /\/Users\//,
  /@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /https?:\/\//,
  /token/i,
  /secret/i,
  /screenshot/i,
  /production export/i,
  /private proof/i
];

for (const pattern of unsafePatterns) {
  if (pattern.test(fixtureText)) {
    throw new Error(`hosted-runtime fixture contains unsafe pattern: ${pattern}`);
  }
}

const requiredCaseIds = new Set([
  "authorized_owner_read",
  "unauthorized_caller_denial",
  "wrong_namespace_denial_without_leak",
  "source_evidence_citation",
  "candidate_prepared_no_promotion",
  "trusted_memory_read_after_approval",
  "source_maintenance_no_auto_promotion",
  "mcp_policy_route_cannot_bypass_api",
  "mcp_bypass_denied",
  "audit_metadata_allowed_case",
  "audit_metadata_denied_case",
  "stale_or_deleted_evidence_gap",
  "owner_application_approval_allowed",
  "agent_approval_requires_owner_control"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.caseId === fixtureCase.caseId);

  if (!result) {
    throw new Error(`missing hosted-runtime fixture result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.runtimeMode, "synthetic_hosted_runtime_fixture_package", fixtureCase.caseId, "runtimeMode");
  assertEqual(result.auditMetadataPresent, true, fixtureCase.caseId, "auditMetadataPresent");
  assertEqual(result.audit.auditId, `audit_${fixtureCase.caseId}`, fixtureCase.caseId, "audit.auditId");
  assertEqual(result.restrictedContentLeaked, false, fixtureCase.caseId, "restrictedContentLeaked");
  assertEqual(result.mcpBypassedApiPolicy, false, fixtureCase.caseId, "mcpBypassedApiPolicy");
  assertEqual(result.trustedMemoryAutoPromoted, false, fixtureCase.caseId, "trustedMemoryAutoPromoted");
  assertEqual(result.databaseMigrationCreated, false, fixtureCase.caseId, "databaseMigrationCreated");
  assertEqual(result.realDatabaseConnectionOpened, false, fixtureCase.caseId, "realDatabaseConnectionOpened");
  assertEqual(result.postgresOrPgvectorSetupCreated, false, fixtureCase.caseId, "postgresOrPgvectorSetupCreated");
  assertEqual(result.apiServerStarted, false, fixtureCase.caseId, "apiServerStarted");
  assertEqual(result.mcpServerRuntimeStarted, false, fixtureCase.caseId, "mcpServerRuntimeStarted");
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");

  console.log(`ok hosted runtime fixture case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing hosted-runtime fixture cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok hosted runtime fixture smoke");

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
        `hosted-runtime fixture smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/contracts/hosted-runtime-fixtures.ts and examples/fixtures/hosted-runtime/hosted-runtime-fixture-matrix.json"
      ].join("\n")
    );
  }
}
