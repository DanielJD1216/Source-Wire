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

## Contracts

- [Source Graph Adapter Contract](docs/contracts/source-graph-adapter-contract.md)
- [Source Connection Contract](docs/contracts/source-connection-contract.md)
- [`second-brain.v1` Contract](docs/contracts/second-brain-v1-contract.md)
- [MCP Tool Behavior Contract](docs/contracts/mcp-tool-behavior-contract.md)
- [Runtime Boundary](docs/runtime-boundary.md)

## Decision Prototypes

- [Runtime-Adjacent Options Decision Matrix](docs/decision-prototypes/runtime-adjacent-options.md)

## Package Boundary

This repo is currently a contract package skeleton.

It can define public shapes and validate public fixtures. It does not run a memory backend, database, MCP server, Mission Control UI, memory-engine integration, or live connector.

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
