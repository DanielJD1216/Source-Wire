# Private Proof To Runtime Extraction Readiness

Status: public-safe extraction readiness checkpoint. Runtime implementation remains blocked.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

The private owner proof is strong enough to refresh Source-Wire runtime planning, but not enough to start unapproved production runtime work.

This checkpoint records the bridge:

```text
private owner proof exists
  -> public-safe metadata only
  -> Source-Wire synthetic runtime skeleton implementation is recorded
  -> production runtime still needs separate approval
```

## Private Proof Metadata

The private proof trail is represented only as redacted metadata:

| Redacted proof | What it proves for Source-Wire | Public-safe status |
| --- | --- | --- |
| Private Unit 25 real owner packet smoke | One owner-selected packet can become source evidence, create review work, and produce trusted memory only after owner approval. | Available as metadata only. |
| Private Unit 26 owner-hosted runtime boundary | MCP routes through API policy, denied namespaces fail closed, source evidence stays separate from trusted memory, and `noAutoPromotion` stays visible. | Available as metadata only. |
| Private Unit 27 owner-hosted setup UX | Owner device or server, owner-controlled backend, owner-controlled database, MCP harness, setup health, and recovery states are modeled. | Available as metadata only. |
| Private Unit 30 decision packet | The larger goal is not complete, and Source-Wire needs a public-safe runtime skeleton path before adopters can fork and run it. | Available as metadata only. |

No private file paths, raw source text, provider payloads, local screenshots, account data, client data, credentials, AGPLv3 code, or private implementation code are copied here.

## What This Allows

This checkpoint allows a future Source-Wire runtime skeleton unit to be drafted with these public-safe slices:

1. Owner-hosted API policy route skeleton using synthetic fixtures only.
2. MCP adapter skeleton that calls API policy and cannot bypass it.
3. Synthetic source update and search flow with `noAutoPromotion`.
4. Synthetic trusted-memory candidate review boundary where approval is owner or application controlled.
5. Local smoke commands that run without secrets, services, deployment, or real data.
6. Public docs that clearly say Source-Wire does not host user memory.

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
```

Expected marker:

```text
ok private proof runtime extraction readiness
```

## Next Decision

The narrow runtime skeleton implementation unit is now approved and recorded in [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md).

The next decision is not production runtime yet. The next safe decision should address one later boundary at a time: database posture implementation, API server runtime, MCP server runtime, or setup packaging.

Recommended approval shape:

```text
Approved for a future Source-Wire owner-hosted runtime skeleton implementation unit: build a public-safe synthetic owner-hosted API policy route skeleton and MCP adapter skeleton using the private Unit 25 through Unit 30 proof trail as redacted evidence only. Use synthetic fixtures only. Do not copy private implementation code or AGPLv3 code. Do not add real user data, client data, database migrations, real database connections, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, or public contribution acceptance. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.
```

## Related Docs

- [Runtime Proof Intake](runtime-proof-intake.md)
- [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Minimal Runtime PRD](minimal-runtime-prd.md)
- [Daily Workflow Implementation Proof](daily-workflow-implementation-proof.md)
