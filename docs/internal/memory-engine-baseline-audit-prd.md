# Source-Wire Memory Engine Baseline Audit PRD

Status: PRD draft. Issue publication and implementation remain blocked until owner approval.

## Problem Statement

Source-Wire is intended to become a public BYO, owner-hosted AI memory system, but the public repo is currently a contracts-first Apache-2.0 package.

The runnable memory-engine candidate, `Source-Wire-Memory-Engine`, is separate and AGPLv3. It already has useful runtime behavior, but Source-Wire cannot safely merge or copy it without deciding the license path, adapter boundary, and nontechnical self-hosted user path.

The owner needs a clear audit before deciding whether to keep, wrap, rewrite, or separate the runtime.

## Solution

Run a public-safe memory-engine baseline audit.

The audit should answer:

1. What runtime capabilities already exist in `Source-Wire-Memory-Engine`.
2. Which capabilities map cleanly to Source-Wire public contracts.
3. Which gaps exist between the engine and Source-Wire's owner-hosted API plus MCP boundary.
4. Which license path is safest: AGPLv3 reference runtime, Apache-2.0 rewrite, dual license, or separate packages.
5. What a nontechnical owner setup path should look like for BYO device/server, PostgreSQL-compatible database, model/API keys, sources, and MCP harnesses.
6. What must remain blocked before implementation starts.

Plain English:

```text
Audit and wrap first.
Do not merge AGPLv3 runtime code into Apache-2.0 Source-Wire by accident.
```

## User Stories

1. As a memory owner, I want Source-Wire to become self-hosted software, so that I can run my own memory system without using Jinni's server.
2. As a memory owner, I want the memory-engine baseline audited before implementation, so that we do not build on unclear assumptions.
3. As a memory owner, I want the AGPLv3 runtime kept separate until a license path is chosen, so that Source-Wire stays legally clean.
4. As a memory owner, I want Source-Wire to support BYO PostgreSQL-compatible storage, so that adopters can choose their own database provider.
5. As a memory owner, I want setup steps designed for nontechnical users, so that adoption does not require deep backend knowledge.
6. As a memory owner, I want clear stop conditions, so that runtime work does not quietly add deployment, live connectors, or real user data.
7. As an adopter, I want to understand what Source-Wire currently includes, so that I do not expect a full runtime too early.
8. As an adopter, I want to understand the future runtime path, so that I know where the public project is heading.
9. As an adopter, I want to connect my own agent harnesses, so that Codex, Claude, OpenClaw, or other tools can use the same memory.
10. As an adopter, I want MCP access to go through policy checks, so that agents cannot bypass API permissions.
11. As an agent harness, I want stable API and MCP behavior, so that memory access works consistently across tools.
12. As an agent harness, I want citations and gaps preserved, so that memory answers remain inspectable.
13. As a developer, I want the engine capability map, so that I can see what can be reused, wrapped, or rewritten.
14. As a developer, I want the Source-Wire contract gap map, so that implementation slices do not invent behavior while coding.
15. As a developer, I want a license decision packet, so that runtime code movement has an explicit legal and product basis.
16. As a developer, I want a no-private-data fixture strategy, so that public tests can run safely.
17. As a maintainer, I want issue slices separated by decision risk, so that HITL decisions are not mixed with AFK documentation work.
18. As a maintainer, I want the existing Apache-2.0 package boundary preserved, so that published package expectations remain true.
19. As a reviewer, I want one diagram for repo/runtime/API/MCP/database boundaries, so that I can understand the system quickly.
20. As a reviewer, I want proof that no runtime implementation is approved by this PRD, so that planning does not masquerade as launch.
21. As a future contributor, I want code contribution acceptance to remain blocked, so that contribution terms are not bypassed.
22. As a public user, I want Source-Wire examples to stay synthetic, so that private owner or client data never appears in the repo.

## Implementation Decisions

- The next unit is an audit and planning unit, not an implementation unit.
- `Source-Wire-Memory-Engine` remains separate for now.
- Treat `Source-Wire-Memory-Engine` as an AGPLv3 reference runtime candidate.
- Do not copy AGPLv3 runtime code into Apache-2.0 Source-Wire.
- Use the deterministic Understand pass on `Source-Wire-Memory-Engine` commit `5ecfc82` as baseline evidence.
- Use the existing Source-Wire contracts as the target behavior surface.
- The audit must map engine behavior to owner-hosted API plus MCP policy behavior.
- The audit must include a license path decision packet.
- The audit must include a nontechnical self-hosted setup path.
- The audit must include public-safe fixture and verification requirements.
- The audit must keep managed-hosted operation out of scope.
- The audit must keep real user data out of scope.
- The audit must keep live connectors out of scope.
- The audit must keep database migrations out of scope unless a later implementation unit explicitly approves them.
- Public GitHub issue publication requires a separate explicit owner approval.

## Testing Decisions

- Good tests for this unit are evidence checks, document checks, link checks, safety scans, and boundary checks.
- The audit should be verified against current docs, current package metadata, the rendered diagram pack, and the deterministic Understand artifacts.
- The audit should not require secrets, databases, external APIs, deployment, or live connectors.
- The audit should check that all examples remain synthetic and public-safe.
- The audit should check that runtime implementation remains blocked.
- The audit should check that AGPLv3 code is not copied into Apache-2.0 Source-Wire.
- Later implementation tests should be defined by the audit, not added in this PRD unit.

## Out Of Scope

- Runtime implementation.
- API server implementation.
- MCP server implementation.
- Database migrations.
- PostgreSQL or pgvector setup.
- Memory-engine code copy.
- Mission Control UI.
- Live connectors.
- Deployment.
- Production runtime claims.
- Managed-hosted operation.
- Real user data.
- Client data.
- New npm version.
- New GitHub release or tag.
- Public code contribution acceptance.

## Further Notes

Related planning artifacts:

- [Product Direction](../concepts/product-direction.md)
- [Runtime Boundary](../concepts/runtime-boundary.md)
- [Hosted Runtime PRD](hosted-runtime-prd.md)
- [Memory Engine Baseline Grill Outcome](memory-engine-baseline-grill-outcome.md)
- [Memory Engine Baseline Audit Diagram Pack](diagrams/memory-engine-baseline-audit/README.md)

Current proof input:

- `Source-Wire-Memory-Engine` Understand pass on local commit `5ecfc82`.
- 127 files scanned.
- 14 batches.
- 127 knowledge graph nodes.
- 143 import edges.
- 0 graph validation issues.
