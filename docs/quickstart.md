# Source-Wire Quickstart

Source-Wire is a public contract package skeleton for agent-first memory systems.

This quickstart verifies the package locally with synthetic fixtures.

It does not run a backend, sync sources, connect to MCP, call a database, create memories, or publish a new package version.

## Prerequisites

- Node.js 22 with npm.
- Git.

Node.js 22 matches GitHub Actions Package Checks.

The package is published to npm as `@source-wire/contracts@0.1.0`. Use the local repository checkout for development and full verification.

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Run The CLI Smoke Check

```bash
npm run cli:smoke
```

This builds the package, validates the four public schema-backed fixtures, and verifies that invalid synthetic payloads fail.

## Validate A Project Context Pack

```bash
node dist/cli.js validate project-context-pack examples/fixtures/project-context-pack/project-context.json
```

Expected output:

```text
ok examples/fixtures/project-context-pack/project-context.json
```

## Validate A Second-Brain Response

```bash
node dist/cli.js validate second-brain-v1 examples/fixtures/second-brain/use-2nd-brain-example.json
```

Expected output:

```text
ok examples/fixtures/second-brain/use-2nd-brain-example.json
```

## Validate A Chat Export Message File

```bash
node dist/cli.js validate chat-export-message examples/fixtures/chat-export/agent-session.jsonl
```

Expected output:

```text
ok examples/fixtures/chat-export/agent-session.jsonl
```

## Validate Owner-Hosted API Plus MCP Boundary Proof Cases

```bash
node dist/cli.js validate owner-hosted-api-mcp-boundary examples/fixtures/owner-hosted-api-mcp-boundary/boundary-proof-cases.json
```

Expected output:

```text
ok examples/fixtures/owner-hosted-api-mcp-boundary/boundary-proof-cases.json
```

## Run The Full Local Readiness Check

```bash
npm run publish:readiness
```

This runs typecheck, build, tests, fixture validation, schema export verification, CLI smoke, release gate, package dry-run, installed package smokes, runtime-boundary smokes, readiness report, docs links, command-doc setup checks, and public-safety scanning.

Use [Publish Readiness](publish-readiness.md) for the local success marker map. Use [CI Checks](ci-checks.md) for the matching GitHub Actions Package Checks marker map.

It does not publish npm.

## Print The Readiness Report

```bash
npm run readiness:report
```

This prints a fast read-only summary of package posture, exported surfaces, validation schemas, readiness commands, installed package smokes, required readiness docs, and intentionally blocked runtime or release scope.

It does not run the full readiness gate, publish npm, or run backend behavior.

## Run The Reviewer First-Pass Smoke

```bash
npm run reviewer:smoke
```

This creates a temporary clean checkout-style copy, runs `npm install`, runs `npm run readiness:report`, checks the expected review-only markers, and removes the temporary copy.

It does not publish npm, create a release, deploy services, start a backend, or use real data.

## Run The Consumer Smoke Check

```bash
npm run consumer:smoke
```

This creates a temporary external TypeScript project, installs a locally packed Source-Wire tarball, typechecks imports from `@source-wire/contracts`, runs a tiny compiled import check, runs the installed `source-wire` CLI against every schema-backed synthetic fixture shipped inside the installed package, and deletes the temporary project.

It does not publish npm or run backend behavior.

## Run The Package Content Smoke Check

```bash
npm run package:content-smoke
```

This creates a temporary external project, installs a locally packed Source-Wire tarball, checks local Markdown links and anchors from the installed package root under `node_modules/@source-wire/contracts`, and verifies the installed runtime readiness summary exists with its protected content assertions.

This proves installed `README.md`, `docs`, and `examples` links and anchors work from the packaged artifact and that the packaged runtime readiness summary still carries the expected boundary claims.

It does not publish npm, run backend behavior, or typecheck installed TypeScript examples.

## Run The Installed TypeScript Examples Smoke Check

```bash
npm run examples:installed-smoke
```

This creates a temporary external project, installs a locally packed Source-Wire tarball, copies the public TypeScript example files into that project, and typechecks them against the installed `@source-wire/contracts` package.

This proves the examples work through package-root imports without repo-local TypeScript path mapping.

It does not publish npm, run backend behavior, or execute compiled example JavaScript.

## Run The Installed Runtime Boundary Smoke Check

```bash
npm run runtime-boundary:installed-smoke
```

This creates a temporary external project, installs a locally packed Source-Wire tarball, and runs the packaged synthetic runtime-boundary example from `node_modules/@source-wire/contracts`.

This proves the runtime-boundary example still works after package installation.

It does not publish npm, start a backend, start an API server, start an MCP server, connect to a database, run connectors, or imply Source-Wire hosts memory.

## Run The Runtime Boundary Diagnostics Smoke Check

```bash
npm run runtime-boundary:diagnostics-smoke
```

This intentionally forces one synthetic runtime-boundary check to fail and verifies that the failure output still includes the failed check name, assertion, expected value, received value, and next action.

This proves the smoke is useful when a future boundary claim breaks.

It does not publish npm, start a backend, start an API server, start an MCP server, connect to a database, run connectors, or use real data.

## Check Local Docs Links

```bash
npm run docs:links
```

This validates local Markdown links in README, docs, and examples.

It does not check external URLs or anchor existence.

## Check Local Docs Anchors

```bash
npm run docs:anchors
```

This validates local Markdown section anchors in README, docs, and examples.

It does not check external URLs.

## Check Public External Links

```bash
npm run docs:external-links
```

This verifies public-facing external URLs in README, docs, examples, `.github` templates, and package metadata.

It uses live network access and is intentionally outside `npm run publish:readiness`.

## What The Fixtures Are For

| Fixture | Purpose | CLI schema |
| --- | --- | --- |
| `examples/fixtures/project-context-pack/project-context.json` | Synthetic project context import shape. | `project-context-pack` |
| `examples/fixtures/second-brain/use-2nd-brain-example.json` | Synthetic second-brain response shape. | `second-brain-v1` |
| `examples/fixtures/chat-export/agent-session.jsonl` | Synthetic chat export message lines. | `chat-export-message` |
| `examples/fixtures/markdown-vault/` | Synthetic Markdown vault evidence examples. | Not schema-validated by the current CLI. |
| `examples/fixtures/owner-hosted-api-mcp-boundary/` | Synthetic owner-hosted API plus MCP boundary proof cases. | `owner-hosted-api-mcp-boundary` |

`npm run consumer:smoke` validates the four schema-backed fixtures from the installed package path under `node_modules/@source-wire/contracts`.

The Markdown vault fixture is intentionally not part of the installed fixture validation matrix until Source-Wire has a matching schema.

More detail:

- [Fixtures README](../examples/fixtures/README.md)
- [Validation CLI](validation-cli.md)
- [API Reference](api-reference.md)

## Current Boundaries

Source-Wire does not currently include:

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

- package license is `Apache-2.0`,
- package version is `0.1.0`,
- `LICENSE` file exists,
- npm package `@source-wire/contracts@0.1.0` is published,
- GitHub release `v0.1.0` is published,
- runtime backend work is blocked.

## Safety Rule

Use synthetic examples only.

Do not add real user data, private implementation history, screenshots, local paths, tokens, domains, emails, account IDs, client names, or production exports to public fixtures or docs.
