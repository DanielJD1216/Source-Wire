# Source-Wire Runtime Boundary

Source-Wire is currently a public contract package skeleton.

It is not a full memory backend yet.

## Included In The Current Public Package

- Public contract documentation.
- Synthetic fixtures.
- Public extraction checklist.
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

The package can define public shapes and validate public fixtures.

The package should not:

- connect to databases,
- start servers,
- call external APIs,
- import private implementation code,
- crawl local files,
- promote trusted memory automatically.

## Next Safe Expansion

The next safe expansion is public TypeScript contract types and JSON schemas for the existing synthetic fixtures.
