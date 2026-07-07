# Source-Wire Owner-Hosted Runtime Implementation Slices

Status: implemented as a public-safe synthetic owner-hosted API server runtime skeleton and MCP server runtime skeleton. Production runtime remains blocked.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Parent

Future parent unit:

```text
Source-Wire Owner-Hosted Runtime Implementation
```

Scope:

```text
narrow public-safe API server runtime skeleton
  + narrow public-safe MCP server runtime skeleton
  + existing policy contracts
  + synthetic fixtures only
```

## Slice 1: File Scope And Runtime Claim Guard

Status: complete.

Goal:

- define the exact implementation file list before code starts,
- prevent production runtime claims,
- prevent database, connector, deployment, Mission Control, and memory-engine changes.

Allowed areas:

- `src/owner-hosted-runtime/`
- `examples/owner-hosted-runtime/`
- `examples/fixtures/owner-hosted-runtime/`
- `docs/owner-hosted-runtime-*`
- package exports and scripts needed to run local smoke tests.

Acceptance criteria:

- no database, migration, connector, deployment, Mission Control, release, or contribution files are touched,
- package version remains `0.1.0`,
- all fixtures are synthetic,
- public claim scans pass.

## Slice 2: API Server Runtime Skeleton

Status: complete.

Goal:

- add a minimal in-process API server runtime skeleton,
- route every synthetic request through the existing Source-Wire API policy boundary,
- return structured denied results, citations, gaps, and audit metadata.

Acceptance criteria:

- authorized synthetic read passes,
- missing capability denies,
- wrong namespace denies without leaked content,
- source evidence stays separate from trusted memory,
- candidate review does not promote trusted memory,
- no database or live network dependency exists.

## Slice 3: MCP Server Runtime Skeleton

Status: complete.

Goal:

- add a minimal MCP server runtime skeleton around the API server skeleton,
- prove MCP cannot bypass Source-Wire API policy.

Acceptance criteria:

- MCP tool call maps to an API policy request,
- MCP source evidence search preserves citations and gaps,
- MCP source maintenance keeps `noAutoPromotion`,
- MCP trusted-memory approval remains owner or application controlled,
- denied results preserve omitted counts without hidden content.

## Slice 4: Synthetic Fixtures And Smoke Tests

Status: complete.

Goal:

- add synthetic fixture cases and local smoke tests for the API and MCP runtime skeletons.

Required cases:

- authorized trusted-memory read,
- source evidence search,
- missing capability denial,
- wrong namespace denial,
- MCP policy bypass blocked,
- source maintenance without automatic promotion,
- pending candidate not promoted,
- owner or application controlled approval boundary,
- stale or weak evidence gap,
- audit metadata present.

Acceptance criteria:

- smoke tests run without secrets,
- smoke tests run without real database connection,
- smoke tests run without live services,
- failure output names the case and next action.

## Slice 5: Docs, Proof, And Readiness

Status: complete.

Goal:

- document what the skeleton proves,
- document what remains blocked,
- wire a targeted smoke command into the local verification path.

Acceptance criteria:

- docs state Source-Wire does not host memory for users,
- docs state this is not production runtime,
- docs state database migrations and real database connections remain blocked,
- docs state Mission Control, live connectors, deployment, and managed hosting remain blocked,
- docs state Source-Wire-Memory-Engine remains separate,
- local verification passes.

## Required Verification

After implementation, run:

```bash
npm run typecheck
npm run build
npm test
npm run runtime:owner-hosted-implementation-packet
npm run runtime:owner-hosted-smoke
npm run runtime:skeleton-smoke
npm run runtime:api-policy-smoke
npm run runtime:mcp-adapter-smoke
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run safety:scan
npm run claims:scan
git diff --check
```

## Still Blocked After These Slices

- production API runtime,
- production MCP runtime,
- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- live connectors,
- local folder crawling,
- whole-vault import,
- Mission Control UI,
- deployment config,
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

- [Owner-Hosted Runtime Implementation Packet](owner-hosted-runtime-implementation-packet.md)
- [Owner-Hosted Runtime Implementation Proof](owner-hosted-runtime-implementation-proof.md)
- [Owner-Hosted Runtime Smoke](owner-hosted-runtime-smoke.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime PRD Refresh Proof](runtime-prd-refresh-proof.md)
- [API Contract Implementation Packet](api-contract-implementation-packet.md)
- [MCP Contract Implementation Packet](mcp-contract-implementation-packet.md)
