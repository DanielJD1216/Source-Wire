# Source-Wire Runtime PRD Refresh Approval Request

Status: approval request recorded. Runtime implementation remains blocked.

This packet does not refresh the PRD by itself, implement production API runtime, add MCP runtime, add database migrations, connect to a real database, add live connectors, deploy services, publish npm, create a GitHub release, change package version, accept public code contributions, copy private implementation code, copy AGPLv3 code, add real data, or approve automatic trusted memory promotion.

## Purpose

Use this packet as the historical approval request for refreshing the public owner-hosted runtime PRD and wrapper-runtime gate from the Unit 33 runtime-readiness alignment baseline.

Recorded approval: https://github.com/DanielJD1216/Source-Wire/issues/257#issuecomment-4884301286

The current public state is:

- Source-Wire has synthetic daily workflow contracts and fixtures.
- Source-Wire has synthetic runtime-readiness contracts and fixtures.
- Source-Wire has redacted private-proof intake metadata.
- Unit 33 alignment may be used as redacted metadata only.
- Production runtime implementation remains blocked.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:prd-refresh-approval-request
```

To check whether the exact approval has already been recorded on the owner issue, run:

```bash
npm run runtime:prd-refresh-approval-status
```

Expected markers:

```text
ok runtime PRD refresh approval request ready
ok unit 33 redacted metadata boundary recorded
blocked production runtime implementation
```

## Exact Approval Text

This exact approval is now recorded. Do not treat it as approval for hosted runtime implementation.

```text
Approved for a future Source-Wire owner-hosted runtime PRD refresh unit: refresh the public owner-hosted runtime PRD and wrapper-runtime gate using the Unit 33 runtime-readiness alignment baseline as redacted metadata only. Keep Source-Wire synthetic-only. Do not add production API runtime, MCP runtime, database migrations, real database connections, live connectors, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, private data, private implementation code, AGPLv3 code copying, or automatic trusted memory promotion. Keep Source-Wire-Memory-Engine separate. MCP must not bypass Source-Wire API policy.
```

## What Approval Would Unlock

Only this:

- refreshing the public owner-hosted runtime PRD,
- refreshing the wrapper-runtime gate,
- using Unit 33 alignment as redacted metadata,
- clarifying synthetic fixture and smoke-test expectations,
- clarifying next implementation approval boundaries.

## What Approval Would Not Unlock

Still blocked:

- production API runtime,
- production MCP runtime,
- route handlers,
- database migrations,
- real database connections,
- PostgreSQL or pgvector setup,
- live connectors,
- local folder crawling,
- whole-vault import,
- Mission Control UI,
- deployment,
- managed hosting,
- npm publishing,
- GitHub release creation,
- package version changes,
- public contribution acceptance,
- private data,
- client data,
- provider exports,
- private implementation code copying,
- AGPLv3 code copying,
- automatic trusted memory promotion.

## Required Preflight

For this PRD refresh lane, run:

```bash
npm run daily-workflow:smoke
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run runtime:extraction-readiness
npm run runtime:prd-refresh-approval-request
npm run runtime:prd-refresh-approval-status
npm run owner:open-issues-status
```

## Stop Conditions

Stop and require a separate owner decision if the PRD refresh needs:

- real runtime source files,
- API or MCP server implementation,
- migrations or database connection code,
- deployment config,
- real user or client data,
- private paths,
- private proof content,
- code copied from any non-public project,
- code copied from `Source-Wire-Memory-Engine`,
- npm or GitHub release mutation.

## Related Docs

- [Hosted Runtime PRD](hosted-runtime-prd.md)
- [Runtime Implementation Decision Gate](runtime-implementation-decision-gate.md)
- [Runtime Implementation Decision Proof](runtime-implementation-decision-proof.md)
- [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md)
- [Daily Workflow Implementation Proof](daily-workflow-implementation-proof.md)
- [Runtime PRD Refresh Approval Status](runtime-prd-refresh-approval-status.md)
