# Source-Wire API Contract Implementation Slices

Status: implementation slice map only. Implementation is blocked until exact owner approval is recorded.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Parent

Future parent unit:

```text
Source-Wire API Contract Implementation
```

Approval packet:

- [API Contract Implementation Packet](api-contract-implementation-packet.md)

## Slice 1: File Scope And Safety Guard

Goal:

- define exact public-safe API contract file areas,
- prevent accidental route handler, server, database, connector, deployment, or Mission Control work,
- keep package version unchanged.

Allowed file areas:

- `src/contracts/`
- `examples/fixtures/api-contract/`
- `examples/api-contract/`
- `docs/api-contract-*`
- package scripts and docs index links.

Acceptance criteria:

- no API server runtime code is added,
- no route handlers are added,
- no MCP server runtime code is added,
- no database connection code is added,
- no migration files are added,
- no runtime adapter, live connector, or Mission Control code is touched,
- no deployment or hosted service config is added,
- package version stays `0.1.0`,
- public safety and claim scans pass.

## Slice 2: Synthetic Request Envelope And Endpoint Group Contract

Goal:

- define synthetic API request and response contract types for caller, owner, namespace, action, capability, trace, source policy, approval policy, citations, gaps, and audit metadata.

Acceptance criteria:

- every operation group has caller identity, owner ID, namespace ID, action, required capability, and trace ID,
- read/search, source maintenance, candidate review, trusted-memory approval, handoff/status evidence, and audit groups are represented,
- source evidence remains source evidence,
- trusted-memory approval stays owner or application controlled.

## Slice 3: Synthetic API Policy Fixture Matrix

Goal:

- add a synthetic matrix for API policy behavior.

Required cases:

- authorized trusted-memory read,
- authorized source evidence search with citations,
- context assembly with gaps,
- missing caller denied,
- missing capability denied,
- wrong namespace denied,
- source maintenance creates no trusted memory,
- candidate creation remains pending,
- agent-only trusted-memory approval denied,
- owner or approved application trusted-memory approval allowed,
- handoff/status evidence read or write with provenance,
- audit summary excludes raw secrets and hidden content,
- MCP request is routed through API policy.

Acceptance criteria:

- all fixture IDs are synthetic,
- no real hostnames, emails, domains, local paths, account IDs, screenshots, tokens, credentials, production exports, or private proof content,
- denied cases fail closed without leaked content,
- no trusted Memory Record is promoted automatically.

## Slice 4: Smoke Test And Validation

Goal:

- add a local smoke test that verifies the synthetic API policy matrix.

Acceptance criteria:

- smoke test runs without secrets,
- smoke test runs without services,
- smoke test runs without a database,
- denied cases fail closed,
- MCP-through-API routing is visible,
- output has stable markers for CI.

## Slice 5: Docs, Proof, And Readiness

Goal:

- document what the synthetic API contract package proves,
- document what remains blocked,
- wire the smoke into readiness gates.

Acceptance criteria:

- docs state this is not an API server,
- docs state route handlers remain blocked,
- docs state MCP runtime remains blocked,
- docs state migrations and real database connections remain blocked,
- docs state Source-Wire-Memory-Engine remains separate,
- local verification passes.

## Required Verification

After implementation, run:

```bash
npm run typecheck
npm run build
npm test
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

- API server implementation,
- route handlers,
- MCP server runtime implementation,
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

- [API Contract Implementation Packet](api-contract-implementation-packet.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)
- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
