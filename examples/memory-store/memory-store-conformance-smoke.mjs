import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS,
  evaluateMemoryStoreConformanceFixtureMatrix
} from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "memory-store",
  "memory-store-v1-fixture-matrix.json"
);

const fixtureText = await readFile(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const results = evaluateMemoryStoreConformanceFixtureMatrix(fixture);
const expectedCaseCount = 107;

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.profile.backend, "postgresql", "profile", "backend");
assertEqual(fixture.profile.defaultSchemaName, "source_wire_memory", "profile", "defaultSchemaName");
assertEqual(fixture.cases.length, expectedCaseCount, "fixture", "caseCount");
assertEqual(results.length, expectedCaseCount, "results", "resultCount");
assertUniqueValues(fixture.cases, "caseId", "fixture cases");
assertUniqueValues(results, "caseId", "results");

for (const [field, value] of Object.entries(fixture.boundary)) {
  if (field === "noAutoPromotion") {
    assertEqual(value, true, "boundary", field);
  } else {
    assertEqual(value, false, "boundary", field);
  }
}

const unsafePatterns = [
  /\/Users\//,
  /postgres(?:ql)?:\/\//i,
  /-----BEGIN [A-Z ]+ KEY-----/,
  /\bsk-[A-Za-z0-9_-]{12,}\b/,
  /\bclient[_-]?secret\s*[:=]/i
];

for (const pattern of unsafePatterns) {
  if (pattern.test(fixtureText)) {
    throw new Error(`memory-store fixture contains unsafe pattern: ${pattern}`);
  }
}

const requiredCaseIds = new Set([
  "ms_provider_search_audit_committed",
  "ms_provider_fetch_audit_committed",
  "ms_provider_search_audit_failure_withholds_content",
  "ms_provider_fetch_audit_failure_withholds_content",
  "ms_read_audit_receipt_field_match",
  "ms_read_audit_receipt_request_mismatch_denied",
  "ms_read_audit_receipt_provider_mismatch_denied",
  "ms_read_audit_receipt_result_digest_mismatch_denied",
  "ms_read_audit_receipt_replay_denied",
  "ms_read_audit_receipt_trace_mismatch_denied",
  "ms_read_audit_receipt_owner_mismatch_denied",
  "ms_read_audit_receipt_namespace_mismatch_denied",
  "ms_read_audit_receipt_kind_mismatch_denied",
  "ms_read_audit_receipt_release_binding_mismatch_denied",
  "ms_read_audit_receipt_count_mismatch_denied",
  "ms_read_audit_receipt_uncommitted_denied",
  "ms_read_audit_receipt_not_single_use_denied",
  "ms_provider_audit_missing_provider_denied",
  "ms_missing_read_kind_denied",
  "ms_owner_assertion_candidate_allowed",
  "ms_memory_only_search_allowed",
  "ms_owner_supplied_postgres_boundary",
  "ms_source_wire_schema_contract",
  "ms_dedicated_schema_required",
  "ms_postgres_supported",
  "ms_non_postgres_rejected",
  "ms_arbitrary_table_mapping_rejected",
  "ms_migration_ownership_posture",
  "ms_schema_owner_nologin",
  "ms_schema_owner_owned_schema_exact",
  "ms_schema_owner_extra_schema_denied",
  "ms_schema_owner_superuser_denied",
  "ms_schema_owner_database_ownership_denied",
  "ms_migrator_temporary_credential",
  "ms_migrator_approved_migration_only",
  "ms_migrator_runtime_use_denied",
  "ms_migrator_data_read_denied",
  "ms_migrator_role_assumption_bounded",
  "ms_runtime_non_owner",
  "ms_runtime_superuser_denied",
  "ms_runtime_create_role_denied",
  "ms_runtime_create_database_denied",
  "ms_runtime_replication_denied",
  "ms_runtime_bypass_rls_denied",
  "ms_runtime_schema_allowlist",
  "ms_runtime_schema_creation_denied",
  "ms_runtime_truncate_denied",
  "ms_runtime_audit_insert_allowed",
  "ms_runtime_audit_update_denied",
  "ms_runtime_audit_delete_denied",
  "ms_cross_schema_denied",
  "ms_kb_reader_read_only",
  "ms_kb_reader_write_denied",
  "ms_runtime_audit_mutation_denied",
  "ms_kb_reader_memory_access_denied",
  "ms_kb_reader_schema_creation_denied",
  "ms_observer_health_allowed",
  "ms_observer_content_denied",
  "ms_observer_row_access_denied",
  "ms_observer_schema_access_denied",
  "ms_fixed_search_path_required",
  "ms_public_schema_creation_revoked",
  "ms_unsafe_function_execution_revoked",
  "ms_objects_fully_qualified",
  "ms_parameterization_required",
  "ms_model_generated_sql_denied",
  "ms_candidate_with_provider_provenance",
  "ms_candidate_with_owner_assertion",
  "ms_candidate_with_prior_memory",
  "ms_missing_provenance_denied",
  "ms_absent_provenance_denied",
  "ms_unknown_provenance_denied",
  "ms_direct_source_to_trusted_denied",
  "ms_missing_decision_denied",
  "ms_unknown_decision_denied",
  "ms_agent_self_approval_denied",
  "ms_missing_explicit_approval_denied",
  "ms_owner_controlled_approval_allowed",
  "ms_candidate_rejected",
  "ms_correction_supersedes_prior",
  "ms_trusted_memory_revoked",
  "ms_agent_revocation_denied",
  "ms_wrong_namespace_denied",
  "ms_missing_read_operation_denied",
  "ms_unknown_read_operation_denied",
  "ms_expected_revision_conflict",
  "ms_idempotent_replay",
  "ms_candidate_write_with_audit",
  "ms_audit_failure_rolls_back",
  "ms_approval_audit_failure_rolls_back",
  "ms_revocation_audit_failure_rolls_back",
  "ms_memory_search_audit_failure_withholds_content",
  "ms_memory_fetch_audit_failure_withholds_content",
  "ms_candidate_list_audit_failure_withholds_content",
  "ms_required_capability_missing_denied",
  "ms_unknown_required_capability_denied",
  "ms_unknown_optional_capability_ignored",
  "ms_contract_version_mismatch",
  "ms_schema_too_old_denied",
  "ms_schema_too_new_denied",
  "ms_schema_string_denied",
  "ms_schema_null_denied",
  "ms_schema_no_downgrade",
  "ms_safe_error_shape",
  "ms_retry_after_bound",
  "ms_fixture_synthetic",
  "ms_contract_scope_flags"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.caseId === fixtureCase.caseId);

  if (!result) {
    throw new Error(`missing memory-store result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.sourceEvidencePromoted, false, fixtureCase.caseId, "sourceEvidencePromoted");
  assertEqual(result.noAutoPromotion, true, fixtureCase.caseId, "noAutoPromotion");
  assertEqual(result.sourceWireHostsUserMemory, false, fixtureCase.caseId, "sourceWireHostsUserMemory");

  if (result.error) {
    assertSafeError(result.error, fixtureCase.caseId);
  }

  console.log(`ok memory store case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing memory-store cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok memory store conformance smoke");

function assertExpectedSubset(actual, expected, caseId) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (key === "memoryCount") {
      assertEqual(actual.memories.length, expectedValue, caseId, key);
      continue;
    }
    if (key === "candidateCount") {
      assertEqual(actual.candidates.length, expectedValue, caseId, key);
      continue;
    }
    if (key === "errorCode") {
      assertEqual(actual.error?.code, expectedValue, caseId, key);
      continue;
    }
    if (key === "retryAfterMs") {
      assertEqual(actual.error?.retryAfterMs, expectedValue, caseId, key);
      continue;
    }
    if (key === "readAuditReceiptPresent") {
      assertEqual(Boolean(actual.readAuditReceipt), expectedValue, caseId, key);
      continue;
    }
    if (key === "transactionReplayed") {
      assertEqual(actual.transactionReceipt?.replayed, expectedValue, caseId, key);
      continue;
    }
    assertEqual(actual[key], expectedValue, caseId, key);
  }
}

function assertSafeError(error, caseId) {
  const keys = Object.keys(error).sort();
  const allowedKeys = ["code", "detailsRedacted", "message", "retryAfterMs", "retryable", "traceId"];
  for (const key of keys) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`memory-store unsafe error field for ${caseId}: ${key}`);
    }
  }
  assertEqual(error.detailsRedacted, true, caseId, "error.detailsRedacted");
  if (error.retryAfterMs !== undefined && error.retryAfterMs > SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS) {
    throw new Error(`memory-store retryAfterMs exceeds safe maximum for ${caseId}`);
  }
}

function assertUniqueValues(items, field, label) {
  const values = items.map((item) => item[field]);
  const unique = new Set(values);
  if (unique.size !== values.length) {
    throw new Error(`memory-store duplicate ${field} in ${label}`);
  }
}

function assertEqual(actual, expected, caseId, field) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `memory-store smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/contracts/memory-store.ts and its synthetic fixture matrix"
      ].join("\n")
    );
  }
}
