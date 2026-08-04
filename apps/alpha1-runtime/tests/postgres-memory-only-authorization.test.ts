import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import type pg from "pg";

import type { DurableMemoryOnlyTransportContext } from "../src/durable-memory-only-runtime.js";
import { ALPHA1_SCHEMA_VERSION } from "../src/config.js";
import {
  GATE_B_DURABLE_AUTH_MIGRATION_NAME,
  GATE_B_DURABLE_RECEIPT_MIGRATION_NAME,
  readAlpha1Migrations
} from "../src/migration.js";
import { canonicalRequestDigest } from "../src/idempotency.js";
import { PostgresMemoryOnlyAuthorizationAuthority } from "../src/postgres-memory-only-authorization.js";
import type { AuthenticatedCredential } from "../src/repository.js";
import {
  prepareTrustedMemorySearch,
  type ProtectedReadReceiptBinding
} from "../src/trusted-memory-search.js";

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

function syntheticReceipt(): ProtectedReadReceiptBinding {
  const credentialId = "10000000-0000-4000-8000-000000000002";
  return {
    receiptId: randomUUID(),
    formatVersion: 2,
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
    expiresAt: "2026-08-01T20:00:05.000Z",
    authorizationId: releaseContext.authorizationId,
    authorizationContextDigest: releaseContext.authorizationContextDigest,
    actorIdentityId: releaseContext.actorIdentityId,
    authenticationEpochId: releaseContext.authenticationEpochId,
    principalId: releaseContext.principalId,
    adapterId: releaseContext.adapterId,
    clientId: releaseContext.clientId,
    sessionId: releaseContext.sessionId,
    credentialAudience: releaseContext.credentialAudience,
    capability: releaseContext.capability,
    authorizationEpoch: releaseContext.authorizationEpoch,
    deletionEpoch: releaseContext.deletionEpoch,
    credentialIssuedAt: releaseContext.credentialIssuedAt,
    credentialExpiresAt: releaseContext.credentialExpiresAt,
    sessionIssuedAt: releaseContext.sessionIssuedAt,
    sessionExpiresAt: releaseContext.sessionExpiresAt,
    credentialStatus: releaseContext.credentialStatus,
    clientState: releaseContext.clientState,
    sessionState: releaseContext.sessionState,
    grantState: releaseContext.grantState,
    destinationDigest: releaseContext.destinationDigest,
    audienceChainDigest: releaseContext.audienceChainDigest,
    senderBindingKind: releaseContext.senderBindingKind,
    senderThumbprintDigest: releaseContext.senderThumbprintDigest,
    nonceDigest: releaseContext.nonceDigest,
    replayIdDigest: releaseContext.replayIdDigest,
    proofIssuedAt: releaseContext.proofIssuedAt,
    requestMethod: releaseContext.requestMethod,
    requestUri: releaseContext.requestUri
  };
}

const releaseContext = {
  authorizationId: "10000000-0000-4000-8000-000000000005",
  authorizationContextDigest: "e".repeat(64),
  credentialId: "10000000-0000-4000-8000-000000000002",
  ownerId: "owner_doo_made",
  actorIdentityId: "10000000-0000-4000-8000-000000000001",
  authenticationEpochId: "10000000-0000-4000-8000-000000000004",
  principalId: "principal_daniel",
  adapterId: "adapter_hermes_synthetic",
  clientId: "client_hermes_synthetic",
  sessionId: "session_gate_b_synthetic",
  credentialAudience: "source_wire_memory",
  namespaceId: "ns_synthetic_memory",
  capability: "trusted_memory.search",
  authorizationEpoch: "7",
  deletionEpoch: "3",
  credentialIssuedAt: "2026-08-01T19:59:00.000Z",
  credentialExpiresAt: "2026-08-01T20:05:00.000Z",
  sessionIssuedAt: "2026-08-01T19:59:30.000Z",
  sessionExpiresAt: "2026-08-01T20:04:00.000Z",
  credentialStatus: "active",
  clientState: "active",
  sessionState: "active",
  grantState: "active",
  destinationDigest,
  audienceChainDigest,
  senderBindingKind: "dpop",
  senderThumbprintDigest,
  nonceDigest,
  replayIdDigest: "d".repeat(64),
  proofIssuedAt: "2026-08-01T19:59:59.000Z",
  requestMethod: "POST",
  requestUri: "/v1alpha1/trusted-memories/search"
} as const;

test("schema version 8 appends the durable Gate B receipt migration", async () => {
  const migrations = await readAlpha1Migrations();
  const durableAuthorization = migrations.find(
    (migration) => migration.name === GATE_B_DURABLE_AUTH_MIGRATION_NAME
  );
  const latest = migrations.at(-1);

  assert.equal(ALPHA1_SCHEMA_VERSION, 8);
  assert.equal(migrations.length, 8);
  assert.equal(durableAuthorization?.version, 7);
  assert.match(
    durableAuthorization?.sql ?? "",
    /CREATE TABLE source_wire_memory\.gate_b_memory_sessions/u
  );
  assert.match(
    durableAuthorization?.sql ?? "",
    /CREATE TABLE source_wire_memory\.gate_b_memory_replay_ids/u
  );
  assert.match(durableAuthorization?.sql ?? "", /authorize_gate_b_memory_search/u);
  assert.match(
    durableAuthorization?.sql ?? "",
    /p_request_method IS DISTINCT FROM 'POST'/u
  );
  assert.match(
    durableAuthorization?.sql ?? "",
    /p_request_uri IS DISTINCT FROM '\/v1alpha1\/trusted-memories\/search'/u
  );
  assert.match(durableAuthorization?.sql ?? "", /lock_gate_b_memory_release/u);
  assert.equal(latest?.name, GATE_B_DURABLE_RECEIPT_MIGRATION_NAME);
  assert.equal(latest?.version, 8);
});

test("schema version 8 defines authorization events and legacy-compatible format-2 receipts", async () => {
  const migration = (await readAlpha1Migrations()).at(-1)?.sql ?? "";
  assert.match(
    migration,
    /CREATE TABLE source_wire_memory\.gate_b_memory_authorization_events/u
  );
  assert.match(migration, /format_version IN \(1, 2\)/u);
  for (const column of [
    "gate_b_authorization_id",
    "gate_b_authorization_context_digest",
    "gate_b_actor_identity_id",
    "gate_b_principal_id",
    "gate_b_adapter_id",
    "gate_b_client_id",
    "gate_b_session_id",
    "gate_b_credential_audience",
    "gate_b_authorization_epoch",
    "gate_b_deletion_epoch",
    "gate_b_capability",
    "gate_b_credential_issued_at",
    "gate_b_credential_expires_at",
    "gate_b_session_issued_at",
    "gate_b_session_expires_at",
    "gate_b_credential_status",
    "gate_b_client_state",
    "gate_b_session_state",
    "gate_b_grant_state",
    "gate_b_destination_digest",
    "gate_b_audience_chain_digest",
    "gate_b_sender_binding_kind",
    "gate_b_sender_thumbprint_digest",
    "gate_b_dpop_nonce_digest",
    "gate_b_replay_id_digest",
    "gate_b_proof_issued_at",
    "gate_b_request_method",
    "gate_b_request_uri"
  ]) {
    assert.match(migration, new RegExp(`\\b${column}\\b`, "u"), column);
  }
  assert.match(migration, /num_nonnulls/u);
  assert.match(migration, /legacy_unbound/u);
  assert.match(migration, /schema_version BETWEEN 4 AND 8/u);
  assert.doesNotMatch(migration, /gate_b_access_token/u);
  assert.doesNotMatch(migration, /gate_b_dpop_proof/u);
  assert.doesNotMatch(migration, /gate_b_sender_thumbprint\s+varchar/u);
  assert.doesNotMatch(migration, /gate_b_dpop_nonce\s+varchar/u);
  assert.doesNotMatch(migration, /gate_b_replay_id\s+varchar/u);
  assert.match(migration, /response_handoff_state/u);
  assert.match(migration, /pending/u);
  assert.match(migration, /accepted_in_process/u);
  assert.match(migration, /failed/u);
  assert.doesNotMatch(migration, /socket_flushed/u);
  assert.doesNotMatch(migration, /remote_received/u);
  assert.doesNotMatch(migration, /\bdelivered\b/u);
});

test("schema version 8 atomically links replay authorization and exact receipt lifecycle", async () => {
  const migration = (await readAlpha1Migrations()).at(-1)?.sql ?? "";
  const functionBody = (name: string): string => {
    const start = migration.indexOf(`CREATE FUNCTION source_wire_memory.${name}(`);
    assert.notEqual(start, -1, `${name} must exist`);
    const end = migration.indexOf("\n$$;", start);
    assert.notEqual(end, -1, `${name} must terminate`);
    return migration.slice(start, end);
  };

  const record = functionBody("record_gate_b_memory_authorization");
  assert.match(record, /gate_b_memory_replay_ids/u);
  assert.match(record, /gate_b_memory_authorization_events/u);
  assert.match(
    record,
    /INSERT INTO source_wire_memory\.gate_b_memory_authorization_events[\s\S]+FROM source_wire_memory\.gate_b_memory_replay_ids/u
  );
  assert.match(record, /p_replay_id_digest/u);
  assert.match(record, /p_proof_issued_at/u);

  const issue = functionBody("issue_gate_b_memory_protected_read_receipt");
  assert.match(issue, /lock_gate_b_memory_release/u);
  assert.match(issue, /gate_b_memory_authorization_events/u);
  assert.match(issue, /issue_protected_read_receipt/u);
  assert.match(issue, /p_format_version IS DISTINCT FROM 2/u);

  const consume = functionBody("consume_gate_b_memory_protected_read_receipt");
  const lockIndex = consume.indexOf("lock_gate_b_memory_release");
  const authorizationIndex = consume.indexOf("gate_b_memory_authorization_events");
  const consumeIndex = consume.indexOf("consume_protected_read_receipt");
  assert.equal(lockIndex >= 0, true);
  assert.equal(authorizationIndex > lockIndex, true);
  assert.equal(consumeIndex > authorizationIndex, true);

  const finalize = functionBody("finalize_gate_b_memory_protected_read_handoff");
  assert.match(finalize, /p_outcome/u);
  assert.match(finalize, /accepted_in_process/u);
  assert.match(finalize, /failed/u);
  assert.match(finalize, /p_origin_process_verifier/u);
  assert.match(finalize, /gate_b_authorization_id/u);
  assert.match(finalize, /gate_b_authorization_context_digest/u);
  assert.match(finalize, /consumption_state = 'consumed'/u);
  assert.match(finalize, /release_status = 'release_attempted'/u);
  assert.match(finalize, /response_handoff_state = 'pending'/u);
  assert.match(migration, /recovery_handoff_immutable/u);
  assert.match(
    migration,
    /NEW\.response_handoff_state = 'failed'[\s\S]+NEW\.response_handoff_recorded_at IS NOT NULL/u
  );

  assert.match(migration, /DROP TRIGGER protected_read_receipts_append_only/u);
  assert.match(migration, /CREATE TRIGGER protected_read_receipts_append_only/u);
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION source_wire_memory\.record_gate_b_memory_authorization/u
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION source_wire_memory\.issue_gate_b_memory_protected_read_receipt/u
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION source_wire_memory\.consume_gate_b_memory_protected_read_receipt/u
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION source_wire_memory\.finalize_gate_b_memory_protected_read_handoff/u
  );
});

test("Gate B SQL functions preserve one canonical authorization lock order", async () => {
  const migrations = await readAlpha1Migrations();
  const migration =
    migrations.find(
      (candidate) => candidate.name === GATE_B_DURABLE_AUTH_MIGRATION_NAME
    )?.sql ?? "";
  const functionBody = (name: string): string => {
    const start = migration.indexOf(`CREATE FUNCTION source_wire_memory.${name}(`);
    assert.notEqual(start, -1, `${name} must exist`);
    const end = migration.indexOf("\n$$;", start);
    assert.notEqual(end, -1, `${name} must terminate`);
    return migration.slice(start, end);
  };
  const lockMarkers = [
    "pg_advisory_xact_lock_shared",
    "PERFORM 1\n    FROM source_wire_memory.credentials AS credential",
    "PERFORM 1\n    FROM source_wire_memory.credential_namespace_grants AS credential_namespace",
    "PERFORM 1\n    FROM source_wire_memory.credential_capability_grants AS credential_capability",
    "PERFORM 1\n    FROM source_wire_memory.gate_b_memory_clients AS client",
    "PERFORM 1\n    FROM source_wire_memory.gate_b_memory_sessions AS session",
    "PERFORM 1\n    FROM source_wire_memory.gate_b_memory_grants AS grant_row"
  ];

  for (const functionName of [
    "authorize_gate_b_memory_search",
    "lock_gate_b_memory_release"
  ]) {
    const body = functionBody(functionName);
    let previous = -1;
    for (const marker of lockMarkers) {
      const current = body.indexOf(marker, previous + 1);
      assert.equal(current > previous, true, `${functionName}: ${marker}`);
      previous = current;
    }
  }
  assert.doesNotMatch(migration, /prepare_gate_b_memory_release/u);
});

test("durable preparation issues a format-2 receipt through the Gate B SQL authority", async () => {
  const nowMs = Date.now();
  const observedSql: string[] = [];
  const client = {
    async query(sql: string, values?: readonly unknown[]) {
      observedSql.push(sql);
      if (sql.includes("WITH eligible AS MATERIALIZED")) {
        return { rows: [] };
      }
      if (sql.includes("issue_gate_b_memory_protected_read_receipt")) {
        return { rows: [{ audit_event_id: values?.[34] }] };
      }
      return { rows: [] };
    },
    release() {}
  } as unknown as pg.PoolClient;
  const pool = {
    async connect() {
      return client;
    }
  } as unknown as pg.Pool;
  const credentialId = "10000000-0000-4000-8000-000000000002";
  const actor: AuthenticatedCredential = {
    credentialId,
    credentialClass: "harness",
    status: "active",
    ownerId: "owner_doo_made",
    actorIdentityId: "10000000-0000-4000-8000-000000000001",
    authenticationEpochId: "10000000-0000-4000-8000-000000000004",
    namespaceIds: ["ns_synthetic_memory"],
    capabilities: ["trusted_memory.search"],
    issuedAt: new Date(nowMs - 60_000),
    expiresAt: new Date(nowMs + 300_000),
    actorReference: `credential:${credentialId}`
  };
  const dynamicReleaseContext = {
    ...releaseContext,
    credentialIssuedAt: new Date(nowMs - 60_000).toISOString(),
    credentialExpiresAt: new Date(nowMs + 300_000).toISOString(),
    sessionIssuedAt: new Date(nowMs - 30_000).toISOString(),
    sessionExpiresAt: new Date(nowMs + 240_000).toISOString(),
    proofIssuedAt: new Date(nowMs - 1_000).toISOString()
  } as const;

  const prepared = await prepareTrustedMemorySearch(
    pool,
    actor,
    {
      namespaceId: "ns_synthetic_memory",
      query: "approved launch constraints",
      queryByteCount: 27,
      limit: 3
    },
    randomUUID(),
    {
      processReleaseSecret: Buffer.alloc(32, 7),
      startedAtMs: nowMs,
      gateBReleaseContext: dynamicReleaseContext,
      async beforeProtectedRead() {}
    }
  );

  assert.equal(prepared.receipt.formatVersion, 2);
  assert.equal(
    prepared.receipt.formatVersion === 2
      ? prepared.receipt.authorizationId
      : undefined,
    dynamicReleaseContext.authorizationId
  );
  assert.equal(
    observedSql.some((sql) =>
      sql.includes("issue_gate_b_memory_protected_read_receipt")
    ),
    true
  );
  prepared.clear();
});

test("PostgreSQL authority rejects pools without a bounded checkout deadline", () => {
  for (const connectionTimeoutMillis of [undefined, 0, 2_001]) {
    const pool = {
      options:
        connectionTimeoutMillis === undefined
          ? {}
          : { connectionTimeoutMillis }
    } as unknown as pg.Pool;
    assert.throws(
      () => new PostgresMemoryOnlyAuthorizationAuthority({ pool }),
      /gate_b_pool_checkout_timeout_invalid/u
    );
  }
});

test("PostgreSQL authority derives actor, input, and immutable release context", async () => {
  const calls: Array<{ sql: string; values: readonly unknown[] | undefined }> = [];
  let released = false;
  const client = {
    async query(sql: string, values?: readonly unknown[]) {
      calls.push({ sql, values });
      if (sql.includes("record_gate_b_memory_authorization")) {
        return {
          rows: [
            {
              authorization_id: String(values?.[0]),
              actor_identity_id: "10000000-0000-4000-8000-000000000001",
              authentication_epoch_id: "10000000-0000-4000-8000-000000000004",
              credential_issued_at: new Date(NOW_MS - 60_000),
              credential_expires_at: new Date(NOW_MS + 5 * 60_000),
              session_issued_at: new Date(NOW_MS - 30_000),
              session_expires_at: new Date(NOW_MS + 4 * 60_000),
              authorization_context_digest: String(values?.[1])
            }
          ]
        };
      }
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
    options: { connectionTimeoutMillis: 20 },
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
      "SET LOCAL idle_in_transaction_session_timeout = '5s'",
      calls[4]!.sql,
      calls[5]!.sql,
      "COMMIT"
    ]
  );
  assert.equal(released, true);
  const authorizationCall = calls[4]!;
  assert.match(authorizationCall.sql, /authorize_gate_b_memory_search/u);
  assert.equal(authorizationCall.values?.[5], "7");
  assert.equal(authorizationCall.values?.[6], "3");
  for (const digestIndex of [7, 8, 9, 12, 13]) {
    assert.match(String(authorizationCall.values?.[digestIndex]), /^[0-9a-f]{64}$/u);
  }
  assert.notEqual(authorizationCall.values?.[9], "thumbprint_dpop_synthetic");
  assert.notEqual(authorizationCall.values?.[12], "nonce_gate_b_0001");
  assert.notEqual(authorizationCall.values?.[13], "replay_gate_b_0001");
  const eventCall = calls[5]!;
  assert.match(eventCall.sql, /record_gate_b_memory_authorization/u);
  assert.match(String(eventCall.values?.[0]), /^[0-9a-f-]{36}$/u);
  assert.match(String(eventCall.values?.[1]), /^[0-9a-f]{64}$/u);
  assert.equal(eventCall.values?.[2], "10000000-0000-4000-8000-000000000002");
  assert.equal(eventCall.values?.[16], authorizationCall.values?.[13]);
  assert.equal(
    (eventCall.values?.[17] as Date | undefined)?.toISOString(),
    new Date(NOW_MS - 1_000).toISOString()
  );
  assert.equal(decision.actor.ownerId, "owner_doo_made");
  assert.equal(decision.actor.actorReference, "credential:10000000-0000-4000-8000-000000000002");
  assert.deepEqual(decision.input, {
    namespaceId: "ns_synthetic_memory",
    query: "approved launch constraints",
    queryByteCount: 27,
    limit: 3
  });
  assert.deepEqual(decision.releaseContext, {
    authorizationId: String(eventCall.values?.[0]),
    authorizationContextDigest: String(eventCall.values?.[1]),
    credentialId: "10000000-0000-4000-8000-000000000002",
    ownerId: "owner_doo_made",
    actorIdentityId: "10000000-0000-4000-8000-000000000001",
    authenticationEpochId: "10000000-0000-4000-8000-000000000004",
    principalId: "principal_daniel",
    adapterId: "adapter_hermes_synthetic",
    clientId: "client_hermes_synthetic",
    sessionId: "session_gate_b_synthetic",
    credentialAudience: "source_wire_memory",
    namespaceId: "ns_synthetic_memory",
    capability: "trusted_memory.search",
    authorizationEpoch: "7",
    deletionEpoch: "3",
    credentialIssuedAt: new Date(NOW_MS - 60_000).toISOString(),
    credentialExpiresAt: new Date(NOW_MS + 5 * 60_000).toISOString(),
    sessionIssuedAt: new Date(NOW_MS - 30_000).toISOString(),
    sessionExpiresAt: new Date(NOW_MS + 4 * 60_000).toISOString(),
    credentialStatus: "active",
    clientState: "active",
    sessionState: "active",
    grantState: "active",
    destinationDigest,
    audienceChainDigest,
    senderBindingKind: "dpop",
    senderThumbprintDigest,
    nonceDigest,
    replayIdDigest: authorizationCall.values?.[13],
    proofIssuedAt: new Date(NOW_MS - 1_000).toISOString(),
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
    options: { connectionTimeoutMillis: 20 },
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
  assert.deepEqual(statements.slice(0, 4), [
    "BEGIN",
    "SET LOCAL lock_timeout = '2s'",
    "SET LOCAL statement_timeout = '2s'",
    "SET LOCAL idle_in_transaction_session_timeout = '5s'"
  ]);
  assert.match(statements[4] ?? "", /authorize_gate_b_memory_search/u);
  assert.equal(statements.at(-1), "ROLLBACK");
  assert.equal(released, true);
});

test("PostgreSQL authority bounds pool acquisition and releases late clients", async () => {
  let resolveClient!: (client: pg.PoolClient) => void;
  const connectPromise = new Promise<pg.PoolClient>((resolve) => {
    resolveClient = resolve;
  });
  const pool = {
    options: { connectionTimeoutMillis: 20 },
    connect() {
      return connectPromise;
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({
    pool,
    operationTimeoutMs: 20
  });
  const request = {
    namespaceId: "ns_synthetic_memory",
    query: "approved launch constraints",
    limit: 3
  };

  await assert.rejects(
    authority.authorizeSearch({ transport, request }),
    (error: unknown) =>
      error instanceof Error && error.message === "operation_unavailable"
  );
  await assert.rejects(
    authority.consumeAuthorizedRelease(
      releaseContext,
      syntheticReceipt(),
      Buffer.alloc(32, 7)
    ),
    (error: unknown) =>
      error instanceof Error && error.message === "operation_unavailable"
  );

  let released = false;
  resolveClient({
    release() {
      released = true;
    }
  } as unknown as pg.PoolClient);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(released, true);
});

test("PostgreSQL authority bounds transaction queries and destroys uncertain clients", async () => {
  let releasedWith: Error | undefined;
  const client = {
    query() {
      return new Promise<never>(() => undefined);
    },
    release(error?: Error) {
      releasedWith = error;
    }
  } as unknown as pg.PoolClient;
  const pool = {
    options: { connectionTimeoutMillis: 20 },
    async connect() {
      return client;
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({
    pool,
    operationTimeoutMs: 20
  });

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
  assert.match(releasedWith?.message ?? "", /gate_b_database_query_timeout/u);
});

test("PostgreSQL authority rejects proof-to-transport substitution before database access", async () => {
  let queryCount = 0;
  const pool = {
    options: { connectionTimeoutMillis: 20 },
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

test("PostgreSQL authority rejects null, undefined, and omitted route bindings before replay access", async () => {
  let connectCount = 0;
  const pool = {
    options: { connectionTimeoutMillis: 20 },
    async connect() {
      connectCount += 1;
      throw new Error("database_must_not_be_reached");
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });
  type MutableRouteTransport = {
    requestMethod?: unknown;
    requestUri?: unknown;
    senderProof: { method?: unknown; uri?: unknown };
  };
  const malformedRoutes: Array<
    [string, (candidate: MutableRouteTransport) => void]
  > = [
    ["null method", (candidate) => {
      candidate.requestMethod = null;
      candidate.senderProof.method = null;
    }],
    ["undefined method", (candidate) => {
      candidate.requestMethod = undefined;
      candidate.senderProof.method = undefined;
    }],
    ["omitted method", (candidate) => {
      delete candidate.requestMethod;
      delete candidate.senderProof.method;
    }],
    ["null URI", (candidate) => {
      candidate.requestUri = null;
      candidate.senderProof.uri = null;
    }],
    ["undefined URI", (candidate) => {
      candidate.requestUri = undefined;
      candidate.senderProof.uri = undefined;
    }],
    ["omitted URI", (candidate) => {
      delete candidate.requestUri;
      delete candidate.senderProof.uri;
    }]
  ];

  for (const [label, mutate] of malformedRoutes) {
    const candidate = structuredClone(transport) as unknown as MutableRouteTransport;
    mutate(candidate);
    await assert.rejects(
      authority.authorizeSearch({
        transport: candidate as unknown as DurableMemoryOnlyTransportContext,
        request: {
          namespaceId: "ns_synthetic_memory",
          query: "approved launch constraints",
          limit: 3
        }
      }),
      (error: unknown) =>
        error instanceof Error && error.message === "credential_invalid",
      label
    );
  }
  assert.equal(connectCount, 0);
});

test("PostgreSQL authority rejects unsafe bigint inputs before database access", async () => {
  let queryCount = 0;
  const pool = {
    options: { connectionTimeoutMillis: 20 },
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

test("PostgreSQL authority fences retrieval on the caller transaction", async () => {
  const statements: string[] = [];
  let poolCheckoutCount = 0;
  const client = {
    async query(sql: string) {
      statements.push(sql);
      return { rows: [{ authorized: true }] };
    }
  } as unknown as pg.PoolClient;
  const pool = {
    options: { connectionTimeoutMillis: 20 },
    async connect() {
      poolCheckoutCount += 1;
      throw new Error("unexpected_pool_checkout");
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });

  await authority.lockAuthorizedRetrieval(releaseContext, client);

  assert.equal(poolCheckoutCount, 0);
  assert.equal(statements.length, 1);
  assert.match(statements[0]!, /lock_gate_b_memory_release/u);
});

test("PostgreSQL authority denies retrieval when the transaction fence is stale", async () => {
  const client = {
    async query() {
      return { rows: [{ authorized: false }] };
    }
  } as unknown as pg.PoolClient;
  const pool = {
    options: { connectionTimeoutMillis: 20 }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });

  await assert.rejects(
    authority.lockAuthorizedRetrieval(releaseContext, client),
    (error: unknown) =>
      error instanceof Error && error.message === "credential_invalid"
  );
});

test("PostgreSQL authority locks authorization and consumes receipt atomically", async () => {
  const statements: string[] = [];
  const client = {
    async query(sql: string) {
      statements.push(sql);
      if (sql.includes("consume_gate_b_memory_protected_read_receipt")) {
        return { rows: [{ consumed: true }] };
      }
      return { rows: [] };
    },
    release() {
      statements.push("RELEASE_CLIENT");
    }
  };
  const pool = {
    options: { connectionTimeoutMillis: 20 },
    async connect() {
      return client;
    }
  } as unknown as pg.Pool;
  const authority = new PostgresMemoryOnlyAuthorizationAuthority({ pool });
  const credentialId = "10000000-0000-4000-8000-000000000002";
  const receipt = syntheticReceipt();

  const consumed = await authority.consumeAuthorizedRelease(
    releaseContext,
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
      "SET",
      "SELECT",
      "COMMIT",
      "RELEASE_CLIENT"
    ]
  );
  assert.match(statements[4]!, /consume_gate_b_memory_protected_read_receipt/u);
  assert.doesNotMatch(statements[4]!, /SELECT source_wire_memory\.lock_gate_b_memory_release/u);
});

test("stalled release-fence cleanup is bounded and discards the pool client", async () => {
  const statements: string[] = [];
  let released = false;
  let discardError: Error | undefined;
  const client = {
    query(sql: string) {
      statements.push(sql);
      if (sql === "ROLLBACK") {
        return new Promise<never>(() => undefined);
      }
      return Promise.resolve({ rows: [] });
    },
    release(error?: Error) {
      released = true;
      discardError = error;
    }
  } as unknown as pg.PoolClient;
  const pool = {
    async connect() {
      return client;
    }
  } as unknown as pg.Pool;
  const credentialId = randomUUID();
  const actor: AuthenticatedCredential = {
    credentialId,
    credentialClass: "harness",
    status: "active",
    ownerId: "owner_synthetic",
    actorIdentityId: "actor_synthetic",
    authenticationEpochId: randomUUID(),
    namespaceIds: ["ns_synthetic_memory"],
    capabilities: ["trusted_memory.search"],
    issuedAt: new Date(NOW_MS - 1_000),
    expiresAt: new Date(NOW_MS + 60_000),
    actorReference: `credential:${credentialId}`
  };
  const startedAt = Date.now();

  await assert.rejects(
    prepareTrustedMemorySearch(
      pool,
      actor,
      {
        namespaceId: "ns_synthetic_memory",
        query: "approved launch constraints",
        queryByteCount: 27,
        limit: 3
      },
      randomUUID(),
      {
        processReleaseSecret: randomBytes(32),
        startedAtMs: startedAt,
        async beforeProtectedRead() {
          throw new Error("release_fence_timeout");
        }
      }
    ),
    (error: unknown) =>
      error instanceof Error && error.message === "release_fence_timeout"
  );

  assert.ok(Date.now() - startedAt < 1_000);
  assert.equal(released, true);
  assert.ok(discardError instanceof Error);
  assert.equal(discardError.message, "trusted_memory_transaction_cleanup_timeout");
  assert.deepEqual(statements, [
    "BEGIN",
    "SET LOCAL lock_timeout = '2s'",
    "SET LOCAL statement_timeout = '2s'",
    "SET LOCAL idle_in_transaction_session_timeout = '5s'",
    "ROLLBACK"
  ]);
});
