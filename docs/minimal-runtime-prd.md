# Source-Wire Minimal Runtime PRD

Status: public PRD package plus minimal synthetic in-memory runtime boundary. Hosted runtime implementation is still blocked.

## Goal

Define the first minimal Source-Wire runtime lane as an owner-hosted API plus MCP boundary.

The goal is to prove the agent-facing memory policy boundary with synthetic data only, without adding database migrations, storage schema, Mission Control UI, deployment, npm publishing, or real source ingestion.

## User Problem

Agent harnesses need a stable way to ask a memory system for context without letting the agent bypass owner policy, cross namespaces, silently trust source evidence, or promote memory without review.

Contracts and fixtures already define that shape. Unit 236 adds a minimal runtime boundary that exercises those contracts through synthetic owner-hosted API policy behavior and an MCP-facing facade.

## Current Evidence

Source-Wire already includes:

- public contracts,
- TypeScript contract types,
- four schema-backed synthetic fixture lanes,
- a validation CLI,
- public safety scan,
- package readiness checks,
- synthetic runtime-boundary smoke examples,
- a minimal exported synthetic runtime boundary,
- a minimal runtime smoke command,
- installed package smokes,
- owner-hosted API plus MCP boundary proof cases.

The owner-hosted API plus MCP boundary fixture is schema-backed and validated by the CLI.

## Runtime Lane

The first runtime lane is:

```text
owner-hosted API boundary
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

## Unit 236 Implementation

Unit 236 adds:

- minimal public synthetic API policy boundary code,
- minimal public MCP-facing boundary code,
- synthetic in-memory fixtures,
- synthetic request and response proof handling,
- namespace and permission checks,
- no-auto-promotion checks,
- source evidence versus trusted memory checks,
- local smoke tests that run without secrets,
- package readiness wiring.

## Out Of Scope

The first runtime implementation must not add:

- database migrations,
- PostgreSQL or pgvector setup,
- storage schema,
- memory-engine integration,
- live connectors,
- local filesystem crawling,
- Mission Control UI,
- deployment automation,
- npm publishing,
- GitHub release publishing,
- license changes,
- real user data,
- private implementation code.

## Acceptance Criteria

A later implementation unit must prove:

- owner-hosted boundary is explicit,
- Source-Wire does not host user memory,
- all runtime examples are synthetic,
- no secrets are required,
- missing permission fails closed,
- wrong namespace fails closed without leaking content,
- source evidence remains cited evidence,
- trusted memory is clearly marked as approved memory,
- pending candidates do not become trusted memory,
- trusted-memory approval is owner or application controlled,
- MCP tools call the API boundary instead of bypassing policy,
- audit-friendly metadata includes caller, namespace, action, and result,
- source maintenance preserves `noAutoPromotion`,
- public safety scan has 0 high, 0 medium, and 0 low findings,
- package readiness remains green.

## Synthetic Proof Matrix

| Case | Required behavior |
| --- | --- |
| Authorized read | Allowed synthetic caller can read permitted synthetic memory or source evidence. |
| Unauthorized read | Missing or invalid permission fails closed. |
| Wrong namespace | Cross-namespace access is denied without leaked content. |
| Source evidence search | Source-only evidence is cited and not treated as trusted memory. |
| Source maintenance | Maintenance preserves `noAutoPromotion`. |
| Pending candidate | Candidate creation does not create trusted Memory Records. |
| Trusted-memory approval | Approval requires owner or application control. |
| MCP boundary | MCP tools call API policy instead of bypassing it. |
| Audit metadata | Results preserve caller, namespace, action, and result metadata. |

## Hosted Runtime Remains Blocked

This PRD package now has a minimal synthetic implementation.

Before hosted runtime code is added, a later public implementation unit must open exact issue slices, list exact files, run public safety checks, and keep the no-go conditions above intact.

The latest private-proof metadata bridge for that future unit is [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md). It keeps runtime implementation blocked until exact owner approval.

The exact future implementation packet is [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md).

## Related Docs

- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Minimal Runtime Issue Slices](minimal-runtime-issue-slices.md)
- [Minimal Runtime Implementation Scope](minimal-runtime-implementation-scope.md)
- [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md)
- [Runtime Skeleton Issue Slices](runtime-skeleton-issue-slices.md)
- [Minimal Synthetic Runtime Boundary](../examples/minimal-runtime/README.md)
- [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Owner-hosted API plus MCP boundary fixture](../examples/fixtures/owner-hosted-api-mcp-boundary/)
