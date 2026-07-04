# Source-Wire Deployment Boundary Implementation Packet

Status: implemented as a synthetic deployment-boundary package after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

The Source-Wire deployment-boundary build unit is now a synthetic deployment readiness package, not deployment config.

This packet records the exact implemented unit after owner approval:

```text
synthetic local, owner-hosted, managed-hosted, stop-condition, rollback, and claim-boundary fixtures
  + local validation smoke
  + no cloud config
  + no container deployment config
  + no hosted service
```

## Why This Is The Next Unit

The deployment boundary doc says what deployment would mean later, but the public package still needs a synthetic proof surface that can keep future deployment claims honest.

The next limiting constraint is making deployment readiness testable without creating infrastructure.

The approved synthetic deployment-boundary package is recorded in [Deployment Boundary Implementation Proof](deployment-boundary-implementation-proof.md).

## Exact Approval Text

Owner approval was recorded with this exact text:

```text
Approved for a future Source-Wire deployment boundary implementation unit: build a public-safe synthetic deployment readiness package and validation smoke tests for local development, owner-hosted runtime, managed-hosted deferral, stop conditions, rollback evidence, claim boundaries, and no-hosted-service proof. Use synthetic fixtures only. Do not add deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source-Wire must not imply it hosts memory for users. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.
```

## Implemented Surface

Only this was implemented:

- public-safe deployment readiness contract types,
- synthetic local development fixture cases,
- synthetic owner-hosted fixture cases,
- synthetic managed-hosted deferral cases,
- synthetic stop-condition cases,
- synthetic rollback evidence cases,
- synthetic claim-boundary cases,
- no-hosted-service proof cases,
- local smoke tests,
- docs and readiness gate updates.

## What Approval Did Not Unlock

Still blocked:

- deployment config,
- cloud provider config,
- Docker or container deployment config for runtime services,
- hosted services,
- managed hosting,
- production runtime use,
- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- production API runtime,
- production MCP runtime,
- live connectors,
- Mission Control UI,
- npm publishing,
- GitHub release creation,
- package version changes,
- public contribution acceptance,
- Source-Wire-Memory-Engine code merge,
- AGPLv3 code copying,
- private implementation code copying,
- real user data,
- client data,
- real local paths,
- account IDs,
- emails,
- domains,
- tokens,
- screenshots,
- production exports,
- private proof content,
- automatic trusted memory promotion.

## Verification

Run:

```bash
npm run runtime:deployment-boundary-smoke
npm run runtime:deployment-implementation-packet
npm run runtime:fixture-implementation-packet
npm run runtime:fixture-plan
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run safety:scan
npm run claims:scan
```

Expected markers include:

```text
ok deployment boundary smoke
ok synthetic deployment-boundary implementation recorded
ok deployment boundary implementation slices complete
blocked deployment config
blocked hosted runtime implementation
```

## Implementation Slice Map

Use [Deployment Boundary Implementation Slices](deployment-boundary-implementation-slices.md) as the completed implementation slice map.

## Owner Approval Recording

Owner approval was recorded with:

```bash
npm run owner:record-approval -- --target deployment-boundary-implementation --write --confirm-exact "<exact approval text>"
```

Then check:

```bash
npm run owner:decision-status
npm run owner:open-issues-status
```

## Related Docs

- [Deployment Boundary Implementation Slices](deployment-boundary-implementation-slices.md)
- [Deployment Boundary Implementation Proof](deployment-boundary-implementation-proof.md)
- [Deployment Boundary Smoke](deployment-boundary-smoke.md)
- [Hosted Runtime Deployment Boundary And Runtime Stop Conditions](hosted-runtime-deployment-boundary-stop-conditions.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
