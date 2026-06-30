import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { runMinimalRuntimeProofCases } from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "owner-hosted-api-mcp-boundary",
  "boundary-proof-cases.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const results = runMinimalRuntimeProofCases(fixture.proofCases);

for (const proofCase of fixture.proofCases) {
  const proofResult = results.find((result) => result.caseId === proofCase.caseId);

  if (!proofResult) {
    throw new Error(`missing runtime proof result for case: ${proofCase.caseId}`);
  }

  assertExpectedSubset(proofResult.result, proofCase.expectedResult, proofCase.caseId);
  assertEqual(proofResult.audit.result, proofCase.audit.result, proofCase.caseId, "audit result");
  assertEqual(proofResult.audit.eventType, proofCase.audit.eventType, proofCase.caseId, "audit eventType");
  assertEqual(
    proofResult.audit.syntheticTraceId,
    proofCase.audit.syntheticTraceId,
    proofCase.caseId,
    "audit syntheticTraceId"
  );
  assertEqual(proofResult.audit.leakedContent, false, proofCase.caseId, "audit leakedContent");
  console.log(`ok minimal runtime boundary case ${proofCase.caseId}`);
}

console.log("ok minimal runtime boundary smoke");

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
        `minimal runtime boundary smoke check failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/runtime/minimal-boundary.ts and the owner-hosted API plus MCP boundary fixture"
      ].join("\n")
    );
  }
}
