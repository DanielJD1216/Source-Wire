# MemoryStore v1 Smoke

## Purpose

The MemoryStore smoke proves the PostgreSQL-only memory posture, lifecycle, audit, compatibility, role, and query-safety contracts with synthetic data.

## Run

Use Node.js 22 with npm from the repository root. See [Quickstart](../getting-started/quickstart.md) for setup.

```bash
npm run runtime:memory-store-smoke
```

The command builds the package, loads the synthetic matrix, runs all 107 cases through `evaluateMemoryStoreConformanceFixtureMatrix`, and exits non-zero on a missing, duplicate, unexpected, or mismatched case or result.

## Stable Markers

Representative markers:

```text
ok memory store case ms_owner_supplied_postgres_boundary
ok memory store case ms_read_audit_receipt_replay_denied
ok memory store case ms_missing_decision_denied
ok memory store case ms_owner_controlled_approval_allowed
ok memory store case ms_agent_revocation_denied
ok memory store case ms_runtime_bypass_rls_denied
ok memory store conformance smoke
```

## What It Proves

- adopter infrastructure ownership and Source-Wire logical schema ownership,
- PostgreSQL-only v1 and no arbitrary table mapping,
- memory-only provenance,
- candidate, approval, rejection, correction, supersession, and revocation rules,
- fail-closed malformed decisions, operations, provenance, provider context, and schema versions,
- idempotency and optimistic concurrency,
- atomic mutation and audit,
- exact, single-use protected-read audit receipts,
- zero-content fail-closed behavior,
- exact contract, capability, and schema compatibility,
- structured role and query-safety posture,
- safe error shape and retry bound,
- no managed hosting and no automatic promotion.

## What It Does Not Prove

It does not connect to PostgreSQL, apply SQL or migrations, validate real grants or row-level security, test backups, measure performance, or operate real data.

Related docs:

- [MemoryStore v1 Contract](../contracts/memory-store-v1-contract.md)
- [MemoryStore Fixture Matrix](../../examples/fixtures/memory-store/README.md)
