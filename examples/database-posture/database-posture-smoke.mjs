import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateDatabasePostureFixtureMatrix } from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "database-posture",
  "database-posture-fixture-matrix.json"
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const results = evaluateDatabasePostureFixtureMatrix(fixture);

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.boundary.databaseMigrationsIncluded, false, "boundary", "databaseMigrationsIncluded");
assertEqual(fixture.boundary.realDatabaseConnectionsIncluded, false, "boundary", "realDatabaseConnectionsIncluded");
assertEqual(fixture.boundary.postgresOrPgvectorSetupIncluded, false, "boundary", "postgresOrPgvectorSetupIncluded");
assertEqual(fixture.boundary.apiServerIncluded, false, "boundary", "apiServerIncluded");
assertEqual(fixture.boundary.mcpServerRuntimeIncluded, false, "boundary", "mcpServerRuntimeIncluded");
assertEqual(fixture.boundary.realDataIncluded, false, "boundary", "realDataIncluded");
assertEqual(fixture.boundary.clientDataIncluded, false, "boundary", "clientDataIncluded");
assertEqual(fixture.boundary.privateImplementationCodeIncluded, false, "boundary", "privateImplementationCodeIncluded");
assertEqual(fixture.boundary.agplCodeIncluded, false, "boundary", "agplCodeIncluded");
assertEqual(fixture.boundary.sourceEvidenceMayAutoPromoteToTrustedMemory, false, "boundary", "sourceEvidenceMayAutoPromoteToTrustedMemory");

const requiredDataClasses = new Set([
  "source_evidence",
  "memory_candidate",
  "trusted_memory",
  "audit_event",
  "embedding_vector",
  "search_cache",
  "backup_snapshot",
  "export_bundle"
]);

for (const dataClass of fixture.dataClasses) {
  requiredDataClasses.delete(dataClass.dataClass);
  assertEqual(typeof dataClass.trustLevel, "string", dataClass.dataClass, "trustLevel");
  assertEqual(typeof dataClass.lifecycleController, "string", dataClass.dataClass, "lifecycleController");
}

if (requiredDataClasses.size > 0) {
  throw new Error(`missing database posture data classes: ${[...requiredDataClasses].join(", ")}`);
}

const requiredCaseIds = new Set([
  "authorized_namespace_data_class_read",
  "wrong_namespace_denied_without_leak",
  "source_evidence_submitted_to_indexed",
  "candidate_prepared_to_approved",
  "candidate_prepared_to_rejected",
  "trusted_memory_approved_to_revoked",
  "trusted_memory_approved_to_deleted",
  "retention_policy_summary",
  "deletion_marks_dependent_citations_stale",
  "backup_keeps_owner_namespace_boundaries",
  "restore_cannot_bypass_candidate_review",
  "cache_and_embedding_inherit_parent_namespace"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.caseId === fixtureCase.caseId);

  if (!result) {
    throw new Error(`missing database posture result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.runtimeMode, "synthetic_database_posture_package", fixtureCase.caseId, "runtimeMode");
  assertEqual(result.contentLeaked, false, fixtureCase.caseId, "contentLeaked");
  assertEqual(result.sourceEvidencePromoted, false, fixtureCase.caseId, "sourceEvidencePromoted");
  assertEqual(result.databaseMigrationCreated, false, fixtureCase.caseId, "databaseMigrationCreated");
  assertEqual(result.realDatabaseConnectionOpened, false, fixtureCase.caseId, "realDatabaseConnectionOpened");
  assertEqual(result.postgresOrPgvectorSetupCreated, false, fixtureCase.caseId, "postgresOrPgvectorSetupCreated");
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");

  if (fixtureCase.caseId !== "candidate_prepared_to_approved") {
    assertEqual(result.trustedMemoryCreated, false, fixtureCase.caseId, "trustedMemoryCreated");
  }

  console.log(`ok database posture case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing database posture cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok database posture smoke");

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
        `database posture smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/contracts/database-posture.ts and examples/fixtures/database-posture/database-posture-fixture-matrix.json"
      ].join("\n")
    );
  }
}
