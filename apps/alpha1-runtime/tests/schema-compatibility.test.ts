import assert from "node:assert/strict";
import test from "node:test";

import { classifySchemaCompatibility } from "../src/schema-compatibility.js";

const expectedChecksum = "a".repeat(64);

test("schema compatibility accepts one completed exact migration", () => {
  assert.deepEqual(
    classifySchemaCompatibility(
      [{ version: 1, checksumSha256: expectedChecksum, state: "completed" }],
      expectedChecksum
    ),
    { compatible: true, version: 1 }
  );
});

test("schema compatibility fails closed for absent, malformed, old, and new state", () => {
  assert.deepEqual(classifySchemaCompatibility([], expectedChecksum), {
    compatible: false,
    code: "schema_incompatible"
  });
  assert.deepEqual(
    classifySchemaCompatibility(
      [{ version: 1, checksumSha256: "b".repeat(64), state: "completed" }],
      expectedChecksum
    ),
    { compatible: false, code: "schema_incompatible" }
  );
  assert.deepEqual(
    classifySchemaCompatibility(
      [{ version: 1, checksumSha256: expectedChecksum, state: "applying" }],
      expectedChecksum
    ),
    { compatible: false, code: "schema_incompatible" }
  );
  assert.deepEqual(
    classifySchemaCompatibility(
      [{ version: 0, checksumSha256: expectedChecksum, state: "completed" }],
      expectedChecksum
    ),
    { compatible: false, code: "schema_too_old" }
  );
  assert.deepEqual(
    classifySchemaCompatibility(
      [{ version: 2, checksumSha256: expectedChecksum, state: "completed" }],
      expectedChecksum
    ),
    { compatible: false, code: "schema_too_new" }
  );
});
