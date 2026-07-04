import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateDeploymentBoundaryFixtureMatrix } from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "deployment-boundary",
  "deployment-boundary-fixture-matrix.json"
);

const fixtureText = await readFile(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const results = evaluateDeploymentBoundaryFixtureMatrix(fixture);

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary.deploymentConfigIncluded, false, "boundary", "deploymentConfigIncluded");
assertEqual(fixture.boundary.cloudProviderConfigIncluded, false, "boundary", "cloudProviderConfigIncluded");
assertEqual(
  fixture.boundary.dockerOrContainerRuntimeConfigIncluded,
  false,
  "boundary",
  "dockerOrContainerRuntimeConfigIncluded"
);
assertEqual(fixture.boundary.hostedServicesIncluded, false, "boundary", "hostedServicesIncluded");
assertEqual(fixture.boundary.managedHostingIncluded, false, "boundary", "managedHostingIncluded");
assertEqual(fixture.boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
assertEqual(fixture.boundary.realDatabaseConnectionsIncluded, false, "boundary", "realDatabaseConnectionsIncluded");
assertEqual(fixture.boundary.postgresOrPgvectorSetupIncluded, false, "boundary", "postgresOrPgvectorSetupIncluded");
assertEqual(fixture.boundary.apiServerIncluded, false, "boundary", "apiServerIncluded");
assertEqual(fixture.boundary.mcpServerRuntimeIncluded, false, "boundary", "mcpServerRuntimeIncluded");
assertEqual(fixture.boundary.liveConnectorsIncluded, false, "boundary", "liveConnectorsIncluded");
assertEqual(fixture.boundary.missionControlIncluded, false, "boundary", "missionControlIncluded");
assertEqual(fixture.boundary.realDataIncluded, false, "boundary", "realDataIncluded");
assertEqual(fixture.boundary.clientDataIncluded, false, "boundary", "clientDataIncluded");
assertEqual(fixture.boundary.privateImplementationCodeIncluded, false, "boundary", "privateImplementationCodeIncluded");
assertEqual(fixture.boundary.agplCodeIncluded, false, "boundary", "agplCodeIncluded");
assertEqual(fixture.boundary.sourceWireHostsUserMemory, false, "boundary", "sourceWireHostsUserMemory");
assertEqual(fixture.boundary.mcpMayBypassApiPolicy, false, "boundary", "mcpMayBypassApiPolicy");
assertEqual(
  fixture.boundary.sourceEvidenceMayAutoPromoteToTrustedMemory,
  false,
  "boundary",
  "sourceEvidenceMayAutoPromoteToTrustedMemory"
);

const unsafePatterns = [
  /\/Users\//,
  /@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /https?:\/\//,
  /\bsecret\b/i,
  /\bscreenshot\b/i,
  /production export/i,
  /private proof/i,
  /client data/i
];

for (const pattern of unsafePatterns) {
  if (pattern.test(fixtureText)) {
    throw new Error(`deployment-boundary fixture contains unsafe pattern: ${pattern}`);
  }
}

const requiredCaseIds = new Set([
  "local_development_ready",
  "owner_hosted_runtime_requires_owner_infra",
  "managed_hosted_deferred",
  "stop_condition_blocks_runtime",
  "rollback_evidence_present",
  "rollback_evidence_missing_requires_review",
  "unsafe_hosting_claim_blocked",
  "no_hosted_service_proof",
  "mcp_bypass_blocked",
  "trusted_memory_promotion_boundary"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.caseId === fixtureCase.caseId);

  if (!result) {
    throw new Error(`missing deployment-boundary fixture result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.runtimeMode, "synthetic_deployment_boundary_package", fixtureCase.caseId, "runtimeMode");
  assertEqual(result.auditMetadataPresent, true, fixtureCase.caseId, "auditMetadataPresent");
  assertEqual(result.audit.auditId, `audit_${fixtureCase.caseId}`, fixtureCase.caseId, "audit.auditId");
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");
  assertEqual(result.deploymentConfigCreated, false, fixtureCase.caseId, "deploymentConfigCreated");
  assertEqual(result.cloudProviderConfigCreated, false, fixtureCase.caseId, "cloudProviderConfigCreated");
  assertEqual(
    result.dockerOrContainerRuntimeConfigCreated,
    false,
    fixtureCase.caseId,
    "dockerOrContainerRuntimeConfigCreated"
  );
  assertEqual(result.hostedServiceCreated, false, fixtureCase.caseId, "hostedServiceCreated");
  assertEqual(result.managedHostingCreated, false, fixtureCase.caseId, "managedHostingCreated");
  assertEqual(result.databaseMigrationCreated, false, fixtureCase.caseId, "databaseMigrationCreated");
  assertEqual(result.realDatabaseConnectionOpened, false, fixtureCase.caseId, "realDatabaseConnectionOpened");
  assertEqual(result.postgresOrPgvectorSetupCreated, false, fixtureCase.caseId, "postgresOrPgvectorSetupCreated");
  assertEqual(result.apiServerStarted, false, fixtureCase.caseId, "apiServerStarted");
  assertEqual(result.mcpServerRuntimeStarted, false, fixtureCase.caseId, "mcpServerRuntimeStarted");
  assertEqual(result.liveConnectorStarted, false, fixtureCase.caseId, "liveConnectorStarted");
  assertEqual(result.missionControlStarted, false, fixtureCase.caseId, "missionControlStarted");
  assertEqual(result.npmPublished, false, fixtureCase.caseId, "npmPublished");
  assertEqual(result.githubReleaseCreated, false, fixtureCase.caseId, "githubReleaseCreated");
  assertEqual(result.packageVersionChanged, false, fixtureCase.caseId, "packageVersionChanged");
  assertEqual(result.publicContributionAccepted, false, fixtureCase.caseId, "publicContributionAccepted");
  assertEqual(result.realDataIncluded, false, fixtureCase.caseId, "realDataIncluded");
  assertEqual(result.clientDataIncluded, false, fixtureCase.caseId, "clientDataIncluded");
  assertEqual(result.privateImplementationCodeIncluded, false, fixtureCase.caseId, "privateImplementationCodeIncluded");
  assertEqual(result.agplCodeIncluded, false, fixtureCase.caseId, "agplCodeIncluded");
  assertEqual(result.mcpBypassedApiPolicy, false, fixtureCase.caseId, "mcpBypassedApiPolicy");
  assertEqual(result.trustedMemoryAutoPromoted, false, fixtureCase.caseId, "trustedMemoryAutoPromoted");

  console.log(`ok deployment boundary case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing deployment-boundary fixture cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok deployment boundary smoke");

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
        `deployment-boundary smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/contracts/deployment-boundary.ts and examples/fixtures/deployment-boundary/deployment-boundary-fixture-matrix.json"
      ].join("\n")
    );
  }
}
