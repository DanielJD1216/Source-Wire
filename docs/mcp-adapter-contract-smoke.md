# MCP Adapter Contract Smoke

Status: active synthetic smoke.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Command

```bash
npm run runtime:mcp-adapter-smoke
```

## What It Proves

The smoke validates the public-safe synthetic MCP adapter contract fixture matrix.

It proves these cases:

- MCP tool declarations exist for the public contract surface
- trusted-memory search routes through API policy
- source-evidence search preserves citations and gaps
- context assembly preserves citations and gaps
- candidate review does not approve trusted memory
- source maintenance creates no trusted memory
- handoff and status evidence keeps audit metadata
- missing caller denies
- missing owner denies
- missing namespace denies
- missing capability denies through API policy
- wrong namespace denies through API policy
- direct database access is blocked
- direct runtime adapter access is blocked
- MCP tool trusted-memory approval denies
- owner-controlled application trusted-memory approval can allow creation through API policy

## What It Does Not Do

- no MCP server runtime implementation
- no API server implementation
- no route handlers
- no database migrations
- no database connection
- no PostgreSQL or pgvector setup
- no runtime adapter implementation
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
