# Owner-Hosted Setup Claim Boundary

This page defines what Source-Wire's owner-hosted setup path means today.

It also defines what must not be claimed yet.

## Direct Answer

Source-Wire is moving toward a BYO owner-hosted memory system.

Today, latest `main` still contains a public contracts package, synthetic fixtures, and synthetic smokes. It is not managed hosting, not a production runtime, and not a database migration package.

## What An Adopter Can Do Today

An adopter can:

- clone the repository,
- inspect the owner-hosted setup contract,
- inspect synthetic setup readiness fixtures,
- run synthetic setup readiness smokes,
- verify public claim and safety boundaries,
- reuse the source package under Apache-2.0,
- study the Source-Wire API/MCP policy direction.

Useful commands:

```bash
npm install
npm run owner-hosted-setup:readiness-smoke
npm run owner-hosted-setup:source-update-safety-smoke
npm run ci:check
```

## What Source-Wire Does Not Provide Yet

Source-Wire does not currently provide:

- managed hosting,
- production runtime,
- API server runtime,
- MCP server runtime,
- database client,
- database migrations,
- PostgreSQL or pgvector installer automation,
- Mission Control UI,
- live connector sync,
- whole-vault import,
- real user data examples,
- automatic trusted memory promotion.

## Database Boundary

The owner-hosted setup path says the owner will bring a PostgreSQL-compatible database later.

It does not mean Source-Wire currently ships database migrations or connects to a database.

Database migrations remain blocked until a separate owner-approved implementation unit.

## Runtime Boundary

The owner-hosted setup path says future runtime should be owner-hosted by default.

It does not mean Source-Wire currently runs an API server, MCP server, memory backend, connector engine, or production service.

Production runtime remains blocked until a separate owner-approved implementation unit.

## Managed Hosting Boundary

Source-Wire is not a managed hosted memory service.

The intended path is BYO owner-hosted:

```text
owner device or server
  -> owner-controlled runtime
  -> owner-controlled PostgreSQL-compatible database
  -> owner-selected sources
  -> owner-approved MCP-capable harness
```

Any managed-hosted product direction requires a separate future decision.

## Memory Engine Boundary

`Source-Wire-Memory-Engine` remains separate from Source-Wire.

It is an AGPLv3 reference runtime candidate, not code copied into this Apache-2.0 Source-Wire package.

Do not claim Source-Wire has merged, vendored, copied, or relicensed `Source-Wire-Memory-Engine`.

Any runtime reuse, rewrite, dual-license path, wrapper boundary, or migration path requires a separate owner-approved implementation unit.

## Safe Public Claim

Use:

```text
Source-Wire is an Apache-2.0 public contracts package for an agent-first memory architecture. Latest main includes synthetic owner-hosted setup contracts, fixtures, and smokes. It is not a hosted runtime or production memory backend yet.
```

Do not use:

```text
Source-Wire is a production-ready memory server.
Source-Wire hosts your memory.
Source-Wire includes database migrations.
Source-Wire includes the AGPLv3 memory engine.
Source-Wire can import your vault today.
```

## Related Docs

- [Owner-Hosted Setup PRD](owner-hosted-setup-prd.md)
- [Owner-Hosted Setup Contract](../contracts/owner-hosted-setup-contract.md)
- [Owner-Hosted Setup Readiness Fixture Matrix](owner-hosted-setup-readiness-fixture-matrix.md)
- [Owner-Hosted Setup Readiness Smoke](owner-hosted-setup-readiness-smoke.md)
- [Owner-Hosted Setup Source Update Safety Smoke](owner-hosted-setup-source-update-safety-smoke.md)
- [Public Status](../status/public-status.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Memory Engine Baseline API And MCP Wrapper Boundary](memory-engine-baseline-api-mcp-wrapper-boundary.md)
