# Runtime Readiness Fixture Matrix

This fixture is synthetic.

It records what must be true before public owner-hosted runtime implementation can start.

It does not add API server runtime, MCP server runtime, database migrations, database connections, live connectors, deployment, managed hosting, real user data, copied AGPLv3 code, copied private implementation code, package publishing, GitHub release creation, or automatic trusted memory promotion.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../docs/quickstart.md).

Validate the fixture with:

```bash
npm run runtime-readiness:smoke
```
