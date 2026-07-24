# Source-Wire Memory Engine Wrapper Runtime PRD

Status: PRD complete. Synthetic wrapper runtime proof unit implemented after exact owner approval. Production runtime remains blocked.

Date: 2026-07-02

## Problem Statement

Source-Wire is intended to become a public BYO owner-hosted memory system, but the current public repo is still a contracts-first package.

The memory-engine baseline audit found that `Source-Wire-Memory-Engine` is useful as a separate runtime candidate, but it cannot be merged or copied into Apache-2.0 Source-Wire as-is because of license, auth, MCP mutation, source evidence, candidate review, and audit gaps.

The owner needs a narrow implementation plan that proves the next real runtime step without accidentally:

- copying AGPLv3 code,
- letting MCP bypass Source-Wire policy,
- adding real data,
- deploying services,
- publishing npm,
- creating a GitHub release,
- accepting public code contributions,
- implying Source-Wire hosts other people's memory.

## Solution

Build a future owner-hosted wrapper runtime unit around a separate runtime candidate.

The wrapper runtime should prove this path:

```text
Agent harness
  -> MCP adapter
  -> Source-Wire owner-hosted API policy wrapper
  -> Source-Wire policy checks
  -> separate runtime adapter if needed
  -> Source-Wire-shaped response
```

Plain English:

```text
MCP is the doorway.
Source-Wire API is the guard.
The memory engine is machinery behind the guard.
```

The wrapper runtime should focus on policy behavior first:

- caller identity,
- harness token capability,
- namespace authorization,
- trusted memory read policy,
- source evidence read policy,
- source maintenance policy,
- candidate preparation,
- owner or application-controlled trusted-memory approval,
- denied-result shaping,
- citation and gap metadata,
- audit metadata,
- runtime adapter boundary.

It should use synthetic fixtures only.

It should not copy code from `Source-Wire-Memory-Engine`.

It should not deploy anything.

It should not connect to real owner data.

## User Stories

1. As a memory owner, I want Source-Wire runtime work to stay owner-hosted first, so that I control where my memory lives.
2. As a memory owner, I want the memory engine kept separate, so that AGPLv3 code is not copied into Apache-2.0 Source-Wire by accident.
3. As a memory owner, I want MCP tools to call a Source-Wire policy wrapper, so that agents cannot bypass owner rules.
4. As a memory owner, I want every call tied to a caller identity, so that I know which harness requested memory.
5. As a memory owner, I want every call tied to a namespace, so that project and client boundaries stay separated.
6. As a memory owner, I want capability-scoped harness tokens, so that each agent gets only the authority it needs.
7. As a memory owner, I want denied requests to fail closed, so that restricted content does not leak.
8. As a memory owner, I want denied responses to include safe reason metadata, so that I can understand what was blocked.
9. As a memory owner, I want source evidence separated from trusted memory, so that imported material does not become fact automatically.
10. As a memory owner, I want candidates to stay pending until approved, so that agents cannot promote their own conclusions.
11. As a memory owner, I want trusted memory approval to be owner or application controlled, so that the trust boundary is explicit.
12. As a memory owner, I want audit metadata for allowed, denied, and partial requests, so that memory access is inspectable.
13. As a memory owner, I want synthetic proof before real data, so that public code does not need my private memory.
14. As a nontechnical owner, I want future Mission Control to show what is connected and what is blocked, so that I do not need to read logs.
15. As a nontechnical owner, I want clear setup boundaries, so that I know I bring my own device, database, keys, sources, and harnesses.
16. As an agent harness, I want stable MCP tools, so that Codex, Claude Code, or another agent can request context consistently.
17. As an agent harness, I want cited results, so that I can explain where memory context came from.
18. As an agent harness, I want gap metadata, so that I know when evidence is missing, stale, weak, or permission-blocked.
19. As an agent harness, I want search radius behavior, so that project, source, and global memory searches stay intentional.
20. As an agent harness, I want source maintenance to preserve `noAutoPromotion`, so that syncing a source never creates trusted memory by surprise.
21. As a developer, I want the API wrapper tested at the highest policy seam, so that implementation details can change without weakening behavior.
22. As a developer, I want the MCP adapter tested as a facade over API policy, so that tool behavior cannot drift into direct runtime access.
23. As a developer, I want the runtime adapter tested separately, so that low-level memory-engine results are shaped before reaching agents.
24. As a developer, I want fixture categories defined before code, so that runtime work starts with testable public-safe examples.
25. As a developer, I want no database migrations in this first wrapper unit, so that storage decisions do not expand the scope.
26. As a reviewer, I want safety and claim-boundary checks to pass, so that docs do not overstate runtime readiness.
27. As a reviewer, I want the license boundary preserved, so that public adopters are not confused about Apache-2.0 versus AGPLv3 code.
28. As a reviewer, I want package checks to remain green, so that the contract package stays usable while runtime work is planned.
29. As a future adopter, I want no Source-Wire-managed hosting implied, so that I understand this is BYO infrastructure.
30. As a maintainer, I want exact stop conditions, so that implementation halts if it needs real data, deployment, release mutation, or copied AGPLv3 code.

## Implementation Decisions

- The next recommended path is `WRAP`, not direct merge, not full rewrite, and not defer.
- Source-Wire remains Apache-2.0.
- `Source-Wire-Memory-Engine` remains a separate runtime candidate.
- No AGPLv3 code, comments, migrations, tests, Docker files, UI components, or implementation structure should be copied into Source-Wire.
- The wrapper runtime unit should start with Source-Wire policy behavior, not storage optimization.
- The API policy wrapper owns auth, namespace, capability, source policy, trusted-memory policy, audit metadata, and response shaping.
- MCP adapters must call the Source-Wire API policy wrapper and must not call the runtime candidate directly.
- Runtime adapters may request low-level retrieval or runtime health from a separate runtime candidate, but cannot own auth, namespace, approval, citation, denied-result, or audit policy.
- Trusted memory promotion remains owner or application controlled.
- Agent-callable tools must not receive trusted-memory approval capability by default.
- Source maintenance must preserve `noAutoPromotion`.
- Denied results must be structured and safe.
- Citations, gaps, caller metadata, namespace metadata, and audit metadata must be first-class response behavior.
- The first wrapper unit should use synthetic fixtures only.
- No real owner memory, client data, private paths, tokens, account IDs, emails, domains, screenshots, production exports, or live connector payloads are allowed.
- Database migrations remain blocked for this PRD.
- Deployment and production runtime use remain blocked for this PRD.
- Mission Control UI implementation remains blocked for this PRD, though future owner-facing status needs should stay visible in the docs.
- Npm publishing, GitHub release creation, tag creation, and public contribution acceptance remain blocked.

## Proposed Test Seams

Use the highest behavior seams first:

1. API policy wrapper seam: request in, policy result out.
2. MCP adapter seam: MCP-shaped tool call in, API-policy-shaped request out, Source-Wire response back.
3. Runtime adapter seam: synthetic runtime result in, shaped Source-Wire result out.
4. Fixture validation seam: synthetic owner, namespace, source, memory, candidate, denial, and MCP cases remain public-safe.
5. Documentation and claim seam: docs must not imply production runtime, managed hosting, deployment, or real memory support.

These seams should be verified before lower-level implementation details.

## Testing Decisions

- Good tests should verify externally visible behavior, not internal helper structure.
- Policy tests should cover allowed, denied, partial, stale, and gap outcomes.
- Namespace tests should prove wrong-namespace access fails closed.
- Capability tests should prove missing capabilities deny mutation and approval actions.
- MCP tests should prove every tool routes through API policy.
- Source evidence tests should prove source-only evidence stays separate from trusted memory.
- Candidate tests should prove candidates remain pending until owner or application approval.
- Approval tests should prove approval creates trusted memory only through the allowed path.
- Audit tests should prove allowed, denied, and partial decisions produce safe metadata.
- Fixture tests should use synthetic data only.
- Public safety scans and claim-boundary scans are required before claiming the wrapper unit is ready.
- Package checks should remain green because Source-Wire is already public as a package.

## Out Of Scope

- Direct merge of `Source-Wire-Memory-Engine`.
- Copying AGPLv3 code into Source-Wire.
- Clean-room full runtime rewrite.
- Database migrations.
- PostgreSQL or pgvector setup.
- Live connectors.
- Real source imports.
- Real user data.
- Real client data.
- Production runtime use.
- Source-Wire-managed hosting.
- Mission Control UI implementation.
- Deployment config.
- Docker or installer bundling with the AGPLv3 runtime.
- Npm publishing.
- GitHub release creation.
- Git tags.
- Public code contribution acceptance.
- Legal advice or final open-source license determination.

## Further Notes

This PRD did not publish a GitHub issue.

Public GitHub issue creation is a mutating action and should wait for exact owner approval.

This PRD did not approve implementation by itself.

Implementation was later approved by the owner for a narrow synthetic wrapper runtime unit with these boundaries:

- keep `Source-Wire-Memory-Engine` separate,
- do not copy AGPLv3 code into Source-Wire,
- use synthetic fixtures only,
- do not add real user data,
- do not deploy services,
- do not publish npm,
- do not create a GitHub release,
- do not accept code contributions,
- do not add managed-hosted behavior,
- keep trusted memory promotion owner or application controlled,
- prevent MCP from bypassing Source-Wire API policy.

The approved synthetic proof unit is now recorded in:

- [Source-Wire Memory Engine Wrapper Runtime Issue Slices](memory-engine-wrapper-runtime-issue-slices.md),
- [Source-Wire Memory Engine Wrapper Runtime Proof Docs And Stop Conditions](memory-engine-wrapper-runtime-proof-docs-stop-conditions.md).

Before any production runtime implementation starts:

1. Convert this PRD into implementation slices.
2. Confirm the slices preserve the no-copy, no-real-data, no-deploy, no-release, no-managed-hosting boundaries.
3. Record exact owner approval for the implementation unit.

The next required owner decision is not this synthetic wrapper proof. It is the owner-hosted runtime direction decision recorded in [Owner-Hosted Runtime Direction Gate](owner-hosted-runtime-direction-gate.md).

## Related Documents

- [Memory Engine Baseline Runtime Implementation Go/No-Go Gate](memory-engine-baseline-runtime-implementation-go-no-go-gate.md)
- [Memory Engine Baseline API And MCP Wrapper Boundary](memory-engine-baseline-api-mcp-wrapper-boundary.md)
- [Memory Engine Baseline Public-Safe Fixtures And Verification Gates](memory-engine-baseline-public-safe-fixtures-and-verification-gates.md)
- [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md)
- [Owner-Hosted API Plus MCP Boundary Contract](../contracts/owner-hosted-api-mcp-boundary-contract.md)
