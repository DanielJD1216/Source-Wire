# Source-Wire Draft GitHub Release Notes

Status: draft only.

These notes do not create a GitHub release, create a tag, publish npm, change package version, deploy services, or accept code contributions.

## Draft Title

```text
Source-Wire 0.1.0: Agent-first memory contract package
```

## Draft Summary

Source-Wire is an Apache-2.0 licensed contract package skeleton for agent-first memory systems.

This release would provide public contracts, JSON schemas, synthetic fixtures, validation tooling, package-readiness checks, and a minimal synthetic runtime-boundary proof. It would not provide a hosted runtime, real MCP server runtime, database-backed memory engine, live connectors, Mission Control UI, or production memory service.

## Draft Highlights

- Agent-first memory contract package.
- Source Graph Adapter contract.
- Source Connection contract.
- `second-brain.v1` response contract.
- MCP Tool Behavior contract.
- Owner-hosted API plus MCP boundary contract.
- JSON schema exports.
- Local validation CLI.
- Synthetic fixtures only.
- Minimal synthetic in-memory runtime-boundary proof.
- Readiness, safety, claim-boundary, and package-content gates.

## Draft Install Note

Do not publish this note until npm publishing is actually approved and completed.

If npm publishing is approved later, update this section with the final install command.

## Explicit Non-Goals

This release would not include:

- hosted memory service,
- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record auto-promotion,
- code contribution acceptance.

## Verification Before Release

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Before any future release, run:

```bash
npm run publish:readiness
```

Then verify the exact release implementation unit commands before publishing npm or creating a GitHub release.
