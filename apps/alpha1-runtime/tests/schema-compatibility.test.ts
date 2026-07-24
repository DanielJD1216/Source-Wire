import assert from "node:assert/strict";
import test from "node:test";

import { classifySchemaCompatibility } from "../src/schema-compatibility.js";

const expectedChecksum = "a".repeat(64);
const secondChecksum = "b".repeat(64);
const thirdChecksum = "c".repeat(64);
const fourthChecksum = "d".repeat(64);
const expectedMigrations = [
  { version: 1, checksumSha256: expectedChecksum },
  { version: 2, checksumSha256: secondChecksum },
  { version: 3, checksumSha256: thirdChecksum },
  { version: 4, checksumSha256: fourthChecksum }
];

test("schema compatibility accepts the completed four-migration chain", () => {
  assert.deepEqual(
    classifySchemaCompatibility(
      [
        { version: 1, checksumSha256: expectedChecksum, state: "completed" },
        { version: 2, checksumSha256: secondChecksum, state: "completed" },
        { version: 3, checksumSha256: thirdChecksum, state: "completed" },
        { version: 4, checksumSha256: fourthChecksum, state: "completed" }
      ],
      expectedMigrations
    ),
    { compatible: true, version: 4 }
  );
});

test("schema compatibility fails closed for absent, malformed, old, and new state", () => {
  assert.deepEqual(classifySchemaCompatibility([], expectedMigrations), {
    compatible: false,
    code: "schema_incompatible"
  });
  assert.deepEqual(
    classifySchemaCompatibility(
      [
        { version: 1, checksumSha256: expectedChecksum, state: "completed" },
        { version: 2, checksumSha256: secondChecksum, state: "completed" },
        { version: 3, checksumSha256: thirdChecksum, state: "completed" },
        { version: 4, checksumSha256: "e".repeat(64), state: "completed" }
      ],
      expectedMigrations
    ),
    { compatible: false, code: "schema_incompatible" }
  );
  assert.deepEqual(
    classifySchemaCompatibility(
      [
        { version: 1, checksumSha256: expectedChecksum, state: "completed" },
        { version: 2, checksumSha256: secondChecksum, state: "completed" },
        { version: 3, checksumSha256: thirdChecksum, state: "completed" },
        { version: 4, checksumSha256: fourthChecksum, state: "applying" }
      ],
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
        { version: 1, checksumSha256: expectedChecksum, state: "completed" },
        { version: 2, checksumSha256: secondChecksum, state: "completed" },
        { version: 3, checksumSha256: thirdChecksum, state: "completed" },
        { version: 4, checksumSha256: fourthChecksum, state: "completed" },
        { version: 5, checksumSha256: "e".repeat(64), state: "completed" }
      ],
      expectedMigrations
    ),
    { compatible: false, code: "schema_too_new" }
  );
});
