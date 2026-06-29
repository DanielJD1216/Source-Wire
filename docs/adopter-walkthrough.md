# Source-Wire Public Adopter Walkthrough

This walkthrough gives a new adopter one practical path through the current Source-Wire package.

Source-Wire is a public contract package skeleton. It defines contract shapes, schemas, fixtures, examples, validation tools, and package-readiness checks for agent-first memory systems.

It does not run a memory backend, API server, MCP server, database, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

For the whole system shape, read the [Architecture Map](architecture-map.md).

## 1. Clone And Install

```bash
git clone https://github.com/DanielJD1216/Source-Wire.git
cd Source-Wire
npm install
```

What this proves:

- You have a local checkout.
- Development dependencies are installed.
- No backend service or secret is required.

## 2. Print The Readiness Report

```bash
npm run readiness:report
```

Expected markers:

```text
Source-Wire Package Readiness Report
Package: @source-wire/contracts
Version: 0.0.0
License: UNLICENSED
Runtime boundary: contracts only, no backend runtime included
ok readiness report
```

What this proves:

- The package posture is readable in one place.
- The current version and license boundary are explicit.
- The package is still contracts-only.
- The report can summarize package exports, schemas, commands, installed smokes, and blocked scope without running the full readiness gate.

## 3. Validate The Synthetic Fixtures

```bash
npm run cli:smoke
```

Expected markers:

```text
ok valid project-context-pack
ok valid second-brain-v1
ok valid chat-export-message
ok invalid project-context-pack
```

What this proves:

- The local validation CLI can validate schema-backed fixtures.
- The invalid-payload path is checked.
- Fixtures are synthetic and public-safe.

You can also validate fixtures directly:

```bash
node dist/cli.js validate project-context-pack examples/fixtures/project-context-pack/project-context.json
node dist/cli.js validate second-brain-v1 examples/fixtures/second-brain/use-2nd-brain-example.json
node dist/cli.js validate chat-export-message examples/fixtures/chat-export/agent-session.jsonl
```

The CLI validates only the three schema-backed fixtures above.

Example-only fixtures are public-safe references, not schema-backed validation targets:

- [Markdown vault fixture](../examples/fixtures/markdown-vault/)
- [Owner-hosted API plus MCP boundary fixture](../examples/fixtures/owner-hosted-api-mcp-boundary/README.md)

## 4. Run The Full Readiness Gate

```bash
npm run publish:readiness
```

Expected markers include:

```text
ok release gate
ok package dry-run @source-wire/contracts@0.0.0
ok consumer installed fixture matrix validation
ok installed package docs links
ok installed examples package-root imports
ok readiness report
Findings: 0 high=0 medium=0 low=0
```

What this proves:

- TypeScript typechecking passes.
- The package builds.
- Synthetic fixtures validate.
- Schema exports are verified.
- CLI smoke passes.
- Public-safety scanning finds no issues.
- Release gate keeps publishing blocked.
- Package dry-run includes required files and excludes forbidden files.
- Installed package smokes pass after local tarball install.

What this does not do:

- It does not publish npm.
- It does not create a GitHub release.
- It does not deploy services.
- It does not run a backend, database, MCP server, memory engine, or connector.

## 5. Inspect TypeScript Examples

Start here:

- [TypeScript Examples](../examples/typescript/README.md)
- [API Reference](api-reference.md)

Run the repo-local example typecheck:

```bash
npm run examples:typecheck
```

Run the installed-package example smoke:

```bash
npm run examples:installed-smoke
```

Expected markers:

```text
ok examples installed smoke @source-wire/contracts@0.0.0
ok installed TypeScript examples 4 files
ok installed examples package-root imports
```

What this proves:

- The examples compile in the repo.
- The same public example files can typecheck in a temporary external project.
- Consumer imports from `@source-wire/contracts` work through installed package declarations.

## 6. Understand Installed Package Smokes

Source-Wire has three installed-package checks:

| Command | What it proves |
| --- | --- |
| `npm run consumer:smoke` | A temporary external project can install the packed tarball, import the package root, run the installed `source-wire` CLI, and validate schema-backed installed fixtures. |
| `npm run package:content-smoke` | Installed `README.md`, `docs`, and `examples` local Markdown links work from `node_modules/@source-wire/contracts`. |
| `npm run examples:installed-smoke` | Public TypeScript examples typecheck against installed package declarations without repo-local path mapping. |

These checks are package-confidence checks. They are not runtime integration tests.

## 7. Know What Is Intentionally Missing

Source-Wire does not currently include:

- npm publishing,
- GitHub release publishing,
- deployment,
- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record promotion.

Current release posture:

- package license is `UNLICENSED`,
- package version is `0.0.0`,
- no `LICENSE` file exists,
- npm publishing is blocked,
- runtime backend work is blocked.

## Related Docs

- [Quickstart](quickstart.md)
- [Architecture Map](architecture-map.md)
- [Publish Readiness](publish-readiness.md)
- [Runtime Boundary](runtime-boundary.md)
- [Schema Exports](schema-exports.md)
- [Validation CLI](validation-cli.md)
- [Public Extraction Checklist](proof/public-extraction-checklist.md)
