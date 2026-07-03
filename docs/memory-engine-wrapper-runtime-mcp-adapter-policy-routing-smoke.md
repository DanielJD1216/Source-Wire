# Source-Wire Memory Engine Wrapper Runtime MCP Adapter Policy Routing Smoke

Status: Slice 4 synthetic smoke complete. Runtime implementation remains blocked for later slices.

Date: 2026-07-02

## Purpose

This document records the narrow synthetic MCP adapter proof for the wrapper runtime unit.

It proves that MCP-shaped tool calls are mapped into Source-Wire API policy requests instead of calling any runtime candidate directly.

It does not add a hosted MCP server, hosted API server, database migration, live connector, real user data, deployment, managed-hosted behavior, or direct `Source-Wire-Memory-Engine` integration.

## Smoke Command

```bash
npm run wrapper-runtime:mcp-adapter-smoke
```

The smoke script lives at:

- [mcp-adapter-policy-routing-smoke.mjs](../examples/wrapper-runtime/mcp-adapter-policy-routing-smoke.mjs)

## What It Proves

The smoke proof checks:

- MCP-shaped `search_memory` maps to an API policy request,
- MCP-shaped `search_sources` maps to an API policy request,
- MCP-shaped source maintenance preserves `noAutoPromotion`,
- citations survive MCP-to-API shaping,
- namespace metadata survives MCP-to-API shaping,
- caller metadata survives MCP-to-API shaping,
- denied counts are preserved for blocked operations,
- MCP cannot approve trusted memory by default,
- MCP does not expose direct memory-engine `save_memory`,
- MCP does not expose direct memory-engine `delete_memory`.

## Policy Boundary

The proof keeps this path:

```text
Synthetic MCP tool call
  -> synthetic MCP adapter
  -> synthetic Source-Wire API policy request
  -> synthetic Source-Wire-shaped response
```

It forbids this path:

```text
Synthetic MCP tool call
  -> memory engine save_memory or delete_memory
```

## Covered MCP Cases

The smoke uses synthetic calls from the wrapper fixture matrix:

- `mcp_call_demo_search_memory`,
- `mcp_call_demo_search_sources`,
- `mcp_call_demo_maintain_source`,
- `mcp_call_demo_approve_trusted_memory_denied`,
- `mcp_call_demo_save_memory_forbidden`,
- `mcp_call_demo_delete_memory_forbidden`.

## Safety Invariants

The smoke asserts:

- every allowed MCP call routes through `mcp_adapter_to_source_wire_api_policy`,
- runtime direct calls are false,
- memory-engine save/delete exposure is false,
- raw tokens are not returned,
- private paths are not returned,
- restricted content is not leaked,
- approval remains blocked for MCP by default,
- maintenance-like MCP calls can prepare candidates but cannot create trusted memory.

## Non-Goals

This smoke does not add:

- MCP server runtime,
- API server runtime,
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

- [Wrapper Runtime Policy Contract](contracts/wrapper-runtime-policy-contract.md)
- [Source-Wire Memory Engine Wrapper Runtime Fixture Matrix](memory-engine-wrapper-runtime-fixture-matrix.md)
- [Source-Wire Memory Engine Wrapper Runtime API Policy Wrapper Smoke](memory-engine-wrapper-runtime-api-policy-wrapper-smoke.md)
- [Source-Wire Memory Engine Wrapper Runtime Issue Slices](memory-engine-wrapper-runtime-issue-slices.md)
