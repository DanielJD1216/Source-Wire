# Hosted Runtime Fixture Smoke

This smoke validates the synthetic hosted-runtime fixture package and fixture matrix.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../docs/quickstart.md).

It does not start an API server, start an MCP server, connect to a database, create migrations, set up PostgreSQL or pgvector, run live connectors, deploy services, publish npm, create a GitHub release, load real user data, or promote trusted memory automatically.

Run:

```bash
npm run runtime:fixture-smoke
```
