import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";

import { SafeError } from "../src/errors.js";
import {
  computeProviderOriginProcessVerifier,
  createKnowledgeProviderHost,
  parseSourceEvidenceSearch,
  type ProviderReadAuditStore,
  type ProviderReadReceiptBinding
} from "../src/knowledge-provider-host.js";
import { createSyntheticKnowledgeProvider } from "../src/knowledge-provider/synthetic-provider.js";
import type { AuthenticatedCredential } from "../src/repository.js";

const actor: AuthenticatedCredential = {
  credentialId: "00000000-0000-4000-8000-000000000101",
  credentialClass: "harness",
  status: "active",
  ownerId: "owner_alpha",
  actorIdentityId: "00000000-0000-4000-8000-000000000102",
  authenticationEpochId: "00000000-0000-4000-8000-000000000103",
  namespaceIds: ["ns_project_alpha"],
  capabilities: ["source_evidence.read"],
  issuedAt: new Date("2026-07-24T00:00:00.000Z"),
  expiresAt: new Date("2026-07-25T00:00:00.000Z"),
  actorReference: "credential:00000000-0000-4000-8000-000000000101"
};

class RecordingAuditStore implements ProviderReadAuditStore {
  issued?: ProviderReadReceiptBinding;
  consumed?: ProviderReadReceiptBinding;
  originProcessVerifier?: string;

  async issue(
    receipt: ProviderReadReceiptBinding,
    originProcessVerifier: string
  ): Promise<boolean> {
    this.issued = structuredClone(receipt);
    this.originProcessVerifier = originProcessVerifier;
    return true;
  }

  async consume(
    receipt: ProviderReadReceiptBinding,
    originProcessVerifier: string
  ): Promise<boolean> {
    if (
      !this.issued ||
      this.originProcessVerifier !== originProcessVerifier ||
      JSON.stringify(this.issued) !== JSON.stringify(receipt)
    ) {
      return false;
    }
    this.consumed = structuredClone(receipt);
    return true;
  }
}

test("audited source-evidence search releases only the receipt-covered synthetic response", async () => {
  const auditStore = new RecordingAuditStore();
  const processReleaseSecret = randomBytes(32);
  const host = createKnowledgeProviderHost({
    binding: {
      provider: createSyntheticKnowledgeProvider(),
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
    auditStore,
    processReleaseSecret
  });
  const input = parseSourceEvidenceSearch({
    namespaceId: "ns_project_alpha",
    query: "deployment review"
  });
  const traceId = randomUUID();
  const execution = await host.execute(
    {
      actor,
      traceId,
      startedAtMs: Date.now()
    },
    {
      operation: "search_evidence",
      ...input
    }
  );

  try {
    const response = JSON.parse(
      execution.serializedResponse.toString("utf8")
    ) as {
      traceId: string;
      data: {
        status: string;
        evidence: Array<{
          providerId: string;
          title: string;
          excerpt: string;
          instructionAuthority: string;
        }>;
      };
      audit: { eventId: string; releaseStatus: string };
    };
    assert.equal(response.traceId, traceId);
    assert.equal(response.data.status, "allowed");
    assert.deepEqual(response.data.evidence, [
      {
        providerId: "synthetic_document_index",
        providerRecordId: "record_deployment_review",
        sourceId: "source_synthetic_runbook",
        segmentId: "segment_release_gate",
        sourceVersion: "synthetic-v1",
        contentDigest: {
          algorithm: "sha256",
          value:
            "473b425d17d88198eda8f78b44cc26bd4740ddbe44430c7d62e6c9a5c55bbf85"
        },
        citationLocator: {
          value: "synthetic://runbook/release-gate",
          publicSafe: true
        },
        title: "Synthetic deployment review gate",
        excerpt:
          "Synthetic evidence: deployment requires an owner-reviewed release gate.",
        mediaType: "text/markdown",
        truncated: false,
        sensitivity: "internal",
        freshness: "fresh",
        retrievedAt: "2026-07-24T00:00:00.000Z",
        sourceModifiedAt: "2026-07-23T00:00:00.000Z",
        instructionAuthority: "none"
      }
    ]);
    assert.equal(response.audit.eventId, execution.auditEventId);
    assert.equal(response.audit.releaseStatus, "release_attempted");
    assert.deepEqual(auditStore.issued, auditStore.consumed);
    assert.equal(auditStore.issued?.actorCredentialId, actor.credentialId);
    assert.equal(auditStore.issued?.actorIdentityId, actor.actorIdentityId);
    assert.equal(auditStore.issued?.providerId, "synthetic_document_index");
    assert.equal(auditStore.issued?.providerScopeId, "scope_docs_alpha");
    assert.equal(auditStore.issued?.operation, "search_evidence");
    assert.equal(
      auditStore.issued?.responseByteCount,
      execution.serializedResponse.byteLength
    );
    assert.equal(auditStore.issued?.coveredResultCount, 1);
    assert(auditStore.issued);
    assert.equal(
      auditStore.originProcessVerifier,
      computeProviderOriginProcessVerifier(
        processReleaseSecret,
        auditStore.issued
      )
    );
    const originalVerifier = auditStore.originProcessVerifier;
    const receiptVariants: ProviderReadReceiptBinding[] = [
      { ...auditStore.issued, receiptId: randomUUID() },
      { ...auditStore.issued, traceId: randomUUID() },
      { ...auditStore.issued, requestId: randomUUID() },
      {
        ...auditStore.issued,
        actorReference: "credential:00000000-0000-4000-8000-000000000111",
        actorCredentialId: "00000000-0000-4000-8000-000000000111"
      },
      {
        ...auditStore.issued,
        actorIdentityId: "00000000-0000-4000-8000-000000000112"
      },
      { ...auditStore.issued, ownerId: "owner_beta" },
      { ...auditStore.issued, namespaceId: "ns_project_beta" },
      { ...auditStore.issued, providerId: "synthetic_document_index_v2" },
      { ...auditStore.issued, providerScopeId: "scope_docs_beta" },
      { ...auditStore.issued, releaseBinding: "a".repeat(43) },
      { ...auditStore.issued, requestDigest: "a".repeat(64) },
      { ...auditStore.issued, resultDigest: "b".repeat(64) },
      { ...auditStore.issued, targetOrderDigest: "c".repeat(64) },
      {
        ...auditStore.issued,
        responseByteCount: auditStore.issued.responseByteCount + 1
      },
      { ...auditStore.issued, coveredResultCount: 0 },
      {
        ...auditStore.issued,
        issuedAt: new Date(
          Date.parse(auditStore.issued.issuedAt) + 1
        ).toISOString()
      },
      {
        ...auditStore.issued,
        expiresAt: new Date(
          Date.parse(auditStore.issued.expiresAt) - 1
        ).toISOString()
      },
      { ...auditStore.issued, originProcessId: randomUUID() },
      { ...auditStore.issued, auditEventId: randomUUID() }
    ];
    for (const variant of receiptVariants) {
      assert.notEqual(
        computeProviderOriginProcessVerifier(processReleaseSecret, variant),
        originalVerifier
      );
    }
  } finally {
    execution.clear();
  }
});

test("source-evidence search without a provider fails safely without fallback", async () => {
  const host = createKnowledgeProviderHost({
    auditStore: new RecordingAuditStore(),
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
        ...parseSourceEvidenceSearch({
          namespaceId: "ns_project_alpha",
          query: "deployment review"
        })
      }
    ),
    (error: unknown) =>
      error instanceof SafeError &&
      error.code === "operation_unavailable" &&
      error.status === 503
  );
});
