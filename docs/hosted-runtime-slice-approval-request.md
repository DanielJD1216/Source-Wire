# Source-Wire Hosted Runtime Slice Approval Request

Status: approval request only.

This request does not publish child issues, implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this request before publishing child issues from the [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md).

The hosted runtime PRD has landed, but child issue publication should still be a separate owner-approved step because it creates public work items that future agents may pick up.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

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
blocked child issue publication pending owner approval
blocked hosted runtime implementation
```

## Exact Approval Text

Do not publish child issues until the owner approves the exact approval text.

```text
Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.
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

Publish only after exact approval:

1. Hosted Runtime Threat Model And Trust Boundary.
2. API Server Runtime Contract.
3. MCP Server Runtime Contract.
4. Database Posture And Data Lifecycle.
5. Public-Safe Fixture And Verification Plan.
6. Deployment Boundary And Runtime Stop Conditions.

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
