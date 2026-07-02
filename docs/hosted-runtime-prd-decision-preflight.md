# Source-Wire Hosted Runtime PRD Decision Preflight

Status: hosted runtime PRD decision preflight only.

This preflight does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, enable branch governance, accept code contributions, or approve production runtime use.

## Purpose

Use this before opening a future hosted runtime PRD unit from issue `#257`.

This command proves the public source-package state, owner decision issues, open-issue boundary, hosted runtime PRD preparation packet, and launch decision blockers are current before runtime PRD work starts.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:prd-decision-preflight
```

This runs:

- `npm run world:share-preflight`
- `npm run owner:decision-status`
- `npm run owner:open-issues-status`
- `npm run runtime:prd-preparation`
- `npm run launch:decision-status`

Expected final markers:

```text
ok hosted runtime PRD decision preflight ready
ok world share preflight current
ok owner decision status current
ok owner open issue boundary current
ok hosted runtime PRD evidence current
ok exact hosted runtime PRD approval recorded
```

## Required Approval Before PRD Work

Issue `#257` must contain the exact owner approval text before a future hosted runtime PRD unit starts:

```text
Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit.
```

This check intentionally does not count recommended approval text as approval. Approval must be recorded separately in issue `#257`.

## Stop Conditions

Stop before PRD work if approval or source-package evidence regresses:

- issue `#257` does not contain exact owner approval before PRD work,
- `npm run owner:decision-status` cannot read issue `#257`,
- `npm run owner:open-issues-status` shows unexpected open issues,
- `npm run world:share-preflight` fails,
- `npm run runtime:prd-preparation` fails,
- the planned PRD asks for hosted runtime implementation instead of PRD scope,
- real user data, client data, local private paths, tokens, screenshots, or production exports are requested.

## Still Blocked

This preflight keeps these blocked:

- hosted runtime implementation,
- API server runtime,
- MCP server runtime,
- database migrations,
- deployment,
- npm publishing,
- GitHub release publishing,
- release tags,
- package version changes,
- repository ruleset governance,
- production runtime use,
- code contribution acceptance.

## Related Docs

- [Hosted Runtime PRD Preparation](hosted-runtime-prd-preparation.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Owner Open Issues Status](owner-open-issues-status.md)
- [Launch Decision Status](launch-decision-status.md)
- [World-Share Readiness](world-share-readiness.md)
