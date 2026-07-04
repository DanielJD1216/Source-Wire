import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "runtime-readiness",
  "runtime-readiness-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

const requiredCaseIds = [
  "private_daily_workflow_proof_ready",
  "private_proof_missing_blocked",
  "api_policy_contract_ready",
  "mcp_policy_bypass_blocked",
  "database_posture_unapproved_blocked",
  "source_update_safety_ready",
  "memory_engine_license_boundary_ready",
  "release_mutation_blocked"
];

assertEqual(fixture.fixtureType, "source-wire-runtime-readiness-fixture-matrix", "fixture", "fixtureType");
assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.contractVersion, "source-wire-runtime-readiness.v1", "fixture", "contractVersion");

assertBoundary(fixture.boundary);

for (const caseId of requiredCaseIds) {
  const readinessCase = getCase(caseId);
  assertTruthy(readinessCase.plainEnglish.length > 0, caseId, "plainEnglish");
  assertTruthy(readinessCase.checks && typeof readinessCase.checks === "object", caseId, "checks");
  assertEqual(readinessCase.expected.runtimeWorkCanStart, false, caseId, "expected.runtimeWorkCanStart");
  assertTruthy(readinessCase.expected.allowedNextAction.length > 0, caseId, "expected.allowedNextAction");

  if (readinessCase.status === "blocked") {
    assertTruthy(readinessCase.expected.failureRecords.length > 0, caseId, "expected.failureRecords present");
    for (const failureRecord of readinessCase.expected.failureRecords) {
      assertFailureRecord(caseId, failureRecord);
    }
  } else {
    assertEqual(readinessCase.expected.failureRecords.length, 0, caseId, "expected.failureRecords");
  }
}

assertEqual(getCase("private_daily_workflow_proof_ready").checks.privateBehaviorProofAvailable, true, "private_daily_workflow_proof_ready", "privateBehaviorProofAvailable");
assertEqual(getCase("private_proof_missing_blocked").checks.privateBehaviorProofAvailable, false, "private_proof_missing_blocked", "privateBehaviorProofAvailable");
assertEqual(getCase("api_policy_contract_ready").checks.apiPolicyDefined, true, "api_policy_contract_ready", "apiPolicyDefined");
assertEqual(getCase("mcp_policy_bypass_blocked").checks.mcpDirectRuntimeBypassAllowed, false, "mcp_policy_bypass_blocked", "mcpDirectRuntimeBypassAllowed");
assertEqual(getCase("database_posture_unapproved_blocked").checks.migrationApproved, false, "database_posture_unapproved_blocked", "migrationApproved");
assertEqual(getCase("source_update_safety_ready").checks.noAutoPromotion, true, "source_update_safety_ready", "noAutoPromotion");
assertEqual(getCase("source_update_safety_ready").checks.localPathCrawlingAllowed, false, "source_update_safety_ready", "localPathCrawlingAllowed");
assertEqual(getCase("memory_engine_license_boundary_ready").checks.agplCodeCopied, false, "memory_engine_license_boundary_ready", "agplCodeCopied");
assertEqual(getCase("release_mutation_blocked").checks.releaseMutationApproved, false, "release_mutation_blocked", "releaseMutationApproved");

assertEqual(fixture.cases.length, requiredCaseIds.length, "fixture", "cases.length");

console.log("ok runtime readiness fixture matrix");
console.log("ok runtime readiness private proof gate");
console.log("ok runtime readiness API and MCP policy gates");
console.log("ok runtime readiness database and source update gates");
console.log("ok runtime readiness license and release gates");
console.log("ok runtime readiness smoke");

function assertBoundary(boundary) {
  assertEqual(boundary.fixtureSafety, "synthetic", "boundary", "fixtureSafety");
  assertEqual(boundary.runtimeImplementationIncluded, false, "boundary", "runtimeImplementationIncluded");
  assertEqual(boundary.apiServerRuntimeIncluded, false, "boundary", "apiServerRuntimeIncluded");
  assertEqual(boundary.mcpServerRuntimeIncluded, false, "boundary", "mcpServerRuntimeIncluded");
  assertEqual(boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
  assertEqual(boundary.databaseConnectionAttempted, false, "boundary", "databaseConnectionAttempted");
  assertEqual(boundary.liveConnectorsIncluded, false, "boundary", "liveConnectorsIncluded");
  assertEqual(boundary.deploymentIncluded, false, "boundary", "deploymentIncluded");
  assertEqual(boundary.managedHostingIncluded, false, "boundary", "managedHostingIncluded");
  assertEqual(boundary.realUserDataIncluded, false, "boundary", "realUserDataIncluded");
  assertEqual(boundary.privateImplementationCodeCopied, false, "boundary", "privateImplementationCodeCopied");
  assertEqual(boundary.agplCodeCopied, false, "boundary", "agplCodeCopied");
  assertEqual(boundary.automaticTrustedMemoryPromotionAllowed, false, "boundary", "automaticTrustedMemoryPromotionAllowed");
  assertEqual(boundary.packageVersionChangeRequired, false, "boundary", "packageVersionChangeRequired");
}

function getCase(caseId) {
  const readinessCase = fixture.cases.find((candidate) => candidate.caseId === caseId);

  if (!readinessCase) {
    fail(caseId, "case", "missing runtime readiness case");
  }

  return readinessCase;
}

function assertFailureRecord(caseId, failureRecord) {
  for (const field of ["failurePoint", "observedError", "supportedCause", "impact", "nextAction"]) {
    assertEqual(typeof failureRecord[field], "string", caseId, `failureRecord.${field}`);
    assertTruthy(failureRecord[field].length > 0, caseId, `failureRecord.${field} populated`);
  }
}

function assertEqual(actual, expected, caseId, field) {
  if (actual !== expected) {
    fail(caseId, field, `expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(value, caseId, field) {
  if (!value) {
    fail(caseId, field, "expected truthy value");
  }
}

function fail(caseId, field, message) {
  throw new Error(`[${caseId}] ${field}: ${message}`);
}
