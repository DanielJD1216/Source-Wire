import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import type { SourceWireKnowledgeProviderRequestV1 } from "@source-wire/contracts";

import { SafeError } from "../src/errors.js";
import {
  createReplaceableSyntheticProvider,
  REPLACEABLE_PROVIDER_RECORD_ID,
  REPLACEABLE_PROVIDER_SCOPE_ID,
  REPLACEABLE_SEGMENT_ID,
  REPLACEABLE_SOURCE_ID
} from "../src/knowledge-provider/replaceable-synthetic-adapter.js";
import {
  createAlphaRuntimeComposition,
  createComposedKnowledgeProviderHost
} from "../src/runtime-composition.js";
import type {
  ProviderReadAuditStore,
  ProviderReadReceiptBinding
} from "../src/knowledge-provider-host.js";
import type { AuthenticatedCredential } from "../src/repository.js";

const actor: AuthenticatedCredential = {
  credentialId: "00000000-0000-4000-8000-000000000601",
  credentialClass: "harness",
  status: "active",
  ownerId: "owner_alpha",
  actorIdentityId: "00000000-0000-4000-8000-000000000602",
  authenticationEpochId: "00000000-0000-4000-8000-000000000603",
  namespaceIds: ["ns_project_alpha"],
  capabilities: ["source_evidence.read"],
  issuedAt: new Date("2026-07-24T00:00:00.000Z"),
  expiresAt: new Date("2026-07-25T00:00:00.000Z"),
  actorReference: "credential:00000000-0000-4000-8000-000000000601"
};

class RecordingAuditStore implements ProviderReadAuditStore {
  issued?: ProviderReadReceiptBinding;
  consumed?: ProviderReadReceiptBinding;

  async issue(
    receipt: ProviderReadReceiptBinding,
    _originProcessVerifier: string
  ): Promise<boolean> {
    this.issued = structuredClone(receipt);
    return true;
  }

  async consume(
    receipt: ProviderReadReceiptBinding,
    _originProcessVerifier: string
  ): Promise<boolean> {
    this.consumed = structuredClone(receipt);
    return true;
  }
}

test("replaceable adapter imports only the public contract and platform dependencies", async () => {
  const sourcePath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../src/knowledge-provider/replaceable-synthetic-adapter.ts"
  );
  const source = await readFile(sourcePath, "utf8");
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/gu)].map(
    (match) => match[1]
  );
  assert.deepEqual(imports.sort(), [
    "@source-wire/contracts",
    "node:crypto"
  ]);
  assert.doesNotMatch(
    source,
    /knowledge-provider-host|database|repository|mcp|receipt|audit-store|memory-store/u
  );
});

test("replaceable adapter survives search and exact fetch through the composed protected host", async () => {
  const observedRequests: SourceWireKnowledgeProviderRequestV1[] = [];
  const adapter = createReplaceableSyntheticProvider();
  const composition = createAlphaRuntimeComposition({
    provider: {
      profile: adapter.profile,
      async execute(request) {
        observedRequests.push(structuredClone(request));
        return adapter.execute(request);
      }
    },
    ownerId: "owner_alpha",
    namespaceId: "ns_project_alpha",
    providerScopeId: REPLACEABLE_PROVIDER_SCOPE_ID,
    timeoutMs: 1_000
  });
  const auditStore = new RecordingAuditStore();
  const host = createComposedKnowledgeProviderHost({
    composition,
    auditStore,
    processReleaseSecret: randomBytes(32)
  });

  const search = await host.execute(
    {
      actor,
      traceId: randomUUID(),
      startedAtMs: Date.now()
    },
    {
      operation: "search_evidence",
      namespaceId: "ns_project_alpha",
      query: "deployment review",
      queryByteCount: 17,
      limit: 10,
      freshness: "fresh",
      sensitivity: "internal"
    }
  );
  const searchBody = JSON.parse(search.serializedResponse.toString("utf8")) as {
    data: { evidence: Array<Record<string, unknown>> };
  };
  assert.equal(searchBody.data.evidence[0]?.providerRecordId, REPLACEABLE_PROVIDER_RECORD_ID);
  assert.equal(searchBody.data.evidence[0]?.sourceId, REPLACEABLE_SOURCE_ID);
  assert.equal(searchBody.data.evidence[0]?.segmentId, REPLACEABLE_SEGMENT_ID);
  assert.equal(searchBody.data.evidence[0]?.freshness, "fresh");
  assert.equal(searchBody.data.evidence[0]?.sensitivity, "internal");
  search.clear();

  const exact = await host.execute(
    {
      actor,
      traceId: randomUUID(),
      startedAtMs: Date.now()
    },
    {
      operation: "get_evidence",
      namespaceId: "ns_project_alpha",
      sourceId: REPLACEABLE_SOURCE_ID,
      segmentId: REPLACEABLE_SEGMENT_ID
    }
  );
  const exactBody = JSON.parse(exact.serializedResponse.toString("utf8")) as {
    data: { evidence: Array<Record<string, unknown>> };
  };
  assert.equal(exactBody.data.evidence[0]?.sourceId, REPLACEABLE_SOURCE_ID);
  assert.equal(exactBody.data.evidence[0]?.segmentId, REPLACEABLE_SEGMENT_ID);
  exact.clear();

  assert.equal(observedRequests.length, 2);
  assert.equal(observedRequests[0]?.search?.freshness, "fresh");
  assert.equal(observedRequests[0]?.search?.sensitivity, "internal");
  assert.deepEqual(auditStore.issued, auditStore.consumed);
});

test("replaceable adapter exposes no runtime authority in its public request", async () => {
  const adapter = createReplaceableSyntheticProvider();
  const request: SourceWireKnowledgeProviderRequestV1 = {
    contractId: "source-wire.knowledge-provider",
    contractVersion: "knowledge-provider.v1",
    requestId: randomUUID(),
    traceId: randomUUID(),
    providerId: adapter.profile.providerId,
    ownerId: "owner_alpha",
    namespaceId: "ns_project_alpha",
    providerScopeId: adapter.profile.providerScopeId,
    operation: "search_evidence",
    requiredCapabilities: [
      { capability: "search_evidence", requirement: "required" }
    ],
    deadlineAt: new Date(Date.now() + 1_000).toISOString(),
    search: { query: "deployment review", maximumResults: 10 }
  };
  const result = await adapter.execute(request);
  assert.equal(result.status, "allowed");
  assert.equal(result.providerMutationAttempted, false);
  assert.equal(result.memoryMutationAttempted, false);
  assert.equal(result.trustedMemoryCreated, false);
  assert.equal(result.noAutoPromotion, true);
});

test("replaceable adapter faults release zero protected evidence", async (t) => {
  for (const fault of [
    "provider_scope_mismatch",
    "acl_denied",
    "provenance_missing",
    "result_bound_exceeded",
    "deadline_exceeded",
    "never_settles",
    "provider_outage"
  ] as const) {
    await t.test(fault, async () => {
      const auditStore = new RecordingAuditStore();
      const host = createComposedKnowledgeProviderHost({
        composition: createAlphaRuntimeComposition({
          provider: createReplaceableSyntheticProvider({ fault }),
          ownerId: "owner_alpha",
          namespaceId: "ns_project_alpha",
          providerScopeId: REPLACEABLE_PROVIDER_SCOPE_ID,
          timeoutMs: 1_000
        }),
        auditStore,
        processReleaseSecret: randomBytes(32)
      });

      await assert.rejects(
        host.execute(
          {
            actor,
            traceId: randomUUID(),
            startedAtMs: Date.now()
          },
          {
            operation: "search_evidence",
            namespaceId: "ns_project_alpha",
            query: "deployment review",
            queryByteCount: 17,
            limit: 10
          }
        ),
        (error: unknown) =>
          error instanceof SafeError &&
          error.code === "operation_unavailable" &&
          error.status === 503
      );
      assert.equal(auditStore.issued, undefined);
      assert.equal(auditStore.consumed, undefined);
    });
  }
});
