import type pg from "pg";

import {
  ALPHA1_SCHEMA_VERSION,
  PORTABLE_EXPORT_TIMEOUT_MS,
  assertSourceWireIdentifier
} from "./config.js";
import { SafeError } from "./errors.js";
import {
  encodePortableBundle,
  emptyPortableSections,
  type EncodedPortableBundle,
  type PortableJson,
  type PortableRecord
} from "./portable-format.js";
import type { AuthenticatedCredential } from "./repository.js";
import { validatePortableState } from "./portable-validation.js";

const MUTATION_AUDIT_OPERATIONS = [
  "propose_memory_candidate",
  "decide_memory_candidate",
  "correct_trusted_memory",
  "revoke_trusted_memory",
  "initialize_from_export",
  "physical_recovery"
] as const;

export type PortableExportRequest = {
  namespaceIds: string[];
};

export function parsePortableExportRequest(
  value: Record<string, unknown>
): PortableExportRequest {
  const keys = Object.keys(value);
  if (
    keys.length !== 1 ||
    keys[0] !== "namespaceIds" ||
    !Array.isArray(value.namespaceIds) ||
    value.namespaceIds.length < 1 ||
    value.namespaceIds.length > 64
  ) {
    throw new SafeError("validation_failed", 400);
  }
  let namespaceIds: string[];
  try {
    namespaceIds = value.namespaceIds.map((item) =>
      assertSourceWireIdentifier(item, "namespaceId")
    );
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  if (new Set(namespaceIds).size !== namespaceIds.length) {
    throw new SafeError("validation_failed", 400);
  }
  namespaceIds.sort(compareUtf8);
  return { namespaceIds };
}

export async function exportPortableState(
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  request: PortableExportRequest
): Promise<EncodedPortableBundle> {
  requireExportAuthority(actor, request.namespaceIds);
  const startedAt = Date.now();
  const client = await pool.connect();

  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query(
      `SELECT pg_catalog.pg_advisory_xact_lock_shared(
         pg_catalog.hashtextextended(
           'source_wire_story4_authentication_epoch',
           1913770104
         )
       )`
    );
    await client.query(
      `SELECT pg_catalog.pg_advisory_xact_lock_shared(
         pg_catalog.hashtextextended($1, 1913770104)
       )`,
      [`source_wire_story4_credential:${actor.credentialId}`]
    );
    await assertCurrentExportAuthority(
      client,
      actor,
      request.namespaceIds
    );
    const cutoff = await client.query<{ snapshot_cutoff: Date }>(
      "SELECT transaction_timestamp() AS snapshot_cutoff"
    );
    const snapshotCutoff = toIso(cutoff.rows[0]?.snapshot_cutoff);
    const sections = emptyPortableSections();
    sections.owners.push({ ownerId: actor.ownerId });

    const namespaces = await queryRows<{
      namespace_id: string;
      owner_id: string;
      created_at: Date;
    }>(
      client,
      `SELECT namespace_id, owner_id, created_at
         FROM source_wire_memory.namespaces
        WHERE owner_id = $1
          AND namespace_id = ANY($2::varchar[])
        ORDER BY namespace_id`,
      [actor.ownerId, request.namespaceIds],
      startedAt
    );
    sections.namespaces.push(
      ...namespaces.map((row) => ({
        namespaceId: row.namespace_id,
        ownerId: row.owner_id,
        createdAt: toIso(row.created_at)
      }))
    );

    const candidates = await queryRows<{
      candidate_id: string;
      owner_id: string;
      namespace_id: string;
      proposed_by_actor_id: string;
      state: string;
      content: string;
      content_byte_count: number;
      created_at: Date;
      updated_at: Date;
      decided_at: Date | null;
      decided_by_actor_id: string | null;
    }>(
      client,
      `SELECT
         candidate_id,
         owner_id,
         namespace_id,
         proposed_by_actor_id,
         state,
         content,
         content_byte_count,
         created_at,
         updated_at,
         decided_at,
         decided_by_actor_id
       FROM source_wire_memory.memory_candidates
       WHERE owner_id = $1
         AND namespace_id = ANY($2::varchar[])
       ORDER BY candidate_id`,
      [actor.ownerId, request.namespaceIds],
      startedAt
    );
    sections.candidates.push(
      ...candidates.map((row) => ({
        candidateId: row.candidate_id,
        ownerId: row.owner_id,
        namespaceId: row.namespace_id,
        proposedByActorId: row.proposed_by_actor_id,
        state: row.state,
        content: row.content,
        contentByteCount: row.content_byte_count,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        decidedAt: row.decided_at ? toIso(row.decided_at) : null,
        decidedByActorId: row.decided_by_actor_id
      }))
    );

    const candidateProvenance = await queryRows<{
      candidate_id: string;
      owner_id: string;
      namespace_id: string;
      provenance_kind: string;
      owner_assertion: string | null;
      prior_memory_id: string | null;
      prior_revision_id: string | null;
      created_at: Date;
    }>(
      client,
      `SELECT
         candidate_id,
         owner_id,
         namespace_id,
         provenance_kind,
         owner_assertion,
         prior_memory_id,
         prior_revision_id,
         created_at
       FROM source_wire_memory.candidate_provenance
       WHERE owner_id = $1
         AND namespace_id = ANY($2::varchar[])
       ORDER BY candidate_id`,
      [actor.ownerId, request.namespaceIds],
      startedAt
    );
    sections.candidateProvenance.push(
      ...candidateProvenance.map((row) => ({
        candidateId: row.candidate_id,
        ownerId: row.owner_id,
        namespaceId: row.namespace_id,
        provenanceKind: row.provenance_kind,
        ownerAssertion: row.owner_assertion,
        priorMemoryId: row.prior_memory_id,
        priorRevisionId: row.prior_revision_id,
        createdAt: toIso(row.created_at)
      }))
    );

    const decisions = await queryRows<{
      candidate_id: string;
      owner_id: string;
      namespace_id: string;
      decision: string;
      expected_state: string;
      reason: string;
      decided_by_actor_id: string;
      trusted_memory_id: string | null;
      trusted_revision_id: string | null;
      decided_at: Date;
    }>(
      client,
      `SELECT
         candidate_id,
         owner_id,
         namespace_id,
         decision,
         expected_state,
         reason,
         decided_by_actor_id,
         trusted_memory_id,
         trusted_revision_id,
         decided_at
       FROM source_wire_memory.candidate_decisions
       WHERE owner_id = $1
         AND namespace_id = ANY($2::varchar[])
       ORDER BY candidate_id`,
      [actor.ownerId, request.namespaceIds],
      startedAt
    );
    sections.candidateDecisions.push(
      ...decisions.map((row) => ({
        candidateId: row.candidate_id,
        ownerId: row.owner_id,
        namespaceId: row.namespace_id,
        decision: row.decision,
        expectedState: row.expected_state,
        reason: row.reason,
        decidedByActorId: row.decided_by_actor_id,
        trustedMemoryId: row.trusted_memory_id,
        trustedRevisionId: row.trusted_revision_id,
        decidedAt: toIso(row.decided_at)
      }))
    );

    const memories = await queryRows<{
      memory_id: string;
      owner_id: string;
      namespace_id: string;
      origin_candidate_id: string;
      state: string;
      created_at: Date;
    }>(
      client,
      `SELECT
         memory_id,
         owner_id,
         namespace_id,
         origin_candidate_id,
         state,
         created_at
       FROM source_wire_memory.trusted_memories
       WHERE owner_id = $1
         AND namespace_id = ANY($2::varchar[])
       ORDER BY memory_id`,
      [actor.ownerId, request.namespaceIds],
      startedAt
    );
    sections.memories.push(
      ...memories.map((row) => ({
        memoryId: row.memory_id,
        ownerId: row.owner_id,
        namespaceId: row.namespace_id,
        originCandidateId: row.origin_candidate_id,
        state: row.state,
        createdAt: toIso(row.created_at)
      }))
    );

    const revisions = await queryRows<{
      revision_id: string;
      memory_id: string;
      owner_id: string;
      namespace_id: string;
      revision_number: number;
      status: string;
      content: string;
      content_byte_count: number;
      origin_candidate_id: string;
      created_by_actor_id: string;
      created_at: Date;
    }>(
      client,
      `SELECT
         revision_id,
         memory_id,
         owner_id,
         namespace_id,
         revision_number,
         status,
         content,
         content_byte_count,
         origin_candidate_id,
         created_by_actor_id,
         created_at
       FROM source_wire_memory.trusted_memory_revisions
       WHERE owner_id = $1
         AND namespace_id = ANY($2::varchar[])
       ORDER BY revision_id`,
      [actor.ownerId, request.namespaceIds],
      startedAt
    );
    sections.revisions.push(
      ...revisions.map((row) => ({
        revisionId: row.revision_id,
        memoryId: row.memory_id,
        ownerId: row.owner_id,
        namespaceId: row.namespace_id,
        revisionNumber: row.revision_number,
        status: row.status,
        content: row.content,
        contentByteCount: row.content_byte_count,
        originCandidateId: row.origin_candidate_id,
        createdByActorId: row.created_by_actor_id,
        createdAt: toIso(row.created_at)
      }))
    );

    const trustedProvenance = await queryRows<{
      provenance_id: string;
      provenance_key: string;
      revision_id: string;
      memory_id: string;
      owner_id: string;
      namespace_id: string;
      origin_candidate_id: string;
      provenance_kind: string;
      owner_assertion: string | null;
      prior_memory_id: string | null;
      prior_revision_id: string | null;
      created_at: Date;
    }>(
      client,
      `SELECT
         provenance_id,
         provenance_key,
         revision_id,
         memory_id,
         owner_id,
         namespace_id,
         origin_candidate_id,
         provenance_kind,
         owner_assertion,
         prior_memory_id,
         prior_revision_id,
         created_at
       FROM source_wire_memory.trusted_memory_provenance
       WHERE owner_id = $1
         AND namespace_id = ANY($2::varchar[])
       ORDER BY provenance_id`,
      [actor.ownerId, request.namespaceIds],
      startedAt
    );
    sections.trustedProvenance.push(
      ...trustedProvenance.map((row) => ({
        provenanceId: row.provenance_id,
        provenanceKey: row.provenance_key,
        revisionId: row.revision_id,
        memoryId: row.memory_id,
        ownerId: row.owner_id,
        namespaceId: row.namespace_id,
        originCandidateId: row.origin_candidate_id,
        provenanceKind: row.provenance_kind,
        ownerAssertion: row.owner_assertion,
        priorMemoryId: row.prior_memory_id,
        priorRevisionId: row.prior_revision_id,
        createdAt: toIso(row.created_at)
      }))
    );

    const lifecycle = await queryRows<{
      lifecycle_event_id: string;
      owner_id: string;
      namespace_id: string;
      memory_id: string;
      event_type: string;
      expected_revision_id: string;
      resulting_revision_id: string;
      reason: string;
      actor_identity_id: string;
      occurred_at: Date;
    }>(
      client,
      `SELECT
         lifecycle_event_id,
         owner_id,
         namespace_id,
         memory_id,
         event_type,
         expected_revision_id,
         resulting_revision_id,
         reason,
         actor_identity_id,
         occurred_at
       FROM source_wire_memory.trusted_memory_lifecycle_events
       WHERE owner_id = $1
         AND namespace_id = ANY($2::varchar[])
       ORDER BY lifecycle_event_id`,
      [actor.ownerId, request.namespaceIds],
      startedAt
    );
    sections.lifecycleEvents.push(
      ...lifecycle.map((row) => ({
        lifecycleEventId: row.lifecycle_event_id,
        ownerId: row.owner_id,
        namespaceId: row.namespace_id,
        memoryId: row.memory_id,
        eventType: row.event_type,
        expectedRevisionId: row.expected_revision_id,
        resultingRevisionId: row.resulting_revision_id,
        reason: row.reason,
        actorIdentityId: row.actor_identity_id,
        occurredAt: toIso(row.occurred_at)
      }))
    );

    const audits = await queryRows<{
      event_id: string;
      occurred_at: Date;
      trace_id: string;
      operation: string;
      result: string;
      actor_identity_id: string | null;
      owner_id: string;
      namespace_id: string | null;
      denial_code: string | null;
      metadata: unknown;
    }>(
      client,
      `SELECT
         event_id,
         occurred_at,
         trace_id,
         operation,
         result,
         actor_identity_id,
         owner_id,
         namespace_id,
         denial_code,
         metadata
       FROM source_wire_memory.audit_events
       WHERE owner_id = $1
         AND operation = ANY($3::varchar[])
         AND result = 'allowed'
         AND (
           namespace_id = ANY($2::varchar[])
           OR (
             namespace_id IS NULL
             AND operation IN ('initialize_from_export', 'physical_recovery')
           )
         )
       ORDER BY event_id`,
      [actor.ownerId, request.namespaceIds, [...MUTATION_AUDIT_OPERATIONS]],
      startedAt
    );
    sections.mutationAudits.push(
      ...audits.map((row) => ({
        eventId: row.event_id,
        occurredAt: toIso(row.occurred_at),
        traceId: row.trace_id,
        operation: row.operation,
        result: row.result,
        actorIdentityId: row.actor_identity_id,
        ownerId: row.owner_id,
        namespaceId: row.namespace_id,
        denialCode: row.denial_code,
        metadata: asPortableObject(row.metadata)
      }))
    );

    const actorIds = collectActorIds(sections);
    const actors =
      actorIds.length === 0
        ? []
        : await queryRows<{
            actor_identity_id: string;
            owner_id: string;
            actor_class: string;
            created_at: Date;
          }>(
            client,
            `SELECT
               actor_identity_id,
               owner_id,
               actor_class,
               created_at
             FROM source_wire_memory.actor_identities
             WHERE owner_id = $1
               AND actor_identity_id = ANY($2::uuid[])
             ORDER BY actor_identity_id`,
            [actor.ownerId, actorIds],
            startedAt
          );
    if (actors.length !== actorIds.length) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    sections.actors.push(
      ...actors.map((row) => ({
        actorIdentityId: row.actor_identity_id,
        ownerId: row.owner_id,
        actorClass: row.actor_class,
        createdAt: toIso(row.created_at)
      }))
    );

    const createdAt = new Date().toISOString();
    const bundle = encodePortableBundle({
      schemaVersion: ALPHA1_SCHEMA_VERSION,
      createdAt,
      snapshotCutoff,
      namespaceIds: request.namespaceIds,
      sections
    });
    validatePortableState({
      sections,
      manifest: bundle.manifest,
      logicalStateSha256: bundle.logicalStateSha256,
      governedRecordCount: bundle.governedRecordCount
    });
    assertWithinDeadline(startedAt);
    await client.query("COMMIT");
    return bundle;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (error instanceof SafeError) throw error;
    throw new SafeError("operation_unavailable", 503, true);
  } finally {
    client.release();
  }
}

function requireExportAuthority(
  actor: AuthenticatedCredential,
  namespaceIds: string[]
): void {
  if (actor.credentialClass !== "owner_admin" || actor.status !== "active") {
    throw new SafeError("capability_not_allowed", 403);
  }
  if (!actor.capabilities.includes("memory.export")) {
    throw new SafeError("capability_not_allowed", 403);
  }
  const allowed = new Set(actor.namespaceIds);
  if (namespaceIds.some((namespaceId) => !allowed.has(namespaceId))) {
    throw new SafeError("namespace_not_allowed", 403);
  }
}

async function assertCurrentExportAuthority(
  client: pg.PoolClient,
  actor: AuthenticatedCredential,
  namespaceIds: string[]
): Promise<void> {
  const authority = await client.query<{ allowed: boolean }>(
    `SELECT (
       credential.credential_class = 'owner_admin'
       AND credential.status = 'active'
       AND credential.expires_at > clock_timestamp()
       AND credential.authentication_epoch_id =
           installation.current_authentication_epoch_id
       AND EXISTS (
         SELECT 1
           FROM source_wire_memory.credential_capability_grants
          WHERE credential_id = credential.credential_id
            AND capability = 'memory.export'
       )
       AND (
         SELECT count(*)
           FROM source_wire_memory.credential_namespace_grants
          WHERE credential_id = credential.credential_id
            AND namespace_id = ANY($2::varchar[])
       ) = cardinality($2::varchar[])
     ) AS allowed
     FROM source_wire_memory.credentials AS credential
     CROSS JOIN source_wire_memory.installation_state AS installation
     WHERE credential.credential_id = $1
       AND credential.owner_id = $3
       AND installation.singleton = true`,
    [actor.credentialId, namespaceIds, actor.ownerId]
  );
  if (authority.rows[0]?.allowed !== true) {
    throw new SafeError("capability_not_allowed", 403);
  }
}

async function queryRows<Row extends pg.QueryResultRow>(
  client: pg.PoolClient,
  sql: string,
  values: unknown[],
  startedAt: number
): Promise<Row[]> {
  assertWithinDeadline(startedAt);
  const result = await client.query<Row>(sql, values);
  assertWithinDeadline(startedAt);
  return result.rows;
}

function collectActorIds(sections: {
  candidates: PortableRecord[];
  candidateDecisions: PortableRecord[];
  revisions: PortableRecord[];
  lifecycleEvents: PortableRecord[];
  mutationAudits: PortableRecord[];
}): string[] {
  const values = new Set<string>();
  for (const record of sections.candidates) {
    addString(values, record.proposedByActorId);
    addString(values, record.decidedByActorId);
  }
  for (const record of sections.candidateDecisions) {
    addString(values, record.decidedByActorId);
  }
  for (const record of sections.revisions) {
    addString(values, record.createdByActorId);
  }
  for (const record of sections.lifecycleEvents) {
    addString(values, record.actorIdentityId);
  }
  for (const record of sections.mutationAudits) {
    addString(values, record.actorIdentityId);
  }
  return [...values].sort(compareUtf8);
}

function addString(values: Set<string>, value: PortableJson): void {
  if (typeof value === "string") values.add(value);
}

function asPortableObject(value: unknown): Record<string, PortableJson> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return value as Record<string, PortableJson>;
}

function toIso(value: Date | undefined): string {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return value.toISOString();
}

function assertWithinDeadline(startedAt: number): void {
  if (Date.now() - startedAt > PORTABLE_EXPORT_TIMEOUT_MS) {
    throw new SafeError("operation_unavailable", 503, true);
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}
