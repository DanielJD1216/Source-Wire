import assert from "node:assert/strict";
import test from "node:test";

import { parseCandidateListQuery } from "../src/candidate-lifecycle.js";
import { SafeError } from "../src/errors.js";

test("candidate list defaults to pending metadata with limit 25", () => {
  assert.deepEqual(parseCandidateListQuery(new URLSearchParams()), {
    state: "pending",
    limit: 25,
    includeContent: false
  });
});

test("candidate list rejects an oversized cursor as validation_failed", () => {
  const cursor = "a".repeat(257);
  assert.throws(
    () => parseCandidateListQuery(new URLSearchParams({ cursor })),
    (error: unknown) =>
      error instanceof SafeError &&
      error.code === "validation_failed" &&
      error.status === 400
  );
});
