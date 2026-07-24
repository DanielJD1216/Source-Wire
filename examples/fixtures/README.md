# Source-Wire Fixtures

These fixtures are fictional and synthetic.

They are designed to test public Source-Wire contracts without using real private data.

## Included Fixtures

| Fixture | Purpose | CLI schema |
| --- | --- | --- |
| `project-context-pack/project-context.json` | Fake Project Context Pack payload. | `project-context-pack` |
| `second-brain/use-2nd-brain-example.json` | Fake second-brain response payload. | `second-brain-v1` |
| `chat-export/agent-session.jsonl` | Fake chat export message lines for the Source Connection Contract. | `chat-export-message` |
| `markdown-vault/` | Fake Markdown notes for the Source Graph Adapter Contract. | Not schema-validated by the current CLI. |
| `owner-hosted-api-mcp-boundary/` | Fake proof cases for future owner-hosted API plus MCP runtime boundaries. | `owner-hosted-api-mcp-boundary` |
| `owner-hosted-setup/` | Fake owner-brings setup checklist and readiness matrix for future BYO owner-hosted setup. | Not schema-validated by the current CLI. |
| `daily-workflow/` | Fake daily owner memory workflow matrix for ask, update, review, follow-up, and Mission Control state. | Not schema-validated by the current CLI. |
| `runtime-readiness/` | Fake runtime-readiness matrix for private proof, API, MCP, database, source update, memory-engine, and release gates. | Not schema-validated by the current CLI. |
| `runtime-proof-intake/` | Fake redacted private-proof intake manifest for future runtime PRD refresh gates. | Not schema-validated by the current CLI. |
| `wrapper-runtime/` | Fake fixture matrix for future wrapper runtime policy behavior. | Not schema-validated by the current CLI. |
| `knowledge-provider/` | Fake two-profile matrix for the read-only KnowledgeProvider v1 contract. | Evaluated by its focused smoke. |
| `memory-store/` | Fake PostgreSQL-only posture and lifecycle matrix for MemoryStore v1. | Evaluated by its focused smoke. |

## Validate Schema-Backed Fixtures

Use Node.js 22 with npm from the repository root.

For the complete local setup path, read the [Quickstart](../../docs/getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Build first:

```bash
npm run build
```

Validate the Project Context Pack:

```bash
node dist/cli.js validate project-context-pack examples/fixtures/project-context-pack/project-context.json
```

Validate the second-brain response:

```bash
node dist/cli.js validate second-brain-v1 examples/fixtures/second-brain/use-2nd-brain-example.json
```

Validate chat export messages:

```bash
node dist/cli.js validate chat-export-message examples/fixtures/chat-export/agent-session.jsonl
```

Validate the owner-hosted API plus MCP boundary proof cases:

```bash
node dist/cli.js validate owner-hosted-api-mcp-boundary examples/fixtures/owner-hosted-api-mcp-boundary/boundary-proof-cases.json
```

## Markdown Vault Fixture

The Markdown vault fixture is a synthetic evidence example for source graph and import concepts.

It is not currently validated by the CLI because the current CLI validates JSON and JSONL contract payloads only.

## Owner-Hosted API Plus MCP Boundary Fixture

The owner-hosted API plus MCP boundary fixture is a synthetic proof-case example for future runtime PRDs.

It is validated by the CLI as a contract-level fixture. This does not start a runtime, connect to MCP, or imply Source-Wire hosts memory.

Start here:

- [Owner-hosted API plus MCP boundary fixture](owner-hosted-api-mcp-boundary/README.md)

## Owner-Hosted Setup Fixture

The owner-hosted setup fixture is a synthetic checklist and readiness matrix for the future BYO setup path.

It does not start a server, connect to a database, deploy services, import private sources, or create trusted memory.

Start here:

- [Owner-hosted setup fixture](owner-hosted-setup/README.md)
- [Owner-Hosted Setup Readiness Fixture Matrix](../../docs/internal/owner-hosted-setup-readiness-fixture-matrix.md)

## Daily Workflow Fixture Matrix

The daily workflow fixture matrix is a synthetic proof-case example for read-only asks, bounded updates, owner review, follow-up answers, and Mission Control state.

It is not currently validated by the CLI because the current CLI validates schema-backed JSON and JSONL contract payloads only.

Start here:

- [Daily workflow fixture matrix](daily-workflow/README.md)
- [Daily Workflow Synthetic Smoke](../../docs/internal/daily-workflow-synthetic-smoke.md)

## Wrapper Runtime Fixture Matrix

The wrapper runtime fixture matrix is a synthetic category and proof-case example for the future Source-Wire API policy wrapper, MCP adapter, and separate runtime adapter boundary.

It is not currently validated by the CLI because the current CLI validates schema-backed JSON and JSONL contract payloads only.

Start here:

- [Wrapper runtime fixture matrix](wrapper-runtime/README.md)

## Runtime Readiness Fixture Matrix

The runtime readiness fixture matrix is a synthetic proof-case example for the gates that must be clear before public owner-hosted runtime implementation can start.

It is not currently validated by the CLI because the current CLI validates schema-backed JSON and JSONL contract payloads only.

Start here:

- [Runtime readiness fixture matrix](runtime-readiness/README.md)
- [Runtime Readiness Smoke](../../docs/internal/runtime-readiness-smoke.md)

## Runtime Proof Intake Fixture

The runtime proof intake fixture is a synthetic redacted-proof manifest for acknowledging private proof metadata without moving private data into Source-Wire.

It is not currently validated by the CLI because the current CLI validates schema-backed JSON and JSONL contract payloads only.

Start here:

- [Runtime proof intake fixture](runtime-proof-intake/README.md)
- [Runtime Proof Intake](../../docs/internal/runtime-proof-intake.md)

## KnowledgeProvider Fixture Matrix

The KnowledgeProvider matrix runs document-index and relational-view profiles through one read-only evaluator. It proves exact version and capability handling, scoped provenance, safe degradation, and no automatic promotion without connecting to a knowledge base.

Start here:

- [KnowledgeProvider fixture matrix](knowledge-provider/README.md)
- [KnowledgeProvider Smoke](../../docs/reference/knowledge-provider-smoke.md)

## MemoryStore Fixture Matrix

The MemoryStore matrix proves the adopter-owned PostgreSQL and Source-Wire logical schema boundary, memory-only provenance, explicit lifecycle transitions, atomic audit, protected-read receipts, and structured role posture.

It contains no SQL, migration, database driver, connection, credential, provisioning, managed hosting, or real data.

Start here:

- [MemoryStore fixture matrix](memory-store/README.md)
- [MemoryStore Smoke](../../docs/reference/memory-store-smoke.md)

## Rules

- Do not replace these fixtures with real private notes, chats, emails, screenshots, database rows, or local files.
- Keep names, projects, IDs, and timestamps fictional.
- Keep imported source text separate from trusted memory.
- Preserve citations and review boundaries in examples.
- Preserve the rule that MCP routes through Source-Wire API policy.

## Related Docs

- [Quickstart](../../docs/getting-started/quickstart.md)
- [Validation CLI](../../docs/reference/validation-cli.md)
- [Owner-Hosted API Plus MCP Boundary Contract](../../docs/contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Owner-Hosted Setup Contract](../../docs/contracts/owner-hosted-setup-contract.md)
- [Daily Workflow Contract](../../docs/contracts/daily-workflow-contract.md)
- [Runtime Readiness Contract](../../docs/contracts/runtime-readiness-contract.md)
- [Runtime Proof Intake Contract](../../docs/contracts/runtime-proof-intake-contract.md)
- [Wrapper Runtime Policy Contract](../../docs/contracts/wrapper-runtime-policy-contract.md)
- [KnowledgeProvider v1 Contract](../../docs/contracts/knowledge-provider-v1-contract.md)
- [MemoryStore v1 Contract](../../docs/contracts/memory-store-v1-contract.md)
