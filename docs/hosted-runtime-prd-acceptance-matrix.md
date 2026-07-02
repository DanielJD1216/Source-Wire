# Source-Wire Hosted Runtime PRD Acceptance Matrix

Status: PRD acceptance matrix only. Hosted runtime implementation remains blocked.

This matrix does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, publish hosted-runtime child issues, or approve production runtime use.

## Purpose

Use this matrix to prove the approved hosted-runtime PRD scope is clause-complete before any later implementation unit starts.

The approval text requires the PRD to define:

```text
scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements
```

This document maps each required clause to public evidence and stop conditions, so future agents cannot treat a broad PRD paragraph as implementation approval.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:prd-acceptance-matrix
```

Expected markers:

```text
ok hosted runtime PRD acceptance matrix ready
ok hosted runtime PRD clauses mapped
ok hosted runtime PRD stop conditions retained
blocked hosted runtime implementation
```

## Acceptance Matrix

| Approval clause | Evidence | Must remain blocked until later approval |
| --- | --- | --- |
| Scope | [Hosted Runtime PRD](hosted-runtime-prd.md), [Hosted Runtime PRD Execution Packet](hosted-runtime-prd-execution-packet.md) | API server code, MCP runtime code, database migrations, deployment, live connectors, real data |
| Threat model | [Hosted Runtime PRD](hosted-runtime-prd.md), [Runtime Implementation Gate](runtime-implementation-gate.md) | production runtime claims, unmanaged operator access, unreviewed secret handling |
| Owner-hosted versus managed-hosted boundary | [Hosted Runtime PRD](hosted-runtime-prd.md), [Public Runtime Decision](public-runtime-decision.md), [Runtime Boundary](runtime-boundary.md) | managed-hosted service, Source-Wire-hosted user memory, deployment |
| API server runtime | [Hosted Runtime PRD](hosted-runtime-prd.md), [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md) | API server implementation, auth service implementation, endpoint deployment |
| MCP server runtime | [Hosted Runtime PRD](hosted-runtime-prd.md), [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md) | real MCP server runtime, tool server deployment, API policy bypass |
| Database posture | [Hosted Runtime PRD](hosted-runtime-prd.md), [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md) | PostgreSQL or pgvector setup, migrations, backups with real data, production retention policies |
| Deployment boundary | [Hosted Runtime PRD](hosted-runtime-prd.md), [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md), [Runtime Boundary](runtime-boundary.md) | deployment config, cloud resources, production runtime use |
| Public-safe fixtures | [Hosted Runtime PRD](hosted-runtime-prd.md), [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md), [First-Time Visitor Share-Readiness Audit](first-time-visitor-share-readiness-audit.md) | real user data, client data, local paths, account IDs, emails, domains, tokens, screenshots, production exports |
| Verification gates | [Hosted Runtime PRD](hosted-runtime-prd.md), [Hosted Runtime PRD Decision Preflight](hosted-runtime-prd-decision-preflight.md), [Hosted Runtime Child Issue Publication Preflight](hosted-runtime-child-issue-publication-preflight.md) | implementation without green Package Checks, owner-side freshness, safety scan, claim scan, and docs gates |
| No-private-data requirements | [Hosted Runtime PRD](hosted-runtime-prd.md), [Legal Review Question Packet](legal-review-question-packet.md), [Public Status](public-status.md) | private owner context, real user data, client data, secrets, local paths, production exports |

## Minimum Evidence Before Implementation

Before any later hosted-runtime implementation unit starts, require:

1. `npm run publish:readiness` passes on current `main`.
2. `npm run world:share-final-preflight` passes.
3. `npm run runtime:prd-decision-preflight` passes.
4. `npm run runtime:prd-acceptance-matrix` passes.
5. `npm run owner:decision-status` shows hosted runtime implementation is still blocked unless a later exact implementation approval exists.
6. GitHub Package Checks are green on the implementation candidate commit.
7. The implementation unit states exactly which blocked boundary it opens.
8. Real user data and private owner data remain out of public docs, fixtures, issues, and examples.

## Stop Conditions

Stop if a follow-up unit:

- treats this PRD as deployment approval,
- adds API server runtime code,
- adds MCP server runtime code,
- adds database migrations,
- provisions cloud services,
- imports real user data,
- publishes hosted-runtime child issues without the separate child-issue publication approval,
- accepts code contributions,
- publishes a new npm package version,
- creates a GitHub release or tag,
- weakens namespace isolation, trusted-memory approval, public-safe fixture, or no-private-data requirements.

## Related Docs

- [Hosted Runtime PRD](hosted-runtime-prd.md)
- [Hosted Runtime PRD Preparation](hosted-runtime-prd-preparation.md)
- [Hosted Runtime PRD Execution Packet](hosted-runtime-prd-execution-packet.md)
- [Hosted Runtime PRD Decision Preflight](hosted-runtime-prd-decision-preflight.md)
- [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md)
- [Hosted Runtime Child Issue Publication Preflight](hosted-runtime-child-issue-publication-preflight.md)
