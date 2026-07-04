# API Policy Contract Implementation Proof

Status: complete synthetic API policy contract implementation.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

Source-Wire now has a public-safe synthetic API policy contract package.

It is not an API server. It is a package-level proof that validates request envelopes, endpoint groups, namespace and capability checks, denied results, citations, gaps, audit metadata, source maintenance, candidate review, trusted-memory approval boundaries, handoff/status evidence, and MCP-through-API routing.

## What Landed

- API policy contract surface: `src/contracts/api-policy.ts`
- Synthetic fixture matrix: `examples/fixtures/api-contract/api-policy-contract-fixture-matrix.json`
- Fixture README: `examples/fixtures/api-contract/README.md`
- Smoke command: `examples/api-contract/api-policy-contract-smoke.mjs`
- Smoke docs: [API Policy Contract Smoke](api-policy-contract-smoke.md)

## Covered API Policy Cases

- missing caller denied
- wrong namespace denied
- missing capability denied
- trusted-memory read with citation
- source-evidence search with citation and gap
- context assembly with citations and gap
- source maintenance creates candidate without trusted memory
- candidate creation remains pending review
- candidate review does not auto-promote trusted memory
- agent trusted-memory approval denied
- owner/application trusted-memory approval allowed
- handoff/status evidence with provenance
- audit summary redacts hidden content
- MCP policy bypass denied
- secret-like input denied

## Boundary

This implementation keeps these blocked:

- API server implementation
- route handlers
- MCP server runtime implementation
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
npm run runtime:api-policy-smoke
npm run runtime:api-implementation-packet
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
ok api policy contract smoke
```

## Related Docs

- [API Policy Contract Smoke](api-policy-contract-smoke.md)
- [API Contract Implementation Packet](api-contract-implementation-packet.md)
- [API Contract Implementation Slices](api-contract-implementation-slices.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
