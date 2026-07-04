# Source-Wire Memory Engine Wrapper Runtime Separate Runtime Adapter Boundary Smoke

Status: Slice 5 synthetic smoke complete. Production runtime remains blocked.

Date: 2026-07-02

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Purpose

This document records the narrow synthetic separate runtime adapter proof for the wrapper runtime unit.

It proves that Source-Wire can accept a separate runtime candidate result while keeping policy outside that runtime.

It does not add a runtime server, hosted API server, hosted MCP server, database migration, live connector, real user data, deployment, managed-hosted behavior, Docker bundling, installer bundling, or direct `Source-Wire-Memory-Engine` integration.

## Smoke Command

```bash
npm run wrapper-runtime:runtime-adapter-smoke
```

The smoke script lives at:

- [separate-runtime-adapter-boundary-smoke.mjs](../examples/wrapper-runtime/separate-runtime-adapter-boundary-smoke.mjs)

## What It Proves

The smoke proof checks:

- adapter uses synthetic runtime results only,
- Source-Wire policy remains outside the runtime candidate,
- runtime result is shaped before reaching MCP,
- raw runtime payload is not returned to MCP,
- runtime cannot own auth policy,
- runtime cannot own namespace policy,
- runtime cannot own approval policy,
- runtime cannot own citation policy,
- runtime cannot own denied-result policy,
- runtime cannot own audit policy,
- degraded runtime result becomes a Source-Wire-shaped gap,
- no Docker or installer bundle is added under the wrapper runtime example path.

## Policy Boundary

The proof keeps this path:

```text
Source-Wire API policy wrapper
  -> synthetic runtime adapter
  -> synthetic separate runtime result
  -> Source-Wire-shaped response
```

The proof rejects this responsibility split:

```text
Separate runtime candidate owns auth, namespace, approval, citation, denied-result, or audit policy
```

## Covered Runtime Results

The smoke uses synthetic runtime results from the wrapper fixture matrix:

- `runtime_result_demo_search_001`,
- `runtime_result_demo_degraded_001`.

## Safety Invariants

The smoke asserts:

- `agplCodeCopied` is false,
- `runtimeIncludedInPackage` is false,
- `realDataIncluded` is false,
- every runtime result is synthetic,
- raw runtime payload is not returned to MCP,
- Source-Wire policy is applied after runtime output,
- citations are Source-Wire-shaped,
- runtime degradation becomes a gap,
- raw tokens are not returned,
- private paths are not returned,
- restricted content is not leaked.

## Non-Goals

This smoke does not add:

- runtime implementation,
- runtime adapter implementation beyond the synthetic smoke,
- MCP server runtime,
- API server runtime,
- database migrations,
- memory-engine integration,
- Mission Control UI,
- live connectors,
- deployment,
- real user data,
- Docker bundling,
- installer bundling,
- npm publishing,
- GitHub release publishing,
- public code contribution acceptance.

## Related Docs

- [Wrapper Runtime Policy Contract](contracts/wrapper-runtime-policy-contract.md)
- [Source-Wire Memory Engine Wrapper Runtime Fixture Matrix](memory-engine-wrapper-runtime-fixture-matrix.md)
- [Source-Wire Memory Engine Wrapper Runtime API Policy Wrapper Smoke](memory-engine-wrapper-runtime-api-policy-wrapper-smoke.md)
- [Source-Wire Memory Engine Wrapper Runtime MCP Adapter Policy Routing Smoke](memory-engine-wrapper-runtime-mcp-adapter-policy-routing-smoke.md)
- [Source-Wire Memory Engine Wrapper Runtime Issue Slices](memory-engine-wrapper-runtime-issue-slices.md)
