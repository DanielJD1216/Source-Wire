# Source-Wire Validation CLI

Source-Wire includes a tiny local validation CLI.

It validates explicit files against explicit Source-Wire schema names.

It does not import sources, sync connectors, call servers, create memories, or promote trusted records.

## Command Shape

```bash
source-wire validate <schema> <file...>
```

During local development, run the built CLI directly:

```bash
npm run build
node dist/cli.js validate <schema> <file...>
```

## Supported Schemas

| Schema name | Expected file shape |
| --- | --- |
| `project-context-pack` | One JSON Project Context Pack file |
| `second-brain-v1` | One JSON `/2nd-brain` response fixture file |
| `chat-export-message` | One JSONL chat export file with one message per line |

## Examples

Validate a Project Context Pack:

```bash
node dist/cli.js validate project-context-pack examples/fixtures/project-context-pack/project-context.json
```

Validate a `second-brain-v1` response fixture:

```bash
node dist/cli.js validate second-brain-v1 examples/fixtures/second-brain/use-2nd-brain-example.json
```

Validate a chat export JSONL file:

```bash
node dist/cli.js validate chat-export-message examples/fixtures/chat-export/agent-session.jsonl
```

Validate multiple files with the same schema:

```bash
node dist/cli.js validate project-context-pack file-a.json file-b.json
```

## Output

Successful validation prints:

```text
ok <file>
```

Failed validation prints:

```text
failed <file>
  - <error>
```

## Exit Codes

- `0`: all files passed.
- non-zero: one or more files failed, the schema name is invalid, or no file path was provided.

## Local Validation Only

The CLI is intentionally small.

It does not:

- crawl directories by default,
- import source collections,
- sync connectors,
- call API servers,
- call MCP server runtime,
- call databases,
- call memory engines,
- create trusted Memory Records,
- promote candidate memories,
- inspect private implementation code.

## Verification

Run:

```bash
npm run cli:smoke
```

The smoke command builds the package, validates the three public fixtures, and verifies that an invalid synthetic payload fails.
