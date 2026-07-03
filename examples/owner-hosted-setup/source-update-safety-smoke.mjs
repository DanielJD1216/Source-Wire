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

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary.realSourceDataIncluded, false, "boundary", "realSourceDataIncluded");
assertEqual(fixture.boundary.localPathCrawlingAllowed, false, "boundary", "localPathCrawlingAllowed");
assertEqual(
  fixture.boundary.automaticTrustedMemoryPromotionAllowed,
  false,
  "boundary",
  "automaticTrustedMemoryPromotionAllowed"
);

const safeCase = getCase("source_update_snapshot_safe");
const blockedCase = getCase("source_update_folder_crawl_blocked");

assertEqual(safeCase.status, "ready", safeCase.caseId, "status");
assertEqual(safeCase.checks.callerSuppliedSnapshot, true, safeCase.caseId, "checks.callerSuppliedSnapshot");
assertEqual(safeCase.checks.ownerSelectedSource, true, safeCase.caseId, "checks.ownerSelectedSource");
assertSourceUpdateSafety(safeCase);
assertEqual(safeCase.expected.setupCanContinue, true, safeCase.caseId, "expected.setupCanContinue");
assertEqual(safeCase.expected.failureRecords.length, 0, safeCase.caseId, "expected.failureRecords");

assertEqual(blockedCase.status, "blocked", blockedCase.caseId, "status");
assertEqual(blockedCase.checks.callerSuppliedSnapshot, false, blockedCase.caseId, "checks.callerSuppliedSnapshot");
assertEqual(blockedCase.checks.ownerSelectedSource, false, blockedCase.caseId, "checks.ownerSelectedSource");
assertSourceUpdateSafety(blockedCase);
assertEqual(blockedCase.expected.setupCanContinue, false, blockedCase.caseId, "expected.setupCanContinue");
assertTruthy(blockedCase.expected.failureRecords.length > 0, blockedCase.caseId, "expected.failureRecords present");

for (const failureRecord of blockedCase.expected.failureRecords) {
  assertFailureRecord(blockedCase.caseId, failureRecord);
}

console.log("ok owner-hosted setup source update safe snapshot");
console.log("ok owner-hosted setup source update folder crawl blocked");
console.log("ok owner-hosted setup source update safety smoke");

function getCase(caseId) {
  const readinessCase = fixture.readinessCases.find((candidate) => candidate.caseId === caseId);

  if (!readinessCase) {
    fail(caseId, "case", "missing source update safety case");
  }

  assertEqual(readinessCase.category, "source_update", caseId, "category");
  return readinessCase;
}

function assertSourceUpdateSafety(readinessCase) {
  assertEqual(readinessCase.checks.localPathCrawlingAllowed, false, readinessCase.caseId, "checks.localPathCrawlingAllowed");
  assertEqual(readinessCase.checks.broadImportAllowed, false, readinessCase.caseId, "checks.broadImportAllowed");
  assertEqual(readinessCase.checks.trustedMemoryRecordDelta, 0, readinessCase.caseId, "checks.trustedMemoryRecordDelta");
  assertEqual(readinessCase.checks.noAutoPromotion, true, readinessCase.caseId, "checks.noAutoPromotion");
  assertEqual(
    readinessCase.checks.pendingReviewControl,
    "owner_or_application_controlled",
    readinessCase.caseId,
    "checks.pendingReviewControl"
  );
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
