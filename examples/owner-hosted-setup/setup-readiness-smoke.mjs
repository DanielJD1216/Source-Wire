import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "owner-hosted-setup",
  "setup-readiness-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

assertEqual(
  fixture.fixtureType,
  "source-wire-owner-hosted-setup-readiness-fixture-matrix",
  "fixture",
  "fixtureType"
);
assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertBoundary(fixture.boundary);
assertCoverage(fixture.coverage);

const requiredCases = new Map([
  ["database_ready", { category: "database", status: "ready" }],
  ["database_missing_owner_secret_blocked", { category: "database", status: "blocked" }],
  ["api_policy_ready", { category: "api", status: "ready" }],
  ["api_missing_namespace_policy_blocked", { category: "api", status: "blocked" }],
  ["mcp_adapter_ready", { category: "mcp", status: "ready" }],
  ["mcp_policy_bypass_blocked", { category: "mcp", status: "blocked" }],
  ["source_update_snapshot_safe", { category: "source_update", status: "ready" }],
  ["source_update_folder_crawl_blocked", { category: "source_update", status: "blocked" }],
  ["mission_control_setup_health_ready", { category: "mission_control", status: "ready" }]
]);

for (const [caseId, expected] of requiredCases) {
  const readinessCase = fixture.readinessCases.find((candidate) => candidate.caseId === caseId);

  if (!readinessCase) {
    fail(caseId, "case", "missing required setup readiness case");
  }

  assertEqual(readinessCase.category, expected.category, caseId, "category");
  assertEqual(readinessCase.status, expected.status, caseId, "status");
  assertEqual(typeof readinessCase.ownerBrings, "string", caseId, "ownerBrings");
  assertTruthy(readinessCase.ownerBrings.length > 0, caseId, "ownerBrings populated");
  assertTruthy(readinessCase.checks && typeof readinessCase.checks === "object", caseId, "checks");
  assertTruthy(readinessCase.expected && typeof readinessCase.expected === "object", caseId, "expected");

  if (readinessCase.status === "ready") {
    assertReadyCase(readinessCase);
  } else {
    assertBlockedCase(readinessCase);
  }

  console.log(`ok owner-hosted setup readiness case ${caseId}`);
}

assertEqual(fixture.readinessCases.length, requiredCases.size, "fixture", "readinessCases.length");

console.log("ok owner-hosted setup readiness smoke");

function assertBoundary(boundary) {
  assertTruthy(boundary && typeof boundary === "object", "boundary", "exists");
  assertEqual(boundary.hosting, "owner_hosted_byo", "boundary", "hosting");
  assertEqual(boundary.sourceWireHostsUserMemory, false, "boundary", "sourceWireHostsUserMemory");
  assertEqual(boundary.managedHostingIncluded, false, "boundary", "managedHostingIncluded");
  assertEqual(boundary.apiServerStarted, false, "boundary", "apiServerStarted");
  assertEqual(boundary.mcpServerStarted, false, "boundary", "mcpServerStarted");
  assertEqual(boundary.databaseConnectionAttempted, false, "boundary", "databaseConnectionAttempted");
  assertEqual(boundary.databaseMigrationAttempted, false, "boundary", "databaseMigrationAttempted");
  assertEqual(boundary.realSourceDataIncluded, false, "boundary", "realSourceDataIncluded");
  assertEqual(boundary.localPathCrawlingAllowed, false, "boundary", "localPathCrawlingAllowed");
  assertEqual(
    boundary.automaticTrustedMemoryPromotionAllowed,
    false,
    "boundary",
    "automaticTrustedMemoryPromotionAllowed"
  );
}

function assertCoverage(coverage) {
  assertTruthy(coverage && typeof coverage === "object", "coverage", "exists");
  assertEqual(coverage.databasePassAndBlocked, true, "coverage", "databasePassAndBlocked");
  assertEqual(coverage.apiPassAndBlocked, true, "coverage", "apiPassAndBlocked");
  assertEqual(coverage.mcpPassAndBlocked, true, "coverage", "mcpPassAndBlocked");
  assertEqual(coverage.sourceUpdateSafeAndBlocked, true, "coverage", "sourceUpdateSafeAndBlocked");
  assertEqual(coverage.missionControlSetupHealth, true, "coverage", "missionControlSetupHealth");
  assertEqual(coverage.noAutoPromotionRepresented, true, "coverage", "noAutoPromotionRepresented");
  assertEqual(coverage.allFixturesSynthetic, true, "coverage", "allFixturesSynthetic");
}

function assertReadyCase(readinessCase) {
  assertEqual(readinessCase.expected.setupCanContinue, true, readinessCase.caseId, "expected.setupCanContinue");
  assertEqual(readinessCase.expected.failureRecords.length, 0, readinessCase.caseId, "expected.failureRecords");
  assertTruthy(readinessCase.expected.nextAction.length > 0, readinessCase.caseId, "expected.nextAction");

  if (readinessCase.category === "source_update") {
    assertEqual(readinessCase.checks.trustedMemoryRecordDelta, 0, readinessCase.caseId, "checks.trustedMemoryRecordDelta");
    assertEqual(readinessCase.checks.noAutoPromotion, true, readinessCase.caseId, "checks.noAutoPromotion");
    assertEqual(
      readinessCase.checks.pendingReviewControl,
      "owner_or_application_controlled",
      readinessCase.caseId,
      "checks.pendingReviewControl"
    );
    assertEqual(readinessCase.checks.localPathCrawlingAllowed, false, readinessCase.caseId, "checks.localPathCrawlingAllowed");
    assertEqual(readinessCase.checks.broadImportAllowed, false, readinessCase.caseId, "checks.broadImportAllowed");
  }
}

function assertBlockedCase(readinessCase) {
  assertEqual(readinessCase.expected.setupCanContinue, false, readinessCase.caseId, "expected.setupCanContinue");
  assertTruthy(Array.isArray(readinessCase.expected.failureRecords), readinessCase.caseId, "expected.failureRecords array");
  assertTruthy(readinessCase.expected.failureRecords.length > 0, readinessCase.caseId, "expected.failureRecords present");

  for (const failureRecord of readinessCase.expected.failureRecords) {
    assertFailureRecord(readinessCase.caseId, failureRecord);
  }

  assertTruthy(readinessCase.expected.nextAction.length > 0, readinessCase.caseId, "expected.nextAction");

  if (readinessCase.category === "source_update") {
    assertEqual(readinessCase.checks.trustedMemoryRecordDelta, 0, readinessCase.caseId, "checks.trustedMemoryRecordDelta");
    assertEqual(readinessCase.checks.noAutoPromotion, true, readinessCase.caseId, "checks.noAutoPromotion");
    assertEqual(
      readinessCase.checks.pendingReviewControl,
      "owner_or_application_controlled",
      readinessCase.caseId,
      "checks.pendingReviewControl"
    );
    assertEqual(readinessCase.checks.localPathCrawlingAllowed, false, readinessCase.caseId, "checks.localPathCrawlingAllowed");
    assertEqual(readinessCase.checks.broadImportAllowed, false, readinessCase.caseId, "checks.broadImportAllowed");
  }
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
