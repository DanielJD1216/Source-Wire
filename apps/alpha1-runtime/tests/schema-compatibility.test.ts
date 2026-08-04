import assert from "node:assert/strict";
import test from "node:test";

import {
  POSTGRESQL_16_COMPATIBILITY_MAJOR,
  POSTGRESQL_18_4_VERSION_NUM,
  isSupportedPostgresqlVersion,
  readPostgresCompatibilityMajor
} from "../src/migration.js";
import { classifySchemaCompatibility } from "../src/schema-compatibility.js";

const expectedChecksum = "a".repeat(64);
const secondChecksum = "b".repeat(64);
const thirdChecksum = "c".repeat(64);
const fourthChecksum = "d".repeat(64);
const fifthChecksum = "e".repeat(64);
const sixthChecksum = "f".repeat(64);
const seventhChecksum = "7".repeat(64);
const eighthChecksum = "8".repeat(64);
const expectedMigrations = [
  { version: 1, checksumSha256: expectedChecksum },
  { version: 2, checksumSha256: secondChecksum },
  { version: 3, checksumSha256: thirdChecksum },
  { version: 4, checksumSha256: fourthChecksum },
  { version: 5, checksumSha256: fifthChecksum },
  { version: 6, checksumSha256: sixthChecksum },
  { version: 7, checksumSha256: seventhChecksum },
  { version: 8, checksumSha256: eighthChecksum }
];

const completedEight = [
  { version: 1, checksumSha256: expectedChecksum, state: "completed" },
  { version: 2, checksumSha256: secondChecksum, state: "completed" },
  { version: 3, checksumSha256: thirdChecksum, state: "completed" },
  { version: 4, checksumSha256: fourthChecksum, state: "completed" },
  { version: 5, checksumSha256: fifthChecksum, state: "completed" },
  { version: 6, checksumSha256: sixthChecksum, state: "completed" },
  { version: 7, checksumSha256: seventhChecksum, state: "completed" },
  { version: 8, checksumSha256: eighthChecksum, state: "completed" }
];

test("exact PostgreSQL 18.4 is authoritative and PostgreSQL 16 requires explicit compatibility", () => {
  assert.equal(isSupportedPostgresqlVersion(POSTGRESQL_18_4_VERSION_NUM), true);
  assert.equal(isSupportedPostgresqlVersion(180_003), false);
  assert.equal(isSupportedPostgresqlVersion(180_005), false);
  assert.equal(isSupportedPostgresqlVersion(190_000), false);
  assert.equal(isSupportedPostgresqlVersion(160_000), false);
  assert.equal(
    isSupportedPostgresqlVersion(
      160_000,
      POSTGRESQL_16_COMPATIBILITY_MAJOR
    ),
    true
  );
  assert.equal(
    isSupportedPostgresqlVersion(169_999, POSTGRESQL_16_COMPATIBILITY_MAJOR),
    true
  );
  assert.equal(
    isSupportedPostgresqlVersion(170_000, POSTGRESQL_16_COMPATIBILITY_MAJOR),
    false
  );
  assert.equal(isSupportedPostgresqlVersion(Number.NaN), false);
});

test("PostgreSQL compatibility selection is explicit and fails closed", () => {
  assert.equal(readPostgresCompatibilityMajor({}), undefined);
  assert.equal(
    readPostgresCompatibilityMajor({ SOURCE_WIRE_POSTGRES_COMPATIBILITY_MAJOR: "16" }),
    POSTGRESQL_16_COMPATIBILITY_MAJOR
  );
  assert.throws(
    () => readPostgresCompatibilityMajor({ SOURCE_WIRE_POSTGRES_COMPATIBILITY_MAJOR: "18" }),
    /postgresql_compatibility_selection_invalid/u
  );
});

test("schema compatibility accepts the completed eight-migration chain", () => {
  assert.deepEqual(
    classifySchemaCompatibility(completedEight, expectedMigrations),
    { compatible: true, version: 8 }
  );
});

test("schema compatibility fails closed for absent, malformed, old, and new state", () => {
  assert.deepEqual(classifySchemaCompatibility([], expectedMigrations), {
    compatible: false,
    code: "schema_incompatible"
  });
  assert.deepEqual(
    classifySchemaCompatibility(
      completedEight.map((row) =>
        row.version === 8
          ? { ...row, checksumSha256: "0".repeat(64) }
          : row
      ),
      expectedMigrations
    ),
    { compatible: false, code: "schema_incompatible" }
  );
  assert.deepEqual(
    classifySchemaCompatibility(
      completedEight.map((row) =>
        row.version === 8 ? { ...row, state: "applying" } : row
      ),
      expectedMigrations
    ),
    { compatible: false, code: "schema_incompatible" }
  );
  assert.deepEqual(
    classifySchemaCompatibility(
      [{ version: 1, checksumSha256: expectedChecksum, state: "completed" }],
      expectedMigrations
    ),
    { compatible: false, code: "schema_too_old" }
  );
  assert.deepEqual(
    classifySchemaCompatibility(
      [
        ...completedEight,
        { version: 9, checksumSha256: "1".repeat(64), state: "completed" }
      ],
      expectedMigrations
    ),
    { compatible: false, code: "schema_too_new" }
  );
});
