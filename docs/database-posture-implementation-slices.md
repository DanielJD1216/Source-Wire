# Source-Wire Database Posture Implementation Slices

Status: completed synthetic database posture slice map after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Parent

Completed parent unit:

```text
Source-Wire Database Posture Implementation
```

Approval packet:

- [Database Posture Implementation Packet](database-posture-implementation-packet.md)

## Slice 1: File Scope And Safety Guard

Goal:

- define the exact public-safe file areas,
- prevent accidental migration or runtime work,
- keep package version unchanged.

Allowed file areas:

- `src/contracts/`
- `examples/fixtures/database-posture/`
- `examples/database-posture/`
- `docs/database-posture-*`
- package scripts and docs index links.

Acceptance criteria:

- no migration files are added,
- no database connection code is added,
- no API server or MCP server runtime code is added,
- no live connector or Mission Control code is touched,
- package version stays `0.1.0`,
- public safety and claim scans pass.

## Slice 2: Synthetic Data-Class And Lifecycle Contract

Goal:

- define synthetic database posture types for data classes and lifecycle states,
- keep source evidence, candidate memory, trusted memory, audit, embeddings, cache, backup, and export separate.

Acceptance criteria:

- each data class has a trust level,
- each data class has an owner or application lifecycle controller,
- source evidence cannot become trusted memory without explicit approval,
- embeddings and caches inherit namespace and sensitivity,
- deleted or stale source evidence cannot be returned as active trusted memory.

## Slice 3: Namespace, Retention, Deletion, Backup, And Restore Fixtures

Goal:

- add a synthetic fixture matrix for storage boundary behavior.

Required cases:

- authorized namespace data-class read,
- wrong namespace denial without leaked content,
- source evidence lifecycle from submitted to indexed,
- candidate lifecycle from prepared to approved or rejected,
- trusted memory lifecycle from approved to revoked or deleted,
- retention policy summary,
- deletion marks dependent citations stale,
- backup keeps owner and namespace boundaries,
- restore cannot bypass candidate review,
- cache and embedding inherit parent namespace.

Acceptance criteria:

- all fixture IDs are synthetic,
- no real hostnames, emails, domains, local paths, account IDs, or credentials,
- no migration SQL,
- no database URL,
- no vector database setup,
- failure records name the failed case and next action.

## Slice 4: Smoke Test And Validation

Goal:

- add a local smoke test that verifies the synthetic matrix.

Acceptance criteria:

- smoke test runs without secrets,
- smoke test runs without services,
- smoke test runs without a database,
- denied cases fail closed,
- trusted-memory promotion remains owner or application controlled,
- output has stable markers for CI.

## Slice 5: Docs, Proof, And Readiness

Goal:

- document what the synthetic database posture package proves,
- document what remains blocked,
- wire the smoke into readiness gates.

Acceptance criteria:

- docs state this is not a database runtime,
- docs state migrations remain blocked,
- docs state PostgreSQL and pgvector setup remain blocked,
- docs state real data remains blocked,
- docs state Source-Wire-Memory-Engine remains separate,
- local verification passes.

## Required Verification

After implementation, run:

```bash
npm run typecheck
npm run build
npm test
npm run runtime:database-posture-smoke
npm run runtime:database-implementation-packet
npm run runtime:database-posture
npm run runtime:skeleton-smoke
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run safety:scan
npm run claims:scan
npm run ci:check
git diff --check
```

## Still Blocked After These Slices

- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- production API runtime,
- production MCP runtime,
- live connectors,
- Mission Control UI,
- deployment,
- managed hosting,
- npm publishing,
- GitHub release creation,
- package version changes,
- public contribution acceptance,
- Source-Wire-Memory-Engine code merge,
- AGPLv3 code copying,
- private implementation code copying,
- real user data,
- client data,
- automatic trusted memory promotion.

## Related Docs

- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Database Posture Implementation Proof](database-posture-implementation-proof.md)
- [Database Posture Smoke](database-posture-smoke.md)
- [Hosted Runtime Database Posture And Data Lifecycle](hosted-runtime-database-posture-data-lifecycle.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
