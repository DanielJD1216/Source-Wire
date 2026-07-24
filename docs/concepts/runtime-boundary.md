# Source-Wire Runtime Boundary

The published Source-Wire package is a public contracts package. Latest source also contains one unpublished local Alpha 1 Stories 1 and 2 runtime workspace.

It is not a full memory backend, hosted service, or production runtime.

## Included In The Current Public Package

- Public contract documentation.
- TypeScript contract types.
- JSON schemas.
- JSON schema package exports.
- Synthetic fixtures.
- Validation CLI.
- TypeScript examples.
- Package readiness checks.
- Installed-package smoke checks.
- Public extraction checklist.
- Public adopter walkthrough.
- Public architecture map.
- Package metadata.
- A TypeScript package boundary.

## Not Included Yet

- Hosted or production API server.
- Hosted or production MCP service.
- Trusted-memory search, correction, supersession, or revocation.
- Production PostgreSQL setup or pgvector.
- Memory-engine fork code.
- Mission Control UI.
- Live connectors.
- Private implementation modules.
- Real user data.
- Trusted Memory Record promotion.

## Included In Latest Source Only

`apps/alpha1-runtime/` adds local developer-alpha Stories 1 and 2 that are not part of `@source-wire/contracts@0.1.0`:

- Hono API bound only to literal loopback addresses.
- Exact forward-only PostgreSQL 16 migration chain.
- Separate migration and runtime role posture.
- Fresh initialization of one explicit owner and two or more explicit namespaces.
- One-time owner-admin and harness credentials backed by an external-keyed verifier.
- Retry-safe credential issue, rotation, and revocation with a five-minute encrypted exact-replay window.
- Streaming 16 KiB request bounds, bounded query validation, and literal loopback-address request limits.
- Content-free liveness and authenticated health.
- One official-SDK stdio MCP process exposing only `propose_memory_candidate`.
- Pending candidate persistence with owner-assertion or active prior-memory provenance.
- Metadata-first owner review and owner-controlled approval or rejection.
- Durable lifecycle idempotency, atomic audit, and one-winner decision concurrency.
- Generated disposable real-process conformance with explicit child, connection, session, role, and database cleanup proof.

Read [Alpha 1 Story 1 Local Runtime](../getting-started/alpha1-story1-local-runtime.md) and [Alpha 1 Story 2 Candidate Approval](../getting-started/alpha1-story2-candidate-approval.md) before running it. It is synthetic-data-only and does not authorize deployment, hosting, production use, real data, trusted-memory search, correction, or revocation.

For the whole package shape, read the [Architecture Map](architecture-map.md).

For a practical first pass through the current package, read the [Public Adopter Walkthrough](../getting-started/adopter-walkthrough.md).

For the current runtime posture, read the [Public Runtime Decision](../internal/public-runtime-decision.md).

Before adding runtime files, read the [Runtime Implementation Gate](../internal/runtime-implementation-gate.md).

For the future owner-hosted API plus MCP boundary, read the [Owner-Hosted API Plus MCP Boundary Contract](../contracts/owner-hosted-api-mcp-boundary-contract.md).

## Why This Boundary Exists

Source-Wire is meant to become reusable infrastructure for agent memory systems.

The safest first step is to make the public contracts testable before shipping runtime behavior. Runtime code carries heavier decisions:

- storage model,
- auth and namespace boundaries,
- memory-engine licensing,
- connector permissions,
- owner review workflow,
- deployment shape.

Those decisions should be opened by later PRDs, not hidden inside the first package skeleton.

## Current Package Promise

The package can define public shapes, expose contract types and schemas, validate public fixtures, typecheck public examples, and prove package readiness from a local tarball.

The published contracts package should not:

- connect to databases,
- start servers,
- call external APIs,
- import private implementation code,
- crawl local files,
- promote trusted memory automatically.

## Next Safe Expansion

Story 2 stops after pending proposal plus owner approval or rejection into the first immutable revision. Trusted-memory search, correction, revocation, provider transport, export, deployment, and release work require their own approved stories and evidence gates.

The current runtime decision is recorded in [Public Runtime Decision](../internal/public-runtime-decision.md).

The current runtime implementation gate is recorded in [Runtime Implementation Gate](../internal/runtime-implementation-gate.md).

The memory-engine baseline audit path is recorded in:

- [Memory Engine Baseline Grill Outcome](../internal/memory-engine-baseline-grill-outcome.md)
- [Memory Engine Baseline Audit PRD](../internal/memory-engine-baseline-audit-prd.md)
- [Memory Engine Baseline Audit Issue Slices](../internal/memory-engine-baseline-audit-issue-slices.md)
- [Memory Engine Baseline Audit Diagram Pack](../internal/diagrams/memory-engine-baseline-audit/README.md)

Any runtime PRD must keep this trust boundary:

```text
Source evidence is not trusted memory.
Trusted memory requires an owner or application approval path.
```
