# MCP Adapter Policy Routing Smoke

Local artifact: [Source-Wire Memory Engine Wrapper Runtime MCP Adapter Policy Routing Smoke](../../memory-engine-wrapper-runtime-mcp-adapter-policy-routing-smoke.md).

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../getting-started/quickstart.md).

Smoke command:

```bash
npm run wrapper-runtime:mcp-adapter-smoke
```

## Parent

Source-Wire Memory Engine Wrapper Runtime PRD.

## What to build

Implement the narrowest MCP adapter proof that maps MCP-shaped tool calls to the Source-Wire API policy wrapper and never calls the runtime candidate directly.

## Acceptance criteria

- [x] MCP-shaped tool calls are mapped to API policy requests.
- [x] MCP preserves citations, gaps, denied counts, namespace metadata, and caller metadata.
- [x] Maintenance-like calls preserve `noAutoPromotion`.
- [x] MCP cannot approve trusted memory by default.
- [x] Tests prove no direct memory-engine save/delete path is exposed.

## Blocked by

- Owner-Hosted API Policy Wrapper Smoke.
