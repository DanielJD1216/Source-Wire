# Synthetic Runtime Boundary Example

This example is fictional and synthetic.

It models the first proposed owner-hosted API plus MCP runtime boundary without starting a server.

It is not a production runtime.

It is not exported from the package root.

It is not schema-validated by the current CLI.

## Run The Smoke Proof

```bash
npm run runtime-boundary:smoke
```

Expected output:

```text
ok synthetic runtime boundary smoke
```

Underlying local command:

```bash
node examples/runtime-boundary/synthetic-boundary-smoke.mjs
```

Installed package smoke:

```bash
npm run runtime-boundary:installed-smoke
```

## What It Proves

The smoke proof checks:

- authorized read,
- unauthorized read,
- wrong-namespace denial,
- source evidence remains evidence only,
- source maintenance preserves `noAutoPromotion`,
- pending candidates do not create trusted Memory Records,
- trusted-memory approval is owner or application controlled,
- MCP boundary calls the API boundary instead of bypassing policy,
- audit-friendly metadata is returned.

## What It Does Not Do

This example does not add:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- storage schema approval,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- package exports,
- CLI commands,
- schema-backed validation,
- deployment,
- npm publishing,
- real user data.

## Related Docs

- [First Runtime PRD Package](../../docs/first-runtime-prd.md)
- [Runtime Implementation Gate](../../docs/runtime-implementation-gate.md)
- [Owner-Hosted API Plus MCP Boundary Contract](../../docs/contracts/owner-hosted-api-mcp-boundary-contract.md)
