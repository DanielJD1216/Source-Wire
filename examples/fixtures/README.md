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

## Validate Schema-Backed Fixtures

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

## Rules

- Do not replace these fixtures with real private notes, chats, emails, screenshots, database rows, or local files.
- Keep names, projects, IDs, and timestamps fictional.
- Keep imported source text separate from trusted memory.
- Preserve citations and review boundaries in examples.

## Related Docs

- [Quickstart](../../docs/quickstart.md)
- [Validation CLI](../../docs/validation-cli.md)
