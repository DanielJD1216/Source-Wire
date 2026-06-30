# Minimal Synthetic Runtime Boundary

This example proves the first Source-Wire runtime boundary as synthetic in-memory code.

It does not start a server, connect to a database, run a real MCP server, crawl files, store user memory, or promote trusted memory automatically.

## What It Uses

- exported package code from `src/runtime/minimal-boundary.ts`,
- the schema-backed owner-hosted API plus MCP boundary fixture,
- local synthetic proof cases only.

## Command

Use Node.js 22 with npm from the repository root. For the complete setup path, read the [Quickstart](../../docs/quickstart.md).

Install dependencies first:

```bash
npm install
```

Run the smoke:

```bash
npm run minimal-runtime:smoke
```

## Expected Marker

```text
ok minimal runtime boundary smoke
```

## Boundary

This example proves policy behavior only:

- MCP-facing calls go through owner-hosted API policy logic.
- Missing capabilities fail closed.
- Wrong namespace access fails closed.
- Source evidence stays cited evidence.
- Pending candidates stay pending.
- Trusted-memory approval requires owner or application control.

Source-Wire still does not host user memory.
