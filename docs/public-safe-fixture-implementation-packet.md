# Source-Wire Public-Safe Fixture Implementation Packet

Status: approval packet only. Implementation is blocked until exact owner approval is recorded.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

The next Source-Wire fixture build unit should be a synthetic hosted-runtime fixture package, not a live runtime.

This packet defines the exact unit that can start after owner approval:

```text
synthetic caller, namespace, source, candidate, trusted-memory, audit, and denied-case fixtures
  + local validation smoke
  + no real services
  + no real database
  + no real data
```

## Why This Is The Next Unit

The runtime skeleton defines the API and MCP policy shape.

The database posture gate defines the future storage-shape decision path.

The next fixture constraint is making the proof cases reusable and public-safe so future runtime work can prove behavior without borrowing private data or production exports.

## Exact Approval Text

Copy this only when the owner is ready to approve the future implementation unit:

```text
Approved for a future Source-Wire public-safe fixture implementation unit: build a synthetic hosted-runtime fixture package and validation smoke tests for caller identity, namespaces, source evidence, candidates, trusted memory, denied cases, audit metadata, and no-auto-promotion. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Fixtures must not include real local paths, account IDs, emails, domains, tokens, screenshots, client data, production exports, or private proof content. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.
```

## What Approval Would Unlock

Only this:

- public-safe fixture contracts or typed fixture helpers,
- synthetic caller and token-permission fixtures,
- synthetic namespace isolation fixtures,
- synthetic Source evidence fixtures,
- synthetic Memory Improvement Candidate fixtures,
- synthetic trusted-memory fixtures,
- denied-result fixtures,
- audit metadata fixtures,
- no-auto-promotion proof cases,
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
- real local paths,
- account IDs,
- emails,
- domains,
- tokens,
- screenshots,
- production exports,
- private proof content,
- automatic trusted memory promotion.

## Pre-Implementation Gates

Before implementation starts, run:

```bash
npm run runtime:fixture-implementation-packet
npm run runtime:fixture-plan
npm run runtime:skeleton-smoke
npm run runtime:database-implementation-packet
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run safety:scan
npm run claims:scan
```

## Implementation Slice Map

Use [Public-Safe Fixture Implementation Slices](public-safe-fixture-implementation-slices.md) as the implementation slice map after approval.

## Owner Approval Recording

After explicit owner approval, record it with:

```bash
npm run owner:record-approval -- --target public-safe-fixture-implementation --write --confirm-exact "<exact approval text>"
```

Then check:

```bash
npm run owner:decision-status
npm run owner:open-issues-status
```

## Related Docs

- [Public-Safe Fixture Implementation Slices](public-safe-fixture-implementation-slices.md)
- [Hosted Runtime Public-Safe Fixture And Verification Plan](hosted-runtime-public-safe-fixture-verification-plan.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
