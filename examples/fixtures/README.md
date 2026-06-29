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
| `owner-hosted-api-mcp-boundary/` | Fake proof cases for future owner-hosted API plus MCP runtime boundaries. | Not schema-validated by the current CLI. |

## Validate Schema-Backed Fixtures

Use Node.js 22 with npm from the repository root.

For the complete local setup path, read the [Quickstart](../../docs/quickstart.md).

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

## Markdown Vault Fixture

The Markdown vault fixture is a synthetic evidence example for source graph and import concepts.

It is not currently validated by the CLI because the current CLI validates JSON and JSONL contract payloads only.

## Owner-Hosted API Plus MCP Boundary Fixture

The owner-hosted API plus MCP boundary fixture is a synthetic proof-case example for future runtime PRDs.

It is not currently validated by the CLI because Unit 51 does not add a schema for this fixture.

Start here:

- [Owner-hosted API plus MCP boundary fixture](owner-hosted-api-mcp-boundary/README.md)

## Rules

- Do not replace these fixtures with real private notes, chats, emails, screenshots, database rows, or local files.
- Keep names, projects, IDs, and timestamps fictional.
- Keep imported source text separate from trusted memory.
- Preserve citations and review boundaries in examples.

## Related Docs

- [Quickstart](../../docs/quickstart.md)
- [Validation CLI](../../docs/validation-cli.md)
- [Owner-Hosted API Plus MCP Boundary Contract](../../docs/contracts/owner-hosted-api-mcp-boundary-contract.md)
