# Runtime Threat Boundary Smoke

This smoke validates the synthetic trust-boundary package and fixture matrix.

It does not start an API server, start an MCP server runtime, connect to a database, run migrations, deploy services, call live connectors, import real user data, or promote trusted memory automatically.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../docs/getting-started/quickstart.md).

Run:

```bash
npm run runtime:threat-boundary-smoke
```
