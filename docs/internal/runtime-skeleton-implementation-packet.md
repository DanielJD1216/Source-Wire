# Source-Wire Runtime Skeleton Implementation Packet

Status: approved and implemented as a synthetic skeleton. Production runtime remains blocked.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

The next Source-Wire build unit should be a narrow owner-hosted runtime skeleton, not a full runtime.

This packet defines the exact unit that can start after owner approval:

```text
synthetic owner-hosted API policy route skeleton
  + synthetic MCP adapter skeleton
  + no database
  + no real data
  + no deployment
  + no trusted-memory auto-promotion
```

## Why This Is The Next Unit

The public repo now has:

- runtime contracts,
- synthetic runtime boundary proof,
- daily workflow proof,
- owner-hosted setup proof,
- hosted-runtime planning artifacts,
- private proof intake,
- private-proof-to-runtime extraction readiness.

The remaining public gap is not more theory. It is a tiny runnable skeleton that shows how a future adopter's MCP harness would call an owner-hosted Source-Wire API policy boundary.

## Exact Approval Text

The owner approved this exact text and the approval was recorded separately in issue `#257`.

```text
Approved for a future Source-Wire owner-hosted runtime skeleton implementation unit: build a public-safe synthetic owner-hosted API policy route skeleton and MCP adapter skeleton using the private Unit 25 through Unit 30 proof trail as redacted evidence only. Use synthetic fixtures only. Do not copy private implementation code or AGPLv3 code. Do not add real user data, client data, database migrations, real database connections, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, or public contribution acceptance. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.
```

## What Approval Would Unlock

Only this:

- public-safe TypeScript skeletons under a small approved file list,
- synthetic route-level API policy examples,
- synthetic MCP adapter examples,
- synthetic fixtures,
- local smoke tests,
- public docs and proof docs.

## What Approval Would Not Unlock

Still blocked:

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

## Pre-Implementation Gates

Before implementation starts, run:

```bash
npm run runtime:skeleton-packet
npm run runtime:extraction-readiness
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run runtime:wrapper-reconciliation
npm run safety:scan
npm run claims:scan
```

## Implementation Slice Map

Use [Runtime Skeleton Issue Slices](runtime-skeleton-issue-slices.md) as the implementation slice map after approval.

## Owner Approval Recording

After explicit owner approval, record it with:

```bash
npm run owner:record-approval -- --target runtime-skeleton-implementation --write --confirm-exact "<exact approval text>"
```

Then check:

```bash
npm run owner:decision-status
```

## Related Docs

- [Runtime Skeleton Issue Slices](runtime-skeleton-issue-slices.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [Runtime Skeleton Smoke](runtime-skeleton-smoke.md)
- [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
- [Minimal Runtime PRD](minimal-runtime-prd.md)
