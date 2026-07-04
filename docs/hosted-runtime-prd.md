# Source-Wire Hosted Runtime PRD

Status: PRD only. Hosted runtime implementation remains blocked.

This PRD defines the future hosted runtime boundary for Source-Wire. It does not add an API server, MCP server runtime, database migrations, deployment config, live connectors, real user data, new npm publishing, a GitHub release, or public code contribution acceptance.

## Problem Statement

Source-Wire is public as a contract package, but agent harnesses eventually need a real owner-controlled memory runtime they can call.

The risk is that runtime work can blur too many boundaries at once: who hosts memory, who can call tools, how namespaces isolate data, what gets stored, what counts as trusted memory, what can be exposed through MCP, and what evidence is safe for a public repo.

The owner needs a PRD that defines those boundaries before any runtime implementation starts.

## Solution

Define a hosted runtime plan that starts owner-hosted first and treats managed-hosted operation as a later, separately approved path.

Plain English ownership rule:

- `hosted runtime` means the memory backend can run somewhere as software.
- `owner-hosted` means each memory owner runs it on their own device, local network, cloud account, or chosen infrastructure.
- The owner brings and pays for their own PostgreSQL database or equivalent storage.
- Source-Wire does not host everyone else's memory by default.
- Managed-hosted or Source-Wire-operated memory would require a separate future approval, threat model, cost model, and implementation unit.

Product direction rule:

- Source-Wire is intended to become the public self-hosted product people can fork, run, and connect to their own tools.
- The current public package is only the contracts-first release, not the full runtime.
- `Source-Wire-Memory-Engine` is a runtime baseline candidate, but its AGPLv3 license posture must be handled before copying runtime code into Apache-2.0 Source-Wire.

The runtime will be planned as two cooperating surfaces:

1. An API server boundary that owns authentication, namespaces, policy checks, audit records, source evidence, candidate creation, and trusted-memory approval rules.
2. An MCP server boundary that exposes agent-callable tools, but cannot bypass the API policy boundary.

The PRD also defines the threat model, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data rules.

## User Stories

1. As a memory owner, I want my memory runtime to be owner-hosted first, so that I control where my data lives.
2. As a memory owner, I want managed-hosted operation to require separate approval, so that Source-Wire does not silently become a SaaS memory host.
3. As a memory owner, I want agents to authenticate before using memory tools, so that unknown callers cannot read or mutate memory.
4. As a memory owner, I want every request scoped to a namespace, so that one project, client, or user cannot leak into another.
5. As a memory owner, I want read, search, maintenance, candidate, and approval actions separated, so that an agent gets only the minimum authority it needs.
6. As a memory owner, I want source evidence to stay separate from trusted memory, so that imported notes or chat logs do not become facts automatically.
7. As a memory owner, I want trusted memory approval to require owner or application control, so that agents cannot promote their own conclusions by default.
8. As an agent harness, I want a stable MCP tool boundary, so that Claude Code, Codex, OpenClaw, or another harness can call the same memory system.
9. As an agent harness, I want MCP tools to preserve citations, gaps, and policy metadata, so that returned context is inspectable.
10. As an agent harness, I want denied results to fail closed, so that permission errors never leak hidden memory content.
11. As a developer, I want the API server contract defined before implementation, so that endpoint scope does not grow accidentally.
12. As a developer, I want the MCP server tool list defined before implementation, so that tool permissions are not invented while coding.
13. As a developer, I want database posture defined before migrations, so that storage choices do not leak into the public package too early.
14. As a developer, I want public-safe fixtures only, so that all examples can run without private owner data.
15. As a reviewer, I want a threat model, so that privacy, namespace, secrets, abuse, and audit risks are visible before implementation.
16. As a reviewer, I want verification gates, so that runtime work cannot claim production readiness without passing the right checks.
17. As a future contributor, I want the contribution boundary to remain blocked, so that feedback and code contribution acceptance are not confused.
18. As a public adopter, I want clear deployment boundaries, so that I know Source-Wire is not running a hosted memory service for me.
19. As a public adopter, I want owner-hosted examples, so that I can understand how to run my own memory system later.
20. As a maintainer, I want stop conditions, so that implementation stops if it requires real data, secrets, deployment, database migrations, or production claims too early.

## Implementation Decisions

- The runtime posture is owner-hosted first.
- Managed-hosted operation is deferred until a separate owner-approved unit.
- The PRD defines runtime behavior only. Runtime code remains blocked.
- The API server owns policy decisions. MCP tools must call through that policy boundary instead of bypassing it.
- The API server plan must define authentication, namespace isolation, caller identity, action authorization, audit metadata, source evidence handling, candidate creation, and trusted-memory approval rules.
- The MCP server plan must define the agent-facing tool list, input and output boundaries, permission requirements, citation behavior, denied-result shape, and error posture.
- Database posture must be explicit before migrations. The PRD may discuss PostgreSQL, pgvector, tenant isolation, backups, retention, and rollback, but must not add migrations.
- Public fixtures must be synthetic. They may model users, namespaces, projects, sources, candidates, and memory records, but cannot include real owner, client, local, account, email, domain, token, financial, or production data.
- Trusted Memory Record auto-promotion remains blocked.
- Live connectors remain blocked.
- Mission Control UI remains blocked.
- New npm publishing, GitHub releases, tags, and deployment remain blocked.
- Code contribution acceptance remains blocked.

## Testing Decisions

- Good tests should verify visible behavior: permission outcomes, namespace isolation, citation preservation, no-auto-promotion, denied-result shape, audit metadata, and public-safety boundaries.
- PRD verification should start with document and marker checks before implementation exists.
- Runtime implementation tests, when separately approved later, should run without secrets and without external services unless that later unit explicitly opens them.
- Public fixtures should be used as the test seam before any real database or deployment seam.
- Owner-side live checks should remain outside CI if they require GitHub, npm, or network authentication.

## Threat Model

The hosted runtime plan must cover:

- unauthorized callers,
- over-permitted agents,
- cross-namespace reads,
- cross-tenant data exposure,
- source evidence mistaken for trusted memory,
- agent-controlled trusted-memory promotion,
- prompt-injection through imported source content,
- secrets or local paths entering public fixtures,
- audit gaps,
- stale or deleted source data,
- managed-hosted operator access,
- backup and restore leakage,
- deployment misconfiguration,
- MCP tool bypass of API policy.

## Verification Gates

The PRD is complete only when it defines:

- owner-hosted versus managed-hosted boundary,
- API server scope and non-goals,
- MCP server scope and non-goals,
- authentication and namespace model,
- database posture,
- deployment boundary,
- public-safe fixture strategy,
- no-private-data requirements,
- threat model,
- stop conditions,
- future implementation slice map,
- checks required before any implementation starts.

The runtime-readiness matrix and runtime-proof-intake smoke are now required companion gates for any future implementation decision. They must stay green before runtime work starts:

```bash
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
```

Before implementation starts later, run:

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

```bash
npm run publish:readiness
npm run world:share-final-preflight
npm run runtime:prd-decision-preflight
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run owner:decision-status
```

## Out Of Scope

- API server implementation.
- MCP server runtime implementation.
- Database migrations.
- PostgreSQL or pgvector setup.
- Memory-engine integration.
- Live connectors.
- Mission Control UI.
- Deployment.
- Production runtime use.
- Real user data.
- Client data.
- Trusted Memory Record auto-promotion.
- New npm package version.
- New GitHub release or tag.
- Public code contribution acceptance.
- DCO or CLA enforcement.

## Further Notes

Issue `#257` records exact owner approval for this PRD path only.

The next step after this PRD is to approve the implementation slice map. Creating implementation issues does not approve implementation by itself. Each later implementation unit must keep the same no-private-data and no-deployment boundary unless the owner explicitly opens a narrower path.

Related docs:

- [Hosted Runtime PRD Preparation](hosted-runtime-prd-preparation.md)
- [Hosted Runtime PRD Execution Packet](hosted-runtime-prd-execution-packet.md)
- [Hosted Runtime PRD Decision Preflight](hosted-runtime-prd-decision-preflight.md)
- [Runtime Boundary](runtime-boundary.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md)
- [Runtime Readiness Smoke](runtime-readiness-smoke.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
