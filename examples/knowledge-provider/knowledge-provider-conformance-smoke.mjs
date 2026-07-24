import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS,
  evaluateKnowledgeProviderConformanceFixtureMatrix
} from "../../dist/index.js";

const fixturePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "knowledge-provider",
  "knowledge-provider-v1-fixture-matrix.json"
);

const fixtureText = await readFile(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const results = evaluateKnowledgeProviderConformanceFixtureMatrix(fixture);
const expectedCaseCount = 37;

assertEqual(fixture.fixtureSafety, "synthetic", "fixture", "fixtureSafety");
assertEqual(fixture.profiles.length, 2, "fixture", "profileCount");
assertEqual(fixture.cases.length, expectedCaseCount, "fixture", "caseCount");
assertEqual(results.length, expectedCaseCount, "results", "resultCount");
assertUniqueValues(fixture.profiles, "providerId", "fixture profiles");
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
    throw new Error(`knowledge-provider fixture contains unsafe pattern: ${pattern}`);
  }
}

const requiredCaseIds = new Set([
  "kp_document_index_conforms",
  "kp_relational_view_conforms",
  "kp_unknown_profile_denied",
  "kp_describe_allowed",
  "kp_health_allowed",
  "kp_version_supported",
  "kp_version_missing_denied",
  "kp_version_mismatch_denied",
  "kp_required_capabilities_supported",
  "kp_required_capability_missing_denied",
  "kp_unknown_required_capability_denied",
  "kp_unknown_optional_capability_ignored",
  "kp_write_operation_rejected",
  "kp_mutation_authority_profile_rejected",
  "kp_scoped_search_allowed",
  "kp_scoped_fetch_allowed",
  "kp_wrong_namespace_denied",
  "kp_wrong_owner_denied",
  "kp_acl_unknown_denied",
  "kp_provider_scope_mismatch_denied",
  "kp_missing_digest_rejected",
  "kp_missing_locator_rejected",
  "kp_missing_source_version_rejected",
  "kp_empty_search_gap",
  "kp_partial_result_gap",
  "kp_unavailable_gap",
  "kp_rate_limited_gap",
  "kp_not_found_gap",
  "kp_cursor_provider_bound",
  "kp_foreign_cursor_denied",
  "kp_no_auto_promotion",
  "kp_safe_error_shape",
  "kp_retry_after_bound",
  "kp_prompt_injection_in_content",
  "kp_prompt_injection_in_metadata",
  "kp_fixture_synthetic",
  "kp_contract_scope_flags"
]);

for (const fixtureCase of fixture.cases) {
  requiredCaseIds.delete(fixtureCase.caseId);
  const result = results.find((candidate) => candidate.caseId === fixtureCase.caseId);

  if (!result) {
    throw new Error(`missing knowledge-provider result for case: ${fixtureCase.caseId}`);
  }

  assertExpectedSubset(result, fixtureCase.expected, fixtureCase.caseId);
  assertEqual(result.providerMutationAttempted, false, fixtureCase.caseId, "providerMutationAttempted");
  assertEqual(result.memoryMutationAttempted, false, fixtureCase.caseId, "memoryMutationAttempted");
  assertEqual(result.trustedMemoryCreated, false, fixtureCase.caseId, "trustedMemoryCreated");
  assertEqual(result.noAutoPromotion, true, fixtureCase.caseId, "noAutoPromotion");
  assertEqual(result.releaseState, "internal_unreleased", fixtureCase.caseId, "releaseState");

  if (result.error) {
    assertSafeError(result.error, fixtureCase.caseId);
  }

  console.log(`ok knowledge provider case ${fixtureCase.caseId}`);
}

if (requiredCaseIds.size > 0) {
  throw new Error(`missing knowledge-provider cases: ${[...requiredCaseIds].join(", ")}`);
}

console.log("ok knowledge provider conformance smoke");

function assertExpectedSubset(actual, expected, caseId) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (key === "evidenceCount") {
      assertEqual(actual.evidence.length, expectedValue, caseId, key);
      continue;
    }
    if (key === "gapCount") {
      assertEqual(actual.gaps.length, expectedValue, caseId, key);
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
    assertEqual(actual[key], expectedValue, caseId, key);
  }
}

function assertSafeError(error, caseId) {
  const keys = Object.keys(error).sort();
  const allowedKeys = ["code", "detailsRedacted", "message", "retryAfterMs", "retryable", "traceId"];
  for (const key of keys) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`knowledge-provider unsafe error field for ${caseId}: ${key}`);
    }
  }
  assertEqual(error.detailsRedacted, true, caseId, "error.detailsRedacted");
  if (error.retryAfterMs !== undefined && error.retryAfterMs > SOURCE_WIRE_MAX_SAFE_RETRY_AFTER_MS) {
    throw new Error(`knowledge-provider retryAfterMs exceeds safe maximum for ${caseId}`);
  }
}

function assertUniqueValues(items, field, label) {
  const values = items.map((item) => item[field]);
  const unique = new Set(values);
  if (unique.size !== values.length) {
    throw new Error(`knowledge-provider duplicate ${field} in ${label}`);
  }
}

function assertEqual(actual, expected, caseId, field) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `knowledge-provider smoke failed: ${caseId}`,
        `field: ${field}`,
        `expected: ${expectedJson}`,
        `received: ${actualJson}`,
        "next action: inspect src/contracts/knowledge-provider.ts and its synthetic fixture matrix"
      ].join("\n")
    );
  }
}
