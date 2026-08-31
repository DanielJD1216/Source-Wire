# Runtime Skeleton Fixture Matrix

This fixture matrix is synthetic.

It proves the future owner-hosted runtime skeleton shape without adding:

- production API runtime,
- production MCP runtime,
- database migrations,
- real database connections,
- live connectors,
- local folder crawling,
- Mission Control UI,
- deployment,
- managed hosting,
- real user data,
- client data,
- AGPLv3 code,
- private implementation code,
- automatic trusted memory promotion.

The `mcp_context_capture_source_only` fixture proves that a valid synthetic capture request routes through MCP to owner-hosted API policy and returns a bounded source citation, server-derived digest, and freshness cutoff. The fixture matrix is stateless. Sequential append, replay, conflict, denial, validation, and owner-scoped source-evidence search behavior is covered by `runtime:context-inbox-smoke`.

## Smoke

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../docs/getting-started/quickstart.md).

Run:

```bash
npm run runtime:skeleton-smoke
npm run runtime:context-inbox-smoke
```

Expected marker:

```text
ok runtime skeleton smoke
ok runtime context inbox smoke
```
