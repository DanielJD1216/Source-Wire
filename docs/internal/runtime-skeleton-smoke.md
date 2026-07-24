# Runtime Skeleton Smoke

Status: synthetic owner-hosted runtime skeleton smoke.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

The runtime skeleton smoke proves a public-safe owner-hosted API policy route skeleton plus MCP adapter skeleton.

It does not prove production runtime, database storage, deployment, live connectors, Mission Control UI, or real user data handling.

## Command

Run:

```bash
npm run runtime:skeleton-smoke
```

Expected marker:

```text
ok runtime skeleton smoke
```

## What It Proves

- authorized trusted-memory read,
- source-evidence search,
- missing permission denial,
- wrong namespace denial,
- source maintenance with `noAutoPromotion`,
- pending candidate without trusted memory creation,
- MCP approval denied by default,
- owner or application controlled approval boundary,
- MCP adapter calls API policy instead of bypassing it,
- audit metadata has no leaked content, raw token, or private path.

## What Remains Blocked

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

## Related Files

- `src/runtime-skeleton/index.ts`
- `examples/runtime-skeleton/runtime-skeleton-smoke.mjs`
- `examples/fixtures/runtime-skeleton/runtime-skeleton-fixture-matrix.json`
- [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md)
- [Runtime Skeleton Issue Slices](runtime-skeleton-issue-slices.md)
