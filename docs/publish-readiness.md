# Source-Wire Publish Readiness

Source-Wire has package readiness checks, but it is not published to npm yet.

Publishing requires a later explicit release decision.

## Local Readiness Command

Run:

```bash
npm run publish:readiness
```

This command runs:

- `npm run ci:check`
- `npm run release:gate`
- `npm run package:dry-run`
- `npm run consumer:smoke`
- `npm run package:content-smoke`
- `npm run examples:installed-smoke`
- `npm run readiness:report`
- `npm run docs:links`
- `npm run safety:scan`

The `ci:check` sub-gate includes:

- `npm run runtime-boundary:smoke`

## Readiness Report

Run only the package readiness report:

```bash
npm run readiness:report
```

The readiness report is a fast read-only summary of current package posture.

It prints package metadata, publish boundary, runtime boundary, package exports, validation schemas, readiness commands, installed package smokes, and intentionally blocked scope.

It fails if required posture fields are missing or inconsistent.

It does not run the full readiness gate. Use `npm run publish:readiness` for verification before committing or releasing.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Package Dry Run

Run only the package dry-run check:

```bash
npm run package:dry-run
```

The dry-run check builds the package, runs `npm pack --dry-run --json`, and verifies expected package contents.

It checks required package paths for core build outputs, public docs, JSON schemas, synthetic fixtures, and TypeScript examples.

It does not publish.

## Consumer Smoke

Run only the consumer smoke check:

```bash
npm run consumer:smoke
```

The consumer smoke check builds and packs Source-Wire locally, creates a temporary external TypeScript project, installs the local tarball, typechecks package-root imports from `@source-wire/contracts`, runs a tiny compiled import check, runs the installed `source-wire` CLI against every schema-backed synthetic fixture shipped inside the installed package, and removes the temporary project.

Installed fixture matrix:

| Installed fixture | CLI schema |
| --- | --- |
| `examples/fixtures/project-context-pack/project-context.json` | `project-context-pack` |
| `examples/fixtures/second-brain/use-2nd-brain-example.json` | `second-brain-v1` |
| `examples/fixtures/chat-export/agent-session.jsonl` | `chat-export-message` |

Markdown vault fixtures are package contents, but they are not part of this validation matrix until a Markdown vault schema exists.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Package Content Smoke

Run only the package content smoke check:

```bash
npm run package:content-smoke
```

The package content smoke check builds and packs Source-Wire locally, creates a temporary external project, installs the local tarball, and runs the Markdown link checker from the installed package root.

It checks installed `README.md`, `docs`, and `examples` local links from `node_modules/@source-wire/contracts`.

This is different from `npm run docs:links`, which checks links in the repository checkout.

Installed TypeScript example typechecking is outside this check because the current examples intentionally use repo-local TypeScript path mapping.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Installed TypeScript Examples Smoke

Run only the installed TypeScript examples smoke:

```bash
npm run examples:installed-smoke
```

The installed examples smoke builds and packs Source-Wire locally, creates a temporary external project, installs the local tarball, copies the public TypeScript example files into that project, and typechecks them against the installed package declarations.

This is different from `npm run examples:typecheck`, which checks examples in the repository checkout through repo-local TypeScript path mapping.

The installed smoke proves package-root imports from `@source-wire/contracts` work for consumer TypeScript examples.

It does not execute compiled example JavaScript.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Runtime Boundary Smoke

Run only the synthetic runtime boundary smoke:

```bash
npm run runtime-boundary:smoke
```

The runtime boundary smoke runs `examples/runtime-boundary/synthetic-boundary-smoke.mjs`.

It checks the synthetic owner-hosted API plus MCP boundary cases without starting a server.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Docs Link Check

Run only the docs link check:

```bash
npm run docs:links
```

The docs link check validates local Markdown links in README, docs, and examples.

It ignores external URLs, mailto links, and pure page anchors.

It strips optional anchor fragments before checking local file or directory targets.

It does not validate external URL availability or anchor existence.

## Expected Package Contents

The package should include:

- `README.md`
- `package.json`
- built `dist` files
- docs index
- quickstart
- API reference
- public contract docs
- schema docs
- validation CLI docs
- CI docs
- publish-readiness docs
- release and license planning docs
- synthetic examples
- TypeScript examples
- Markdown vault fixtures
- JSON schemas

The package should not include:

- `.git`
- `.github`
- `node_modules`
- `src`
- `scripts`
- `.env` files
- `package-lock.json`
- `tsconfig.json`
- private files
- build junk outside the intentional `dist` output

## Current Publish Boundary

Publishing remains blocked.

Do not run:

```bash
npm publish
```

until a later PRD explicitly opens npm publishing and records owner approval.

## Release Gate

Run:

```bash
npm run release:gate
```

The release gate verifies that current package metadata still matches the release decision:

- license is `UNLICENSED`,
- version is `0.0.0`,
- npm publishing remains blocked through restricted publish config,
- package scripts do not include publish, release, or deployment commands.

Release decision docs:

- [Release Decision](release-decision.md)
- [License And Version Policy](license-version-policy.md)

## What Is Still Blocked

This readiness work does not include:

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
- trusted Memory Record promotion,
- private implementation code,
- secret-dependent checks,
- private repo checkout.

## Future Release Gate

A future publish unit should decide:

- package name and scope finality,
- license posture,
- versioning policy,
- npm access policy,
- release notes,
- owner approval,
- post-publish verification.
