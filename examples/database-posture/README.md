# Database Posture Smoke

This smoke validates the synthetic database posture contract package and fixture matrix.

It does not create migrations, open database connections, set up PostgreSQL or pgvector, start API or MCP runtimes, deploy services, call live connectors, import real user data, or promote trusted memory automatically.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../docs/quickstart.md).

Run:

```bash
npm run runtime:database-posture-smoke
```
