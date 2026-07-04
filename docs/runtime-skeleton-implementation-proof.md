# Runtime Skeleton Implementation Proof

Status: complete synthetic runtime skeleton implementation.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

Source-Wire now has a public-safe synthetic owner-hosted runtime skeleton.

It is not a production runtime. It is a tiny package-level skeleton that proves the approved API policy route and MCP adapter shape with synthetic fixtures only.

## What Landed

- Runtime skeleton package surface: `src/runtime-skeleton/index.ts`
- Synthetic fixture matrix: `examples/fixtures/runtime-skeleton/runtime-skeleton-fixture-matrix.json`
- Fixture README: `examples/fixtures/runtime-skeleton/README.md`
- Smoke command: `examples/runtime-skeleton/runtime-skeleton-smoke.mjs`
- Smoke docs: [Runtime Skeleton Smoke](runtime-skeleton-smoke.md)

## Boundary

This implementation keeps these blocked:

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

## Verification

Run:

```bash
npm run runtime:skeleton-smoke
npm run runtime:skeleton-packet
npm run runtime:extraction-readiness
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run runtime:wrapper-reconciliation
npm run docs:links
npm run docs:anchors
npm run docs:command-setup
npm run safety:scan
npm run claims:scan
npm run ci:check
git diff --check
```

Expected key marker:

```text
ok runtime skeleton smoke
```

## Related Docs

- [Runtime Skeleton Smoke](runtime-skeleton-smoke.md)
- [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md)
- [Runtime Skeleton Issue Slices](runtime-skeleton-issue-slices.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
