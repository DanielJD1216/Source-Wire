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
- A minimal synthetic in-memory runtime boundary for owner-hosted API plus MCP policy proof.

## What Is Intentionally Not Included Yet

- Hosted runtime backend code.
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
- [Technical Reviewer Guide](docs/technical-reviewer-guide.md)
- [Reviewer Feedback Guide](docs/reviewer-feedback-guide.md)
- [Public Adopter Walkthrough](docs/adopter-walkthrough.md)
- [Architecture Map](docs/architecture-map.md)
- [Quickstart](docs/quickstart.md)
- [API Reference](docs/api-reference.md)
- [TypeScript Examples](examples/typescript/README.md)
- [Minimal Runtime TypeScript Example](examples/typescript/minimal-runtime.ts)
- [Runtime Implementation Gate](docs/runtime-implementation-gate.md)
- [Runtime Boundary Readiness](docs/runtime-boundary-readiness.md)
- [Minimal Synthetic Runtime Boundary](examples/minimal-runtime/)
- [Synthetic Runtime Boundary Example](examples/runtime-boundary/)

## Contracts

- [Source Graph Adapter Contract](docs/contracts/source-graph-adapter-contract.md)
- [Source Connection Contract](docs/contracts/source-connection-contract.md)
- [`second-brain.v1` Contract](docs/contracts/second-brain-v1-contract.md)
- [MCP Tool Behavior Contract](docs/contracts/mcp-tool-behavior-contract.md)
- [Runtime Boundary](docs/runtime-boundary.md)
- [Runtime Implementation Gate](docs/runtime-implementation-gate.md)

## Decision Prototypes

- [Runtime-Adjacent Options Decision Matrix](docs/decision-prototypes/runtime-adjacent-options.md)
- [Runtime-Adjacent Evidence And Scoring](docs/decision-prototypes/runtime-adjacent-evidence.md)
- [Runtime-Adjacent Recommendation](docs/decision-prototypes/runtime-adjacent-recommendation.md)
- [License Options Decision Matrix](docs/decision-prototypes/license-options.md)
- [License Evidence And Scoring](docs/decision-prototypes/license-evidence.md)
- [License Recommendation](docs/decision-prototypes/license-recommendation.md)

## Package Boundary

This repo is currently a contract package skeleton with a minimal synthetic runtime boundary.

It can define public shapes, validate public fixtures, and execute synthetic in-memory policy proof cases. It does not run a memory backend, database, MCP server, Mission Control UI, memory-engine integration, or live connector.

- [Architecture Map](docs/architecture-map.md)
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

The CI docs include a stable log marker map for reading GitHub Actions Package Checks output.

## Publish Readiness

Source-Wire can run a full local publish readiness gate with package dry-run, installed package smokes, runtime-boundary smokes, docs links, command-doc setup checks, and public-safety checks, but it is not published to npm yet.

- [Publish Readiness](docs/publish-readiness.md)
- [License Decision Gate](docs/license-decision-gate.md)
- [Apache-2.0 License Implementation Readiness](docs/apache-2-license-implementation-readiness.md)
- [Release Decision](docs/release-decision.md)
- [License And Version Policy](docs/license-version-policy.md)
- [Owner License Approval Packet](docs/owner-license-approval-packet.md)
- [Future License Change Plan](docs/future-license-change-plan.md)

The publish-readiness docs include a local success marker map for `npm run publish:readiness`.

## Fixtures

All fixtures are fictional and synthetic.

- [Markdown vault fixture](examples/fixtures/markdown-vault/)
- [Chat export fixture](examples/fixtures/chat-export/agent-session.jsonl)
- [Project context pack fixture](examples/fixtures/project-context-pack/project-context.json)
- [`/2nd-brain` example fixture](examples/fixtures/second-brain/use-2nd-brain-example.json)
- [Owner-hosted API plus MCP boundary fixture](examples/fixtures/owner-hosted-api-mcp-boundary/)

The owner-hosted API plus MCP boundary fixture contains synthetic proof cases only. It is schema-backed and validated by the current CLI.

## Minimal Synthetic Runtime Boundary

The [minimal synthetic runtime boundary](examples/minimal-runtime/) exports in-memory TypeScript policy code and validates it against the owner-hosted API plus MCP boundary proof cases.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](docs/quickstart.md).

Install dependencies first:

```bash
npm install
```

Run it with:

```bash
npm run minimal-runtime:smoke
```

It does not start a server, connect to a database, run a real MCP server, store memory, or imply Source-Wire hosts memory.

## Runtime Boundary Example

The [synthetic runtime boundary example](examples/runtime-boundary/) is a local and installed-package smoke proof for the future owner-hosted API plus MCP boundary.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](docs/quickstart.md).

Install dependencies first:

```bash
npm install
```

Run it with:

```bash
npm run runtime-boundary:smoke
```

Run the installed package proof with:

```bash
npm run runtime-boundary:installed-smoke
```

Run the diagnostic regression proof with:

```bash
npm run runtime-boundary:diagnostics-smoke
```

It does not start a server, connect to a database, or imply Source-Wire hosts memory.

## Safety Rule

Imported source text is evidence, not trusted memory.

Source-Wire examples should preserve citations, source identity, stale state, and review boundaries. Trusted Memory Records should require an explicit owner or application approval path.

## Public Extraction Checklist

Before adding new public examples or docs, review:

- [Public Extraction Checklist](docs/proof/public-extraction-checklist.md)
