# Source-Wire Database Posture Implementation Packet

Status: implemented as a synthetic database posture package after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

The Source-Wire build unit is now a synthetic database posture package, not database migrations.

This packet records the exact unit implemented after owner approval:

```text
synthetic data-class contract
  + synthetic lifecycle fixtures
  + synthetic namespace and deletion checks
  + no database connection
  + no migrations
  + no pgvector setup
```

## Why This Is The Next Unit

The runtime skeleton now proves the API policy route and MCP adapter shape.

The next limiting constraint is storage shape: what records exist, how they stay separated, how evidence moves through lifecycle states, and what must never become trusted memory automatically.

## Implementation Proof

The approved synthetic database posture package is recorded in [Database Posture Implementation Proof](database-posture-implementation-proof.md).

The smoke proof is recorded in [Database Posture Smoke](database-posture-smoke.md).

Run:

```bash
npm run runtime:database-posture-smoke
npm run runtime:database-implementation-packet
```

## Exact Approval Text

This is the exact approval text recorded before implementation:

```text
Approved for a future Source-Wire database posture implementation unit: build a public-safe synthetic database posture package that defines data-class contracts, lifecycle state fixtures, namespace isolation fixtures, deletion/retention fixtures, backup/restore risk fixtures, and validation/smoke checks. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.
```

## What Approval Would Unlock

Only this was unlocked:

- public-safe TypeScript contract types for database posture,
- synthetic data-class definitions,
- synthetic lifecycle state fixtures,
- synthetic namespace isolation fixtures,
- synthetic deletion, retention, backup, and restore risk fixtures,
- local smoke tests,
- docs and readiness gate updates.

## What Approval Would Not Unlock

Still blocked:

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

## Verification Gates

After implementation, run:

```bash
npm run runtime:database-posture-smoke
npm run runtime:database-implementation-packet
npm run runtime:database-posture
npm run runtime:skeleton-smoke
npm run runtime:extraction-readiness
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run safety:scan
npm run claims:scan
```

## Implementation Slice Map

Use [Database Posture Implementation Slices](database-posture-implementation-slices.md) as the completed implementation slice map.

## Owner Approval Recording

The approval was recorded with:

```bash
npm run owner:record-approval -- --target database-posture-implementation --write --confirm-exact "<exact approval text>"
```

Then check:

```bash
npm run owner:decision-status
npm run owner:open-issues-status
```

## Related Docs

- [Database Posture Implementation Slices](database-posture-implementation-slices.md)
- [Database Posture Implementation Proof](database-posture-implementation-proof.md)
- [Database Posture Smoke](database-posture-smoke.md)
- [Hosted Runtime Database Posture And Data Lifecycle](hosted-runtime-database-posture-data-lifecycle.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
