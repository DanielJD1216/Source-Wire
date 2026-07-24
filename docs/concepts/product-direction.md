# Source-Wire Product Direction

Status: future product direction. Current runtime implementation remains blocked.

Source-Wire's intended end state is a public BYO, owner-hosted AI memory system.

Plain English:

- Source-Wire should become the public version of the same memory-system idea proven first in a private owner instance.
- People should be able to fork or clone it, run it on their own device, server, local network, or cloud account, and connect their own tools.
- Each owner should bring their own database, model/API keys, data sources, MCP-capable agent harnesses, and private runtime configuration.
- Source-Wire should not host everyone else's memory by default.
- Managed-hosted operation remains a separate later product path, not the default open-source path.

## Current State

The current public repository is not that full product yet.

Current Source-Wire includes:

- Apache-2.0 contracts,
- JSON schemas,
- public-safe synthetic fixtures,
- TypeScript validation helpers,
- a minimal synthetic in-memory runtime boundary,
- npm package `@source-wire/contracts@0.1.0`,
- GitHub release `v0.1.0`.

Current Source-Wire does not include:

- a hosted or production API service,
- a hosted or production MCP service,
- non-disposable or production database migrations,
- Mission Control UI,
- live source connectors,
- memory-engine integration,
- deployment,
- production runtime use,
- real user data.

## Why This Exists

The first public package was intentionally conservative. It created clean contracts, fixtures, release gates, and public-safety boundaries before exposing runtime behavior.

That first step should not be confused with the final product goal.

The final product goal is:

```text
Source-Wire = public self-hosted memory system that adopters can run with their own infrastructure.
```

## Runtime Baseline

`DanielJD1216/Source-Wire-Memory-Engine` is the current memory-engine baseline candidate.

It is a fork/rebrand of the Open-RLM-Memory style runtime and currently carries an AGPLv3 license posture.

That means it can inform the implementation path, but its code should not be copied into Apache-2.0 Source-Wire without a deliberate license decision, dual-license plan, or clean rewrite.

## Next Strategic Gate

Before Source-Wire becomes the runnable self-hosted product, run a focused audit that answers:

1. Which parts of `Source-Wire-Memory-Engine` should remain the runtime baseline?
2. Which Source-Wire contracts must the runtime implement?
3. What is the license path: AGPLv3 runtime, Apache-2.0 rewrite, dual licensing, or separate reference implementation?
4. What setup path lets a nontechnical owner run it with their own device/server and PostgreSQL-compatible database?
5. What must stay blocked until public safety, namespace isolation, auth, audit, and no-private-data gates are green?

Current audit package:

- [Memory Engine Baseline Grill Outcome](../internal/memory-engine-baseline-grill-outcome.md)
- [Memory Engine Baseline Audit PRD](../internal/memory-engine-baseline-audit-prd.md)
- [Memory Engine Baseline Audit Issue Slices](../internal/memory-engine-baseline-audit-issue-slices.md)
- [Memory Engine Baseline Issue Publication Approval Request](../internal/memory-engine-baseline-issue-publication-approval-request.md)
- [Memory Engine Baseline Audit Diagram Pack](../internal/diagrams/memory-engine-baseline-audit/README.md)

## Hard Boundaries

Do not treat this direction doc as approval to implement runtime behavior.

Still blocked until separately approved:

- hosted runtime implementation,
- API server runtime,
- MCP server runtime,
- database migrations,
- Mission Control UI,
- live connectors,
- deployment,
- production runtime use,
- real user data,
- code contribution acceptance,
- new npm publishing,
- new GitHub releases or tags.
