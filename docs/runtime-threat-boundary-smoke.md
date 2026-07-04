# Runtime Threat Boundary Smoke

Status: active synthetic smoke.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Command

```bash
npm run runtime:threat-boundary-smoke
```

## What It Proves

The smoke validates the public-safe synthetic trust-boundary fixture matrix.

It proves these cases:

- unauthorized callers deny
- cross-namespace access denies
- missing capability denies
- source evidence does not auto-promote to trusted memory
- prompt injection cannot override policy
- secret-like values are not returned
- missing audit metadata denies
- backup and restore namespace drift denies
- public exposure without policy denies
- MCP cannot bypass Source-Wire API policy
- MCP tool trusted-memory approval denies
- owner-controlled application trusted-memory approval can allow creation

## What It Does Not Do

- no API server implementation
- no MCP server runtime implementation
- no database migrations
- no database connection
- no PostgreSQL or pgvector setup
- no live connectors
- no Mission Control UI
- no deployment config
- no hosted services
- no managed hosting
- no real user data
- no client data
- no private implementation code
- no AGPLv3 code
- no automatic trusted memory promotion
