# Source-Wire Runtime Skeleton Issue Slices

Status: implementation slice map only. Runtime skeleton implementation remains blocked pending exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Parent

Future parent unit:

```text
Source-Wire Owner-Hosted Runtime Skeleton Implementation
```

## Slice 1: File Scope And Public Safety Guard

Goal:

- define the exact implementation file list,
- keep the skeleton public-safe,
- prevent accidental production runtime claims.

Allowed file areas:

- `src/runtime-skeleton/`
- `examples/runtime-skeleton/`
- `examples/fixtures/runtime-skeleton/`
- `docs/runtime-skeleton-*`
- package scripts and docs index links.

Acceptance criteria:

- file list is exact before code starts,
- no database, deployment, Mission Control, connector, memory-engine, release, or contribution file areas are touched,
- public safety and claim scans pass,
- package version stays `0.1.0`.

## Slice 2: Synthetic Owner-Hosted API Policy Route Skeleton

Goal:

- add a tiny synthetic API policy route boundary,
- validate caller, namespace, action, and capability,
- return cited source evidence or trusted memory without storing anything.

Acceptance criteria:

- authorized read passes,
- missing capability fails closed,
- wrong namespace fails closed without leaked content,
- source evidence is labeled separately from trusted memory,
- audit metadata includes caller, namespace, action, and result.

## Slice 3: Synthetic MCP Adapter Skeleton

Goal:

- add an MCP-facing adapter skeleton that calls the API policy boundary,
- prove MCP does not bypass Source-Wire policy.

Acceptance criteria:

- MCP read maps to API policy request,
- MCP source maintenance maps to API policy request and preserves `noAutoPromotion`,
- MCP trusted-memory approval is blocked by default unless owner or application control is represented,
- denied namespace result returns omitted counts without leaked content,
- citations and gaps are preserved.

## Slice 4: Synthetic Fixture Matrix And Smoke Tests

Goal:

- add synthetic fixture cases and smoke tests for the skeleton.

Required cases:

- authorized trusted-memory read,
- source evidence search,
- missing permission denial,
- wrong namespace denial,
- source maintenance with `noAutoPromotion`,
- pending candidate without trusted memory,
- owner or application controlled approval boundary,
- MCP policy bypass blocked,
- stale or weak evidence gap,
- audit metadata present.

Acceptance criteria:

- smoke tests run without secrets,
- smoke tests run without services,
- smoke tests run without real database connection,
- all fixtures are synthetic,
- failure messages name the failed case and next action.

## Slice 5: Docs, Proof, And Readiness

Goal:

- document what the skeleton proves,
- document what remains blocked,
- wire the smoke command into readiness gates.

Acceptance criteria:

- docs state Source-Wire does not host memory,
- docs state this is not production runtime,
- docs state database migrations remain blocked,
- docs state Mission Control remains blocked,
- docs state live connectors remain blocked,
- docs state Source-Wire-Memory-Engine remains separate,
- local verification passes.

## Required Verification

After implementation, run:

```bash
npm run typecheck
npm run build
npm test
npm run runtime:skeleton-packet
npm run runtime:extraction-readiness
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run runtime:wrapper-reconciliation
npm run safety:scan
npm run claims:scan
npm run ci:check
git diff --check
```

## Still Blocked After These Slices

- production API runtime,
- production MCP runtime,
- database schema or migrations,
- PostgreSQL or pgvector connection code,
- real database connection,
- live connectors,
- local folder crawling,
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

- [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md)
- [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
