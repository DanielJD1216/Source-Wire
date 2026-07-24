# Source-Wire Hosted Runtime Slice Approval Request

Status: approval request complete.

This request records the completed child issue publication approval path. It does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this request to verify the approval text that allowed child issues from the [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md) to be published.

The hosted runtime PRD has landed, child issue publication was separately approved, and the six PRD/planning issues were published as `#259` through `#264`.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:slice-approval-request
```

Expected markers:

```text
ok hosted runtime slice approval request ready
ok hosted runtime child issue slice map ready
ok hosted runtime child issue publication approval retained
ok hosted runtime child planning issues published
blocked hosted runtime implementation
```

## Exact Approval Text

Child issue publication approval is recorded.

```text
Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/internal/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.
```

## What Approval Would Unlock

Only this:

- publishing the six hosted runtime child issues,
- linking them back to issue `#257`,
- labeling them for planning or documentation work,
- preserving dependency order,
- keeping child issues PRD/planning-only until a later implementation approval exists.

## What Approval Would Not Unlock

Implementation remains blocked after child issues are published.

Still blocked:

- hosted runtime implementation,
- API server implementation,
- MCP server runtime implementation,
- database migrations,
- deployment,
- production runtime use,
- real user data,
- client data,
- live connectors,
- memory-engine integration,
- Mission Control UI,
- trusted Memory Record auto-promotion,
- code contribution acceptance,
- npm publishing,
- GitHub release creation,
- tags.

## Child Issue Publication Order

Published after exact approval:

1. `#259` Hosted Runtime Threat Model And Trust Boundary.
2. `#260` API Server Runtime Contract.
3. `#261` MCP Server Runtime Contract.
4. `#262` Database Posture And Data Lifecycle.
5. `#263` Public-Safe Fixture And Verification Plan.
6. `#264` Deployment Boundary And Runtime Stop Conditions.

## Verification After Publication

After publishing child issues, run:

```bash
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run owner:open-issues-status
npm run owner:decision-issues-freshness
npm run world:share-final-preflight
```

If the open-issue boundary changes because child issues are now expected, update the owner-open-issue guard in the same publication unit.

## Related Docs

- [Hosted Runtime PRD](hosted-runtime-prd.md)
- [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md)
- [Hosted Runtime Child Issue Publication Packet](hosted-runtime-child-issue-publication-packet.md)
- [Hosted Runtime PRD Decision Preflight](hosted-runtime-prd-decision-preflight.md)
- [Runtime Readiness Smoke](runtime-readiness-smoke.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Owner Open Issues Status](owner-open-issues-status.md)
