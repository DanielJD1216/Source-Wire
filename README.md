# Source-Wire

Source-Wire is an agent-first memory architecture skeleton.

It is designed for systems where AI agents need to search, cite, update, and reason over source-backed context without turning every imported note or chat message into trusted memory automatically.

## What This Public Skeleton Includes

- Source Graph Adapter Contract.
- Source Connection Contract.
- `second-brain.v1` response contract.
- MCP tool behavior contract.
- Synthetic fixtures for notes, chat exports, project context, and `/2nd-brain` examples.
- A public extraction checklist for future safety reviews.
- A lightweight TypeScript package boundary.

## What Is Intentionally Not Included Yet

- Runtime implementation code.
- Mission Control UI.
- Real user data.
- Real Memory Records or Sources.
- Private proof history.
- Screenshots.
- Database values or migrations.
- Memory-engine fork code.
- Live connectors.
- Tokens, local paths, domains, emails, account IDs, client names, or private project history.

## Documentation

- [Docs Index](docs/index.md)
- [Public Adopter Walkthrough](docs/adopter-walkthrough.md)
- [Quickstart](docs/quickstart.md)
- [API Reference](docs/api-reference.md)
- [TypeScript Examples](examples/typescript/README.md)

## Contracts

- [Source Graph Adapter Contract](docs/contracts/source-graph-adapter-contract.md)
- [Source Connection Contract](docs/contracts/source-connection-contract.md)
- [`second-brain.v1` Contract](docs/contracts/second-brain-v1-contract.md)
- [MCP Tool Behavior Contract](docs/contracts/mcp-tool-behavior-contract.md)
- [Runtime Boundary](docs/runtime-boundary.md)

## Decision Prototypes

- [Runtime-Adjacent Options Decision Matrix](docs/decision-prototypes/runtime-adjacent-options.md)
- [Runtime-Adjacent Evidence And Scoring](docs/decision-prototypes/runtime-adjacent-evidence.md)
- [Runtime-Adjacent Recommendation](docs/decision-prototypes/runtime-adjacent-recommendation.md)
- [License Options Decision Matrix](docs/decision-prototypes/license-options.md)
- [License Evidence And Scoring](docs/decision-prototypes/license-evidence.md)
- [License Recommendation](docs/decision-prototypes/license-recommendation.md)

## Package Boundary

This repo is currently a contract package skeleton.

It can define public shapes and validate public fixtures. It does not run a memory backend, database, MCP server, Mission Control UI, memory-engine integration, or live connector.

- [API Reference](docs/api-reference.md)
- [TypeScript Examples](examples/typescript/README.md)

## Schema Exports

Source-Wire exposes its current JSON schemas through stable package subpaths and a typed schema registry.

- [Schema Exports](docs/schema-exports.md)

## Validation CLI

Source-Wire includes a tiny local CLI for validating explicit files against explicit schema names.

- [Validation CLI](docs/validation-cli.md)

## CI Checks

Source-Wire runs package checks and public-safety scanning on push and pull request.

- [CI Checks](docs/ci-checks.md)

## Publish Readiness

Source-Wire can run package dry-run checks, but it is not published to npm yet.

- [Publish Readiness](docs/publish-readiness.md)
- [Release Decision](docs/release-decision.md)
- [License And Version Policy](docs/license-version-policy.md)
- [Owner License Approval Packet](docs/owner-license-approval-packet.md)
- [Future License Change Plan](docs/future-license-change-plan.md)

## Fixtures

All fixtures are fictional and synthetic.

- [Markdown vault fixture](examples/fixtures/markdown-vault/)
- [Chat export fixture](examples/fixtures/chat-export/agent-session.jsonl)
- [Project context pack fixture](examples/fixtures/project-context-pack/project-context.json)
- [`/2nd-brain` example fixture](examples/fixtures/second-brain/use-2nd-brain-example.json)

## Safety Rule

Imported source text is evidence, not trusted memory.

Source-Wire examples should preserve citations, source identity, stale state, and review boundaries. Trusted Memory Records should require an explicit owner or application approval path.

## Public Extraction Checklist

Before adding new public examples or docs, review:

- [Public Extraction Checklist](docs/proof/public-extraction-checklist.md)
