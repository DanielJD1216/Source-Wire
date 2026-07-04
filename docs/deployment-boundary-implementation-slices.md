# Source-Wire Deployment Boundary Implementation Slices

Status: implementation slice map only. Implementation is blocked until exact owner approval is recorded.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Parent

Future parent unit:

```text
Source-Wire Deployment Boundary Implementation
```

Approval packet:

- [Deployment Boundary Implementation Packet](deployment-boundary-implementation-packet.md)

## Slice 1: File Scope And Safety Guard

Goal:

- define the exact public-safe deployment-boundary file areas,
- prevent accidental cloud, container, runtime, database, connector, or deployment work,
- keep package version unchanged.

Allowed file areas:

- `src/contracts/`
- `examples/fixtures/deployment-boundary/`
- `examples/deployment-boundary/`
- `docs/deployment-boundary-*`
- package scripts and docs index links.

Acceptance criteria:

- no deployment config is added,
- no cloud provider config is added,
- no Docker or container deployment config for runtime services is added,
- no hosted service is created,
- no database connection code is added,
- no API server or MCP server runtime code is added,
- no live connector or Mission Control code is touched,
- package version stays `0.1.0`,
- public safety and claim scans pass.

## Slice 2: Synthetic Deployment Readiness Contract

Goal:

- define a small contract for deployment-readiness proof cases,
- preserve runtime mode, operator, owner control, required gates, stop conditions, rollback evidence, and claim boundary.

Acceptance criteria:

- local development, owner-hosted, and managed-hosted states are separate,
- managed-hosted remains deferred,
- production runtime use remains blocked,
- no fixture implies Source-Wire hosts memory for users,
- rollback evidence is modeled without running rollback behavior.

## Slice 3: Synthetic Deployment Boundary Matrix

Goal:

- add a synthetic matrix for deployment boundary behavior.

Required cases:

- local synthetic development allowed,
- owner-hosted runtime eligible only after implementation approval,
- managed-hosted deferred,
- cloud config blocked,
- container deployment config blocked,
- public network exposure blocked,
- real secrets blocked,
- real database connection blocked,
- real user data blocked,
- Source-Wire-hosted-memory claim blocked,
- rollback evidence required before deployment approval.

Acceptance criteria:

- all cases are deterministic,
- blocked cases include failure point, observed error, supported cause, impact, and next action,
- no real hostnames, emails, domains, local paths, account IDs, screenshots, tokens, credentials, or production exports.

## Slice 4: Smoke Test And Validation

Goal:

- add a local smoke test that verifies the synthetic matrix.

Acceptance criteria:

- smoke test runs without secrets,
- smoke test runs without services,
- smoke test runs without a database,
- allowed local synthetic cases pass,
- blocked deployment cases fail closed,
- output has stable markers for CI.

## Slice 5: Docs, Proof, And Readiness

Goal:

- document what the synthetic deployment-boundary package proves,
- document what remains blocked,
- wire the smoke into readiness gates.

Acceptance criteria:

- docs state this is not deployment,
- docs state no hosted service exists,
- docs state managed hosting remains deferred,
- docs state production runtime use remains blocked,
- docs state Source-Wire-Memory-Engine remains separate,
- local verification passes.

## Required Verification

After implementation, run:

```bash
npm run typecheck
npm run build
npm test
npm run runtime:deployment-implementation-packet
npm run runtime:deployment-boundary
npm run runtime:fixture-implementation-packet
npm run runtime:database-implementation-packet
npm run runtime:skeleton-smoke
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run safety:scan
npm run claims:scan
npm run ci:check
git diff --check
```

## Still Blocked After These Slices

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

## Related Docs

- [Deployment Boundary Implementation Packet](deployment-boundary-implementation-packet.md)
- [Hosted Runtime Deployment Boundary And Runtime Stop Conditions](hosted-runtime-deployment-boundary-stop-conditions.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
