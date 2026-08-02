import type pg from "pg";

import type { Story1Capability } from "./config.js";
import { SafeError } from "./errors.js";
import type {
  DurableMemoryOnlyAuthorization,
  DurableMemoryOnlyAuthorizationAuthority,
  DurableMemoryOnlyReleaseContext,
  DurableMemoryOnlyTransportContext
} from "./durable-memory-only-runtime.js";
import { canonicalRequestDigest } from "./idempotency.js";
import {
  consumeProtectedReadReceiptWithQueryable,
  parseTrustedMemorySearch,
  type ProtectedReadReceiptBinding
} from "./trusted-memory-search.js";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const PG_BIGINT_MAX = 9_223_372_036_854_775_807n;

export type PostgresMemoryOnlyReleaseContext = Readonly<{
  credentialId: string;
  ownerId: string;
  principalId: string;
  adapterId: string;
  clientId: string;
  sessionId: string;
  credentialAudience: string;
  namespaceId: string;
  authorizationEpoch: string;
  deletionEpoch: string;
  destinationDigest: string;
  audienceChainDigest: string;
  senderThumbprintDigest: string;
  nonceDigest: string;
  requestMethod: string;
  requestUri: string;
}>;

type AuthorizationRow = {
  credential_id: string;
  credential_class: string;
  owner_id: string;
  actor_identity_id: string;
  authentication_epoch_id: string;
  namespace_ids: unknown;
  capabilities: unknown;
  issued_at: Date;
  expires_at: Date;
  session_id: string;
  authorization_epoch: string | number;
  deletion_epoch: string | number;
};

export class PostgresMemoryOnlyAuthorizationAuthority
  implements DurableMemoryOnlyAuthorizationAuthority
{
  readonly #pool: pg.Pool;

  constructor(options: { pool: pg.Pool }) {
    this.#pool = options.pool;
  }

  async authorizeSearch(input: {
    transport: DurableMemoryOnlyTransportContext;
    request: unknown;
  }): Promise<DurableMemoryOnlyAuthorization> {
    const request = parseTrustedMemorySearch(input.request);
    const { transport } = input;
    if (
      transport.senderProof.kind !== "dpop" ||
      transport.senderProof.method !== transport.requestMethod ||
      transport.senderProof.uri !== transport.requestUri
    ) {
      throw new SafeError("credential_invalid", 401);
    }
    if (
      !isCanonicalPgBigint(transport.authorizationEpoch) ||
      !isCanonicalPgBigint(transport.deletionEpoch) ||
      !Number.isSafeInteger(transport.senderProof.issuedAtMs) ||
      transport.senderProof.issuedAtMs < 0
    ) {
      throw new SafeError("credential_invalid", 401);
    }
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
      thumbprint: transport.senderProof.keyThumbprint
    });
    const nonceDigest = canonicalRequestDigest({
      domain: "source-wire.gate-b.dpop-nonce.v1",
      nonce: transport.senderProof.nonce
    });
    const replayIdDigest = canonicalRequestDigest({
      domain: "source-wire.gate-b.dpop-replay-id.v1",
      replayId: transport.senderProof.replayId
    });
    const client = await this.#pool.connect().catch(() => {
      throw new SafeError("operation_unavailable", 503, true);
    });
    let result: pg.QueryResult<AuthorizationRow>;
    let committed = false;
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '2s'");
      await client.query("SET LOCAL statement_timeout = '2s'");
      result = await client.query<AuthorizationRow>(
        `SELECT *
         FROM source_wire_memory.authorize_gate_b_memory_search(
           $1::varchar,
           $2::varchar,
           $3::varchar,
           $4::varchar,
           $5::varchar,
           $6::bigint,
           $7::bigint,
           $8::varchar(64),
           $9::varchar(64),
           $10::varchar,
           $11::varchar,
           $12::varchar,
           $13::varchar,
           $14::varchar,
           $15::bigint,
           $16::varchar
         )`,
        [
          transport.principalId,
          transport.adapterId,
          transport.clientId,
          transport.sessionId,
          transport.credentialAudience,
          transport.authorizationEpoch,
          transport.deletionEpoch,
          destinationDigest,
          audienceChainDigest,
          senderThumbprintDigest,
          transport.senderProof.method,
          transport.senderProof.uri,
          nonceDigest,
          replayIdDigest,
          transport.senderProof.issuedAtMs,
          request.namespaceId
        ]
      );
      await client.query("COMMIT");
      committed = true;
    } catch {
      if (!committed) {
        await client.query("ROLLBACK").catch(() => undefined);
      }
      throw new SafeError("operation_unavailable", 503, true);
    } finally {
      client.release();
    }
    const row = result.rows[0];
    if (!row || result.rows.length !== 1) {
      throw new SafeError("credential_invalid", 401);
    }
    return authorizationFromRow(row, transport, request);
  }

  async consumeAuthorizedRelease(
    context: DurableMemoryOnlyReleaseContext,
    receipt: ProtectedReadReceiptBinding,
    processReleaseSecret: Buffer
  ): Promise<boolean> {
    const release = parseReleaseContext(context);
    if (
      processReleaseSecret.length !== 32 ||
      receipt.actorCredentialId !== release.credentialId ||
      receipt.actorReference !== `credential:${release.credentialId}` ||
      receipt.ownerId !== release.ownerId ||
      receipt.namespaceId !== release.namespaceId ||
      receipt.operation !== "search_trusted_memory" ||
      receipt.policyDecision !== "allowed"
    ) {
      throw new SafeError("release_binding_invalid", 503, true);
    }
    const client = await this.#pool.connect().catch(() => {
      throw new SafeError("operation_unavailable", 503, true);
    });
    let committed = false;
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '2s'");
      await client.query("SET LOCAL statement_timeout = '2s'");
      const prepared = await client.query<{ prepared: boolean }>(
        `SELECT source_wire_memory.prepare_gate_b_memory_release(
           $1::uuid,
           $2::uuid,
           $3::varchar,
           $4::varchar,
           $5::varchar,
           $6::smallint
         ) AS prepared`,
        [
          receipt.receiptId,
          receipt.actorCredentialId,
          receipt.ownerId,
          receipt.namespaceId,
          receipt.targetOrderDigest,
          receipt.coveredResultCount
        ]
      );
      if (prepared.rows[0]?.prepared !== true) {
        await client.query("ROLLBACK");
        return false;
      }
      const authorization = await client.query<{ authorized: boolean }>(
        `SELECT source_wire_memory.lock_gate_b_memory_release(
           $1::uuid,
           $2::varchar,
           $3::varchar,
           $4::varchar,
           $5::varchar,
           $6::varchar,
           $7::varchar,
           $8::bigint,
           $9::bigint,
           $10::varchar,
           $11::varchar,
           $12::varchar,
           $13::varchar,
           $14::varchar,
           $15::varchar,
           $16::varchar
         ) AS authorized`,
        [
          release.credentialId,
          release.ownerId,
          release.principalId,
          release.adapterId,
          release.clientId,
          release.sessionId,
          release.credentialAudience,
          release.authorizationEpoch,
          release.deletionEpoch,
          release.namespaceId,
          release.destinationDigest,
          release.audienceChainDigest,
          release.senderThumbprintDigest,
          release.nonceDigest,
          release.requestMethod,
          release.requestUri
        ]
      );
      if (authorization.rows[0]?.authorized !== true) {
        await client.query("ROLLBACK");
        return false;
      }
      const consumed = await consumeProtectedReadReceiptWithQueryable(
        client,
        processReleaseSecret,
        receipt
      );
      await client.query("COMMIT");
      committed = true;
      return consumed;
    } catch (error) {
      if (!committed) {
        await client.query("ROLLBACK").catch(() => undefined);
      }
      if (error instanceof SafeError) {
        throw error;
      }
      throw new SafeError("operation_unavailable", 503, true);
    } finally {
      client.release();
    }
  }
}

function authorizationFromRow(
  row: AuthorizationRow,
  transport: DurableMemoryOnlyTransportContext,
  input: ReturnType<typeof parseTrustedMemorySearch>
): DurableMemoryOnlyAuthorization {
  if (
    !UUID.test(row.credential_id) ||
    !UUID.test(row.actor_identity_id) ||
    !UUID.test(row.authentication_epoch_id) ||
    (row.credential_class !== "owner_admin" &&
      row.credential_class !== "harness") ||
    !(row.issued_at instanceof Date) ||
    !Number.isFinite(row.issued_at.getTime()) ||
    !(row.expires_at instanceof Date) ||
    !Number.isFinite(row.expires_at.getTime()) ||
    !Array.isArray(row.namespace_ids) ||
    !row.namespace_ids.every((value) => typeof value === "string") ||
    !Array.isArray(row.capabilities) ||
    !row.capabilities.every((value) => typeof value === "string") ||
    !row.namespace_ids.includes(input.namespaceId) ||
    !row.capabilities.includes("trusted_memory.search") ||
    row.session_id !== transport.sessionId
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  if (transport.senderProof.kind !== "dpop") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const authorizationEpoch = parseEpoch(row.authorization_epoch);
  const deletionEpoch = parseEpoch(row.deletion_epoch);
  if (
    authorizationEpoch !== transport.authorizationEpoch ||
    deletionEpoch !== transport.deletionEpoch
  ) {
    throw new SafeError("credential_invalid", 401);
  }

  const releaseContext: PostgresMemoryOnlyReleaseContext = Object.freeze({
    credentialId: row.credential_id,
    ownerId: row.owner_id,
    principalId: transport.principalId,
    adapterId: transport.adapterId,
    clientId: transport.clientId,
    sessionId: row.session_id,
    credentialAudience: transport.credentialAudience,
    namespaceId: input.namespaceId,
    authorizationEpoch,
    deletionEpoch,
    destinationDigest: canonicalRequestDigest({
      domain: "source-wire.gate-b.destination.v1",
      destination: transport.destination
    }),
    audienceChainDigest: canonicalRequestDigest({
      domain: "source-wire.gate-b.audience-chain.v1",
      audienceChain: transport.audienceChain
    }),
    senderThumbprintDigest: canonicalRequestDigest({
      domain: "source-wire.gate-b.sender-thumbprint.v1",
      thumbprint: transport.senderProof.keyThumbprint
    }),
    nonceDigest: canonicalRequestDigest({
      domain: "source-wire.gate-b.dpop-nonce.v1",
      nonce: transport.senderProof.nonce
    }),
    requestMethod: transport.requestMethod,
    requestUri: transport.requestUri
  });
  const namespaceIds = [...row.namespace_ids];
  const capabilities = [...row.capabilities] as Story1Capability[];

  return Object.freeze({
    actor: {
      credentialId: row.credential_id,
      credentialClass: row.credential_class,
      status: "active",
      ownerId: row.owner_id,
      actorIdentityId: row.actor_identity_id,
      authenticationEpochId: row.authentication_epoch_id,
      namespaceIds,
      capabilities,
      issuedAt: new Date(row.issued_at),
      expiresAt: new Date(row.expires_at),
      actorReference: `credential:${row.credential_id}`
    },
    input,
    releaseContext
  });
}

function parseEpoch(value: string | number): string {
  if (
    typeof value === "number" &&
    (!Number.isSafeInteger(value) || value < 0)
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const epoch = String(value);
  if (!isCanonicalPgBigint(epoch)) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return epoch;
}

function isCanonicalPgBigint(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 19 &&
    /^(0|[1-9][0-9]*)$/u.test(value) &&
    BigInt(value) <= PG_BIGINT_MAX
  );
}

function parseReleaseContext(
  context: DurableMemoryOnlyReleaseContext
): PostgresMemoryOnlyReleaseContext {
  const keys = Object.keys(context).sort();
  const expected = [
    "adapterId",
    "audienceChainDigest",
    "authorizationEpoch",
    "clientId",
    "credentialAudience",
    "credentialId",
    "deletionEpoch",
    "destinationDigest",
    "namespaceId",
    "nonceDigest",
    "ownerId",
    "principalId",
    "requestMethod",
    "requestUri",
    "senderThumbprintDigest",
    "sessionId"
  ];
  if (
    keys.length !== expected.length ||
    !keys.every((key, index) => key === expected[index])
  ) {
    throw new SafeError("release_binding_invalid", 503, true);
  }
  const release = context as PostgresMemoryOnlyReleaseContext;
  if (
    !UUID.test(release.credentialId) ||
    !release.ownerId ||
    !release.principalId ||
    !release.adapterId ||
    !release.clientId ||
    !release.sessionId ||
    !release.credentialAudience ||
    !release.namespaceId ||
    !isCanonicalPgBigint(release.authorizationEpoch) ||
    !isCanonicalPgBigint(release.deletionEpoch) ||
    !/^[0-9a-f]{64}$/u.test(release.destinationDigest) ||
    !/^[0-9a-f]{64}$/u.test(release.audienceChainDigest) ||
    !/^[0-9a-f]{64}$/u.test(release.senderThumbprintDigest) ||
    !/^[0-9a-f]{64}$/u.test(release.nonceDigest) ||
    release.requestMethod !== "POST" ||
    release.requestUri !== "/v1alpha1/trusted-memories/search"
  ) {
    throw new SafeError("release_binding_invalid", 503, true);
  }
  return release;
}
