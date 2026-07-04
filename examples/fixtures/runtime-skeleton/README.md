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

## Smoke

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../docs/quickstart.md).

Run:

```bash
npm run runtime:skeleton-smoke
```

Expected marker:

```text
ok runtime skeleton smoke
```
