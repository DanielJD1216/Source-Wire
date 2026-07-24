# MemoryStore v1 Contract

Use Node.js 22 with npm for local checks. See the [Quickstart](../getting-started/quickstart.md).

## Purpose

`MemoryStore v1` defines Source-Wire's structured memory port and its PostgreSQL posture. The adopter owns and operates PostgreSQL infrastructure. Source-Wire owns the logical memory schema definition, lifecycle invariants, compatibility rules, and future migration lineage.

`sourceWireHostsUserMemory: false` means Source-Wire does not provide managed storage or operate adopter data. It does not remove Source-Wire's authority over its logical schema contract.

## Identity

- Contract ID: `source-wire.memory-store`
- Contract version: `memory-store.v1`
- Backend: PostgreSQL only
- Default dedicated schema: `source_wire_memory`

Arbitrary table mapping and additional backends are not supported in v1.

## Operations

Allowed operations are:

- `describe`
- `health`
- `search_trusted_memory`
- `get_trusted_memory`
- `list_candidates`
- `append_read_audit`
- `create_candidate`
- `decide_candidate`
- `revoke_trusted_memory`

Generic SQL, DDL, migration application, provisioning, backup administration, and arbitrary table mapping are not operations.

## Schema And Compatibility Posture

The profile separates:

- `infrastructureOwner: adopter`,
- `logicalSchemaOwner: source_wire`,
- `migrationDefinitionsOwner: source_wire`,
- `migrationExecutionOwner: adopter`.

It also declares observed, minimum supported, and maximum supported schema versions. A schema below the range returns `schema_too_old`. A schema above the range returns `schema_too_new`. Both deny reads and writes. Runtime auto-migration, downgrade, and fallback are forbidden.

Observed schema versions must be integers. Missing-type, null, string, fractional, or otherwise malformed runtime values return `schema_incompatible` instead of entering range comparison.

This contract names logical data classes for migrations, namespaces, candidates, trusted memories, immutable revisions, evidence receipts, provenance, embeddings, idempotency, and audit. It includes no SQL or migration file.

## Memory-Only Use

A candidate requires at least one provenance record:

- knowledge-provider evidence reference,
- owner assertion,
- prior-memory reference.

Owner assertions and prior-memory references allow Source-Wire to operate without any knowledge provider.

Unknown provenance kinds are denied. They cannot fall through to an owner assertion or another trusted provenance form.

## Lifecycle

Candidate transitions:

- `pending` to `approved`,
- `pending` to `rejected`.

Trusted-memory transitions:

- `active` to `superseded`,
- `active` to `revoked`.

Approval requires an explicit owner or owner-application authority. Agent harnesses and system actors cannot self-approve. A correction creates a new active revision and supersedes the prior revision atomically. Revoked and superseded records are excluded from active reads. Source evidence cannot become trusted memory directly.

Missing or unknown decision values are invalid lifecycle transitions. Revocation is also owner controlled: an agent harness cannot revoke trusted memory.

## Atomic Mutation Audit

Candidate creation, decisions, corrections, and revocation require an idempotency key, actor, policy decision, owner, namespace, trace, reason, provenance, and expected revision where concurrency matters.

Every successful mutation returns one committed receipt binding the mutation and immutable audit event. Audit failure rolls back the full logical transaction and returns `mutationApplied: false` and `auditCommitted: false`.

## Protected Read Audit

Memory search, memory fetch, and candidate listing persist read audit before returning content.

Any operation outside those three protected-read operations is denied before receipt creation or content release. Provider-search and provider-fetch audits also require an explicit provider ID.

Provider search and fetch use this order:

1. Hold evidence in an internal unreleased buffer.
2. Call `append_read_audit` with safe aggregate metadata.
3. Verify a committed receipt.
4. Release only the result set covered by that receipt.

Receipt binding includes request, trace, owner, namespace, read kind, optional provider, release binding ID, result-set digest, and covered result count. Receipts are single use. Mismatch or replay returns `audit_receipt_invalid` and zero protected content.

## PostgreSQL Role Posture

| Role | Allowed posture | Required denials |
| --- | --- | --- |
| `source_wire_schema_owner` | Non-login owner of exactly `source_wire_memory` | Database ownership, content access, administration |
| `source_wire_migrator` | Temporary, approved-migration-only assumption of schema owner | Runtime use, data reads, permanent credential, broad role assumption |
| `source_wire_runtime` | Bounded DML in `source_wire_memory`, insert-only audit | Ownership, DDL, truncate, audit update or delete, administration, replication, BYPASSRLS |
| `source_wire_kb_reader` | Read-only access to explicitly allowed external views | Memory schema access, writes, schema creation |
| `source_wire_observer` | Content-free health | Content, row, schema, or role-assumption access |

Query-safety posture requires a fixed `source_wire_memory, pg_catalog` search path, fully qualified objects, parameterized queries, revoked public schema creation, revoked unsafe function execution, and no model-generated SQL.

These are structured synthetic assertions, not proof of real PostgreSQL grants.

## Synthetic Proof

Run:

```bash
npm run runtime:memory-store-smoke
```

The smoke exercises the full Revision 5 acceptance matrix. It does not connect to PostgreSQL, apply migrations, use credentials, or operate real data.

Related docs:

- [MemoryStore Smoke](../reference/memory-store-smoke.md)
- [Knowledge Provider And Memory Store Boundary](../concepts/knowledge-provider-memory-store-boundary.md)
- [ADR 0001](../adr/0001-memory-store-and-knowledge-provider-boundary.md)
