# Source-Wire Hosted Runtime PRD Execution Packet

Status: execution packet only.

This packet does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish a new npm version, create a new GitHub release, create tags, enable branch governance, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this packet after the owner records exact approval for issue `#257`.

The goal is to make the future hosted runtime PRD unit bounded and boring: define the runtime product boundary, threat model, owner-hosted versus managed-hosted posture, API and MCP responsibilities, database posture, public-safe fixtures, verification gates, and no-private-data rules before any runtime implementation starts.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:prd-execution-packet
```

Expected markers:

```text
ok hosted runtime PRD execution packet ready
ok hosted runtime PRD execution scope documented
ok exact hosted runtime PRD approval recorded
```

This command verifies the packet and docs only. It does not add runtime code, call deployment APIs, or create infrastructure.

## Required Owner Approval

Hosted runtime PRD approval is recorded on issue `#257` with this exact text:

```text
Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit.
```

## Pre-Execution Checks

Before starting the future PRD unit:

1. Run `npm run publish:readiness`.
2. Run `npm run world:share-final-preflight`.
3. Run `npm run runtime:prd-decision-preflight`.
4. Run `npm run owner:decision-status`.
5. Confirm issue `#257` has exact approval recorded.
6. Confirm the latest `Package Checks` is green on `origin/main`.
7. Confirm local `main` and `origin/main` point to the same commit.
8. Confirm no npm package version, GitHub release, tag, deployment, branch governance change, or contribution acceptance is being opened in the same unit.

## Future PRD Scope

The future PRD unit should define, but not implement:

| Area | Required PRD decision |
| --- | --- |
| Runtime posture | owner-hosted first, managed-hosted deferred unless explicitly approved |
| API server | exact public-safe endpoints, auth boundary, and non-goals |
| MCP server | tool list, permission model, and caller identity posture |
| Database | PostgreSQL or other storage posture, tenant isolation, migration policy, backup/restore boundary |
| Threat model | private data, secrets, namespace isolation, hosted abuse cases, audit needs |
| Public fixtures | synthetic-only data, no real user data, no owner-private data |
| Verification | local smokes, package checks, security scans, issue freshness, and docs gates |
| Runtime limits | no trusted Memory Record auto-promotion, no live connectors, no production claims |

## Future Verification

After the future PRD unit lands, run:

```bash
npm run publish:readiness
npm run world:share-final-preflight
npm run owner:refresh-decision-issues
npm run owner:decision-issues-freshness
```

Expected future result while implementation remains blocked:

```text
ok hosted runtime PRD decision preflight ready
ok hosted runtime PRD evidence current
blocked hosted runtime implementation not approved
```

## Stop Conditions

Stop the future PRD unit if:

- it starts adding runtime code,
- it introduces real user data,
- it adds deployment configuration,
- it accepts code contributions,
- it changes npm package version,
- it creates a GitHub release or tag,
- it enables branch governance,
- it weakens the no-private-data boundary.

## Still Blocked

This packet does not approve:

- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record auto-promotion,
- deployment,
- production runtime use,
- accepting code contributions.

## Related Docs

- [Hosted Runtime PRD Preparation](hosted-runtime-prd-preparation.md)
- [Hosted Runtime PRD Decision Preflight](hosted-runtime-prd-decision-preflight.md)
- [Public Runtime Decision](public-runtime-decision.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Boundary](runtime-boundary.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
