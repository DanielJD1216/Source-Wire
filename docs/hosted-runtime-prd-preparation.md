# Source-Wire Hosted Runtime PRD Preparation

Status: future PRD preparation only.

This preparation packet does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, accept code contributions, or use real data.

## Purpose

Use this packet before opening a future hosted runtime PRD unit from issue `#257`.

The goal is to keep runtime work narrow and explicit before Source-Wire moves beyond a contract package skeleton.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:prd-preparation
```

Expected markers:

```text
ok hosted runtime PRD preparation ready
ok hosted runtime PRD evidence map ready
ok exact hosted runtime PRD approval recorded
```

Before asking the owner for a hosted runtime PRD decision, run the complete read-only decision preflight:

```bash
npm run runtime:prd-decision-preflight
```

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

## PRD Must Define

The future PRD must define:

- owner-hosted versus managed-hosted boundary,
- no Source-Wire-hosted user memory unless separately approved,
- API server runtime scope,
- MCP server runtime scope,
- authentication and namespace boundary,
- database posture,
- deployment boundary,
- public-safe fixture strategy,
- no-private-data requirement,
- no trusted Memory Record auto-promotion,
- verification gates,
- rollback and stop conditions.

## Required Inputs

Before starting the PRD unit, review:

- [Public Runtime Decision](public-runtime-decision.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Boundary](runtime-boundary.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Minimal Runtime PRD](minimal-runtime-prd.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)

## Stop Conditions

Stop before PRD implementation if:

- issue `#257` does not contain exact owner approval before PRD work,
- the PRD implies Source-Wire hosts user memory by default,
- real user data, private project data, client data, local paths, tokens, account IDs, domains, emails, screenshots, or production exports are requested,
- the PRD opens npm publishing or GitHub release publishing,
- the PRD accepts code contributions,
- the PRD skips threat model or namespace isolation,
- the PRD allows trusted memory creation without owner or application approval.

## Still Blocked

This packet keeps these blocked:

- hosted runtime implementation,
- API server runtime,
- MCP server runtime,
- database migrations,
- deployment,
- npm publishing,
- GitHub release publishing,
- release tags,
- package version changes,
- production runtime use,
- code contribution acceptance.

## Related Docs

- [Public Runtime Decision](public-runtime-decision.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Boundary](runtime-boundary.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Launch Decision Status](launch-decision-status.md)
