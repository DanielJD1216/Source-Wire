# API Policy Contract Smoke

Status: active synthetic smoke.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Command

```bash
npm run runtime:api-policy-smoke
```

## What It Proves

The smoke validates the public-safe synthetic API policy contract fixture matrix.

It proves these cases:

- missing caller denies
- wrong namespace denies
- missing capability denies
- trusted-memory reads include citations
- source-evidence search includes citations and gaps
- context assembly includes citations and gaps
- source maintenance creates only pending candidate evidence
- candidate creation remains pending review
- candidate review does not auto-promote trusted memory
- MCP tool trusted-memory approval denies
- owner-controlled application trusted-memory approval can allow creation
- handoff/status evidence includes provenance
- audit summary omits raw secrets and hidden content
- MCP cannot bypass Source-Wire API policy
- secret-like input is not returned

## What It Does Not Do

- no API server implementation
- no route handlers
- no MCP server runtime implementation
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
