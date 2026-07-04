import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { runRuntimeSkeletonFixtureMatrix } from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "runtime-skeleton",
  "runtime-skeleton-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const results = runRuntimeSkeletonFixtureMatrix(fixture);

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary.sourceWireHostsUserMemory, false, "boundary", "sourceWireHostsUserMemory");
assertEqual(fixture.boundary.apiServerIncluded, false, "boundary", "apiServerIncluded");
assertEqual(fixture.boundary.mcpServerIncluded, false, "boundary", "mcpServerIncluded");
assertEqual(fixture.boundary.databaseIncluded, false, "boundary", "databaseIncluded");
assertEqual(fixture.boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
assertEqual(fixture.boundary.deploymentIncluded, false, "boundary", "deploymentIncluded");
assertEqual(fixture.boundary.mcpBypassesApiPolicy, false, "boundary", "mcpBypassesApiPolicy");

for (const fixtureCase of fixture.cases) {
  const result = results.find((candidate) => candidate.requestId === fixtureCase.request.requestId);

  if (!result) {
    throw new Error(`missing runtime skeleton result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");
  assertEqual(result.runtimeMode, "synthetic_owner_hosted_skeleton", fixtureCase.caseId, "runtimeMode");
  assertEqual(result.audit.leakedContent, false, fixtureCase.caseId, "audit.leakedContent");
  assertEqual(result.audit.rawTokenReturned, false, fixtureCase.caseId, "audit.rawTokenReturned");
  assertEqual(result.audit.privatePathReturned, false, fixtureCase.caseId, "audit.privatePathReturned");

  if (fixtureCase.via === "mcp") {
    assertEqual(
      result.audit.boundaryPath,
      "mcp_adapter_to_owner_hosted_api_policy",
      fixtureCase.caseId,
      "audit.boundaryPath"
    );
  } else {
    assertEqual(result.audit.boundaryPath, "owner_hosted_api_policy", fixtureCase.caseId, "audit.boundaryPath");
  }

  console.log(`ok runtime skeleton case ${fixtureCase.caseId}`);
}

console.log("ok runtime skeleton smoke");

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
        `runtime skeleton smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/runtime-skeleton/index.ts and examples/fixtures/runtime-skeleton/runtime-skeleton-fixture-matrix.json"
      ].join("\n")
    );
  }
}
