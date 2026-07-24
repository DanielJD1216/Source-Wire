import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";

import { SafeError } from "../src/errors.js";
import {
  canonicalTrustedMemoryRequestDigest,
  canonicalTrustedMemoryResultDigest,
  computeOriginProcessVerifier,
  parseTrustedMemorySearch,
  type ProtectedReadReceiptBinding,
  type TrustedMemoryRequestDigestInput,
  type TrustedMemorySearchResult
} from "../src/trusted-memory-search.js";

test("trusted-memory search defaults to ten bounded results", () => {
  assert.deepEqual(
    parseTrustedMemorySearch({
      namespaceId: "ns_project_alpha",
      query: "deployment approval"
    }),
    {
      namespaceId: "ns_project_alpha",
      query: "deployment approval",
      queryByteCount: 19,
      limit: 10
    }
  );
});

test("trusted-memory search rejects unbounded or ambiguous input", () => {
  for (const input of [
    { namespaceId: "ns_project_alpha", query: "   " },
    { namespaceId: "ns_project_alpha", query: "x".repeat(1_025) },
    { namespaceId: "ns_project_alpha", query: "safe\0unsafe" },
    { namespaceId: "ns_project_alpha", query: "\ud800" },
    { namespaceId: "ns_project_alpha", query: "safe", limit: 0 },
    { namespaceId: "ns_project_alpha", query: "safe", limit: 11 },
    { namespaceId: "ns_project_alpha", query: "safe", limit: 1.5 },
    { namespaceId: "ns_project_alpha", query: "safe", sort: "rank" }
  ]) {
    assert.throws(
      () => parseTrustedMemorySearch(input),
      (error: unknown) =>
        error instanceof SafeError &&
        error.code === "validation_failed" &&
        error.status === 400
    );
  }
});

test("trusted-memory request and result digests are deterministic and scope-bound", () => {
  const request = {
    apiSchema: "source-wire.api.v1alpha1",
    method: "POST" as const,
    operation: "search_trusted_memory" as const,
    actorCredentialId: "00000000-0000-4000-8000-000000000001",
    ownerId: "owner_alpha",
    namespaceId: "ns_project_alpha",
    query: "deployment approval",
    limit: 10
  } satisfies TrustedMemoryRequestDigestInput;
  assert.equal(
    canonicalTrustedMemoryRequestDigest(request),
    canonicalTrustedMemoryRequestDigest({ ...request })
  );
  assert.notEqual(
    canonicalTrustedMemoryRequestDigest(request),
    canonicalTrustedMemoryRequestDigest({ ...request, limit: 9 })
  );

  const results: TrustedMemorySearchResult[] = [
    {
      memoryId: "00000000-0000-4000-8000-000000000010",
      revisionId: "00000000-0000-4000-8000-000000000011",
      content: "Synthetic deployment approval memory.",
      rank: "0.500000",
      provenance: { kind: "owner_assertion" }
    }
  ];
  assert.equal(
    canonicalTrustedMemoryResultDigest(results),
    canonicalTrustedMemoryResultDigest(structuredClone(results))
  );
  assert.notEqual(
    canonicalTrustedMemoryResultDigest(results),
    canonicalTrustedMemoryResultDigest([
      { ...results[0]!, content: "Synthetic changed memory." }
    ])
  );
});

test("origin process verifier binds every receipt field to one process secret", () => {
  const actorCredentialId = randomUUID();
  const binding: ProtectedReadReceiptBinding = {
    receiptId: randomUUID(),
    formatVersion: 1,
    traceId: randomUUID(),
    requestId: randomUUID(),
    actorReference: `credential:${actorCredentialId}`,
    actorCredentialId,
    ownerId: "owner_alpha",
    namespaceId: "ns_project_alpha",
    operation: "search_trusted_memory",
    policyDecision: "allowed",
    releaseBinding: randomBytes(32).toString("base64url"),
    requestDigest: "a".repeat(64),
    resultDigest: "b".repeat(64),
    targetOrderDigest: "c".repeat(64),
    responseByteCount: 512,
    coveredResultCount: 1,
    issuedAt: "2026-07-24T00:00:00.000Z",
    expiresAt: "2026-07-24T00:00:05.000Z"
  };
  const originSecret = randomBytes(32);
  assert.equal(
    computeOriginProcessVerifier(originSecret, binding),
    computeOriginProcessVerifier(originSecret, { ...binding })
  );
  assert.notEqual(
    computeOriginProcessVerifier(originSecret, binding),
    computeOriginProcessVerifier(randomBytes(32), binding)
  );
  assert.notEqual(
    computeOriginProcessVerifier(originSecret, binding),
    computeOriginProcessVerifier(originSecret, {
      ...binding,
      coveredResultCount: 0
    })
  );
});
