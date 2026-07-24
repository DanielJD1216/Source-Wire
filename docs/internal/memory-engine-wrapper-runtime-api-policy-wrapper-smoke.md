# Source-Wire Memory Engine Wrapper Runtime API Policy Wrapper Smoke

Status: Slice 3 synthetic smoke complete. Production runtime remains blocked.

Date: 2026-07-02

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Purpose

This document records the narrow synthetic owner-hosted API policy wrapper proof for the wrapper runtime unit.

It proves the policy behavior using the [wrapper runtime fixture matrix](../../examples/fixtures/wrapper-runtime/wrapper-runtime-fixture-matrix.json).

It does not add a hosted API server, MCP server, database migration, live connector, real user data, deployment, managed-hosted behavior, or direct `Source-Wire-Memory-Engine` integration.

## Smoke Command

```bash
npm run wrapper-runtime:api-policy-smoke
```

The smoke script lives at:

- [owner-hosted-api-policy-wrapper-smoke.mjs](../../examples/wrapper-runtime/owner-hosted-api-policy-wrapper-smoke.mjs)

## What It Proves

The smoke proof checks:

- authorized trusted-memory read succeeds,
- missing capability fails closed,
- wrong namespace fails closed,
- source evidence remains separate from trusted memory,
- pending candidates do not become trusted memory,
- owner or application-controlled approval path is represented,
- MCP route proof keeps MCP behind Source-Wire API policy,
- runtime adapter result is shaped before returning to MCP,
- stale source evidence produces a gap,
- denied, gap, citation, namespace, caller, and audit metadata are shaped safely.

## Policy Boundary

The proof keeps this path:

```text
Synthetic caller
  -> synthetic owner-hosted API policy wrapper
  -> Source-Wire policy shaping
  -> synthetic result
```

It does not create this path:

```text
MCP adapter -> memory engine -> database
```

## Fixture Inputs

The smoke uses:

- synthetic owner: `owner_demo_wrapper_001`,
- synthetic namespaces: `ns_demo_wrapper_project`, `ns_demo_wrapper_client`,
- synthetic harness callers: `harness_demo_codex`, `harness_demo_owner_app`,
- synthetic source evidence: `source_demo_note_001`,
- synthetic trusted memory: `memory_demo_trusted_001`,
- synthetic pending candidate: `candidate_demo_pending_001`,
- synthetic gap: `gap_demo_stale_source`.

## Safety Invariants

The smoke asserts:

- Source-Wire does not host user memory by default,
- runtime is not included in the package,
- MCP bypass is not allowed,
- AGPLv3 code is not copied,
- real data is not included,
- raw tokens are not returned,
- private paths are not returned,
- restricted content is not leaked,
- `noAutoPromotion` remains true except for the explicit owner or application-controlled approval proof.

## Non-Goals

This smoke does not add:

- API server runtime,
- MCP adapter runtime,
- database migrations,
- runtime adapter implementation,
- memory-engine integration,
- Mission Control UI,
- live connectors,
- deployment,
- real user data,
- npm publishing,
- GitHub release publishing,
- public code contribution acceptance.

## Related Docs

- [Wrapper Runtime Policy Contract](../contracts/wrapper-runtime-policy-contract.md)
- [Source-Wire Memory Engine Wrapper Runtime Fixture Matrix](memory-engine-wrapper-runtime-fixture-matrix.md)
- [Source-Wire Memory Engine Wrapper Runtime Issue Slices](memory-engine-wrapper-runtime-issue-slices.md)
