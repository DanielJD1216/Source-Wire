import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";

import { SafeError } from "../src/errors.js";
import {
  computeProviderOriginProcessVerifier,
  createKnowledgeProviderHost,
  parseSourceEvidenceGet,
  parseSourceEvidenceSearch,
  type ProviderReadAuditStore,
  type ProviderReadReceiptBinding,
  type RuntimeKnowledgeProviderRequest,
  type RuntimeKnowledgeProviderResult
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

async function expectRejectedProviderResult(
  mutate: (
    result: RuntimeKnowledgeProviderResult,
    request: RuntimeKnowledgeProviderRequest
  ) => RuntimeKnowledgeProviderResult
): Promise<void> {
  const synthetic = createSyntheticKnowledgeProvider();
  const auditStore = new RecordingAuditStore();
  const host = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute(request) {
          return mutate(await synthetic.execute(request), request);
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
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
        ...parseSourceEvidenceSearch({
          namespaceId: "ns_project_alpha",
          query: "deployment review"
        })
      }
    ),
    (error: unknown) =>
      error instanceof SafeError &&
      error.code === "operation_unavailable" &&
      error.status === 503 &&
      error.message === "operation_unavailable"
  );
  assert.equal(auditStore.issued, undefined);
  assert.equal(auditStore.consumed, undefined);
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

test("audited exact-evidence fetch releases at most one receipt-covered segment", async () => {
  const auditStore = new RecordingAuditStore();
  const host = createKnowledgeProviderHost({
    binding: {
      provider: createSyntheticKnowledgeProvider(),
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
    auditStore,
    processReleaseSecret: randomBytes(32)
  });

  const execution = await host.execute(
    {
      actor,
      traceId: randomUUID(),
      startedAtMs: Date.now()
    },
    {
      operation: "get_evidence",
      ...parseSourceEvidenceGet({
        namespaceId: "ns_project_alpha",
        sourceId: "source_synthetic_runbook",
        segmentId: "segment_release_gate"
      })
    }
  );
  try {
    const response = JSON.parse(
      execution.serializedResponse.toString("utf8")
    ) as {
      data: { evidence: unknown[]; gaps: unknown[] };
    };
    assert.equal(response.data.evidence.length, 1);
    assert.deepEqual(response.data.gaps, []);
    assert.equal(auditStore.issued?.operation, "get_evidence");
    assert.equal(auditStore.issued?.coveredResultCount, 1);
    assert.deepEqual(auditStore.issued, auditStore.consumed);
  } finally {
    execution.clear();
  }

  const missing = await host.execute(
    {
      actor,
      traceId: randomUUID(),
      startedAtMs: Date.now()
    },
    {
      operation: "get_evidence",
      ...parseSourceEvidenceGet({
        namespaceId: "ns_project_alpha",
        sourceId: "source_missing",
        segmentId: "segment_missing"
      })
    }
  );
  try {
    const response = JSON.parse(
      missing.serializedResponse.toString("utf8")
    ) as {
      data: {
        status: string;
        evidence: unknown[];
        gaps: Array<{ code: string; message: string; retryable: boolean }>;
        error?: {
          code: string;
          message: string;
          traceId: string;
          retryable: boolean;
          detailsRedacted: true;
        };
      };
    };
    assert.equal(response.data.status, "denied");
    assert.deepEqual(response.data.evidence, []);
    assert.deepEqual(response.data.gaps, [
      {
        code: "not_found",
        message: "Requested evidence is unavailable.",
        retryable: false
      }
    ]);
    assert.equal(response.data.error?.code, "not_found");
    assert.equal(
      response.data.error?.message,
      "The requested item is not available."
    );
    assert.equal(response.data.error?.detailsRedacted, true);
    assert.equal(auditStore.issued?.operation, "get_evidence");
    assert.equal(auditStore.issued?.coveredResultCount, 0);
  } finally {
    missing.clear();
  }

  const synthetic = createSyntheticKnowledgeProvider();
  const mismatchedHost = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute(request) {
          const result = await synthetic.execute(request);
          return {
            ...result,
            evidence: result.evidence.map((item) => ({
              ...item,
              sourceId: "source_wrong"
            }))
          };
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
    auditStore: new RecordingAuditStore(),
    processReleaseSecret: randomBytes(32)
  });
  await assert.rejects(
    mismatchedHost.execute(
      {
        actor,
        traceId: randomUUID(),
        startedAtMs: Date.now()
      },
      {
        operation: "get_evidence",
        ...parseSourceEvidenceGet({
          namespaceId: "ns_project_alpha",
          sourceId: "source_synthetic_runbook",
          segmentId: "segment_release_gate"
        })
      }
    ),
    (error: unknown) =>
      error instanceof SafeError &&
      error.code === "operation_unavailable" &&
      error.status === 503
  );
});

test("provider availability gaps are normalized before audited release", async () => {
  const synthetic = createSyntheticKnowledgeProvider();
  const auditStore = new RecordingAuditStore();
  const host = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute(request) {
          const result = await synthetic.execute(request);
          return {
            ...result,
            status: "unavailable" as const,
            evidence: [],
            gaps: [
              {
                code: "provider_unavailable" as const,
                message:
                  "raw endpoint https://private.invalid failed with token secret",
                retryable: true
              }
            ],
            error: {
              code: "temporarily_unavailable" as const,
              message: "raw provider endpoint with token secret",
              traceId: request.traceId,
              retryable: true,
              detailsRedacted: true as const
            }
          };
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
    auditStore,
    processReleaseSecret: randomBytes(32)
  });

  const execution = await host.execute(
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
  );
  try {
    const response = JSON.parse(
      execution.serializedResponse.toString("utf8")
    ) as {
      data: {
        status: string;
        evidence: unknown[];
        gaps: Array<{ code: string; message: string; retryable: boolean }>;
      };
    };
    assert.equal(response.data.status, "unavailable");
    assert.deepEqual(response.data.evidence, []);
    assert.deepEqual(response.data.gaps, [
      {
        code: "provider_unavailable",
        message: "Source evidence is temporarily unavailable.",
        retryable: true
      }
    ]);
    assert.doesNotMatch(
      execution.serializedResponse.toString("utf8"),
      /private|token|secret|invalid/u
    );
    assert.deepEqual(auditStore.issued, auditStore.consumed);
  } finally {
    execution.clear();
  }
});

test("malformed provider evidence is withheld before audit or release", async () => {
  const synthetic = createSyntheticKnowledgeProvider();
  const auditStore = new RecordingAuditStore();
  const host = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute(request) {
          const result = await synthetic.execute(request);
          const [{ contentDigest: _digest, ...incomplete }] = result.evidence;
          return {
            ...result,
            evidence: [incomplete]
          } as unknown as typeof result;
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
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
  assert.equal(auditStore.issued, undefined);
  assert.equal(auditStore.consumed, undefined);
});

test("foreign provider cursors fail before provider invocation", async () => {
  const synthetic = createSyntheticKnowledgeProvider();
  let providerInvoked = false;
  const host = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute(request) {
          providerInvoked = true;
          return synthetic.execute(request);
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
    auditStore: new RecordingAuditStore(),
    processReleaseSecret: randomBytes(32)
  });

  const input = parseSourceEvidenceSearch({
    namespaceId: "ns_project_alpha",
    query: "deployment review",
    cursor: {
      providerId: "foreign_provider",
      providerScopeId: "scope_docs_alpha",
      value: "cursor_page_2"
    }
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
        ...input
      }
    ),
    (error: unknown) =>
      error instanceof SafeError &&
      error.code === "operation_unavailable" &&
      error.status === 503
  );
  assert.equal(providerInvoked, false);
});

test("foreign next cursors are withheld before audit or release", async () => {
  const synthetic = createSyntheticKnowledgeProvider();
  const auditStore = new RecordingAuditStore();
  const host = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute(request) {
          const result = await synthetic.execute(request);
          return {
            ...result,
            nextCursor: {
              providerId: "foreign_provider",
              providerScopeId: "scope_docs_alpha",
              value: "cursor_page_2"
            }
          };
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
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
  assert.equal(auditStore.issued, undefined);
});

test("provider results arriving after the configured deadline are discarded", async () => {
  const synthetic = createSyntheticKnowledgeProvider();
  const auditStore = new RecordingAuditStore();
  const host = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute(request) {
          await new Promise((resolve) => setTimeout(resolve, 15));
          return synthetic.execute(request);
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1
    },
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
  assert.equal(auditStore.issued, undefined);
});

test("expired and aborted request lifetimes fail before provider invocation", async (t) => {
  for (const testCase of [
    {
      name: "expired request",
      startedAtMs: Date.now() - 5_000,
      signal: undefined
    },
    {
      name: "aborted request",
      startedAtMs: Date.now(),
      signal: AbortSignal.abort()
    }
  ]) {
    await t.test(testCase.name, async () => {
      const synthetic = createSyntheticKnowledgeProvider();
      let providerInvoked = false;
      const host = createKnowledgeProviderHost({
        binding: {
          provider: {
            profile: synthetic.profile,
            async execute(request) {
              providerInvoked = true;
              return synthetic.execute(request);
            }
          },
          ownerId: "owner_alpha",
          namespaceId: "ns_project_alpha",
          providerScopeId: "scope_docs_alpha",
          timeoutMs: 1_000
        },
        auditStore: new RecordingAuditStore(),
        processReleaseSecret: randomBytes(32)
      });

      await assert.rejects(
        host.execute(
          {
            actor,
            traceId: randomUUID(),
            startedAtMs: testCase.startedAtMs,
            ...(testCase.signal === undefined
              ? {}
              : { signal: testCase.signal })
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
      assert.equal(providerInvoked, false);
    });
  }
});

test("non-object provider results map to the safe unavailable error", async () => {
  const synthetic = createSyntheticKnowledgeProvider();
  const auditStore = new RecordingAuditStore();
  const host = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute() {
          return null as unknown as Awaited<
            ReturnType<typeof synthetic.execute>
          >;
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
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
  assert.equal(auditStore.issued, undefined);
});

test("authority and immutable provider scope fail closed before invocation", async (t) => {
  for (const testCase of [
    {
      name: "missing source-evidence capability",
      actor: {
        ...actor,
        capabilities: ["trusted_memory.search"]
      } satisfies AuthenticatedCredential,
      expectedCode: "capability_not_allowed"
    },
    {
      name: "wrong namespace grant",
      actor: {
        ...actor,
        namespaceIds: ["ns_project_beta"]
      } satisfies AuthenticatedCredential,
      expectedCode: "namespace_not_allowed"
    }
  ] as const) {
    await t.test(testCase.name, async () => {
      const synthetic = createSyntheticKnowledgeProvider();
      let providerInvoked = false;
      const host = createKnowledgeProviderHost({
        binding: {
          provider: {
            profile: synthetic.profile,
            async execute(request) {
              providerInvoked = true;
              return synthetic.execute(request);
            }
          },
          ownerId: "owner_alpha",
          namespaceId: "ns_project_alpha",
          providerScopeId: "scope_docs_alpha",
          timeoutMs: 1_000
        },
        auditStore: new RecordingAuditStore(),
        processReleaseSecret: randomBytes(32)
      });

      await assert.rejects(
        host.execute(
          {
            actor: testCase.actor,
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
          error.code === testCase.expectedCode &&
          error.status === 403
      );
      assert.equal(providerInvoked, false);
    });
  }

  await t.test("profile scope mismatch", () => {
    const synthetic = createSyntheticKnowledgeProvider();
    assert.throws(
      () =>
        createKnowledgeProviderHost({
          binding: {
            provider: {
              ...synthetic,
              profile: {
                ...synthetic.profile,
                providerScopeId: "scope_docs_beta"
              }
            },
            ownerId: "owner_alpha",
            namespaceId: "ns_project_alpha",
            providerScopeId: "scope_docs_alpha",
            timeoutMs: 1_000
          },
          auditStore: new RecordingAuditStore(),
          processReleaseSecret: randomBytes(32)
        }),
      /knowledge_provider_binding_invalid/u
    );
  });

  await t.test("incompatible profile contract version", () => {
    const synthetic = createSyntheticKnowledgeProvider();
    assert.throws(
      () =>
        createKnowledgeProviderHost({
          binding: {
            provider: {
              ...synthetic,
              profile: {
                ...synthetic.profile,
                contractVersion: "knowledge-provider.v2"
              } as unknown as typeof synthetic.profile
            },
            ownerId: "owner_alpha",
            namespaceId: "ns_project_alpha",
            providerScopeId: "scope_docs_alpha",
            timeoutMs: 1_000
          },
          auditStore: new RecordingAuditStore(),
          processReleaseSecret: randomBytes(32)
        }),
      /knowledge_provider_binding_invalid/u
    );
  });
});

test("cross-scope, malformed, and over-authoritative evidence releases zero content", async (t) => {
  const cases: Array<{
    name: string;
    mutate: (
      result: RuntimeKnowledgeProviderResult
    ) => RuntimeKnowledgeProviderResult;
  }> = [
    {
      name: "cross-owner evidence",
      mutate: (result) => ({
        ...result,
        evidence: result.evidence.map((item) => ({
          ...item,
          ownerId: "owner_beta"
        }))
      })
    },
    {
      name: "cross-namespace evidence",
      mutate: (result) => ({
        ...result,
        evidence: result.evidence.map((item) => ({
          ...item,
          namespaceId: "ns_project_beta"
        }))
      })
    },
    {
      name: "denied ACL",
      mutate: (result) =>
        ({
          ...result,
          evidence: result.evidence.map((item) => ({
            ...item,
            aclDecision: "denied"
          }))
        }) as unknown as RuntimeKnowledgeProviderResult
    },
    {
      name: "invalid digest",
      mutate: (result) => ({
        ...result,
        evidence: result.evidence.map((item) => ({
          ...item,
          contentDigest: {
            algorithm: "sha256",
            value: "not-a-digest"
          }
        }))
      })
    },
    {
      name: "unsafe locator",
      mutate: (result) =>
        ({
          ...result,
          evidence: result.evidence.map((item) => ({
            ...item,
            citationLocator: {
              value: "private://secret/path",
              publicSafe: false
            }
          }))
        }) as unknown as RuntimeKnowledgeProviderResult
    },
    {
      name: "incompatible result contract version",
      mutate: (result) =>
        ({
          ...result,
          contractVersion: "knowledge-provider.v2"
        }) as unknown as RuntimeKnowledgeProviderResult
    },
    {
      name: "invalid provider authority",
      mutate: (result) =>
        ({
          ...result,
          evidence: result.evidence.map((item) => ({
            ...item,
            instructionAuthority: "provider"
          }))
        }) as unknown as RuntimeKnowledgeProviderResult
    },
    {
      name: "allowed result with contradictory error",
      mutate: (result) => ({
        ...result,
        error: {
          code: "provider_failure",
          message: "The provider could not complete the request.",
          traceId: result.traceId,
          retryable: true,
          detailsRedacted: true
        }
      })
    },
    {
      name: "unavailable result without safe error",
      mutate: (result) => ({
        ...result,
        status: "unavailable",
        evidence: [],
        gaps: [
          {
            code: "provider_unavailable",
            message: "Source evidence is temporarily unavailable.",
            retryable: true
          }
        ]
      })
    },
    {
      name: "denied result with a continuation cursor",
      mutate: (result) => ({
        ...result,
        status: "denied",
        evidence: [],
        gaps: [
          {
            code: "not_found",
            message: "Requested evidence is unavailable.",
            retryable: false
          }
        ],
        error: {
          code: "not_found",
          message: "The requested item is not available.",
          traceId: result.traceId,
          retryable: false,
          detailsRedacted: true
        },
        nextCursor: {
          providerId: result.providerId,
          providerScopeId: "scope_docs_alpha",
          value: "cursor_page_2"
        }
      })
    }
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, async () => {
      await expectRejectedProviderResult((result) =>
        testCase.mutate(result)
      );
    });
  }
});

test("provider query, cursor, result, excerpt, and aggregate response bounds fail closed", async (t) => {
  await t.test("query byte bound", () => {
    assert.throws(
      () =>
        parseSourceEvidenceSearch({
          namespaceId: "ns_project_alpha",
          query: "q".repeat(1_025)
        }),
      (error: unknown) =>
        error instanceof SafeError &&
        error.code === "validation_failed" &&
        error.status === 400
    );
  });

  await t.test("cursor byte bound", () => {
    assert.throws(
      () =>
        parseSourceEvidenceSearch({
          namespaceId: "ns_project_alpha",
          query: "deployment review",
          cursor: {
            providerId: "synthetic_document_index",
            providerScopeId: "scope_docs_alpha",
            value: "c".repeat(257)
          }
        }),
      (error: unknown) =>
        error instanceof SafeError &&
        error.code === "validation_failed" &&
        error.status === 400
    );
  });

  await t.test("result-count bound", async () => {
    await expectRejectedProviderResult((result) => ({
      ...result,
      evidence: Array.from({ length: 11 }, () => ({
        ...result.evidence[0]
      }))
    }));
  });

  await t.test("single-excerpt bound", async () => {
    await expectRejectedProviderResult((result) => ({
      ...result,
      evidence: result.evidence.map((item) => ({
        ...item,
        excerpt: "e".repeat(65_537)
      }))
    }));
  });

  await t.test("aggregate response bound", async () => {
    await expectRejectedProviderResult((result) => {
      const item = result.evidence[0];
      assert(item);
      return {
        ...result,
        evidence: Array.from({ length: 10 }, (_, index) => ({
          ...item,
          providerRecordId: `record_${index}`,
          sourceId: `source_${index}`,
          segmentId: `segment_${index}`,
          sourceVersion: `v${index}${"s".repeat(254)}`,
          citationLocator: {
            value: `synthetic://${"l".repeat(2_036)}`,
            publicSafe: true
          },
          title: "t".repeat(1_024),
          excerpt: "e".repeat(6_500),
          mediaType: "m".repeat(128)
        }))
      };
    });
  });
});

test("empty, partial, unavailable, rate-limited, denied, and not-found outcomes preserve safe gaps", async (t) => {
  const cases = [
    {
      name: "empty",
      status: "allowed" as const,
      code: "no_evidence" as const,
      expectedMessage: "No evidence matched the request.",
      retryable: false,
      errorCode: undefined
    },
    {
      name: "partial",
      status: "partial_success" as const,
      code: "partial_evidence" as const,
      expectedMessage: "Some evidence could not be returned.",
      retryable: false,
      errorCode: undefined
    },
    {
      name: "rate-limited",
      status: "unavailable" as const,
      code: "rate_limited" as const,
      expectedMessage: "Source evidence is temporarily unavailable.",
      retryable: true,
      errorCode: "rate_limited" as const
    },
    {
      name: "denied",
      status: "denied" as const,
      code: "invalid_evidence" as const,
      expectedMessage: "Some evidence was withheld.",
      retryable: false,
      errorCode: "provenance_incomplete" as const
    },
    {
      name: "not-found",
      status: "denied" as const,
      code: "not_found" as const,
      expectedMessage: "Requested evidence is unavailable.",
      retryable: false,
      errorCode: "not_found" as const
    }
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, async () => {
      const synthetic = createSyntheticKnowledgeProvider();
      const auditStore = new RecordingAuditStore();
      const host = createKnowledgeProviderHost({
        binding: {
          provider: {
            profile: synthetic.profile,
            async execute(request) {
              const result = await synthetic.execute(request);
              return {
                ...result,
                status: testCase.status,
                evidence:
                  testCase.status === "partial_success"
                    ? result.evidence
                    : [],
                gaps: [
                  {
                    code: testCase.code,
                    message: "raw provider detail with token secret",
                    retryable: testCase.retryable
                  }
                ],
                ...(testCase.errorCode === undefined
                  ? {}
                  : {
                      error: {
                        code: testCase.errorCode,
                        message:
                          "raw provider endpoint with credential secret",
                        traceId: request.traceId,
                        retryable: testCase.retryable,
                        ...(testCase.errorCode === "rate_limited"
                          ? { retryAfterMs: 12_000 }
                          : {}),
                        detailsRedacted: true as const
                      }
                    })
              };
            }
          },
          ownerId: "owner_alpha",
          namespaceId: "ns_project_alpha",
          providerScopeId: "scope_docs_alpha",
          timeoutMs: 1_000
        },
        auditStore,
        processReleaseSecret: randomBytes(32)
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
          ...parseSourceEvidenceSearch({
            namespaceId: "ns_project_alpha",
            query: "deployment review"
          })
        }
      );
      try {
        const response = JSON.parse(
          execution.serializedResponse.toString("utf8")
        ) as {
          data: {
            status: string;
            evidence: unknown[];
            gaps: Array<{
              code: string;
              message: string;
              retryable: boolean;
            }>;
            error?: {
              code: string;
              message: string;
              traceId: string;
              retryable: boolean;
              retryAfterMs?: number;
              detailsRedacted: true;
            };
          };
        };
        assert.equal(response.data.status, testCase.status);
        assert.equal(
          response.data.evidence.length,
          testCase.status === "partial_success" ? 1 : 0
        );
        assert.deepEqual(response.data.gaps, [
          {
            code: testCase.code,
            message: testCase.expectedMessage,
            retryable: testCase.retryable
          }
        ]);
        if (testCase.errorCode === undefined) {
          assert.equal(response.data.error, undefined);
        } else {
          assert.equal(response.data.error?.code, testCase.errorCode);
          assert.equal(response.data.error?.traceId, traceId);
          assert.equal(response.data.error?.retryable, testCase.retryable);
          assert.equal(response.data.error?.detailsRedacted, true);
          assert.doesNotMatch(
            response.data.error?.message ?? "",
            /raw|endpoint|credential|secret/u
          );
          if (testCase.errorCode === "rate_limited") {
            assert.equal(response.data.error?.retryAfterMs, 12_000);
          }
        }
        assert.doesNotMatch(
          execution.serializedResponse.toString("utf8"),
          /raw|token|secret/u
        );
        assert.deepEqual(auditStore.issued, auditStore.consumed);
      } finally {
        execution.clear();
      }
    });
  }
});

test("provider exceptions never enter client errors or audit metadata", async () => {
  const synthetic = createSyntheticKnowledgeProvider();
  const auditStore = new RecordingAuditStore();
  const host = createKnowledgeProviderHost({
    binding: {
      provider: {
        profile: synthetic.profile,
        async execute() {
          throw new Error(
            "private endpoint https://secret.invalid token=restricted"
          );
        }
      },
      ownerId: "owner_alpha",
      namespaceId: "ns_project_alpha",
      providerScopeId: "scope_docs_alpha",
      timeoutMs: 1_000
    },
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
        ...parseSourceEvidenceSearch({
          namespaceId: "ns_project_alpha",
          query: "private query"
        })
      }
    ),
    (error: unknown) =>
      error instanceof SafeError &&
      error.message === "operation_unavailable" &&
      !/private|secret|token|restricted|invalid/u.test(error.message)
  );
  assert.equal(auditStore.issued, undefined);
  assert.equal(auditStore.consumed, undefined);
});
