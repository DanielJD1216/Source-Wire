import assert from "node:assert/strict";
import test from "node:test";

import { SafeError } from "../src/errors.js";
import {
  LocalProtectedRequestGate,
  normalizeLiteralLoopbackAddress
} from "../src/rate-gate.js";

test("protected request limits are isolated per literal loopback address", async () => {
  const gate = new LocalProtectedRequestGate({
    maximumConcurrent: 1,
    maximumPerWindow: 2,
    windowMs: 60_000
  });

  await gate.run("127.0.0.1", async () => undefined);
  await gate.run("127.0.0.1", async () => undefined);
  await assert.rejects(
    gate.run("127.0.0.1", async () => undefined),
    (error) => error instanceof SafeError && error.code === "rate_limited"
  );

  await gate.run("::1", async () => undefined);
});

test("only trusted Node loopback socket literals are accepted", () => {
  assert.equal(normalizeLiteralLoopbackAddress("127.0.0.1"), "127.0.0.1");
  assert.equal(normalizeLiteralLoopbackAddress("::1"), "::1");
  assert.equal(normalizeLiteralLoopbackAddress("::ffff:127.0.0.1"), "127.0.0.1");
  assert.throws(() => normalizeLiteralLoopbackAddress("203.0.113.9"));
});
