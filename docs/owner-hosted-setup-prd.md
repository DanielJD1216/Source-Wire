# Source-Wire Owner-Hosted Setup PRD

Status: PRD drafted. No runtime implementation is included.

Date: 2026-07-03

## Direct Answer

Source-Wire's completed public setup step is the owner-hosted setup package, not managed hosting and not a production runtime claim.

The goal was to define how an adopter will bring their own device or server, PostgreSQL-compatible database, credentials, source packets, and MCP-capable harnesses, then prove that setup path with synthetic fixtures before any real runtime implementation starts.

For the adopter-facing claim boundary, read [Owner-Hosted Setup Claim Boundary](owner-hosted-setup-claim-boundary.md).

## Problem

Source-Wire is intended to become a BYO owner-hosted memory system, but the public repo is still a contracts-first package with synthetic setup and runtime-boundary proof code.

Adopters need a clear setup path that answers:

- what the owner brings,
- what Source-Wire will eventually provide,
- what readiness checks must pass,
- what Mission Control should show later,
- what remains blocked until a separate implementation unit.

Without this setup boundary, Source-Wire would risk jumping from contracts to runtime code before the owner-hosted path is understandable and safe.

## Goal

Define a public-safe setup package for future Source-Wire implementation.

The setup package should eventually let an owner understand and verify:

```text
owner device or server
  -> owner-controlled Source-Wire API
  -> owner-controlled PostgreSQL-compatible database
  -> owner-approved MCP harness
  -> local setup health check
  -> caller-supplied source update
  -> pending review work only
```

## Non-Goals

This PRD does not approve:

- API server runtime implementation,
- MCP server runtime implementation,
- database migrations,
- PostgreSQL or pgvector installer automation,
- Mission Control UI implementation,
- memory-engine integration,
- AGPLv3 code copying,
- private implementation code copying,
- live connectors,
- local filesystem crawling,
- real user data,
- deployment,
- managed hosting,
- production runtime use,
- npm publishing,
- GitHub release creation,
- public code contribution acceptance.

## User Stories

1. As an adopter, I want to know what I bring, so that I can run Source-Wire with my own infrastructure.
2. As an adopter, I want a database readiness checklist, so that I know whether my PostgreSQL-compatible database is usable.
3. As an adopter, I want an API readiness checklist, so that I know whether the owner-hosted API is reachable.
4. As an adopter, I want an MCP readiness checklist, so that I know whether my agent harness can see the memory tools.
5. As an adopter, I want source update safety rules, so that a chat prompt cannot make Source-Wire crawl my computer.
6. As an adopter, I want no-auto-promotion visible, so that source updates do not silently become trusted memory.
7. As a nontechnical owner, I want setup health in plain language, so that I do not need to read logs.
8. As a reviewer, I want synthetic fixtures only, so that public examples do not leak private data.
9. As a maintainer, I want exact stop conditions, so that runtime work does not expand into deployment, hosting, releases, or AGPLv3 code copying.

## Setup Requirements

### Owner-Brings Requirements

The future setup package should document that each owner brings:

- a device or server,
- a PostgreSQL-compatible database,
- credentials and secret storage,
- model or API keys if later runtime features require them,
- source packets or explicitly configured source connections,
- MCP-capable agent harnesses,
- owner review time for trusted memory approval.

### Database Readiness

Future setup checks should prove:

- database connection is configured,
- database connectivity passes,
- vector capability is represented when semantic retrieval requires it,
- schema readiness is represented before database-backed runtime claims,
- raw connection strings and credentials are never printed.

Synthetic fixture example:

```json
{
  "database": {
    "configured": true,
    "connected": true,
    "vectorCapability": "available",
    "secretVisible": false
  }
}
```

### API Readiness

Future setup checks should prove:

- owner-hosted API URL is configured,
- health endpoint passes,
- blocked API state returns failure point, observed error, supported cause, impact, and next action,
- setup docs do not imply Source-Wire hosts memory.

Synthetic fixture example:

```json
{
  "api": {
    "mode": "owner_hosted",
    "health": "pass",
    "sourceWireHostedMemory": false
  }
}
```

### MCP Readiness

Future setup checks should prove:

- MCP tool visibility is checkable,
- `use_2nd_brain` or equivalent read wrapper is visible,
- source update tools are visible only when policy allows them,
- MCP routes through API policy,
- raw tokens are never printed,
- MCP cannot bypass API policy or directly approve trusted memory.

Synthetic fixture example:

```json
{
  "mcp": {
    "toolVisibility": "pass",
    "tokenVisible": false,
    "bypassesApiPolicy": false,
    "agentApprovalAllowed": false
  }
}
```

### Source Update Safety

Future setup checks should prove:

- updates use caller-supplied snapshot files,
- local folder crawling from a prompt is blocked,
- broad private import is blocked by default,
- update output prepares review work only,
- trusted memory delta stays `0`,
- `noAutoPromotion: true` remains visible.

Synthetic fixture example:

```json
{
  "sourceUpdate": {
    "payloadMode": "snapshot",
    "filesSuppliedByCaller": true,
    "localFolderCrawling": false,
    "trustedMemoryRecordDelta": 0,
    "noAutoPromotion": true
  }
}
```

### Mission Control Setup Health

Future Mission Control setup health should show:

- database readiness,
- vector readiness when required,
- API readiness,
- MCP readiness,
- source update safety,
- last setup check result,
- next physical action,
- no-auto-promotion status,
- raw private content hidden.

Mission Control implementation remains out of scope for this PRD.

## Acceptance Criteria

A future implementation unit derived from this PRD must prove:

- owner-hosted setup is the default,
- Source-Wire does not host user memory,
- setup examples are synthetic only,
- setup checks require no real secrets,
- database readiness is represented,
- API readiness is represented,
- MCP readiness is represented,
- source update safety is represented,
- no-auto-promotion is represented,
- trusted memory promotion remains owner or application controlled,
- setup failures include next physical action,
- public safety scan reports no private data,
- claim-boundary scan does not find managed-hosting or production-runtime claims,
- package checks remain green.

## Stop Conditions

Stop and require a separate owner decision if the next step needs:

- production runtime implementation,
- public API server runtime,
- public MCP server runtime,
- database migrations,
- deployment,
- managed hosting,
- npm publishing,
- GitHub release creation,
- public code contribution acceptance,
- real user data,
- real client data,
- raw credentials,
- private local paths,
- AGPLv3 code copying,
- private implementation code copying.

## Related Documents

- [Product Direction](product-direction.md)
- [Public Status](public-status.md)
- [Owner-Hosted Runtime Direction Gate](owner-hosted-runtime-direction-gate.md)
- [Memory Engine Baseline BYO Self-Hosted Setup Path](memory-engine-baseline-byo-self-hosted-setup-path.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Owner-Hosted Setup Issue Slices](owner-hosted-setup-issue-slices.md)
