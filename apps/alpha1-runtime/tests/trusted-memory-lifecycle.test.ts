import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { SafeError } from "../src/errors.js";
import {
  canonicalTrustedMemoryLifecycleDigest,
  parseTrustedMemoryCorrection,
  parseTrustedMemoryRevocation
} from "../src/trusted-memory-lifecycle.js";

test("trusted-memory correction accepts the exact bounded owner input", () => {
  const memoryId = randomUUID();
  const expectedRevisionId = randomUUID();
  assert.deepEqual(
    parseTrustedMemoryCorrection(memoryId, {
      namespaceId: "ns_project_alpha",
      expectedRevisionId,
      content: "Corrected synthetic memory.",
      reason: "Owner corrected an obsolete value.",
      idempotencyKey: "correction_request_1"
    }),
    {
      memoryId,
      namespaceId: "ns_project_alpha",
      expectedRevisionId,
      content: "Corrected synthetic memory.",
      contentByteCount: 27,
      reason: "Owner corrected an obsolete value.",
      idempotencyKey: "correction_request_1"
    }
  );
});

test("trusted-memory revocation accepts the exact bounded owner input", () => {
  const memoryId = randomUUID();
  const expectedRevisionId = randomUUID();
  assert.deepEqual(
    parseTrustedMemoryRevocation(memoryId, {
      namespaceId: "ns_project_alpha",
      expectedRevisionId,
      reason: "Owner revoked superseded guidance.",
      idempotencyKey: "revocation_request_1"
    }),
    {
      memoryId,
      namespaceId: "ns_project_alpha",
      expectedRevisionId,
      reason: "Owner revoked superseded guidance.",
      idempotencyKey: "revocation_request_1"
    }
  );
});

test("trusted-memory lifecycle rejects ambiguous, stale-shaped, or unbounded input", () => {
  const memoryId = randomUUID();
  const revisionId = randomUUID();
  const invalidCorrections = [
    {
      namespaceId: "ns_project_alpha",
      expectedRevisionId: revisionId,
      content: "   ",
      reason: "Bounded reason.",
      idempotencyKey: "correction_request_1"
    },
    {
      namespaceId: "ns_project_alpha",
      expectedRevisionId: revisionId,
      content: "Valid content.",
      reason: "   ",
      idempotencyKey: "correction_request_1"
    },
    {
      namespaceId: "ns_project_alpha",
      expectedRevisionId: revisionId,
      content: "x".repeat(8_193),
      reason: "Bounded reason.",
      idempotencyKey: "correction_request_1"
    },
    {
      namespaceId: "ns_project_alpha",
      expectedRevisionId: revisionId,
      content: "Valid content.",
      reason: "r".repeat(513),
      idempotencyKey: "correction_request_1"
    },
    {
      namespaceId: "ns_project_alpha",
      expectedRevisionId: revisionId,
      content: "Valid content.",
      reason: "Bounded reason.",
      idempotencyKey: "correction_request_1",
      provenance: []
    }
  ];
  for (const value of invalidCorrections) {
    assert.throws(
      () => parseTrustedMemoryCorrection(memoryId, value),
      isValidationFailure
    );
  }

  assert.throws(
    () =>
      parseTrustedMemoryRevocation(memoryId, {
        namespaceId: "ns_project_alpha",
        expectedRevisionId: revisionId,
        reason: "Bounded reason.",
        idempotencyKey: "revocation_request_1",
        content: "Caller must not send content."
      }),
    isValidationFailure
  );
  assert.throws(
    () =>
      parseTrustedMemoryRevocation("not-a-uuid", {
        namespaceId: "ns_project_alpha",
        expectedRevisionId: revisionId,
        reason: "Bounded reason.",
        idempotencyKey: "revocation_request_1"
      }),
    isValidationFailure
  );
});

test("lifecycle request digest binds every owner-controlled field", () => {
  const base = {
    apiSchema: "source-wire.api.v1alpha1" as const,
    method: "POST" as const,
    operation: "correct_trusted_memory" as const,
    actorCredentialId: randomUUID(),
    actorIdentityId: randomUUID(),
    ownerId: "owner_alpha",
    namespaceId: "ns_project_alpha",
    memoryId: randomUUID(),
    expectedRevisionId: randomUUID(),
    content: "Corrected synthetic memory.",
    reason: "Owner correction reason.",
    idempotencyKey: "correction_request_1"
  };
  const digest = canonicalTrustedMemoryLifecycleDigest(base);
  assert.equal(digest, canonicalTrustedMemoryLifecycleDigest({ ...base }));
  for (const changed of [
    { ...base, namespaceId: "ns_project_beta" },
    { ...base, expectedRevisionId: randomUUID() },
    { ...base, content: "Changed synthetic memory." },
    { ...base, reason: "Changed reason." },
    { ...base, idempotencyKey: "correction_request_2" }
  ]) {
    assert.notEqual(digest, canonicalTrustedMemoryLifecycleDigest(changed));
  }
});

function isValidationFailure(error: unknown): boolean {
  return (
    error instanceof SafeError &&
    error.code === "validation_failed" &&
    error.status === 400
  );
}
