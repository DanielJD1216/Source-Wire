import assert from "node:assert/strict";
import test from "node:test";

import { classifySchemaCompatibility } from "../src/schema-compatibility.js";

const expectedChecksum = "a".repeat(64);
const secondChecksum = "b".repeat(64);
const thirdChecksum = "c".repeat(64);
const fourthChecksum = "d".repeat(64);
const fifthChecksum = "e".repeat(64);
const sixthChecksum = "f".repeat(64);
const seventhChecksum = "7".repeat(64);
const expectedMigrations = [
  { version: 1, checksumSha256: expectedChecksum },
  { version: 2, checksumSha256: secondChecksum },
  { version: 3, checksumSha256: thirdChecksum },
  { version: 4, checksumSha256: fourthChecksum },
  { version: 5, checksumSha256: fifthChecksum },
  { version: 6, checksumSha256: sixthChecksum },
  { version: 7, checksumSha256: seventhChecksum }
];

const completedSeven = [
  { version: 1, checksumSha256: expectedChecksum, state: "completed" },
  { version: 2, checksumSha256: secondChecksum, state: "completed" },
  { version: 3, checksumSha256: thirdChecksum, state: "completed" },
  { version: 4, checksumSha256: fourthChecksum, state: "completed" },
  { version: 5, checksumSha256: fifthChecksum, state: "completed" },
  { version: 6, checksumSha256: sixthChecksum, state: "completed" },
  { version: 7, checksumSha256: seventhChecksum, state: "completed" }
];

test("schema compatibility accepts the completed seven-migration chain", () => {
  assert.deepEqual(
    classifySchemaCompatibility(completedSeven, expectedMigrations),
    { compatible: true, version: 7 }
  );
});

test("schema compatibility fails closed for absent, malformed, old, and new state", () => {
  assert.deepEqual(classifySchemaCompatibility([], expectedMigrations), {
    compatible: false,
    code: "schema_incompatible"
  });
  assert.deepEqual(
    classifySchemaCompatibility(
      completedSeven.map((row) =>
        row.version === 7
          ? { ...row, checksumSha256: "0".repeat(64) }
          : row
      ),
      expectedMigrations
    ),
    { compatible: false, code: "schema_incompatible" }
  );
  assert.deepEqual(
    classifySchemaCompatibility(
      completedSeven.map((row) =>
        row.version === 7 ? { ...row, state: "applying" } : row
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
        ...completedSeven,
        { version: 8, checksumSha256: "1".repeat(64), state: "completed" }
      ],
      expectedMigrations
    ),
    { compatible: false, code: "schema_too_new" }
  );
});
