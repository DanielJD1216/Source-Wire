# MemoryStore v1 Fixture Matrix

Use Node.js 22 with npm for local checks. See the [Quickstart](../../../docs/getting-started/quickstart.md).

This directory contains one fictional, synthetic conformance matrix for the PostgreSQL-only `MemoryStore v1` posture contract.

The matrix covers:

- adopter-owned PostgreSQL infrastructure and Source-Wire-owned logical schema rules,
- the dedicated `source_wire_memory` schema boundary,
- schema owner, migrator, runtime, knowledge reader, and observer role posture,
- fixed search path and query-safety posture,
- candidate creation from provider evidence, owner assertions, or prior memory,
- explicit approval, rejection, correction, supersession, and revocation,
- idempotency and optimistic concurrency,
- atomic mutation and audit behavior,
- protected-read audit receipts with exact binding and single-use release,
- exact contract and schema compatibility with no downgrade.

The 107 cases also deny missing or unknown decisions, operations, provenance kinds, read-audit context, schema-version types, and agent-harness revocation. The smoke requires the exact case count and unique fixture-case and result IDs.

Run the matrix from the repository root:

```bash
npm run runtime:memory-store-smoke
```

The fixture is posture evidence only. It contains no SQL, migration, database driver, credential, connection string, provisioning, deployment, or real data.

Related docs:

- [MemoryStore v1 Contract](../../../docs/contracts/memory-store-v1-contract.md)
- [MemoryStore Smoke](../../../docs/reference/memory-store-smoke.md)
- [Knowledge Provider And Memory Store Boundary](../../../docs/concepts/knowledge-provider-memory-store-boundary.md)
