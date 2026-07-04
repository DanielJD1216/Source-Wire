import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "daily-workflow",
  "daily-workflow-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

const requiredCaseIds = [
  "daily_ask_trusted_citation",
  "daily_ask_missing_evidence_gap",
  "bounded_update_pending_review",
  "bounded_update_missing_snapshot_blocked",
  "bounded_update_folder_crawl_blocked",
  "owner_review_approval",
  "owner_review_rejection",
  "owner_review_mcp_bypass_denied",
  "follow_up_uses_approved_memory",
  "follow_up_excludes_pending_candidate",
  "follow_up_excludes_rejected_candidate",
  "mission_control_daily_summary"
];

assertEqual(fixture.fixtureType, "source-wire-daily-workflow-fixture-matrix", "fixture", "fixtureType");
assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.contractVersion, "source-wire-daily-workflow.v1", "fixture", "contractVersion");

assertBoundary(fixture.boundary);

for (const caseId of requiredCaseIds) {
  const workflowCase = getCase(caseId);
  assertEqual(workflowCase.checks.noAutoPromotion, true, caseId, "checks.noAutoPromotion");
  assertTruthy(Array.isArray(workflowCase.checks.evidenceLabels), caseId, "checks.evidenceLabels");

  if (workflowCase.status === "blocked") {
    assertEqual(workflowCase.expected.canContinue, false, caseId, "expected.canContinue");
    assertTruthy(workflowCase.expected.failureRecords.length > 0, caseId, "expected.failureRecords present");
    for (const failureRecord of workflowCase.expected.failureRecords) {
      assertFailureRecord(caseId, failureRecord);
    }
  }
}

assertEqual(getCase("daily_ask_trusted_citation").checks.trustedMemoryRecordDelta, 0, "daily_ask_trusted_citation", "trustedMemoryRecordDelta");
assertEqual(getCase("daily_ask_trusted_citation").checks.approvedTrustedCitationCount, 1, "daily_ask_trusted_citation", "approvedTrustedCitationCount");

assertEqual(getCase("bounded_update_pending_review").checks.trustedMemoryRecordDelta, 0, "bounded_update_pending_review", "trustedMemoryRecordDelta");
assertEqual(getCase("bounded_update_pending_review").checks.callerSuppliedSnapshotRequired, true, "bounded_update_pending_review", "callerSuppliedSnapshotRequired");
assertEqual(getCase("bounded_update_pending_review").checks.callerSuppliedSnapshotProvided, true, "bounded_update_pending_review", "callerSuppliedSnapshotProvided");
assertEqual(getCase("bounded_update_pending_review").checks.folderCrawlingAllowed, false, "bounded_update_pending_review", "folderCrawlingAllowed");

assertEqual(getCase("bounded_update_missing_snapshot_blocked").checks.trustedMemoryRecordDelta, 0, "bounded_update_missing_snapshot_blocked", "trustedMemoryRecordDelta");
assertEqual(getCase("bounded_update_missing_snapshot_blocked").checks.callerSuppliedSnapshotProvided, false, "bounded_update_missing_snapshot_blocked", "callerSuppliedSnapshotProvided");

assertEqual(getCase("bounded_update_folder_crawl_blocked").checks.folderCrawlingRequested, true, "bounded_update_folder_crawl_blocked", "folderCrawlingRequested");
assertEqual(getCase("bounded_update_folder_crawl_blocked").checks.folderCrawlingAllowed, false, "bounded_update_folder_crawl_blocked", "folderCrawlingAllowed");

assertEqual(getCase("owner_review_approval").checks.trustedMemoryRecordDelta, 1, "owner_review_approval", "trustedMemoryRecordDelta");
assertEqual(getCase("owner_review_approval").checks.ownerApprovalCreatesTrustedMemoryRecords, 1, "owner_review_approval", "ownerApprovalCreatesTrustedMemoryRecords");

assertEqual(getCase("owner_review_rejection").checks.trustedMemoryRecordDelta, 0, "owner_review_rejection", "trustedMemoryRecordDelta");
assertEqual(getCase("owner_review_rejection").checks.ownerRejectionCreatesTrustedMemoryRecords, 0, "owner_review_rejection", "ownerRejectionCreatesTrustedMemoryRecords");

assertEqual(getCase("owner_review_mcp_bypass_denied").checks.mcpApprovalAllowed, false, "owner_review_mcp_bypass_denied", "mcpApprovalAllowed");
assertEqual(getCase("owner_review_mcp_bypass_denied").checks.trustedMemoryRecordDelta, 0, "owner_review_mcp_bypass_denied", "trustedMemoryRecordDelta");

assertEqual(getCase("follow_up_uses_approved_memory").checks.approvedTrustedCitationCount, 1, "follow_up_uses_approved_memory", "approvedTrustedCitationCount");
assertEqual(getCase("follow_up_uses_approved_memory").checks.pendingCandidateTrustedCitationCount, 0, "follow_up_uses_approved_memory", "pendingCandidateTrustedCitationCount");
assertEqual(getCase("follow_up_uses_approved_memory").checks.rejectedCandidateTrustedCitationCount, 0, "follow_up_uses_approved_memory", "rejectedCandidateTrustedCitationCount");

assertEqual(getCase("follow_up_excludes_pending_candidate").checks.pendingCandidateTrustedCitationCount, 0, "follow_up_excludes_pending_candidate", "pendingCandidateTrustedCitationCount");
assertEqual(getCase("follow_up_excludes_rejected_candidate").checks.rejectedCandidateTrustedCitationCount, 0, "follow_up_excludes_rejected_candidate", "rejectedCandidateTrustedCitationCount");

console.log("ok daily workflow fixture matrix");
console.log("ok daily workflow read-only ask invariants");
console.log("ok daily workflow bounded update invariants");
console.log("ok daily workflow owner review invariants");
console.log("ok daily workflow follow-up evidence separation");
console.log("ok daily workflow smoke");

function assertBoundary(boundary) {
  assertEqual(boundary.fixtureSafety, "synthetic", "boundary", "fixtureSafety");
  assertEqual(boundary.runtimeIncluded, false, "boundary", "runtimeIncluded");
  assertEqual(boundary.apiServerRuntimeIncluded, false, "boundary", "apiServerRuntimeIncluded");
  assertEqual(boundary.mcpServerRuntimeIncluded, false, "boundary", "mcpServerRuntimeIncluded");
  assertEqual(boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
  assertEqual(boundary.realDatabaseConnectionIncluded, false, "boundary", "realDatabaseConnectionIncluded");
  assertEqual(boundary.liveConnectorsIncluded, false, "boundary", "liveConnectorsIncluded");
  assertEqual(boundary.localPathCrawlingAllowed, false, "boundary", "localPathCrawlingAllowed");
  assertEqual(boundary.realUserDataIncluded, false, "boundary", "realUserDataIncluded");
  assertEqual(boundary.privateImplementationCodeCopied, false, "boundary", "privateImplementationCodeCopied");
  assertEqual(boundary.agplCodeCopied, false, "boundary", "agplCodeCopied");
  assertEqual(boundary.automaticTrustedMemoryPromotionAllowed, false, "boundary", "automaticTrustedMemoryPromotionAllowed");
  assertEqual(boundary.mcpCanApproveTrustedMemory, false, "boundary", "mcpCanApproveTrustedMemory");
  assertEqual(boundary.packageVersionChangeRequired, false, "boundary", "packageVersionChangeRequired");
}

function getCase(caseId) {
  const workflowCase = fixture.cases.find((candidate) => candidate.caseId === caseId);

  if (!workflowCase) {
    fail(caseId, "case", "missing daily workflow case");
  }

  return workflowCase;
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
