# Runtime Readiness Smoke

Status: local synthetic smoke for runtime-readiness gates.

The smoke command validates the runtime-readiness fixture matrix.

It does not start an API server, start an MCP server, connect to a database, run migrations, import sources, deploy services, publish npm, create a GitHub release, copy AGPLv3 code, copy private implementation code, or promote trusted memory.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Command

Run from the repository root:

```bash
npm run runtime-readiness:smoke
```

## What It Verifies

The smoke verifies:

- fixture type is `source-wire-runtime-readiness-fixture-matrix`,
- fixture safety is synthetic,
- all required cases exist,
- runtime work remains `false` for every case,
- blocked cases include shaped failure records,
- API and MCP policy gates are explicit,
- database posture blocks migrations until approval,
- source updates preserve no crawling and no auto-promotion,
- AGPLv3 and private implementation code are not copied,
- release mutation remains blocked.

## Stable Success Markers

The command should print:

```text
ok runtime readiness fixture matrix
ok runtime readiness private proof gate
ok runtime readiness API and MCP policy gates
ok runtime readiness database and source update gates
ok runtime readiness license and release gates
ok runtime readiness smoke
```

## Related Docs

- [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md)
- [Runtime Readiness Contract](../contracts/runtime-readiness-contract.md)
- [Runtime Readiness Implementation Proof](runtime-readiness-implementation-proof.md)
