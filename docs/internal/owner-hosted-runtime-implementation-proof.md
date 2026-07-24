# Source-Wire Owner-Hosted Runtime Implementation Proof

Status: implemented as a public-safe synthetic owner-hosted API and MCP runtime skeleton. Production runtime remains blocked.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

The approved owner-hosted runtime implementation unit is now implemented as an in-process skeleton.

It proves the policy path:

```text
API request or MCP tool call
  -> owner-hosted runtime skeleton
  -> Source-Wire API policy contract
  -> synthetic fixture result
  -> citations, gaps, denied result, and audit metadata
```

## What Was Added

- `src/owner-hosted-runtime/index.ts`
- `examples/owner-hosted-runtime/owner-hosted-runtime-smoke.mjs`
- `examples/fixtures/owner-hosted-runtime/owner-hosted-runtime-fixture-matrix.json`
- `examples/owner-hosted-runtime/README.md`
- `examples/fixtures/owner-hosted-runtime/README.md`
- `npm run runtime:owner-hosted-smoke`

## What It Proves

- authorized trusted-memory reads route through API policy,
- source evidence search stays separate from trusted memory,
- missing capability denies,
- wrong namespace denies,
- MCP policy bypass attempts deny through the API policy path,
- source maintenance creates candidates without trusted-memory promotion,
- candidate review does not create trusted memory,
- trusted-memory approval requires owner or application control,
- citations, gaps, denied results, and audit metadata are preserved.

## Boundary

This implementation does not add:

- production API runtime,
- production MCP runtime,
- network listener,
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

## Verification

Run:

```bash
npm run runtime:owner-hosted-smoke
```

Recommended focused gate:

```bash
npm run typecheck
npm run build
npm test
npm run runtime:owner-hosted-implementation-packet
npm run runtime:owner-hosted-smoke
npm run runtime:skeleton-smoke
npm run runtime:api-policy-smoke
npm run runtime:mcp-adapter-smoke
npm run safety:scan
npm run claims:scan
git diff --check
```

## Related Docs

- [Owner-Hosted Runtime Smoke](owner-hosted-runtime-smoke.md)
- [Owner-Hosted Runtime Implementation Packet](owner-hosted-runtime-implementation-packet.md)
- [Owner-Hosted Runtime Implementation Slices](owner-hosted-runtime-implementation-slices.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
