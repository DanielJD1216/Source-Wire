import assert from "node:assert/strict";
import test from "node:test";

import {
  computeCredentialVerifier,
  createCredentialSecret,
  parseCredentialToken,
  verifierMatches
} from "../src/credentials.js";

test("credential tokens use strict versioned wire format and 32 random bytes", () => {
  const created = createCredentialSecret("11111111-1111-4111-8111-111111111111");
  const parsed = parseCredentialToken(created.token);

  assert.equal(parsed?.credentialId, "11111111-1111-4111-8111-111111111111");
  assert.equal(parsed?.secret.length, 43);
  assert.equal(created.displayPrefix, "sw_a1.11111111-1111-4111-8111-111111111111");
  assert.equal(parseCredentialToken(`${created.token}.extra`), null);
  assert.equal(parseCredentialToken("sw_a0.11111111-1111-4111-8111-111111111111.secret"), null);
});

test("credential verification is exact and key-bound", () => {
  const key = Buffer.alloc(32, 3);
  const otherKey = Buffer.alloc(32, 4);
  const created = createCredentialSecret("22222222-2222-4222-8222-222222222222");
  const verifier = computeCredentialVerifier(key, created.token);

  assert.equal(verifierMatches(key, created.token, verifier), true);
  assert.equal(verifierMatches(otherKey, created.token, verifier), false);
  assert.equal(verifierMatches(key, `${created.token}x`, verifier), false);
});
