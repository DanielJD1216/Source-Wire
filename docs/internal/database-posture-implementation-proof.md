# Source-Wire Database Posture Implementation Proof

Status: implemented as a synthetic database posture package after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

Source-Wire now includes a synthetic database posture package.

It defines public-safe data-class contracts, lifecycle behavior, namespace isolation, deletion and retention behavior, backup and restore risk checks, and derived data inheritance without adding database migrations, real database connections, PostgreSQL setup, pgvector setup, API server runtime, MCP server runtime, live connectors, Mission Control UI, deployment, managed hosting, real data, client data, private implementation code, or AGPLv3 code.

## Implemented Surface

- `src/contracts/database-posture.ts`
- `examples/fixtures/database-posture/database-posture-fixture-matrix.json`
- `examples/database-posture/database-posture-smoke.mjs`
- `docs/internal/database-posture-smoke.md`
- `docs/internal/database-posture-implementation-packet.md`
- `docs/internal/database-posture-implementation-slices.md`

## What It Proves

- source evidence, memory candidates, trusted memory, audit events, embedding vectors, search cache, backup snapshots, and export bundles are separate data classes,
- wrong owner or namespace access is denied without leaking content,
- source evidence can move from submitted to indexed without becoming trusted memory,
- candidate memory can become trusted memory only with explicit owner or application approval,
- rejected candidates do not create trusted memory,
- revoked or deleted trusted memory marks dependent citations stale,
- deletion marks dependent citations stale,
- retention can be summarized without exposing private content,
- backups preserve owner and namespace boundaries,
- restores cannot bypass candidate review,
- embeddings and caches inherit parent namespace.

## Still Blocked

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

## Verification

```bash
npm run runtime:database-posture-smoke
npm run runtime:database-implementation-packet
```

Expected markers:

```text
ok database posture smoke
ok synthetic database posture implementation recorded
blocked database migrations
```

## Related Docs

- [Database Posture Smoke](database-posture-smoke.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Database Posture Implementation Slices](database-posture-implementation-slices.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
