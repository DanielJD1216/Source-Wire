import { randomUUID } from "node:crypto";

import type pg from "pg";

import type { Story1Capability } from "./config.js";
import { SafeError } from "./errors.js";
import type {
  DurableMemoryOnlyAuthorization,
  DurableMemoryOnlyAuthorizationAuthority,
  DurableMemoryOnlyHandoffOutcome,
  DurableMemoryOnlyReleaseContext,
  DurableMemoryOnlyTransportContext
} from "./durable-memory-only-runtime.js";
import { canonicalRequestDigest } from "./idempotency.js";
import {
  computeOriginProcessVerifier,
  parseTrustedMemorySearch,
  type ProtectedReadReceiptBinding
} from "./trusted-memory-search.js";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const PG_BIGINT_MAX = 9_223_372_036_854_775_807n;
const TRUSTED_MEMORY_SEARCH_METHOD = "POST";
const TRUSTED_MEMORY_SEARCH_URI = "/v1alpha1/trusted-memories/search";
export const GATE_B_DATABASE_OPERATION_TIMEOUT_MS = 2_000;

class DatabaseOperationTimeoutError extends Error {
  constructor(stage: string) {
    super(`gate_b_database_${stage}_timeout`);
  }
}

export type PostgresMemoryOnlyReleaseContext = Readonly<{
  authorizationId: string;
  authorizationContextDigest: string;
  credentialId: string;
  ownerId: string;
  actorIdentityId: string;
  authenticationEpochId: string;
  principalId: string;
  adapterId: string;
  clientId: string;
  sessionId: string;
  credentialAudience: string;
  namespaceId: string;
  capability: "trusted_memory.search";
  authorizationEpoch: string;
  deletionEpoch: string;
  credentialIssuedAt: string;
  credentialExpiresAt: string;
  sessionIssuedAt: string;
  sessionExpiresAt: string;
  credentialStatus: "active";
  clientState: "active";
  sessionState: "active";
  grantState: "active";
  destinationDigest: string;
  audienceChainDigest: string;
  senderBindingKind: "dpop";
  senderThumbprintDigest: string;
  nonceDigest: string;
  replayIdDigest: string;
  proofIssuedAt: string;
  requestMethod: string;
  requestUri: string;
}>;

type AuthorizationEventRow = {
  authorization_id: string;
  actor_identity_id: string;
  authentication_epoch_id: string;
  credential_issued_at: Date;
  credential_expires_at: Date;
  session_issued_at: Date;
  session_expires_at: Date;
  authorization_context_digest: string;
};

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

function normalizeDatabaseError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error("gate_b_database_operation_failed");
}

async function acquirePoolClient(
  pool: pg.Pool,
  timeoutMs: number
): Promise<pg.PoolClient> {
  return new Promise<pg.PoolClient>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(new SafeError("operation_unavailable", 503, true));
    }, timeoutMs);

    pool.connect().then(
      (client) => {
        if (settled) {
          client.release();
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(client);
      },
      () => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        reject(new SafeError("operation_unavailable", 503, true));
      }
    );
  });
}

async function boundedQuery<
  Row extends pg.QueryResultRow = pg.QueryResultRow
>(
  client: pg.PoolClient,
  sql: string,
  values: readonly unknown[] | undefined,
  timeoutMs: number
): Promise<pg.QueryResult<Row>> {
  return new Promise<pg.QueryResult<Row>>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(new DatabaseOperationTimeoutError("query"));
    }, timeoutMs);

    client.query<Row>(sql, values as unknown[] | undefined).then(
      (result) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(result);
      },
      (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export class PostgresMemoryOnlyAuthorizationAuthority
  implements DurableMemoryOnlyAuthorizationAuthority
{
  readonly #pool: pg.Pool;
  readonly #operationTimeoutMs: number;

  constructor(options: { pool: pg.Pool; operationTimeoutMs?: number }) {
    this.#pool = options.pool;
    this.#operationTimeoutMs =
      options.operationTimeoutMs ?? GATE_B_DATABASE_OPERATION_TIMEOUT_MS;
    if (
      !Number.isInteger(this.#operationTimeoutMs) ||
      this.#operationTimeoutMs < 1 ||
      this.#operationTimeoutMs > GATE_B_DATABASE_OPERATION_TIMEOUT_MS
    ) {
      throw new Error("gate_b_database_operation_timeout_invalid");
    }
    const poolCheckoutTimeoutMs = options.pool.options?.connectionTimeoutMillis;
    if (
      !Number.isInteger(poolCheckoutTimeoutMs) ||
      (poolCheckoutTimeoutMs ?? 0) < 1 ||
      (poolCheckoutTimeoutMs ?? 0) > this.#operationTimeoutMs
    ) {
      throw new Error("gate_b_pool_checkout_timeout_invalid");
    }
  }

  async authorizeSearch(input: {
    transport: DurableMemoryOnlyTransportContext;
    request: unknown;
  }): Promise<DurableMemoryOnlyAuthorization> {
    const request = parseTrustedMemorySearch(input.request);
    const { transport } = input;
    if (
      transport.senderProof.kind !== "dpop" ||
      transport.requestMethod !== TRUSTED_MEMORY_SEARCH_METHOD ||
      transport.requestUri !== TRUSTED_MEMORY_SEARCH_URI ||
      transport.senderProof.method !== TRUSTED_MEMORY_SEARCH_METHOD ||
      transport.senderProof.uri !== TRUSTED_MEMORY_SEARCH_URI
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
    const client = await acquirePoolClient(
      this.#pool,
      this.#operationTimeoutMs
    );
    let result: pg.QueryResult<AuthorizationRow>;
    let eventResult: pg.QueryResult<AuthorizationEventRow>;
    let authorizationId = "";
    let authorizationContextDigest = "";
    let committed = false;
    let discardError: Error | undefined;
    try {
      await boundedQuery(client, "BEGIN", undefined, this.#operationTimeoutMs);
      await boundedQuery(
        client,
        "SET LOCAL lock_timeout = '2s'",
        undefined,
        this.#operationTimeoutMs
      );
      await boundedQuery(
        client,
        "SET LOCAL statement_timeout = '2s'",
        undefined,
        this.#operationTimeoutMs
      );
      await boundedQuery(
        client,
        "SET LOCAL idle_in_transaction_session_timeout = '5s'",
        undefined,
        this.#operationTimeoutMs
      );
      result = await boundedQuery<AuthorizationRow>(
        client,
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
        ],
        this.#operationTimeoutMs
      );
      const authorizationRow = result.rows[0];
      if (!authorizationRow || result.rows.length !== 1) {
        throw new SafeError("credential_invalid", 401);
      }
      authorizationId = randomUUID();
      authorizationContextDigest = canonicalRequestDigest({
        domain: "source-wire.gate-b.authorization-context.v1",
        authorizationId,
        credentialId: authorizationRow.credential_id,
        ownerId: authorizationRow.owner_id,
        actorIdentityId: authorizationRow.actor_identity_id,
        authenticationEpochId: authorizationRow.authentication_epoch_id,
        principalId: transport.principalId,
        adapterId: transport.adapterId,
        clientId: transport.clientId,
        sessionId: transport.sessionId,
        credentialAudience: transport.credentialAudience,
        namespaceId: request.namespaceId,
        capability: "trusted_memory.search",
        authorizationEpoch: transport.authorizationEpoch,
        deletionEpoch: transport.deletionEpoch,
        destinationDigest,
        audienceChainDigest,
        senderBindingKind: "dpop",
        senderThumbprintDigest,
        nonceDigest,
        replayIdDigest,
        proofIssuedAt: new Date(transport.senderProof.issuedAtMs).toISOString(),
        requestMethod: transport.requestMethod,
        requestUri: transport.requestUri
      });
      eventResult = await boundedQuery<AuthorizationEventRow>(
        client,
        `SELECT *
         FROM source_wire_memory.record_gate_b_memory_authorization(
           $1::uuid,
           $2::varchar,
           $3::uuid,
           $4::varchar,
           $5::varchar,
           $6::varchar,
           $7::varchar,
           $8::varchar,
           $9::varchar,
           $10::bigint,
           $11::bigint,
           $12::varchar,
           $13::varchar,
           $14::varchar,
           $15::varchar,
           $16::varchar,
           $17::varchar,
           $18::timestamptz,
           $19::varchar,
           $20::varchar
         )`,
        [
          authorizationId,
          authorizationContextDigest,
          authorizationRow.credential_id,
          authorizationRow.owner_id,
          transport.principalId,
          transport.adapterId,
          transport.clientId,
          transport.sessionId,
          transport.credentialAudience,
          transport.authorizationEpoch,
          transport.deletionEpoch,
          request.namespaceId,
          destinationDigest,
          audienceChainDigest,
          senderThumbprintDigest,
          nonceDigest,
          replayIdDigest,
          new Date(transport.senderProof.issuedAtMs),
          transport.requestMethod,
          transport.requestUri
        ],
        this.#operationTimeoutMs
      );
      if (eventResult.rows.length !== 1) {
        throw new SafeError("operation_unavailable", 503, true);
      }
      await boundedQuery(
        client,
        "COMMIT",
        undefined,
        this.#operationTimeoutMs
      );
      committed = true;
    } catch (error) {
      discardError = normalizeDatabaseError(error);
      if (!committed) {
        await boundedQuery(
          client,
          "ROLLBACK",
          undefined,
          this.#operationTimeoutMs
        ).catch((rollbackError: unknown) => {
          discardError = normalizeDatabaseError(rollbackError);
        });
      }
      throw new SafeError("operation_unavailable", 503, true);
    } finally {
      client.release(discardError);
    }
    const row = result.rows[0];
    const eventRow = eventResult.rows[0];
    if (!row || result.rows.length !== 1 || !eventRow) {
      throw new SafeError("credential_invalid", 401);
    }
    return authorizationFromRow(
      row,
      eventRow,
      authorizationId,
      authorizationContextDigest,
      replayIdDigest,
      transport,
      request
    );
  }

  async lockAuthorizedRetrieval(
    context: DurableMemoryOnlyReleaseContext,
    client: pg.PoolClient
  ): Promise<void> {
    const release = parseReleaseContext(context);
    try {
      if (
        !(await lockDurableMemoryAuthorization(
          client,
          release,
          this.#operationTimeoutMs
        ))
      ) {
        throw new SafeError("credential_invalid", 401);
      }
    } catch (error) {
      if (error instanceof SafeError) {
        throw error;
      }
      throw new SafeError("operation_unavailable", 503, true);
    }
  }

  async consumeAuthorizedRelease(
    context: DurableMemoryOnlyReleaseContext,
    receipt: ProtectedReadReceiptBinding,
    processReleaseSecret: Buffer
  ): Promise<boolean> {
    const release = parseReleaseContext(context);
    if (
      processReleaseSecret.length !== 32 ||
      receipt.formatVersion !== 2 ||
      receipt.actorCredentialId !== release.credentialId ||
      receipt.actorReference !== `credential:${release.credentialId}` ||
      receipt.ownerId !== release.ownerId ||
      receipt.namespaceId !== release.namespaceId ||
      receipt.operation !== "search_trusted_memory" ||
      receipt.policyDecision !== "allowed"
    ) {
      throw new SafeError("release_binding_invalid", 503, true);
    }
    const receiptReleaseContext = {
      authorizationId: receipt.authorizationId,
      authorizationContextDigest: receipt.authorizationContextDigest,
      credentialId: receipt.actorCredentialId,
      ownerId: receipt.ownerId,
      actorIdentityId: receipt.actorIdentityId,
      authenticationEpochId: receipt.authenticationEpochId,
      principalId: receipt.principalId,
      adapterId: receipt.adapterId,
      clientId: receipt.clientId,
      sessionId: receipt.sessionId,
      credentialAudience: receipt.credentialAudience,
      namespaceId: receipt.namespaceId,
      capability: receipt.capability,
      authorizationEpoch: receipt.authorizationEpoch,
      deletionEpoch: receipt.deletionEpoch,
      credentialIssuedAt: receipt.credentialIssuedAt,
      credentialExpiresAt: receipt.credentialExpiresAt,
      sessionIssuedAt: receipt.sessionIssuedAt,
      sessionExpiresAt: receipt.sessionExpiresAt,
      credentialStatus: receipt.credentialStatus,
      clientState: receipt.clientState,
      sessionState: receipt.sessionState,
      grantState: receipt.grantState,
      destinationDigest: receipt.destinationDigest,
      audienceChainDigest: receipt.audienceChainDigest,
      senderBindingKind: receipt.senderBindingKind,
      senderThumbprintDigest: receipt.senderThumbprintDigest,
      nonceDigest: receipt.nonceDigest,
      replayIdDigest: receipt.replayIdDigest,
      proofIssuedAt: receipt.proofIssuedAt,
      requestMethod: receipt.requestMethod,
      requestUri: receipt.requestUri
    };
    if (
      canonicalRequestDigest({
        domain: "source-wire.gate-b.release-context-equality.v1",
        context: receiptReleaseContext
      }) !==
      canonicalRequestDigest({
        domain: "source-wire.gate-b.release-context-equality.v1",
        context: release
      })
    ) {
      throw new SafeError("release_binding_invalid", 503, true);
    }
    const client = await acquirePoolClient(
      this.#pool,
      this.#operationTimeoutMs
    );
    let committed = false;
    let discardError: Error | undefined;
    try {
      await boundedQuery(client, "BEGIN", undefined, this.#operationTimeoutMs);
      await boundedQuery(
        client,
        "SET LOCAL lock_timeout = '2s'",
        undefined,
        this.#operationTimeoutMs
      );
      await boundedQuery(
        client,
        "SET LOCAL statement_timeout = '2s'",
        undefined,
        this.#operationTimeoutMs
      );
      await boundedQuery(
        client,
        "SET LOCAL idle_in_transaction_session_timeout = '5s'",
        undefined,
        this.#operationTimeoutMs
      );
      const originProcessVerifier = computeOriginProcessVerifier(
        processReleaseSecret,
        receipt
      );
      const consumeResult = await boundedQuery<{ consumed: boolean }>(
        client,
        `SELECT source_wire_memory.consume_gate_b_memory_protected_read_receipt(
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
           $16::varchar,
           $17::uuid,
           $18::varchar,
           $19::uuid,
           $20::smallint,
           $21::uuid,
           $22::uuid,
           $23::varchar,
           $24::varchar,
           $25::varchar,
           $26::varchar,
           $27::varchar,
           $28::varchar,
           $29::varchar,
           $30::integer,
           $31::smallint,
           $32::timestamptz,
           $33::timestamptz,
           $34::varchar
         ) AS consumed`,
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
          release.requestUri,
          release.authorizationId,
          release.authorizationContextDigest,
          receipt.receiptId,
          receipt.formatVersion,
          receipt.traceId,
          receipt.requestId,
          receipt.actorReference,
          receipt.operation,
          receipt.policyDecision,
          receipt.releaseBinding,
          receipt.requestDigest,
          receipt.resultDigest,
          receipt.targetOrderDigest,
          receipt.responseByteCount,
          receipt.coveredResultCount,
          receipt.issuedAt,
          receipt.expiresAt,
          originProcessVerifier
        ],
        this.#operationTimeoutMs
      );
      const consumed = consumeResult.rows[0]?.consumed === true;
      await boundedQuery(
        client,
        "COMMIT",
        undefined,
        this.#operationTimeoutMs
      );
      committed = true;
      return consumed;
    } catch (error) {
      discardError = normalizeDatabaseError(error);
      if (!committed) {
        await boundedQuery(
          client,
          "ROLLBACK",
          undefined,
          this.#operationTimeoutMs
        ).catch((rollbackError: unknown) => {
          discardError = normalizeDatabaseError(rollbackError);
        });
      }
      if (error instanceof SafeError) {
        throw error;
      }
      throw new SafeError("operation_unavailable", 503, true);
    } finally {
      client.release(discardError);
    }
  }

  async finalizeResponseHandoff(
    context: DurableMemoryOnlyReleaseContext,
    receipt: ProtectedReadReceiptBinding,
    processReleaseSecret: Buffer,
    outcome: DurableMemoryOnlyHandoffOutcome
  ): Promise<boolean> {
    const release = parseReleaseContext(context);
    if (
      processReleaseSecret.length !== 32 ||
      receipt.formatVersion !== 2 ||
      receipt.authorizationId !== release.authorizationId ||
      receipt.authorizationContextDigest !== release.authorizationContextDigest
    ) {
      throw new SafeError("release_binding_invalid", 503, true);
    }
    const originProcessVerifier = computeOriginProcessVerifier(
      processReleaseSecret,
      receipt
    );
    const client = await acquirePoolClient(
      this.#pool,
      this.#operationTimeoutMs
    );
    let committed = false;
    let discardError: Error | undefined;
    try {
      await boundedQuery(client, "BEGIN", undefined, this.#operationTimeoutMs);
      await boundedQuery(
        client,
        "SET LOCAL lock_timeout = '2s'",
        undefined,
        this.#operationTimeoutMs
      );
      await boundedQuery(
        client,
        "SET LOCAL statement_timeout = '2s'",
        undefined,
        this.#operationTimeoutMs
      );
      await boundedQuery(
        client,
        "SET LOCAL idle_in_transaction_session_timeout = '5s'",
        undefined,
        this.#operationTimeoutMs
      );
      const result = await boundedQuery<{ finalized: boolean }>(
        client,
        `SELECT source_wire_memory.finalize_gate_b_memory_protected_read_handoff(
           $1::uuid,
           $2::uuid,
           $3::varchar,
           $4::varchar,
           $5::varchar
         ) AS finalized`,
        [
          receipt.receiptId,
          release.authorizationId,
          release.authorizationContextDigest,
          originProcessVerifier,
          outcome
        ],
        this.#operationTimeoutMs
      );
      const finalized = result.rows[0]?.finalized === true;
      await boundedQuery(
        client,
        "COMMIT",
        undefined,
        this.#operationTimeoutMs
      );
      committed = true;
      return finalized;
    } catch (error) {
      discardError = normalizeDatabaseError(error);
      if (!committed) {
        await boundedQuery(
          client,
          "ROLLBACK",
          undefined,
          this.#operationTimeoutMs
        ).catch((rollbackError: unknown) => {
          discardError = normalizeDatabaseError(rollbackError);
        });
      }
      if (error instanceof SafeError) {
        throw error;
      }
      throw new SafeError("operation_unavailable", 503, true);
    } finally {
      client.release(discardError);
    }
  }
}

async function lockDurableMemoryAuthorization(
  client: pg.PoolClient,
  release: PostgresMemoryOnlyReleaseContext,
  timeoutMs: number
): Promise<boolean> {
  const authorization = await boundedQuery<{ authorized: boolean }>(
    client,
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
    ],
    timeoutMs
  );
  return authorization.rows[0]?.authorized === true;
}

function authorizationFromRow(
  row: AuthorizationRow,
  eventRow: AuthorizationEventRow,
  authorizationId: string,
  authorizationContextDigest: string,
  replayIdDigest: string,
  transport: DurableMemoryOnlyTransportContext,
  input: ReturnType<typeof parseTrustedMemorySearch>
): DurableMemoryOnlyAuthorization {
  if (transport.senderProof.kind !== "dpop") {
    throw new SafeError("operation_unavailable", 503, true);
  }
  if (
    !UUID.test(row.credential_id) ||
    !UUID.test(row.actor_identity_id) ||
    !UUID.test(row.authentication_epoch_id) ||
    row.credential_class !== "harness" ||
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
    row.session_id !== transport.sessionId ||
    eventRow.authorization_id !== authorizationId ||
    eventRow.authorization_context_digest !== authorizationContextDigest ||
    eventRow.actor_identity_id !== row.actor_identity_id ||
    eventRow.authentication_epoch_id !== row.authentication_epoch_id ||
    !(eventRow.credential_issued_at instanceof Date) ||
    !Number.isFinite(eventRow.credential_issued_at.getTime()) ||
    eventRow.credential_issued_at.getTime() !== row.issued_at.getTime() ||
    !(eventRow.credential_expires_at instanceof Date) ||
    !Number.isFinite(eventRow.credential_expires_at.getTime()) ||
    eventRow.credential_expires_at.getTime() !== row.expires_at.getTime() ||
    !(eventRow.session_issued_at instanceof Date) ||
    !Number.isFinite(eventRow.session_issued_at.getTime()) ||
    !(eventRow.session_expires_at instanceof Date) ||
    !Number.isFinite(eventRow.session_expires_at.getTime()) ||
    eventRow.session_expires_at <= eventRow.session_issued_at ||
    eventRow.session_expires_at.getTime() <= transport.senderProof.issuedAtMs
  ) {
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
    authorizationId,
    authorizationContextDigest,
    credentialId: row.credential_id,
    ownerId: row.owner_id,
    actorIdentityId: eventRow.actor_identity_id,
    authenticationEpochId: eventRow.authentication_epoch_id,
    principalId: transport.principalId,
    adapterId: transport.adapterId,
    clientId: transport.clientId,
    sessionId: row.session_id,
    credentialAudience: transport.credentialAudience,
    namespaceId: input.namespaceId,
    capability: "trusted_memory.search",
    authorizationEpoch,
    deletionEpoch,
    credentialIssuedAt: eventRow.credential_issued_at.toISOString(),
    credentialExpiresAt: eventRow.credential_expires_at.toISOString(),
    sessionIssuedAt: eventRow.session_issued_at.toISOString(),
    sessionExpiresAt: eventRow.session_expires_at.toISOString(),
    credentialStatus: "active",
    clientState: "active",
    sessionState: "active",
    grantState: "active",
    destinationDigest: canonicalRequestDigest({
      domain: "source-wire.gate-b.destination.v1",
      destination: transport.destination
    }),
    audienceChainDigest: canonicalRequestDigest({
      domain: "source-wire.gate-b.audience-chain.v1",
      audienceChain: transport.audienceChain
    }),
    senderBindingKind: "dpop",
    senderThumbprintDigest: canonicalRequestDigest({
      domain: "source-wire.gate-b.sender-thumbprint.v1",
      thumbprint: transport.senderProof.keyThumbprint
    }),
    nonceDigest: canonicalRequestDigest({
      domain: "source-wire.gate-b.dpop-nonce.v1",
      nonce: transport.senderProof.nonce
    }),
    replayIdDigest,
    proofIssuedAt: new Date(transport.senderProof.issuedAtMs).toISOString(),
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
    "actorIdentityId",
    "adapterId",
    "audienceChainDigest",
    "authenticationEpochId",
    "authorizationContextDigest",
    "authorizationEpoch",
    "authorizationId",
    "capability",
    "clientId",
    "clientState",
    "credentialAudience",
    "credentialExpiresAt",
    "credentialId",
    "credentialIssuedAt",
    "credentialStatus",
    "deletionEpoch",
    "destinationDigest",
    "grantState",
    "namespaceId",
    "nonceDigest",
    "ownerId",
    "principalId",
    "proofIssuedAt",
    "replayIdDigest",
    "requestMethod",
    "requestUri",
    "senderBindingKind",
    "senderThumbprintDigest",
    "sessionExpiresAt",
    "sessionId",
    "sessionIssuedAt",
    "sessionState"
  ].sort();
  if (
    keys.length !== expected.length ||
    !keys.every((key, index) => key === expected[index])
  ) {
    throw new SafeError("release_binding_invalid", 503, true);
  }
  const release = context as PostgresMemoryOnlyReleaseContext;
  const credentialIssuedAt = Date.parse(release.credentialIssuedAt);
  const credentialExpiresAt = Date.parse(release.credentialExpiresAt);
  const sessionIssuedAt = Date.parse(release.sessionIssuedAt);
  const sessionExpiresAt = Date.parse(release.sessionExpiresAt);
  const proofIssuedAt = Date.parse(release.proofIssuedAt);
  // Proof time is sender-clock data. PostgreSQL proves credential/session
  // activity at its own observed decision and receipt times; do not invent a
  // cross-clock lower-bound ordering against server-issued timestamps here.
  const canonicalTimes = [
    [release.credentialIssuedAt, credentialIssuedAt],
    [release.credentialExpiresAt, credentialExpiresAt],
    [release.sessionIssuedAt, sessionIssuedAt],
    [release.sessionExpiresAt, sessionExpiresAt],
    [release.proofIssuedAt, proofIssuedAt]
  ] as const;
  if (
    !UUID.test(release.authorizationId) ||
    !UUID.test(release.credentialId) ||
    !UUID.test(release.actorIdentityId) ||
    !UUID.test(release.authenticationEpochId) ||
    !release.ownerId ||
    !release.principalId ||
    !release.adapterId ||
    !release.clientId ||
    !release.sessionId ||
    !release.credentialAudience ||
    !release.namespaceId ||
    release.capability !== "trusted_memory.search" ||
    !isCanonicalPgBigint(release.authorizationEpoch) ||
    !isCanonicalPgBigint(release.deletionEpoch) ||
    release.credentialStatus !== "active" ||
    release.clientState !== "active" ||
    release.sessionState !== "active" ||
    release.grantState !== "active" ||
    release.senderBindingKind !== "dpop" ||
    ![
      release.authorizationContextDigest,
      release.destinationDigest,
      release.audienceChainDigest,
      release.senderThumbprintDigest,
      release.nonceDigest,
      release.replayIdDigest
    ].every((digest) => /^[0-9a-f]{64}$/u.test(digest)) ||
    canonicalTimes.some(
      ([value, parsed]) =>
        !Number.isFinite(parsed) || new Date(parsed).toISOString() !== value
    ) ||
    credentialExpiresAt <= credentialIssuedAt ||
    sessionExpiresAt <= sessionIssuedAt ||
    release.requestMethod !== "POST" ||
    release.requestUri !== "/v1alpha1/trusted-memories/search"
  ) {
    throw new SafeError("release_binding_invalid", 503, true);
  }
  return release;
}
