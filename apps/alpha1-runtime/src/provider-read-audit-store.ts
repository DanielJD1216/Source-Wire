import type pg from "pg";

import type {
  ProviderReadAuditStore,
  ProviderReadReceiptBinding
} from "./knowledge-provider-host.js";

export class PostgresProviderReadAuditStore
  implements ProviderReadAuditStore
{
  readonly #pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this.#pool = pool;
  }

  async issue(
    receipt: ProviderReadReceiptBinding,
    originProcessVerifier: string
  ): Promise<boolean> {
    const result = await this.#pool.query<{ audit_event_id: string }>(
      `SELECT source_wire_memory.issue_provider_read_receipt(
         $1::uuid,
         $2::smallint,
         $3::uuid,
         $4::uuid,
         $5::varchar,
         $6::uuid,
         $7::uuid,
         $8::varchar,
         $9::varchar,
         $10::varchar,
         $11::varchar,
         $12::varchar,
         $13::varchar,
         $14::varchar,
         $15::varchar,
         $16::varchar,
         $17::varchar,
         $18::integer,
         $19::smallint,
         $20::timestamptz,
         $21::timestamptz,
         $22::uuid,
         $23::varchar,
         $24::uuid
       ) AS audit_event_id`,
      receiptParameters(receipt, originProcessVerifier)
    );
    return result.rows[0]?.audit_event_id === receipt.auditEventId;
  }

  async consume(
    receipt: ProviderReadReceiptBinding,
    originProcessVerifier: string
  ): Promise<boolean> {
    const result = await this.#pool.query<{ consumed: boolean }>(
      `SELECT source_wire_memory.consume_provider_read_receipt(
         $1::uuid,
         $2::smallint,
         $3::uuid,
         $4::uuid,
         $5::varchar,
         $6::uuid,
         $7::uuid,
         $8::varchar,
         $9::varchar,
         $10::varchar,
         $11::varchar,
         $12::varchar,
         $13::varchar,
         $14::varchar,
         $15::varchar,
         $16::varchar,
         $17::varchar,
         $18::integer,
         $19::smallint,
         $20::timestamptz,
         $21::timestamptz,
         $22::uuid,
         $23::varchar,
         $24::uuid
       ) AS consumed`,
      receiptParameters(receipt, originProcessVerifier)
    );
    return result.rows[0]?.consumed === true;
  }
}

function receiptParameters(
  receipt: ProviderReadReceiptBinding,
  originProcessVerifier: string
) {
  return [
    receipt.receiptId,
    receipt.formatVersion,
    receipt.traceId,
    receipt.requestId,
    receipt.actorReference,
    receipt.actorCredentialId,
    receipt.actorIdentityId,
    receipt.ownerId,
    receipt.namespaceId,
    receipt.providerId,
    receipt.providerScopeId,
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
    receipt.originProcessId,
    originProcessVerifier,
    receipt.auditEventId
  ];
}
