# Private Proof To Runtime Extraction Readiness

Status: public-safe extraction readiness checkpoint. Runtime PRD refresh is approved and recorded; runtime implementation remains blocked.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

The private owner proof was strong enough to refresh Source-Wire runtime planning from the Unit 33 baseline, and that refresh approval is now recorded. It is still not enough to start unapproved production runtime work.

This checkpoint records the bridge:

```text
private owner proof exists through Unit 33
  -> public-safe metadata only
  -> Source-Wire daily workflow and runtime-readiness synthetic contracts are recorded
  -> production runtime still needs separate approval
```

## Private Proof Metadata

The private proof trail is represented only as redacted metadata:

| Redacted proof | What it proves for Source-Wire | Public-safe status |
| --- | --- | --- |
| Private Unit 25 real owner packet smoke | One owner-selected packet can become source evidence, create review work, and produce trusted memory only after owner approval. | Available as metadata only. |
| Private Unit 26 owner-hosted runtime boundary | MCP routes through API policy, denied namespaces fail closed, source evidence stays separate from trusted memory, and `noAutoPromotion` stays visible. | Available as metadata only. |
| Private Unit 27 owner-hosted setup UX | Owner device or server, owner-controlled backend, owner-controlled database, MCP harness, setup health, and recovery states are modeled. | Available as metadata only. |
| Private Unit 28 daily workflow proof | Ask, bounded update packet, owner review, approval or rejection, follow-up answer, Mission Control state, and handoff are proven as a daily owner loop. | Available as metadata only. |
| Private Unit 29 extraction PRD | The private daily workflow is translated into public-safe Source-Wire requirements, fixtures, smoke expectations, and adopter docs. | Available as metadata only. |
| Private Unit 31 daily workflow alignment | Public Source-Wire daily workflow fixtures align with private Unit 28 behavior. | Available as metadata only. |
| Private Unit 32 dependency posture | The private repo should keep file-based `SOURCE_WIRE_ROOT` fixture comparison instead of depending on `@source-wire/contracts` yet. | Available as metadata only. |
| Private Unit 33 runtime-readiness alignment | Public Source-Wire runtime-readiness fixtures align with private Unit 26 through Unit 28 proof boundaries. | Available as metadata only. |

No private file paths, raw source text, provider payloads, local screenshots, account data, client data, credentials, AGPLv3 code, or private implementation code are copied here.

## What This Allows

This checkpoint allows Source-Wire planning to be refreshed with these public-safe lanes:

1. Owner-hosted API policy route skeleton using synthetic fixtures only.
2. MCP adapter skeleton that calls API policy and cannot bypass it.
3. Daily workflow fixture coverage for ask, bounded update, review, approval, rejection, follow-up, and Mission Control state.
4. Runtime-readiness fixture coverage for private proof, API policy, MCP policy, database posture, source update safety, memory-engine boundary, and release boundary.
5. Synthetic trusted-memory candidate review boundary where approval is owner or application controlled.
6. Local smoke commands that run without secrets, services, deployment, or real data.
7. Public docs that clearly say Source-Wire does not host user memory.

## What This Does Not Allow

This checkpoint does not allow:

- production API runtime,
- production MCP runtime,
- database schema or migrations,
- PostgreSQL or pgvector connection code,
- real source imports,
- live connectors,
- local folder crawling,
- Mission Control UI,
- deployment,
- managed hosting,
- npm publishing,
- GitHub release creation,
- public contribution acceptance,
- Source-Wire-Memory-Engine code merge,
- AGPLv3 code copying,
- private implementation code copying,
- real user data,
- client data,
- automatic trusted memory promotion.

## Extraction Rule

Future extraction must follow this order:

```text
private behavior observed
  -> public requirement written
  -> synthetic fixture added
  -> public smoke added
  -> clean Apache-2.0 implementation written
```

The private owner repo is evidence, not a code source.

## Required Gate

Run:

```bash
npm run runtime:extraction-readiness
npm run daily-workflow:smoke
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
```

Expected marker:

```text
ok private proof runtime extraction readiness
```

## Next Decision

The narrow runtime skeleton implementation unit is already recorded in [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md), and the daily workflow plus runtime-readiness synthetic lanes are now available as current baseline evidence.

The runtime PRD refresh decision is now recorded on issue `#257`: https://github.com/DanielJD1216/Source-Wire/issues/257#issuecomment-4884301286

The next decision is not production runtime yet. The next safe decision should address one later implementation boundary at a time: database posture, API server runtime, MCP server runtime, setup packaging, or runtime adapter packaging.

Recommended approval shape:

```text
Approved for a future Source-Wire owner-hosted runtime skeleton implementation unit: build a public-safe synthetic owner-hosted API policy route skeleton and MCP adapter skeleton using the private Unit 25 through Unit 30 proof trail as redacted evidence only. Use synthetic fixtures only. Do not copy private implementation code or AGPLv3 code. Do not add real user data, client data, database migrations, real database connections, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, or public contribution acceptance. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.
```

For a future PRD refresh, prefer this updated approval shape:

```text
Approved for a future Source-Wire owner-hosted runtime PRD refresh unit: refresh the public owner-hosted runtime PRD and wrapper-runtime gate using the Unit 33 runtime-readiness alignment baseline as redacted metadata only. Keep Source-Wire synthetic-only. Do not add production API runtime, MCP runtime, database migrations, real database connections, live connectors, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, private data, private implementation code, AGPLv3 code copying, or automatic trusted memory promotion. Keep Source-Wire-Memory-Engine separate. MCP must not bypass Source-Wire API policy.
```

## Related Docs

- [Runtime Proof Intake](runtime-proof-intake.md)
- [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md)
- [Daily Workflow Implementation Proof](daily-workflow-implementation-proof.md)
- [Daily Workflow Synthetic Smoke](daily-workflow-synthetic-smoke.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Minimal Runtime PRD](minimal-runtime-prd.md)
