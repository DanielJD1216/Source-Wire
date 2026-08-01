import assert from "node:assert/strict";
import test from "node:test";
import type pg from "pg";

import {
  SyntheticMemoryOnlyAccessPlane,
  type MemoryOnlyPolicySnapshot,
  type MemoryOnlyTransportContext
} from "../src/global-memory-access-plane.js";
import {
  SyntheticMemoryOnlyRuntime,
  type MemoryOnlySearchExecutor
} from "../src/global-memory-only-runtime.js";
import type { TrustedMemorySearchExecution } from "../src/trusted-memory-search.js";

const NOW_MS = Date.parse("2026-08-01T20:00:00.000Z");

const policy: MemoryOnlyPolicySnapshot = {
  ownerId: "owner_doo_made",
  principalId: "principal_daniel",
  adapterId: "adapter_hermes_synthetic",
  actorIdentityId: "10000000-0000-4000-8000-000000000001",
  clientId: "client_hermes_synthetic",
  sessionId: "session_gate_b_synthetic",
  credentialId: "10000000-0000-4000-8000-000000000002",
  credentialAudience: "source_wire_memory",
  credentialIssuedAt: "2026-08-01T19:55:00.000Z",
  credentialExpiresAt: "2026-08-01T20:05:00.000Z",
  credentialStatus: "active",
  sessionStatus: "active",
  namespaceIds: ["ns_synthetic_memory"],
  capabilities: ["trusted_memory.search"],
  authorizationEpoch: 7,
  deletionEpoch: 3,
  destination: {
    deliverySurface: "synthetic_harness",
    workspaceId: "workspace_synthetic",
    channelId: "channel_private_synthetic",
    threadId: "thread_gate_b",
    modelProvider: "provider_synthetic",
    modelAccount: "account_synthetic",
    modelEndpoint: "endpoint_local_synthetic",
    locality: "local",
    retentionClass: "ephemeral"
  },
  audienceChain: [
    "principal_daniel",
    "adapter_hermes_synthetic",
    "client_hermes_synthetic",
    "endpoint_local_synthetic",
    "channel_private_synthetic"
  ],
  senderBinding: {
    kind: "dpop",
    thumbprint: "thumbprint_dpop_synthetic"
  }
};

const transport: MemoryOnlyTransportContext = {
  principalId: policy.principalId,
  adapterId: policy.adapterId,
  clientId: policy.clientId,
  sessionId: policy.sessionId,
  credentialAudience: policy.credentialAudience,
  authorizationEpoch: policy.authorizationEpoch,
  deletionEpoch: policy.deletionEpoch,
  destination: policy.destination,
  audienceChain: policy.audienceChain,
  requestMethod: "POST",
  requestUri: "/v1alpha1/trusted-memories/search",
  senderProof: {
    kind: "dpop",
    keyThumbprint: "thumbprint_dpop_synthetic",
    method: "POST",
    uri: "/v1alpha1/trusted-memories/search",
    nonce: "nonce_gate_b_0001",
    replayId: "replay_gate_b_0001",
    issuedAtMs: NOW_MS - 1_000
  }
};

test("authorizes one DPoP-bound synthetic memory search from immutable server context", () => {
  const accessPlane = new SyntheticMemoryOnlyAccessPlane({
    now: () => NOW_MS,
    expectedDpopNonce: () => "nonce_gate_b_0001"
  });

  const authorized = accessPlane.authorizeSearch({
    policy,
    transport,
    request: {
      namespaceId: "ns_synthetic_memory",
      query: "approved launch constraints",
      limit: 3
    }
  });

  assert.equal(authorized.actor.ownerId, "owner_doo_made");
  assert.equal(authorized.actor.actorIdentityId, policy.actorIdentityId);
  assert.equal(authorized.actor.actorReference, `credential:${policy.credentialId}`);
  assert.deepEqual(authorized.actor.namespaceIds, ["ns_synthetic_memory"]);
  assert.deepEqual(authorized.actor.capabilities, ["trusted_memory.search"]);
  assert.deepEqual(authorized.input, {
    namespaceId: "ns_synthetic_memory",
    query: "approved launch constraints",
    queryByteCount: 27,
    limit: 3
  });
  assert.match(authorized.destinationDigest, /^[0-9a-f]{64}$/u);
  assert.match(authorized.audienceChainDigest, /^[0-9a-f]{64}$/u);
  assert(Object.isFrozen(authorized));
  assert(Object.isFrozen(authorized.actor));
  assert(Object.isFrozen(authorized.input));
});

function createAccessPlane(): SyntheticMemoryOnlyAccessPlane {
  return new SyntheticMemoryOnlyAccessPlane({
    now: () => NOW_MS,
    expectedDpopNonce: () => "nonce_gate_b_0001"
  });
}

function authorizeWith(overrides: {
  policy?: Partial<MemoryOnlyPolicySnapshot>;
  transport?: Partial<MemoryOnlyTransportContext>;
  request?: Record<string, unknown>;
} = {}) {
  return createAccessPlane().authorizeSearch({
    policy: { ...policy, ...overrides.policy },
    transport: { ...transport, ...overrides.transport },
    request: overrides.request ?? {
      namespaceId: "ns_synthetic_memory",
      query: "approved launch constraints",
      limit: 3
    }
  });
}

test("rejects DPoP replay after the first authorized request", () => {
  const accessPlane = createAccessPlane();
  const input = {
    policy,
    transport,
    request: {
      namespaceId: "ns_synthetic_memory",
      query: "approved launch constraints",
      limit: 3
    }
  };

  accessPlane.authorizeSearch(input);
  assert.throws(
    () => accessPlane.authorizeSearch(input),
    (error: unknown) =>
      error instanceof Error && error.message === "credential_invalid"
  );
});

test("fails unavailable when the bounded DPoP replay store reaches capacity", () => {
  assert.equal(transport.senderProof.kind, "dpop");
  if (transport.senderProof.kind !== "dpop") {
    throw new Error("invalid_test_fixture");
  }
  const dpopProof = transport.senderProof;
  const accessPlane = new SyntheticMemoryOnlyAccessPlane({
    now: () => NOW_MS,
    expectedDpopNonce: () => "nonce_gate_b_0001",
    maxDpopReplayIds: 1
  });
  const request = {
    namespaceId: "ns_synthetic_memory",
    query: "approved launch constraints",
    limit: 3
  };

  accessPlane.authorizeSearch({ policy, transport, request });
  assert.throws(
    () =>
      accessPlane.authorizeSearch({
        policy,
        transport: {
          ...transport,
          senderProof: {
            ...dpopProof,
            replayId: "replay_gate_b_0002"
          }
        },
        request
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "operation_unavailable"
  );
});

test("rejects transport-derived identity, route, proof, and epoch substitution", () => {
  assert.equal(transport.senderProof.kind, "dpop");
  if (transport.senderProof.kind !== "dpop") {
    throw new Error("invalid_test_fixture");
  }
  const dpopProof = transport.senderProof;
  const denials: Array<{
    name: string;
    transport: Partial<MemoryOnlyTransportContext>;
    code: string;
  }> = [
    {
      name: "principal",
      transport: { principalId: "principal_other" },
      code: "credential_invalid"
    },
    {
      name: "adapter",
      transport: { adapterId: "adapter_other" },
      code: "credential_invalid"
    },
    {
      name: "client",
      transport: { clientId: "client_other" },
      code: "credential_invalid"
    },
    {
      name: "session",
      transport: { sessionId: "session_other" },
      code: "credential_invalid"
    },
    {
      name: "credential audience",
      transport: { credentialAudience: "source_wire_other" },
      code: "credential_invalid"
    },
    {
      name: "destination",
      transport: {
        destination: { ...transport.destination, channelId: "channel_other" }
      },
      code: "credential_invalid"
    },
    {
      name: "audience chain",
      transport: {
        audienceChain: [
          "principal_daniel",
          "client_hermes_synthetic",
          "channel_private_synthetic"
        ]
      },
      code: "credential_invalid"
    },
    {
      name: "authorization epoch",
      transport: { authorizationEpoch: 8 },
      code: "credential_revoked"
    },
    {
      name: "deletion epoch",
      transport: { deletionEpoch: 4 },
      code: "credential_revoked"
    },
    {
      name: "DPoP thumbprint",
      transport: {
        senderProof: {
          ...dpopProof,
          kind: "dpop",
          keyThumbprint: "thumbprint_other"
        }
      },
      code: "credential_invalid"
    },
    {
      name: "DPoP nonce",
      transport: {
        senderProof: {
          ...dpopProof,
          kind: "dpop",
          nonce: "nonce_other"
        }
      },
      code: "credential_invalid"
    },
    {
      name: "DPoP method",
      transport: {
        senderProof: {
          ...dpopProof,
          kind: "dpop",
          method: "GET"
        }
      },
      code: "credential_invalid"
    },
    {
      name: "stale DPoP proof",
      transport: {
        senderProof: {
          ...dpopProof,
          kind: "dpop",
          issuedAtMs: NOW_MS - 60_001
        }
      },
      code: "credential_invalid"
    }
  ];

  for (const denial of denials) {
    assert.throws(
      () => authorizeWith({ transport: denial.transport }),
      (error: unknown) =>
        error instanceof Error && error.message === denial.code,
      denial.name
    );
  }
});

test("payload fields cannot assert access-plane authority", () => {
  for (const field of [
    "principalId",
    "clientId",
    "sessionId",
    "capabilities",
    "destination",
    "audienceChain",
    "authorizationEpoch",
    "deletionEpoch"
  ]) {
    assert.throws(
      () =>
        authorizeWith({
          request: {
            namespaceId: "ns_synthetic_memory",
            query: "approved launch constraints",
            limit: 3,
            [field]: "attacker_supplied"
          }
        }),
      (error: unknown) =>
        error instanceof Error && error.message === "validation_failed",
      field
    );
  }
});

test("rejects ungranted namespace and missing search capability", () => {
  assert.throws(
    () =>
      authorizeWith({
        request: {
          namespaceId: "ns_other",
          query: "approved launch constraints"
        }
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "namespace_not_allowed"
  );
  assert.throws(
    () => authorizeWith({ policy: { capabilities: [] } }),
    (error: unknown) =>
      error instanceof Error && error.message === "capability_not_allowed"
  );
});

test("rejects credentials whose lifetime exceeds the fifteen-minute bound", () => {
  assert.throws(
    () =>
      authorizeWith({
        policy: {
          credentialIssuedAt: "2026-08-01T19:50:00.000Z",
          credentialExpiresAt: "2026-08-01T20:10:00.000Z"
        }
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "credential_invalid"
  );
});

test("rejects revoked credential or session state before retrieval", () => {
  for (const policyOverride of [
    { credentialStatus: "revoked" as const },
    { sessionStatus: "revoked" as const }
  ]) {
    assert.throws(
      () => authorizeWith({ policy: policyOverride }),
      (error: unknown) =>
        error instanceof Error && error.message === "credential_revoked"
    );
  }
});

test("fails unavailable when the injected clock is invalid", () => {
  const accessPlane = new SyntheticMemoryOnlyAccessPlane({
    now: () => Number.NaN,
    expectedDpopNonce: () => "nonce_gate_b_0001"
  });
  assert.throws(
    () =>
      accessPlane.authorizeSearch({
        policy,
        transport,
        request: {
          namespaceId: "ns_synthetic_memory",
          query: "approved launch constraints"
        }
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "operation_unavailable"
  );
});

test("rejects invalid sender proof before policy grant evaluation", () => {
  assert.equal(transport.senderProof.kind, "dpop");
  if (transport.senderProof.kind !== "dpop") {
    throw new Error("invalid_test_fixture");
  }
  const dpopProof = transport.senderProof;
  assert.throws(
    () =>
      authorizeWith({
        policy: {
          capabilities: ["invalid_capability" as "trusted_memory.search"]
        },
        transport: {
          senderProof: {
            ...dpopProof,
            keyThumbprint: "thumbprint_other"
          }
        }
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "credential_invalid"
  );
});

test("rejects a policy snapshot with an incomplete audience chain", () => {
  const incomplete = [
    "principal_daniel",
    "client_hermes_synthetic",
    "channel_private_synthetic"
  ];
  assert.throws(
    () =>
      authorizeWith({
        policy: { audienceChain: incomplete },
        transport: { audienceChain: incomplete }
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "operation_unavailable"
  );
});

test("rejects missing or additional destination tuple fields", () => {
  const destinationWithoutLocality = Object.fromEntries(
    Object.entries(policy.destination).filter(([field]) => field !== "locality")
  ) as MemoryOnlyPolicySnapshot["destination"];
  const destinationWithAdditionalField = {
    ...policy.destination,
    callerSuppliedRoute: "route_injected"
  } as MemoryOnlyPolicySnapshot["destination"];

  for (const destination of [
    destinationWithoutLocality,
    destinationWithAdditionalField
  ]) {
    assert.throws(
      () =>
        authorizeWith({
          policy: { destination },
          transport: { destination }
        }),
      (error: unknown) =>
        error instanceof Error && error.message === "operation_unavailable"
    );
  }
});

test("authorizes exact mTLS binding and rejects certificate substitution", () => {
  const mtlsPolicy: Partial<MemoryOnlyPolicySnapshot> = {
    senderBinding: {
      kind: "mtls",
      thumbprint: "thumbprint_mtls_synthetic"
    }
  };
  const mtlsTransport: Partial<MemoryOnlyTransportContext> = {
    senderProof: {
      kind: "mtls",
      certificateThumbprint: "thumbprint_mtls_synthetic"
    }
  };
  assert.equal(
    authorizeWith({ policy: mtlsPolicy, transport: mtlsTransport }).clientId,
    policy.clientId
  );
  assert.throws(
    () =>
      authorizeWith({
        policy: mtlsPolicy,
        transport: {
          senderProof: {
            kind: "mtls",
            certificateThumbprint: "thumbprint_other"
          }
        }
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "credential_invalid"
  );
});

test("runtime authorizes before invoking the existing trusted-memory executor", async () => {
  const calls: Parameters<MemoryOnlySearchExecutor>[] = [];
  const syntheticExecution = {
    marker: "synthetic_memory_only_execution"
  } as unknown as TrustedMemorySearchExecution;
  const executeSearch: MemoryOnlySearchExecutor = async (...args) => {
    calls.push(args);
    return syntheticExecution;
  };
  const runtime = new SyntheticMemoryOnlyRuntime({
    accessPlane: createAccessPlane(),
    pool: {} as never,
    processReleaseSecret: Buffer.alloc(32, 7),
    executeSearch,
    now: () => NOW_MS
  });

  const result = await runtime.search({
    policy,
    transport,
    request: {
      namespaceId: "ns_synthetic_memory",
      query: "approved launch constraints",
      limit: 3
    },
    traceId: "10000000-0000-4000-8000-000000000003"
  });

  assert.equal(result, syntheticExecution);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.[1].ownerId, policy.ownerId);
  assert.deepEqual(calls[0]?.[2], {
    namespaceId: "ns_synthetic_memory",
    query: "approved launch constraints",
    queryByteCount: 27,
    limit: 3
  });
  assert.equal(calls[0]?.[3], "10000000-0000-4000-8000-000000000003");
});

test("runtime blocks destination substitution before trusted-memory retrieval", async () => {
  let callCount = 0;
  const executeSearch: MemoryOnlySearchExecutor = async () => {
    callCount += 1;
    throw new Error("executor_must_not_run");
  };
  const runtime = new SyntheticMemoryOnlyRuntime({
    accessPlane: createAccessPlane(),
    pool: {} as never,
    processReleaseSecret: Buffer.alloc(32, 7),
    executeSearch,
    now: () => NOW_MS
  });

  await assert.rejects(
    runtime.search({
      policy,
      transport: {
        ...transport,
        destination: {
          ...transport.destination,
          channelId: "channel_attacker"
        }
      },
      request: {
        namespaceId: "ns_synthetic_memory",
        query: "approved launch constraints",
        limit: 3
      },
      traceId: "10000000-0000-4000-8000-000000000003"
    }),
    (error: unknown) =>
      error instanceof Error && error.message === "credential_invalid"
  );
  assert.equal(callCount, 0);
});

test("default runtime completes the existing protected-read receipt path", async () => {
  assert.equal(transport.senderProof.kind, "dpop");
  if (transport.senderProof.kind !== "dpop") {
    throw new Error("invalid_test_fixture");
  }
  const nowMs = Date.now();
  const activePolicy: MemoryOnlyPolicySnapshot = {
    ...policy,
    credentialIssuedAt: new Date(nowMs - 60_000).toISOString(),
    credentialExpiresAt: new Date(nowMs + 5 * 60_000).toISOString()
  };
  const activeTransport: MemoryOnlyTransportContext = {
    ...transport,
    senderProof: {
      ...transport.senderProof,
      replayId: "replay_gate_b_default_executor",
      issuedAtMs: nowMs - 1_000
    }
  };
  const runtime = new SyntheticMemoryOnlyRuntime({
    accessPlane: new SyntheticMemoryOnlyAccessPlane({
      now: () => nowMs,
      expectedDpopNonce: () => "nonce_gate_b_0001"
    }),
    pool: createDefaultExecutorPool(),
    processReleaseSecret: Buffer.alloc(32, 7),
    now: () => nowMs
  });

  const result = await runtime.search({
    policy: activePolicy,
    transport: activeTransport,
    request: {
      namespaceId: "ns_synthetic_memory",
      query: "approved launch constraints",
      limit: 3
    },
    traceId: "10000000-0000-4000-8000-000000000003"
  });

  assert.equal(result.releaseStatus, "release_attempted");
  assert.deepEqual(result.results, []);
  assert.equal(result.receipt.actorReference, `credential:${policy.credentialId}`);
  result.clear();
});

function createDefaultExecutorPool(): pg.Pool {
  const client = {
    async query(sql: string, values?: readonly unknown[]) {
      if (sql.includes("WITH eligible AS MATERIALIZED")) {
        return { rows: [] };
      }
      if (sql.includes("issue_protected_read_receipt")) {
        return { rows: [{ audit_event_id: values?.[19] }] };
      }
      return { rows: [] };
    },
    release() {}
  };
  return {
    async connect() {
      return client;
    },
    async query(sql: string) {
      if (!sql.includes("consume_protected_read_receipt")) {
        throw new Error("unexpected_pool_query");
      }
      return { rows: [{ consumed: true }] };
    }
  } as unknown as pg.Pool;
}
