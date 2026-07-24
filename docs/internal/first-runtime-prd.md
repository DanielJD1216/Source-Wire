# Source-Wire First Runtime PRD Package

Status: proposed runtime PRD package only. No runtime implementation is included.

## Purpose

This document defines the first runtime lane that Source-Wire may implement later.

It does not approve runtime implementation by itself.

A later implementation unit must still open explicit issue slices before adding runtime files.

## Proposed First Runtime Goal

The first runtime goal is a narrow owner-hosted API plus MCP boundary that proves the agent-facing memory workflow without locking database schema, deployment, Mission Control UI, live connectors, or npm publishing.

The proposed runtime should show how an owner-controlled service boundary and an MCP tool boundary would work together using synthetic data only.

## Proposed Runtime Lane

```text
Owner-hosted API boundary
  -> validates caller and namespace
  -> receives synthetic requests
  -> returns cited synthetic responses
  -> keeps source evidence separate from trusted memory
  -> never auto-promotes trusted memory

MCP tool boundary
  -> exposes agent-callable tool shapes
  -> calls the owner-hosted API boundary
  -> preserves permission and citation metadata
  -> never bypasses API policy
```

## Later Implementation May Add

A later implementation unit may propose these public-safe surfaces:

- a minimal owner-hosted API example boundary,
- a minimal MCP tool boundary example,
- synthetic request and response fixtures,
- synthetic namespace and permission examples,
- synthetic source evidence and trusted-memory examples,
- no-auto-promotion proof cases,
- local-only smoke proof instructions that run without secrets.

The implementation must keep examples synthetic and must not imply Source-Wire hosts memory.

## Later Implementation Must Not Add

The first runtime implementation must not include:

- database migrations,
- PostgreSQL or pgvector setup,
- storage schema approval,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- deployment automation,
- npm publishing,
- GitHub release publishing,
- license changes,
- real user data,
- private implementation code.

## Minimum API Boundary Behavior

A future API boundary should prove:

| Behavior | Requirement |
| --- | --- |
| Caller validation | Missing or invalid synthetic permission fails closed. |
| Namespace validation | Wrong-namespace access fails closed without leaking content. |
| Source evidence read | Source evidence is cited as evidence only. |
| Trusted memory read | Trusted memory is clearly marked as approved memory. |
| Candidate creation | Pending candidates do not become trusted memory. |
| Approval boundary | Trusted-memory approval is owner or application controlled. |
| Audit metadata | Responses include caller, namespace, action, and result metadata. |

## Minimum MCP Boundary Behavior

A future MCP boundary should prove:

| Behavior | Requirement |
| --- | --- |
| Tool calls | MCP tools call the API boundary instead of bypassing policy. |
| Read tools | Read requests do not require mutation permission. |
| Source maintenance | Maintenance preserves `noAutoPromotion`. |
| Update tools | Update requests require explicit source payloads. |
| Wrong namespace | Denied evidence is counted without leaking content. |
| Cited response | Tool results preserve citations and gaps. |

## Required Synthetic Proof Cases

The first runtime implementation must cover:

- authorized read,
- unauthorized read,
- wrong-namespace denial,
- source evidence search with citations,
- source maintenance with `noAutoPromotion`,
- pending candidate creation without trusted Memory Record promotion,
- trusted-memory approval through owner or application control,
- audit-friendly metadata,
- public safety scan with zero high, medium, or low findings.

The existing [owner-hosted API plus MCP boundary fixture](../../examples/fixtures/owner-hosted-api-mcp-boundary) is the starting proof vocabulary.

The local [synthetic runtime boundary example](../../examples/runtime-boundary) demonstrates this vocabulary without starting a server.

## Go Criteria

A later runtime implementation unit may start only if:

- the implementation stays within owner-hosted API plus MCP boundary,
- examples are synthetic,
- no secrets are required,
- namespace isolation is represented,
- source evidence and trusted memory remain separate,
- trusted memory is never created automatically,
- MCP tools cannot bypass API policy,
- future npm versions remain blocked unless a future approved release execution path is completed.

## No-Go Criteria

Runtime implementation should not start if:

- real data is required,
- secrets are required,
- local filesystem crawling is implied,
- Source-Wire-hosted memory is implied,
- database migrations are required,
- storage schema approval is required,
- Mission Control UI is required,
- deployment or publish behavior is bundled in,
- agent-controlled trusted-memory approval is included by default.

## Success Criteria For The Later Implementation Unit

A later implementation unit should pass:

- local docs link check,
- readiness report,
- publish readiness,
- public safety scan,
- package checks,
- synthetic runtime proof cases,
- remote GitHub Actions Package Checks.

It should also prove no real data, no secrets, no npm publish, no GitHub release, no deployment, and no trusted Memory Record auto-promotion.

## Current Decision

This PRD package is ready for a later owner-approved runtime implementation unit.

Runtime implementation remains blocked until that unit is opened.

The current public PRD package for that next planning step is [Minimal Runtime PRD](minimal-runtime-prd.md).

## Related Docs

- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Public Runtime Decision](public-runtime-decision.md)
- [Minimal Runtime PRD](minimal-runtime-prd.md)
- [Minimal Runtime Issue Slices](minimal-runtime-issue-slices.md)
- [Minimal Runtime Implementation Scope](minimal-runtime-implementation-scope.md)
- [Owner-Hosted API Plus MCP Boundary Contract](../contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Owner-hosted API plus MCP boundary fixture](../../examples/fixtures/owner-hosted-api-mcp-boundary)
