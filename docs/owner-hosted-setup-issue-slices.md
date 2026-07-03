# Source-Wire Owner-Hosted Setup Issue Slices

Status: draft issue slices. No runtime implementation is included.

Parent:

```text
Source-Wire Owner-Hosted Setup Package
```

Goal:

Define and later prove the public-safe setup package for BYO owner-hosted Source-Wire without adding production runtime, database migrations, deployment, managed hosting, real data, AGPLv3 code, or private implementation code.

## Slice 1: Setup Contract And Owner-Brings Checklist

Status: implemented in `src/contracts/owner-hosted-setup.ts`, with proof in `docs/owner-hosted-setup-slice-1-proof.md`.

File: `docs/issues/owner-hosted-setup/01-setup-contract-owner-brings-checklist.md`

Define what the owner brings, what Source-Wire provides later, setup states, required services, and hard stop conditions.

Acceptance criteria:

- owner device or server is required,
- PostgreSQL-compatible database is required,
- owner credentials and secret storage are owner-controlled,
- MCP-capable harnesses are owner-controlled,
- Source-Wire-hosted memory is explicitly not the default,
- no real secrets, paths, or private data are included.

## Slice 2: Synthetic Setup Readiness Fixture Matrix

Status: implemented in `examples/fixtures/owner-hosted-setup/setup-readiness-fixture-matrix.json`, with proof in `docs/owner-hosted-setup-slice-2-proof.md`.

File: `docs/issues/owner-hosted-setup/02-synthetic-setup-readiness-fixture-matrix.md`

Define synthetic fixture cases for database, API, MCP, source update safety, and Mission Control setup health.

Acceptance criteria:

- database pass and blocked fixtures exist,
- API pass and blocked fixtures exist,
- MCP pass and blocked fixtures exist,
- source update safe and blocked fixtures exist,
- no-auto-promotion is represented,
- all fixtures are synthetic.

## Slice 3: Setup Readiness Smoke

Status: implemented in `examples/owner-hosted-setup/setup-readiness-smoke.mjs`, with proof in `docs/owner-hosted-setup-slice-3-proof.md`.

File: `docs/issues/owner-hosted-setup/03-setup-readiness-smoke.md`

Add a synthetic local smoke that validates setup readiness fixtures without starting servers, connecting databases, or requiring secrets.

Acceptance criteria:

- smoke checks every setup fixture,
- blocked states include failure point, observed error, supported cause, impact, and next action,
- no secrets are required,
- no external services are required,
- public safety scan remains clean.

## Slice 4: Source Update Safety Smoke

Status: implemented in `examples/owner-hosted-setup/source-update-safety-smoke.mjs`, with proof in `docs/owner-hosted-setup-slice-4-proof.md`.

File: `docs/issues/owner-hosted-setup/04-source-update-safety-smoke.md`

Prove the setup package represents safe source update behavior without local folder crawling or trusted-memory auto-promotion.

Acceptance criteria:

- caller-supplied snapshot is required,
- local folder crawling is blocked,
- broad private import is blocked,
- trusted memory delta stays `0`,
- `noAutoPromotion: true` is visible,
- pending review remains owner or application controlled.

## Slice 5: Setup Docs And Claim Boundary

Status: implemented in `docs/owner-hosted-setup-claim-boundary.md`, with proof in `docs/owner-hosted-setup-slice-5-proof.md`.

File: `docs/issues/owner-hosted-setup/05-setup-docs-claim-boundary.md`

Document the setup path for adopters and keep public claims accurate.

Acceptance criteria:

- README and docs index point to setup docs,
- docs state Source-Wire is not managed hosting,
- docs state production runtime remains blocked,
- docs state database migrations remain blocked until a separate unit,
- docs state Source-Wire-Memory-Engine remains separate,
- claim-boundary scan passes.

## Slice 6: Proof Docs And Go/No-Go Gate

File: `docs/issues/owner-hosted-setup/06-proof-docs-go-no-go-gate.md`

Close the owner-hosted setup package with proof docs, verification output, privacy scan, and the next go/no-go decision.

Acceptance criteria:

- final proof exists,
- docs audit exists,
- public safety scan passes,
- claim-boundary scan passes,
- package checks remain green,
- next runtime implementation remains blocked unless separately approved.

## Global Boundaries

These slices do not approve:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector installer automation,
- Mission Control UI implementation,
- memory-engine integration,
- AGPLv3 code copying,
- private implementation code copying,
- live connectors,
- real user data,
- deployment,
- managed hosting,
- npm publishing,
- GitHub release creation,
- public code contribution acceptance.
