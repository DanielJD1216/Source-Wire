# Source-Wire Owner-Hosted Runtime Implementation Packet

Status: implemented as a public-safe synthetic owner-hosted API server runtime skeleton and MCP server runtime skeleton. Production runtime remains blocked.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

The approved Source-Wire runtime unit is now implemented as a narrow public-safe owner-hosted API server runtime skeleton plus MCP server runtime skeleton.

This is not the full runtime. It is the smallest runnable server-shaped boundary that can prove:

```text
MCP request
  -> Source-Wire API policy
  -> synthetic fixture response
  -> citations, gaps, audit metadata, and denied-result behavior
```

## Exact Approval Text

The owner provided this exact approval text and it was recorded separately in issue `#257`:

- Approval record: https://github.com/DanielJD1216/Source-Wire/issues/257#issuecomment-4900872957

```text
Approved for a future Source-Wire owner-hosted runtime implementation unit: build a narrow public-safe owner-hosted API server runtime skeleton and MCP server runtime skeleton around the existing Source-Wire policy contracts and synthetic fixtures. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, live connectors, local folder crawling, whole-vault import, Mission Control UI, deployment config, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, AGPLv3 code copying, or Source-Wire-Memory-Engine code merge. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled. Automatic trusted memory promotion remains blocked.
```

## What Approval Unlocks

Only this:

- public-safe API server runtime skeleton,
- public-safe MCP server runtime skeleton,
- synthetic fixtures only,
- policy routing through existing Source-Wire API policy contracts,
- citation, gap, denied-result, and audit metadata preservation,
- local smoke tests that run without services, secrets, live connectors, or databases,
- docs and proof updates.

## What Approval Does Not Unlock

Still blocked:

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

## Implemented Artifacts

- `src/owner-hosted-runtime/index.ts`
- `examples/owner-hosted-runtime/owner-hosted-runtime-smoke.mjs`
- `examples/fixtures/owner-hosted-runtime/owner-hosted-runtime-fixture-matrix.json`
- [Owner-Hosted Runtime Implementation Proof](owner-hosted-runtime-implementation-proof.md)
- [Owner-Hosted Runtime Smoke](owner-hosted-runtime-smoke.md)

## Verification Gates

After implementation, run:

```bash
npm run runtime:owner-hosted-implementation-packet
npm run runtime:owner-hosted-smoke
npm run runtime:prd-decision-preflight
npm run runtime:implementation-approval-status
npm run runtime:skeleton-smoke
npm run runtime:api-policy-smoke
npm run runtime:mcp-adapter-smoke
npm run safety:scan
npm run claims:scan
```

## Implementation Slice Map

Use [Owner-Hosted Runtime Implementation Slices](owner-hosted-runtime-implementation-slices.md) as the implementation slice map and [Owner-Hosted Runtime Implementation Proof](owner-hosted-runtime-implementation-proof.md) as the current proof.

## Owner Approval Recording

After explicit owner approval, record it with:

```bash
npm run owner:record-approval -- --target owner-hosted-runtime-implementation --write --confirm-exact "<exact approval text>"
```

Then check:

```bash
npm run owner:record-approval -- --target owner-hosted-runtime-implementation
```

## Related Docs

- [Owner-Hosted Runtime Implementation Slices](owner-hosted-runtime-implementation-slices.md)
- [Owner-Hosted Runtime Implementation Proof](owner-hosted-runtime-implementation-proof.md)
- [Owner-Hosted Runtime Smoke](owner-hosted-runtime-smoke.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [API Contract Implementation Packet](api-contract-implementation-packet.md)
- [MCP Contract Implementation Packet](mcp-contract-implementation-packet.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Runtime PRD Refresh Proof](runtime-prd-refresh-proof.md)
