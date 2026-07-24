import assert from "node:assert/strict";
import test from "node:test";

import { SafeError } from "../src/errors.js";
import { parseStrictJsonObject } from "../src/strict-json.js";

test("strict JSON accepts unique top-level fields and nested objects", () => {
  assert.deepEqual(
    parseStrictJsonObject(
      Buffer.from(
        '{"namespaceId":"ns_project_alpha","query":"safe","nested":{"query":"allowed"}}',
        "utf8"
      )
    ),
    {
      namespaceId: "ns_project_alpha",
      query: "safe",
      nested: { query: "allowed" }
    }
  );
});

test("strict JSON rejects repeated top-level fields and malformed UTF-8", () => {
  for (const bytes of [
    Buffer.from('{"query":"first","query":"second"}', "utf8"),
    Buffer.from([0x7b, 0x22, 0x71, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d])
  ]) {
    assert.throws(
      () => parseStrictJsonObject(bytes),
      (error: unknown) =>
        error instanceof SafeError &&
        error.code === "validation_failed" &&
        error.status === 400
    );
  }
});
