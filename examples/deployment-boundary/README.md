# Source-Wire Deployment Boundary Smoke

Status: local smoke for synthetic deployment-boundary fixtures.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../docs/getting-started/quickstart.md).

## Direct Answer

This example validates the synthetic deployment-boundary fixture matrix.

It proves Source-Wire can document deployment readiness boundaries without shipping deployment config, hosted services, database setup, runtime services, live connectors, private data, or automatic trusted memory promotion.

## Run

```bash
npm run runtime:deployment-boundary-smoke
```

## Expected Marker

```text
ok deployment boundary smoke
```

## Boundary

The smoke asserts:

- Source-Wire does not host user memory,
- MCP cannot bypass Source-Wire API policy,
- managed hosting remains deferred,
- deployment config remains blocked,
- hosted services remain blocked,
- rollback evidence is explicit,
- unsafe hosting claims are blocked,
- trusted memory promotion remains owner or application controlled.
