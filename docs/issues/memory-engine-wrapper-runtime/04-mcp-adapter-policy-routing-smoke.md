# MCP Adapter Policy Routing Smoke

## Parent

Source-Wire Memory Engine Wrapper Runtime PRD.

## What to build

Implement the narrowest MCP adapter proof that maps MCP-shaped tool calls to the Source-Wire API policy wrapper and never calls the runtime candidate directly.

## Acceptance criteria

- [ ] MCP-shaped tool calls are mapped to API policy requests.
- [ ] MCP preserves citations, gaps, denied counts, namespace metadata, and caller metadata.
- [ ] Maintenance-like calls preserve `noAutoPromotion`.
- [ ] MCP cannot approve trusted memory by default.
- [ ] Tests prove no direct memory-engine save/delete path is exposed.

## Blocked by

- Owner-Hosted API Policy Wrapper Smoke.
