# Source-Wire Public Architecture Map

Source-Wire is currently a public contract package skeleton.

It describes the shape of an agent-first memory system, but it does not ship the runtime system yet.

## Current Package Shape

```text
Synthetic fixtures
  -> JSON schemas and TypeScript contract types
  -> Validation CLI and helper functions
  -> TypeScript examples
  -> Package readiness and installed-package smoke checks
```

Current package contents:

- contract documentation,
- TypeScript contract types,
- JSON schemas,
- synthetic fixtures,
- validation CLI,
- TypeScript examples,
- package-readiness checks,
- public safety scan,
- adopter walkthrough.

Current package non-goals:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record promotion.

## Concept Map

```text
Source System
  -> Source Graph
  -> Source Connection
  -> Source-backed Evidence
  -> Candidate Review (future runtime)
  -> Trusted Memory (future runtime)
  -> /2nd-brain Response
  -> MCP Tool Behavior
```

This package defines the public shapes around that flow. It does not execute the flow.

## Source Graph

Source Graph is the evidence shape.

It describes collections, items, segments, and edges from source systems such as notes, chat exports, project context packs, or future connector exports.

Source Graph output should remain source evidence.

It should not automatically create trusted facts, personal memory, decisions, or rules.

Related docs:

- [Source Graph Adapter Contract](contracts/source-graph-adapter-contract.md)
- [Markdown vault fixture](../examples/fixtures/markdown-vault/)

## Source Connections

Source Connections describe source sync and maintenance boundaries.

They help represent:

- source class,
- sync mode,
- latest sync result,
- candidate policy,
- no-auto-promotion behavior.

In a future runtime, a Source Connection may prepare review candidates. It still should not approve trusted memory by itself.

Related docs:

- [Source Connection Contract](contracts/source-connection-contract.md)
- [Chat export fixture](../examples/fixtures/chat-export/agent-session.jsonl)

## `/2nd-brain`

`second-brain.v1` is the public response contract for agent-facing memory use.

It gives agent harnesses a predictable shape for:

- answering a memory-backed question,
- returning citations,
- naming evidence gaps,
- choosing a search radius,
- reporting whether maintenance ran,
- preserving `noAutoPromotion`.

This package defines the response shape. It does not perform retrieval or source maintenance.

Related docs:

- [`second-brain.v1` Contract](contracts/second-brain-v1-contract.md)
- [`/2nd-brain` fixture](../examples/fixtures/second-brain/use-2nd-brain-example.json)

## MCP Tool Behavior

The MCP tool behavior contract describes expected behavior for future agent-callable tools.

It groups tools such as memory search, source search, maintenance, second-brain, context assembly, and handoff.

The contract preserves important boundaries:

- explicit user action where needed,
- citations returned where relevant,
- namespace boundary preservation,
- no automatic trusted memory creation.

This package does not ship an MCP server runtime.

Related docs:

- [MCP Tool Behavior Contract](contracts/mcp-tool-behavior-contract.md)

## Schemas And Fixtures

Schemas make public fixture shapes testable.

Current schema-backed fixture lanes:

| Lane | Schema | Fixture |
| --- | --- | --- |
| Project Context Pack | `project-context-pack` | `examples/fixtures/project-context-pack/project-context.json` |
| `/2nd-brain` | `second-brain-v1` | `examples/fixtures/second-brain/use-2nd-brain-example.json` |
| Chat Export | `chat-export-message` | `examples/fixtures/chat-export/agent-session.jsonl` |

Example-only fixture lanes:

| Lane | Fixture | Current validation status |
| --- | --- | --- |
| Markdown Vault | `examples/fixtures/markdown-vault/` | Not schema-validated yet. |
| Owner-Hosted API Plus MCP Boundary | `examples/fixtures/owner-hosted-api-mcp-boundary/` | Not schema-validated yet. |

Markdown vault and owner-hosted API plus MCP boundary fixtures are included as source-evidence and runtime-boundary examples, but they are not schema-validated yet.

Related docs:

- [Schema Exports](schema-exports.md)
- [Validation CLI](validation-cli.md)
- [Fixtures README](../examples/fixtures/README.md)

## Readiness And Package Confidence

Readiness checks prove package confidence, not runtime behavior.

Important commands:

| Command | Purpose |
| --- | --- |
| `npm run readiness:report` | Prints a fast read-only summary of package posture. |
| `npm run cli:smoke` | Validates public schema-backed fixtures and one invalid payload. |
| `npm run consumer:smoke` | Installs a packed tarball and checks package-root imports plus installed CLI validation. |
| `npm run package:content-smoke` | Checks installed README/docs/examples local links, installed runtime readiness summary presence, and installed readiness summary content assertions. |
| `npm run examples:installed-smoke` | Typechecks copied TypeScript examples against installed package declarations. |
| `npm run runtime-boundary:installed-smoke` | Runs the packaged synthetic runtime-boundary example from an installed tarball. |
| `npm run runtime-boundary:diagnostics-smoke` | Verifies runtime-boundary failure output keeps the failed check name, assertion, expected value, received value, and next action visible. |
| `npm run publish:readiness` | Runs the full local readiness gate without publishing. |

Related docs:

- [Public Adopter Walkthrough](adopter-walkthrough.md)
- [Publish Readiness](publish-readiness.md)
- [CI Checks](ci-checks.md)

## Future Runtime Boundary

Future runtime work may add:

- owner-hosted API server,
- MCP server runtime,
- database migrations,
- Postgres and pgvector setup,
- memory-engine integration,
- source maintenance workflows,
- candidate review,
- Mission Control UI.

The [synthetic runtime boundary example](../examples/runtime-boundary/README.md) shows the proposed owner-hosted API plus MCP boundary with synthetic data only, local smoke proof, and installed-package smoke proof.

It does not start a server, connect to a database, add package exports, or approve runtime implementation.

Those are future implementation layers. They should be opened by explicit PRDs and must preserve the trust boundary:

```text
Source evidence is not trusted memory.
Trusted memory requires an owner or application approval path.
```

Related docs:

- [Runtime Boundary](runtime-boundary.md)
- [Synthetic Runtime Boundary Example](../examples/runtime-boundary/README.md)
- [Release Decision](release-decision.md)

## Safe Mental Model

Use Source-Wire this way today:

- Treat fixtures as synthetic examples.
- Treat schemas and types as public contracts.
- Treat readiness checks as package confidence checks.
- Treat Source Graph as evidence.
- Treat trusted memory as future runtime behavior.
- Treat runtime systems as intentionally absent until a later PRD opens them.
