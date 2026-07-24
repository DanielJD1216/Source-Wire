import assert from "node:assert/strict";
import test from "node:test";

import {
  assertLoopbackHost,
  assertSourceWireIdentifier,
  parseVerifierKey,
  STORY1_CONNECTION_CHECK_INTERVAL_MS,
  STORY1_HEADERS_TIMEOUT_MS,
  STORY1_REQUEST_TIMEOUT_MS
} from "../src/config.js";

test("loopback validation accepts only literal loopback addresses", () => {
  assert.equal(assertLoopbackHost("127.0.0.1"), "127.0.0.1");
  assert.equal(assertLoopbackHost("::1"), "::1");

  for (const host of ["0.0.0.0", "192.168.1.25", "localhost"]) {
    assert.throws(() => assertLoopbackHost(host), /loopback_host_required/);
  }
});

test("identifiers stay explicit, bounded, and wildcard-free", () => {
  assert.equal(assertSourceWireIdentifier("ns_project_alpha", "namespaceId"), "ns_project_alpha");

  for (const value of ["", "*", "bad value", "a".repeat(65)]) {
    assert.throws(() => assertSourceWireIdentifier(value, "namespaceId"), /validation_failed/);
  }
});

test("verifier keys require at least 32 decoded bytes", () => {
  const valid = Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString("base64url");
  assert.equal(parseVerifierKey(valid).length, 32);
  assert.throws(() => parseVerifierKey(Buffer.alloc(31, 7).toString("base64url")), /verifier_key_invalid/);
  assert.throws(() => parseVerifierKey(Buffer.alloc(32, 7).toString("base64url")), /verifier_key_invalid/);
  assert.throws(() => parseVerifierKey("not-base64url!"), /verifier_key_invalid/);
});

test("server request deadlines stay explicit and short", () => {
  assert.equal(STORY1_REQUEST_TIMEOUT_MS, 5_000);
  assert.equal(STORY1_HEADERS_TIMEOUT_MS, 5_000);
  assert.equal(STORY1_CONNECTION_CHECK_INTERVAL_MS, 250);
});
