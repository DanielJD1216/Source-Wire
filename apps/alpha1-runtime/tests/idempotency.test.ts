import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import {
  canonicalRequestDigest,
  decryptReplaySecret,
  deriveIdempotencyReplayKey,
  encryptReplaySecret
} from "../src/idempotency.js";

test("canonical request digests are stable across object key order", () => {
  const first = canonicalRequestDigest({
    method: "POST",
    operation: "issue_harness_credential",
    body: {
      expiresAt: "2026-07-23T12:00:00.000Z",
      capabilities: ["runtime.health"],
      namespaceIds: ["ns_project_alpha"]
    }
  });
  const second = canonicalRequestDigest({
    body: {
      namespaceIds: ["ns_project_alpha"],
      capabilities: ["runtime.health"],
      expiresAt: "2026-07-23T12:00:00.000Z"
    },
    operation: "issue_harness_credential",
    method: "POST"
  });

  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/u);
});

test("canonical request digests use locale-independent UTF-8 byte ordering", () => {
  const value = {
    "ä": "unicode",
    z: "ascii",
    A: "upper"
  };
  const original = Intl.Collator;
  Object.defineProperty(Intl, "Collator", {
    value: class {
      compare(): number {
        return 0;
      }
    },
    configurable: true
  });
  try {
    assert.equal(canonicalRequestDigest(value), canonicalRequestDigest({ z: "ascii", A: "upper", "ä": "unicode" }));
  } finally {
    Object.defineProperty(Intl, "Collator", { value: original, configurable: true });
  }
});

test("replay secrets use domain-separated authenticated encryption", () => {
  const verifierKey = randomBytes(32);
  const replayKey = deriveIdempotencyReplayKey(verifierKey);
  const context = {
    actorCredentialId: "00000000-0000-4000-8000-000000000001",
    operation: "rotate_credential",
    idempotencyKey: "request_alpha",
    requestDigest: "a".repeat(64),
    replayExpiresAt: "2026-07-23T12:05:00.000Z"
  };
  const plaintext = "sw_a1.00000000-0000-4000-8000-000000000002.secret";
  const encrypted = encryptReplaySecret(replayKey, plaintext, context);

  assert.equal(replayKey.length, 32);
  assert.equal(encrypted.nonce.length, 12);
  assert.equal(encrypted.tag.length, 16);
  assert.equal(encrypted.ciphertext.includes(Buffer.from(plaintext, "utf8")), false);
  assert.equal(decryptReplaySecret(replayKey, encrypted, context), plaintext);
  assert.throws(() =>
    decryptReplaySecret(replayKey, encrypted, {
      ...context,
      operation: "revoke_credential"
    })
  );
});
