import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import type pg from "pg";

import type { DurableMemoryOnlyTransportContext } from "../src/durable-memory-only-runtime.js";
import { ALPHA1_SCHEMA_VERSION } from "../src/config.js";
import {
  GATE_B_DURABLE_AUTH_MIGRATION_NAME,
  readAlpha1Migrations
} from "../src/migration.js";
import { canonicalRequestDigest } from "../src/idempotency.js";
import { PostgresMemoryOnlyAuthorizationAuthority } from "../src/postgres-memory-only-authorization.js";
import type { ProtectedReadReceiptBinding } from "../src/trusted-memory-search.js";

const NOW_MS = Date.parse("2026-08-01T20:00:00.000Z");
const transport: DurableMemoryOnlyTransportContext = {
  principalId: "principal_daniel",
  adapterId: "adapter_hermes_synthetic",
  clientId: "client_hermes_synthetic",
  sessionId: "session_gate_b_synthetic",
  credentialAudience: "source_wire_memory",
  authorizationEpoch: "7",
  deletionEpoch: "3",
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
const destinationDigest = canonicalRequestDigest({
  domain: "source-wire.gate-b.destination.v1",
  destination: transport.destination
});
const audienceChainDigest = canonicalRequestDigest({
  domain: "source-wire.gate-b.audience-chain.v1",
  audienceChain: transport.audienceChain
});
const senderThumbprintDigest = canonicalRequestDigest({
  domain: "source-wire.gate-b.sender-thumbprint.v1",
  thumbprint: "thumbprint_dpop_synthetic"
});
const nonceDigest = canonicalRequestDigest({
  domain: "source-wire.gate-b.dpop-nonce.v1",
  nonce: "nonce_gate_b_0001"
});

test("schema version 7 registers the durable Gate B authorization migration", async () => {
  const migrations = await readAlpha1Migrations();
  const latest = migrations.at(-1);

  assert.equal(ALPHA1_SCHEMA_VERSION, 7);
  assert.equal(migrations.length, 7);
  assert.equal(latest?.name, GATE_B_DURABLE_AUTH_MIGRATION_NAME);
  assert.match(latest?.sql ?? "", /CREATE TABLE source_wire_memory\.gate_b_memory_sessions/u);
  assert.match(latest?.sql ?? "", /CREATE TABLE source_wire_memory\.gate_b_memory_replay_ids/u);
  assert.match(latest?.sql ?? "", /authorize_gate_b_memory_search/u);
  assert.match(latest?.sql ?? "", /lock_gate_b_memory_release/u);
});

test("PostgreSQL authority derives actor, input, and immutable release context", async () => {
  const calls: Array<{ sql: string; values: readonly unknown[] | undefined }> = [];
  let released = false;
  const client = {
    async query(sql: string, values?: readonly unknown[]) {
      calls.push({ sql, values });
      if (!sql.includes("authorize_gate_b_memory_search")) {
        return { rows: [] };
      }
      return {
        rows: [
          {
            credential_id: "10000000-0000-4000-8000-000000000002",
            credential_class: "harness",
            owner_id: "owner_doo_made",
            actor_identity_id: "10000000-0000-4000-8000-000000000001",
            authentication_epoch_id: "10000000-0000-4000-8000-000000000004",
            namespace_ids: ["ns_synthetic_memory"],
            capabilities: ["trusted_memory.search"],
            issued_at: new Date(NOW_MS - 60_000),
            expires_at: new Date(NOW_MS + 5 * 60_000),
            session_id: "session_gate_b_synthetic",
            authorization_epoch: "7",
            deletion_epoch: "3"
          }
        ]
      };
    },
    release() {
      released = true;
    }
  };
  const pool = {
    async connect() {
      return client;
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });

  const decision = await authority.authorizeSearch({
    transport,
    request: {
      namespaceId: "ns_synthetic_memory",
      query: "approved launch constraints",
      limit: 3
    }
  });

  assert.deepEqual(
    calls.map((call) => call.sql),
    [
      "BEGIN",
      "SET LOCAL lock_timeout = '2s'",
      "SET LOCAL statement_timeout = '2s'",
      calls[3]!.sql,
      "COMMIT"
    ]
  );
  assert.equal(released, true);
  const authorizationCall = calls[3]!;
  assert.match(authorizationCall.sql, /authorize_gate_b_memory_search/u);
  assert.equal(authorizationCall.values?.[5], "7");
  assert.equal(authorizationCall.values?.[6], "3");
  for (const digestIndex of [7, 8, 9, 12, 13]) {
    assert.match(String(authorizationCall.values?.[digestIndex]), /^[0-9a-f]{64}$/u);
  }
  assert.notEqual(authorizationCall.values?.[9], "thumbprint_dpop_synthetic");
  assert.notEqual(authorizationCall.values?.[12], "nonce_gate_b_0001");
  assert.notEqual(authorizationCall.values?.[13], "replay_gate_b_0001");
  assert.equal(decision.actor.ownerId, "owner_doo_made");
  assert.equal(decision.actor.actorReference, "credential:10000000-0000-4000-8000-000000000002");
  assert.deepEqual(decision.input, {
    namespaceId: "ns_synthetic_memory",
    query: "approved launch constraints",
    queryByteCount: 27,
    limit: 3
  });
  assert.deepEqual(decision.releaseContext, {
    credentialId: "10000000-0000-4000-8000-000000000002",
    ownerId: "owner_doo_made",
    principalId: "principal_daniel",
    adapterId: "adapter_hermes_synthetic",
    clientId: "client_hermes_synthetic",
    sessionId: "session_gate_b_synthetic",
    credentialAudience: "source_wire_memory",
    namespaceId: "ns_synthetic_memory",
    authorizationEpoch: "7",
    deletionEpoch: "3",
    destinationDigest,
    audienceChainDigest,
    senderThumbprintDigest,
    nonceDigest,
    requestMethod: "POST",
    requestUri: "/v1alpha1/trusted-memories/search"
  });
  assert.equal(Object.isFrozen(decision.releaseContext), true);
});

test("PostgreSQL authority fails closed when durable authorization is unavailable", async () => {
  const statements: string[] = [];
  let released = false;
  const client = {
    async query(sql: string) {
      statements.push(sql);
      if (sql.includes("authorize_gate_b_memory_search")) {
        throw new Error("synthetic_database_outage");
      }
      return { rows: [] };
    },
    release() {
      released = true;
    }
  };
  const pool = {
    async connect() {
      return client;
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });

  await assert.rejects(
    authority.authorizeSearch({
      transport,
      request: {
        namespaceId: "ns_synthetic_memory",
        query: "approved launch constraints",
        limit: 3
      }
    }),
    (error: unknown) =>
      error instanceof Error && error.message === "operation_unavailable"
  );
  assert.deepEqual(statements.slice(0, 3), [
    "BEGIN",
    "SET LOCAL lock_timeout = '2s'",
    "SET LOCAL statement_timeout = '2s'"
  ]);
  assert.match(statements[3] ?? "", /authorize_gate_b_memory_search/u);
  assert.equal(statements.at(-1), "ROLLBACK");
  assert.equal(released, true);
});

test("PostgreSQL authority rejects proof-to-transport substitution before database access", async () => {
  let queryCount = 0;
  const pool = {
    async query() {
      queryCount += 1;
      return { rows: [] };
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });

  await assert.rejects(
    authority.authorizeSearch({
      transport: {
        ...transport,
        requestMethod: "GET"
      },
      request: {
        namespaceId: "ns_synthetic_memory",
        query: "approved launch constraints",
        limit: 3
      }
    }),
    (error: unknown) =>
      error instanceof Error && error.message === "credential_invalid"
  );
  assert.equal(queryCount, 0);
});

test("PostgreSQL authority rejects unsafe bigint inputs before database access", async () => {
  let queryCount = 0;
  const pool = {
    async query() {
      queryCount += 1;
      return { rows: [] };
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });
  const request = {
    namespaceId: "ns_synthetic_memory",
    query: "approved launch constraints",
    limit: 3
  };

  for (const invalidTransport of [
    { ...transport, authorizationEpoch: "01" },
    { ...transport, deletionEpoch: "9223372036854775808" },
    {
      ...transport,
      senderProof: {
        ...transport.senderProof,
        issuedAtMs: Number.MAX_SAFE_INTEGER + 1
      }
    }
  ]) {
    await assert.rejects(
      authority.authorizeSearch({ transport: invalidTransport, request }),
      (error: unknown) =>
        error instanceof Error && error.message === "credential_invalid"
    );
  }
  assert.equal(queryCount, 0);
});

test("PostgreSQL authority locks authorization and consumes receipt atomically", async () => {
  const statements: string[] = [];
  const client = {
    async query(sql: string) {
      statements.push(sql);
      if (sql.includes("prepare_gate_b_memory_release")) {
        return { rows: [{ prepared: true }] };
      }
      if (sql.includes("lock_gate_b_memory_release")) {
        return { rows: [{ authorized: true }] };
      }
      if (sql.includes("consume_protected_read_receipt")) {
        return { rows: [{ consumed: true }] };
      }
      return { rows: [] };
    },
    release() {
      statements.push("RELEASE_CLIENT");
    }
  };
  const pool = {
    async connect() {
      return client;
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });
  const credentialId = "10000000-0000-4000-8000-000000000002";
  const receipt: ProtectedReadReceiptBinding = {
    receiptId: randomUUID(),
    formatVersion: 1,
    traceId: randomUUID(),
    requestId: randomUUID(),
    actorReference: `credential:${credentialId}`,
    actorCredentialId: credentialId,
    ownerId: "owner_doo_made",
    namespaceId: "ns_synthetic_memory",
    operation: "search_trusted_memory",
    policyDecision: "allowed",
    releaseBinding: randomBytes(32).toString("base64url"),
    requestDigest: "a".repeat(64),
    resultDigest: "b".repeat(64),
    targetOrderDigest: "c".repeat(64),
    responseByteCount: 512,
    coveredResultCount: 1,
    issuedAt: "2026-08-01T20:00:00.000Z",
    expiresAt: "2026-08-01T20:00:05.000Z"
  };

  const consumed = await authority.consumeAuthorizedRelease(
    {
      credentialId,
      ownerId: "owner_doo_made",
      principalId: "principal_daniel",
      adapterId: "adapter_hermes_synthetic",
      clientId: "client_hermes_synthetic",
      sessionId: "session_gate_b_synthetic",
      credentialAudience: "source_wire_memory",
      namespaceId: "ns_synthetic_memory",
      authorizationEpoch: "7",
      deletionEpoch: "3",
      destinationDigest,
      audienceChainDigest,
      senderThumbprintDigest,
      nonceDigest,
      requestMethod: "POST",
      requestUri: "/v1alpha1/trusted-memories/search"
    },
    receipt,
    Buffer.alloc(32, 7)
  );

  assert.equal(consumed, true);
  assert.deepEqual(
    statements.map((sql) => sql.trim().split(/\s+/u)[0]),
    [
      "BEGIN",
      "SET",
      "SET",
      "SELECT",
      "SELECT",
      "SELECT",
      "COMMIT",
      "RELEASE_CLIENT"
    ]
  );
  assert.match(statements[3]!, /prepare_gate_b_memory_release/u);
  assert.match(statements[4]!, /lock_gate_b_memory_release/u);
  assert.match(statements[5]!, /consume_protected_read_receipt/u);
});
