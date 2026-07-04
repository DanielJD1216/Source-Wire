# MCP Adapter Contract Implementation Proof

Status: complete synthetic MCP adapter contract implementation.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

Source-Wire now has a public-safe synthetic MCP adapter contract package.

It is not an MCP server. It proves the contract boundary for tool declarations, input validation, MCP-to-API envelopes, capability mapping, namespace forwarding, denied results, citation and gap preservation, audit metadata, source evidence search, trusted memory search, context assembly, candidate review, source maintenance, handoff and status evidence, and trusted-memory approval boundaries.

## What Landed

- MCP adapter contract surface: `src/contracts/mcp-adapter.ts`
- Synthetic fixture matrix: `examples/fixtures/mcp-contract/mcp-adapter-contract-fixture-matrix.json`
- Fixture README: `examples/fixtures/mcp-contract/README.md`
- Smoke command: `examples/mcp-contract/mcp-adapter-contract-smoke.mjs`
- Smoke docs: [MCP Adapter Contract Smoke](mcp-adapter-contract-smoke.md)

## Covered MCP Adapter Cases

- trusted-memory search forwards to API policy
- source-evidence search preserves citation and gap metadata
- context assembly preserves trusted-memory and source-evidence citations
- candidate review does not approve trusted memory
- source maintenance creates no trusted memory
- handoff and status evidence keeps audit metadata visible
- missing caller denied
- missing owner denied
- missing namespace denied
- missing capability denied through API policy
- wrong namespace denied through API policy
- direct database access denied by contract
- direct runtime adapter access denied by contract
- MCP tool trusted-memory approval denied
- owner-controlled application trusted-memory approval allowed through API policy

## Boundary

This implementation keeps these blocked:

- MCP server runtime implementation
- API server implementation
- route handlers
- database schema or migrations
- PostgreSQL or pgvector setup
- real database connections
- runtime adapter implementation
- live connectors
- Mission Control UI
- deployment config
- cloud provider config
- Docker or container deployment config for runtime services
- hosted services
- managed hosting
- npm publishing
- GitHub release creation
- package version changes
- public contribution acceptance
- Source-Wire-Memory-Engine code merge
- AGPLv3 code copying
- private implementation code copying
- real user data
- client data
- automatic trusted memory promotion

## Verification

Run:

```bash
npm run runtime:mcp-adapter-smoke
npm run runtime:mcp-implementation-packet
npm run runtime:implementation-approval-status
npm run docs:links
npm run docs:anchors
npm run docs:command-setup
npm run safety:scan
npm run claims:scan
npm run ci:check
git diff --check
```

Expected key marker:

```text
ok mcp adapter contract smoke
```

## Related Docs

- [MCP Adapter Contract Smoke](mcp-adapter-contract-smoke.md)
- [MCP Contract Implementation Packet](mcp-contract-implementation-packet.md)
- [MCP Contract Implementation Slices](mcp-contract-implementation-slices.md)
- [Hosted Runtime MCP Server Contract](hosted-runtime-mcp-server-contract.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
