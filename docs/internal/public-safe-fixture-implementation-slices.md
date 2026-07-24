# Source-Wire Public-Safe Fixture Implementation Slices

Status: completed synthetic public-safe fixture slice map after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Parent

Completed parent unit:

```text
Source-Wire Public-Safe Fixture Implementation
```

Approval packet:

- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)

## Slice 1: File Scope And Safety Guard

Goal:

- define the exact public-safe fixture file areas,
- prevent accidental runtime, database, connector, or deployment work,
- keep package version unchanged.

Allowed file areas:

- `src/contracts/`
- `examples/fixtures/hosted-runtime/`
- `examples/hosted-runtime-fixtures/`
- `docs/public-safe-fixture-*`
- package scripts and docs index links.

Acceptance criteria:

- no migration files are added,
- no database connection code is added,
- no API server or MCP server runtime code is added,
- no live connector or Mission Control code is touched,
- package version stays `0.1.0`,
- public safety and claim scans pass.

Implemented files:

- `src/contracts/hosted-runtime-fixtures.ts`
- `examples/fixtures/hosted-runtime/hosted-runtime-fixture-matrix.json`
- `examples/fixtures/hosted-runtime/README.md`
- `examples/hosted-runtime-fixtures/hosted-runtime-fixtures-smoke.mjs`
- `examples/hosted-runtime-fixtures/README.md`
- `docs/internal/public-safe-fixture-implementation-proof.md`
- `docs/internal/public-safe-fixture-smoke.md`

## Slice 2: Synthetic Fixture Contract

Goal:

- define a small fixture contract for hosted-runtime proof cases,
- preserve caller identity, namespace, permission, action, result, citation, and audit metadata.

Acceptance criteria:

- fixture IDs are synthetic,
- fixture callers are synthetic,
- fixture namespaces are synthetic,
- source evidence and trusted memory are separate fixture classes,
- no fixture implies Source-Wire hosts user memory,
- no fixture contains private proof content.

## Slice 3: Synthetic Fixture Matrix

Goal:

- add a synthetic matrix for expected runtime behavior.

Required cases:

- authorized owner read,
- unauthorized caller denial,
- wrong namespace denial without leaked content,
- source evidence citation,
- candidate prepared without trusted-memory promotion,
- trusted-memory read only after approved fixture state,
- source maintenance preserves `noAutoPromotion`,
- MCP policy route cannot bypass API policy,
- audit metadata is present for allowed and denied cases,
- stale or deleted fixture evidence returns a gap or denial.

Acceptance criteria:

- all cases are deterministic,
- denied cases expose no restricted content,
- no real hostnames, emails, domains, local paths, account IDs, screenshots, tokens, or credentials,
- failure records name the failed case and next action.

## Slice 4: Smoke Test And Validation

Goal:

- add a local smoke test that verifies the synthetic matrix.

Acceptance criteria:

- smoke test runs without secrets,
- smoke test runs without services,
- smoke test runs without a database,
- allowed cases pass,
- denied cases fail closed,
- trusted-memory promotion remains owner or application controlled,
- output has stable markers for CI.

## Slice 5: Docs, Proof, And Readiness

Goal:

- document what the synthetic fixture package proves,
- document what remains blocked,
- wire the smoke into readiness gates.

Acceptance criteria:

- docs state this is not a hosted runtime,
- docs state real data remains blocked,
- docs state real services remain blocked,
- docs state Source-Wire-Memory-Engine remains separate,
- local verification passes.

## Required Verification

After implementation, run:

```bash
npm run typecheck
npm run build
npm test
npm run runtime:fixture-smoke
npm run runtime:fixture-implementation-packet
npm run runtime:fixture-plan
npm run runtime:skeleton-smoke
npm run runtime:database-implementation-packet
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run safety:scan
npm run claims:scan
npm run ci:check
git diff --check
```

## Still Blocked After These Slices

- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- production API runtime,
- production MCP runtime,
- live connectors,
- Mission Control UI,
- deployment,
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

- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Public-Safe Fixture Implementation Proof](public-safe-fixture-implementation-proof.md)
- [Public-Safe Fixture Smoke](public-safe-fixture-smoke.md)
- [Hosted Runtime Public-Safe Fixture And Verification Plan](hosted-runtime-public-safe-fixture-verification-plan.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
