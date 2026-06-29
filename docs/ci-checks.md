# Source-Wire CI Checks

Source-Wire uses GitHub Actions to run package checks on push and pull request.

The workflow is for release confidence only. It does not publish, deploy, run a backend, or call private services.

## Workflow

Workflow file:

```text
.github/workflows/package-checks.yml
```

The workflow uses:

- `actions/checkout@v5`
- `actions/setup-node@v5`

Those actions use Node 24 for their own action internals.

Source-Wire package checks still run on Node 22 through `actions/setup-node`.

The workflow runs:

```bash
npm ci
npm run publish:readiness
```

## Local Mirror

Run the same readiness gate locally:

```bash
npm run publish:readiness
```

## Check Coverage

The readiness gate runs:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run validate:fixtures`
- `npm run verify:schema-exports`
- `npm run cli:smoke`
- `npm run safety:scan`
- `npm run release:gate`
- `npm run package:dry-run`
- `npm run consumer:smoke`
- `npm run package:content-smoke`
- `npm run examples:installed-smoke`
- `npm run readiness:report`
- `npm run docs:links`
- `npm run safety:scan`

`npm run ci:check` remains as a sub-gate inside `npm run publish:readiness`.

## Public-Safety Scan

The public-safety scan is self-contained inside Source-Wire:

```bash
npm run safety:scan
```

It scans public Source-Wire files for obvious private data, secrets, local paths, private implementation references, and similar public-extraction risks.

The scan is non-destructive.

It exits non-zero when high-risk findings are present.

## What CI Does Not Do

CI does not:

- publish npm,
- create GitHub releases,
- deploy services,
- call API server runtime,
- call MCP server runtime,
- call databases,
- call connectors,
- call memory engines,
- require secrets,
- check out private repos,
- use real user data,
- create or promote trusted Memory Records.

The consumer smoke check installs a locally packed tarball into a temporary project.

It verifies package-root imports and the installed `source-wire` CLI against every schema-backed synthetic fixture shipped inside the installed package:

- `project-context-pack`
- `second-brain-v1`
- `chat-export-message`

Markdown vault fixtures are not part of the installed fixture validation matrix until a Markdown vault schema exists.

It does not publish npm, create a release, deploy services, or call backend runtime.

The package content smoke check installs a locally packed tarball into a temporary project and runs the Markdown link checker from the installed package root.

It verifies installed `README.md`, `docs`, and `examples` local links from `node_modules/@source-wire/contracts`.

It does not typecheck installed TypeScript examples because those examples currently use repo-local path mapping.

The installed TypeScript examples smoke check installs a locally packed tarball into a temporary project, copies the public TypeScript examples into that project, and typechecks them against the installed package declarations.

It verifies consumer package-root imports without repo-local TypeScript path mapping.

It does not execute compiled example JavaScript.

The readiness report prints a fast read-only summary of package posture, package surfaces, readiness commands, installed package smokes, and intentionally blocked scope.

It does not replace the full readiness gate.

The docs link check validates local Markdown links in README, docs, and examples.

It does not check external URLs or validate anchor existence.

## Current Boundary

Source-Wire remains a public contract package with schema exports, fixture validation, and a local validation CLI.

Runtime backend behavior remains out of scope until a later PRD explicitly opens it.
