# Source-Wire Runtime Boundary

Source-Wire is currently a public contract package skeleton.

It is not a full memory backend yet.

## Included In The Current Public Package

- Public contract documentation.
- TypeScript contract types.
- JSON schemas.
- JSON schema package exports.
- Synthetic fixtures.
- Validation CLI.
- TypeScript examples.
- Package readiness checks.
- Installed-package smoke checks.
- Public extraction checklist.
- Public adopter walkthrough.
- Public architecture map.
- Package metadata.
- A TypeScript package boundary.

## Not Included Yet

- API server.
- MCP server runtime.
- Database migrations.
- PostgreSQL or pgvector setup.
- Memory-engine fork code.
- Mission Control UI.
- Live connectors.
- Private implementation modules.
- Real user data.
- Trusted Memory Record promotion.

For the whole package shape, read the [Architecture Map](architecture-map.md).

For a practical first pass through the current package, read the [Public Adopter Walkthrough](adopter-walkthrough.md).

## Why This Boundary Exists

Source-Wire is meant to become reusable infrastructure for agent memory systems.

The safest first step is to make the public contracts testable before shipping runtime behavior. Runtime code carries heavier decisions:

- storage model,
- auth and namespace boundaries,
- memory-engine licensing,
- connector permissions,
- owner review workflow,
- deployment shape.

Those decisions should be opened by later PRDs, not hidden inside the first package skeleton.

## Current Package Promise

The package can define public shapes, expose contract types and schemas, validate public fixtures, typecheck public examples, and prove package readiness from a local tarball.

The package should not:

- connect to databases,
- start servers,
- call external APIs,
- import private implementation code,
- crawl local files,
- promote trusted memory automatically.

## Next Safe Expansion

The next safe expansion is not more runtime behavior by default.

The next safe expansion should be one of these explicit PRD paths:

1. Documentation or examples that make the existing contract package easier to adopt.
2. A runtime decision package that chooses the first public runtime boundary before adding server, database, MCP, or connector code.
3. A license or publish approval gate, if the owner decides Source-Wire is ready to move beyond `UNLICENSED` and `0.0.0`.

Any runtime PRD must keep this trust boundary:

```text
Source evidence is not trusted memory.
Trusted memory requires an owner or application approval path.
```
