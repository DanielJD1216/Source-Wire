# MCP Tool Behavior Contract

## Purpose

This contract describes the public behavior boundary for MCP tools in an agent memory system.

The exact implementation can vary, but the tool behavior should preserve source evidence, citations, namespace boundaries, and owner review.

For the future runtime boundary around an owner-hosted API plus MCP server, see the [Owner-Hosted API Plus MCP Boundary Contract](owner-hosted-api-mcp-boundary-contract.md).

## Recommended Tool Groups

### Memory Search

Tools that search trusted memory and return cited answers.

Expected behavior:

- respect namespace boundaries,
- return citations,
- avoid hidden cross-client leakage,
- report gaps when evidence is weak.

### Source Search

Tools that search source evidence directly.

Expected behavior:

- return source-only evidence,
- cite source segments,
- mark stale evidence,
- avoid creating trusted memory automatically.

### Source Maintenance

Tools that sync or maintain source connections.

Expected behavior:

- require explicit caller action,
- report imported, changed, stale, skipped, and error counts,
- prepare review candidates only when policy allows,
- preserve `noAutoPromotion`.

### Second Brain Wrapper

Tools that expose a friendly `/2nd-brain` style interface.

Expected behavior:

- return `second-brain.v1`,
- choose an appropriate search radius,
- include citations and gaps,
- avoid surprise maintenance on read requests.

### Context Assembly

Tools that assemble context for an agent task.

Expected behavior:

- rank evidence,
- cite every important claim,
- distinguish trusted memory from source-only evidence,
- include stale warnings where relevant.

### Handoff

Tools that write or read operational handoff evidence.

Expected behavior:

- preserve what happened,
- link to source or proof artifacts,
- avoid promoting handoff text into trusted memory automatically.

## Owner-Only Actions

Candidate approval and rejection should remain owner-only or application-controlled.

Agents can suggest, search, and assemble evidence. They should not silently approve their own suggestions as trusted memory.

## Synthetic Fixtures

See:

```text
examples/fixtures/
```

The fixtures demonstrate public-safe source and response shapes without real tokens, namespaces, source IDs, database rows, or private data.
