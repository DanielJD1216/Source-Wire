# Database Posture Fixtures

These fixtures are synthetic only.

They model Source-Wire data classes, lifecycle states, namespace boundaries, deletion and retention behavior, backup and restore risk, and derived data inheritance without adding migrations, database connections, PostgreSQL setup, pgvector setup, runtime services, live connectors, private data, client data, private implementation code, or AGPLv3 code.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../docs/quickstart.md).

Run:

```bash
npm run runtime:database-posture-smoke
```
