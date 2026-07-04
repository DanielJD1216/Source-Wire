# Source-Wire Threat Model Implementation Slices

Status: implementation slice map completed after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Parent

Parent unit:

```text
Source-Wire Threat Model Implementation
```

Approval packet:

- [Threat Model Implementation Packet](threat-model-implementation-packet.md)

## Slice 1: File Scope And Safety Guard

Goal:

- define exact public-safe threat-model file areas,
- prevent accidental runtime, database, connector, deployment, or Mission Control work,
- keep package version unchanged.

Allowed file areas:

- `src/contracts/`
- `src/runtime-threat-boundary/`
- `examples/fixtures/runtime-threat-boundary/`
- `examples/runtime-threat-boundary/`
- `docs/threat-model-*`
- `docs/runtime-threat-boundary-*`
- package scripts and docs index links.

Acceptance criteria:

- no API server runtime code is added,
- no MCP server runtime code is added,
- no database connection code is added,
- no migration files are added,
- no live connector or Mission Control code is touched,
- no deployment or hosted service config is added,
- package version stays `0.1.0`,
- public safety and claim scans pass.

## Slice 2: Synthetic Trust-Boundary Contract

Goal:

- define synthetic threat case types for caller identity, namespace, source evidence, candidate memory, trusted memory, audit, secrets, backup, restore, deployment, and MCP routing.

Acceptance criteria:

- every case has a threat category,
- every case names the required trust boundary,
- every denied case has a fail-closed result,
- source evidence cannot become trusted memory without explicit owner or application approval,
- MCP routing cannot bypass Source-Wire API policy,
- blocked cases include failure point, observed error, supported cause, impact, and next action.

## Slice 3: Synthetic Threat Matrix Fixtures

Goal:

- add a synthetic matrix for trust-boundary behavior.

Required cases:

- unauthorized caller denied,
- missing capability denied,
- wrong namespace denied,
- source-to-memory confusion flagged for owner review without promotion,
- prompt injection treated as source data, not policy,
- secrets or private-path fixture blocked,
- audit durability gap blocks mutation,
- backup preserves owner and namespace boundary,
- restore cannot bypass candidate review,
- deployment misconfiguration blocked,
- MCP bypass attempt denied,
- owner or application approval path allowed.

Acceptance criteria:

- all fixture IDs are synthetic,
- no real hostnames, emails, domains, local paths, account IDs, screenshots, tokens, credentials, production exports, or private proof content,
- all blocked cases fail closed without leaked content,
- no trusted Memory Record is promoted automatically.

## Slice 4: Smoke Test And Validation

Goal:

- add a local smoke test that verifies the synthetic threat matrix.

Acceptance criteria:

- smoke test runs without secrets,
- smoke test runs without services,
- smoke test runs without a database,
- denied cases fail closed,
- allowed approval path stays owner or application controlled,
- output has stable markers for CI.

## Slice 5: Docs, Proof, And Readiness

Goal:

- document what the synthetic threat-model package proves,
- document what remains blocked,
- wire the smoke into readiness gates.

Acceptance criteria:

- docs state this is not production runtime,
- docs state API runtime remains blocked,
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
npm run runtime:threat-boundary-smoke
npm run runtime:threat-implementation-packet
npm run runtime:threat-model
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
- MCP server runtime implementation,
- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
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

- [Threat Model Implementation Packet](threat-model-implementation-packet.md)
- [Runtime Threat Boundary Implementation Proof](runtime-threat-boundary-implementation-proof.md)
- [Runtime Threat Boundary Smoke](runtime-threat-boundary-smoke.md)
- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
