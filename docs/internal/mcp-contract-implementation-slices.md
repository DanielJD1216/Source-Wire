# Source-Wire MCP Contract Implementation Slices

Status: completed synthetic MCP adapter contract slice map after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Parent

Parent unit:

```text
Source-Wire MCP Contract Implementation
```

Approval packet:

- [MCP Contract Implementation Packet](mcp-contract-implementation-packet.md)

## Slice 1: File Scope And Safety Guard

Goal:

- define exact public-safe MCP contract file areas,
- prevent accidental MCP runtime, API server, route handler, database, connector, deployment, or Mission Control work,
- keep package version unchanged.

Allowed file areas:

- `src/contracts/`
- `examples/fixtures/mcp-contract/`
- `examples/mcp-contract/`
- `docs/mcp-contract-*`
- package scripts and docs index links.

Acceptance criteria:

- no MCP server runtime code is added,
- no API server runtime code is added,
- no route handlers are added,
- no database connection code is added,
- no migration files are added,
- no runtime adapter, live connector, or Mission Control code is touched,
- no deployment or hosted service config is added,
- package version stays `0.1.0`,
- public safety and claim scans pass.

## Slice 2: Synthetic Tool Declaration And Input Contract

Goal:

- define synthetic MCP tool declaration and input contract types for tool name, caller, owner, namespace, capability, trace, input payload, citations, gaps, denied result shape, and audit metadata.

Acceptance criteria:

- every tool has a minimum required capability,
- every request forwards owner ID, namespace ID, caller identity, and trace ID,
- agent-facing input is validated before forwarding,
- MCP does not silently broaden namespace, capability, or search radius,
- source evidence remains source evidence,
- trusted-memory approval stays owner or application controlled.

## Slice 3: Synthetic MCP-To-API Policy Fixture Matrix

Goal:

- add a synthetic matrix for MCP adapter policy behavior.

Required cases:

- `search_trusted_memory` forwards to API policy,
- `search_source_evidence` forwards to API policy,
- `assemble_context` preserves source and trusted-memory citations,
- `review_candidates` does not approve trusted memory,
- `maintain_sources` creates no trusted memory,
- `read_handoff_status` preserves audit metadata,
- missing caller denied,
- missing owner denied,
- missing namespace denied,
- missing capability denied,
- wrong namespace denied,
- MCP direct database access denied by contract,
- MCP direct runtime adapter access denied by contract,
- agent-only trusted-memory approval denied,
- owner or approved application trusted-memory approval allowed through API policy only.

Acceptance criteria:

- all fixture IDs are synthetic,
- no real hostnames, emails, domains, local paths, account IDs, screenshots, tokens, credentials, production exports, or private proof content,
- denied cases fail closed without leaked content,
- no trusted Memory Record is promoted automatically,
- every allowed case visibly routes through API policy.

## Slice 4: Smoke Test And Validation

Goal:

- add a local smoke test that verifies the synthetic MCP adapter policy matrix.

Acceptance criteria:

- smoke test runs without secrets,
- smoke test runs without services,
- smoke test runs without a database,
- denied cases fail closed,
- MCP-through-API routing is visible,
- output has stable markers for CI.

## Slice 5: Docs, Proof, And Readiness

Goal:

- document what the synthetic MCP contract package proves,
- document what remains blocked,
- wire the smoke into readiness gates.

Acceptance criteria:

- docs state this is not an MCP server runtime,
- docs state API server runtime remains blocked,
- docs state route handlers remain blocked,
- docs state migrations and real database connections remain blocked,
- docs state Source-Wire-Memory-Engine remains separate,
- local verification passes.

## Required Verification

After implementation, run:

```bash
npm run typecheck
npm run build
npm test
npm run runtime:mcp-adapter-smoke
npm run runtime:mcp-implementation-packet
npm run runtime:mcp-contract
npm run runtime:api-implementation-packet
npm run runtime:api-contract
npm run runtime:threat-implementation-packet
npm run runtime:skeleton-smoke
npm run runtime:database-implementation-packet
npm run runtime:fixture-implementation-packet
npm run runtime:deployment-implementation-packet
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run safety:scan
npm run claims:scan
npm run ci:check
git diff --check
```

## Still Blocked After These Slices

- MCP server runtime implementation,
- API server implementation,
- route handlers,
- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- runtime adapter implementation,
- live connectors,
- Mission Control UI,
- deployment config,
- cloud provider config,
- Docker or container deployment config for runtime services,
- hosted services,
- managed hosting,
- npm publishing,
- GitHub release creation,
- package version changes,
- public contribution acceptance,
- Source-Wire-Memory-Engine code merge,
- AGPLv3 code copying,
- private implementation code copying,
- real user data,
- client data,
- real local paths,
- account IDs,
- emails,
- domains,
- tokens,
- screenshots,
- production exports,
- private proof content,
- automatic trusted memory promotion.

## Related Docs

- [MCP Contract Implementation Packet](mcp-contract-implementation-packet.md)
- [Hosted Runtime MCP Server Contract](hosted-runtime-mcp-server-contract.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)
- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
