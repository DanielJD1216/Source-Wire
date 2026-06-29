# Source-Wire Publish Readiness

Source-Wire has package readiness checks, but it is not published to npm yet.

Publishing requires a later explicit release decision.

## Local Readiness Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

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
- `npm run runtime-boundary:installed-smoke`
- `npm run runtime-boundary:diagnostics-smoke`
- `npm run readiness:report`
- `npm run docs:links`
- `npm run docs:command-setup`
- `npm run safety:scan`

The `ci:check` sub-gate includes:

- `npm run runtime-boundary:smoke`

## Local Success Marker Map

When `npm run publish:readiness` passes, scan the output for these stable markers.

They prove the current package skeleton, installed package behavior, docs, safety scan, and synthetic runtime-boundary lane. They do not prove runtime deployment, database setup, connector sync, real memory storage, MCP server runtime, or npm publication.

| Area | Markers to look for |
| --- | --- |
| Release boundary | `ok release gate`, `ok license UNLICENSED`, `ok version 0.0.0`, `ok publishing blocked` |
| Package dry run | `ok package dry-run @source-wire/contracts@0.0.0`, `ok package file count 82` |
| Package content smoke | `ok package content smoke @source-wire/contracts@0.0.0`, `ok installed runtime readiness summary`, `ok installed runtime readiness summary content`, `ok installed package docs links` |
| Runtime boundary smoke | `ok runtime boundary check authorized_read`, `ok runtime boundary check unauthorized_read_denial`, `ok runtime boundary check wrong_namespace_denial`, `ok runtime boundary check source_maintenance_no_auto_promotion`, `ok runtime boundary check owner_controlled_approval`, `ok runtime boundary check agent_approval_denial`, `ok synthetic runtime boundary smoke` |
| Installed runtime boundary smoke | `ok runtime boundary installed smoke @source-wire/contracts@0.0.0`, `ok installed runtime boundary example` |
| Diagnostic regression smoke | `ok runtime boundary diagnostics smoke authorized_read`, `ok diagnostic failure includes check name`, `ok diagnostic failure includes assertion`, `ok diagnostic failure includes expected value`, `ok diagnostic failure includes received value`, `ok diagnostic failure includes next action` |
| Docs and readiness | `ok readiness report`, `ok docs links 38 markdown files`, `ok command docs setup` |
| Public safety | `Findings: 0 high=0 medium=0 low=0` |

Use [CI Checks](ci-checks.md) for the same marker map from the GitHub Actions perspective.

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

The package content smoke check builds and packs Source-Wire locally, creates a temporary external project, installs the local tarball, checks that the installed package includes `docs/runtime-boundary-readiness.md`, asserts that the installed summary still contains the key runtime-boundary claims, and runs the Markdown link checker from the installed package root.

It checks installed `README.md`, `docs`, and `examples` local links from `node_modules/@source-wire/contracts`.

The installed readiness summary content assertions protect:

- no runtime implementation is included,
- Source-Wire-hosted memory remains blocked,
- Source-Wire does not host memory,
- trusted memory requires owner or application approval.

Expected markers include `ok installed runtime readiness summary`, `ok installed runtime readiness summary content`, and `ok installed package docs links`.

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

For the full runtime-boundary proof lane, see [Runtime Boundary Readiness](runtime-boundary-readiness.md).

Run only the synthetic runtime boundary smoke:

```bash
npm run runtime-boundary:smoke
```

The runtime boundary smoke runs `examples/runtime-boundary/synthetic-boundary-smoke.mjs`.

It checks the synthetic owner-hosted API plus MCP boundary cases without starting a server.

The smoke output includes `ok runtime boundary check ...` markers before `ok synthetic runtime boundary smoke`.

If the smoke fails, the error names the failed check, expected value, received value, and next action.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Installed Runtime Boundary Smoke

Run only the installed synthetic runtime boundary smoke:

```bash
npm run runtime-boundary:installed-smoke
```

The installed runtime boundary smoke builds and packs Source-Wire locally, creates a temporary external project, installs the local tarball, and runs `examples/runtime-boundary/synthetic-boundary-smoke.mjs` from `node_modules/@source-wire/contracts`.

It proves the packaged runtime-boundary example can execute after package installation.

The installed smoke surfaces the same diagnostic markers from the packaged example.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Runtime Boundary Diagnostics Smoke

Run only the diagnostic regression smoke:

```bash
npm run runtime-boundary:diagnostics-smoke
```

The diagnostics smoke intentionally forces one synthetic runtime-boundary check to fail through `SOURCE_WIRE_RUNTIME_BOUNDARY_SMOKE_FORCE_FAILURE`.

It passes only when the failure output includes the failed check name, assertion, expected value, received value, and next action.

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

## Command Docs Setup Check

Run only the command-doc setup check:

```bash
npm run docs:command-setup
```

The command-doc setup check scans README, docs, and examples Markdown files.

It verifies command-bearing files include setup context or a Quickstart pointer before readers copy local commands.

Expected marker:

```text
ok command docs setup
```

It does not validate shell behavior or external services.

## Expected Package Contents

The package should include:

- `README.md`
- `package.json`
- built `dist` files
- docs index
- quickstart
- API reference
- public contract docs
- runtime boundary readiness summary
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
