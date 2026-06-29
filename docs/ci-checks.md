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

It does not publish npm, create a release, deploy services, or call backend runtime.

The docs link check validates local Markdown links in README, docs, and examples.

It does not check external URLs or validate anchor existence.

## Current Boundary

Source-Wire remains a public contract package with schema exports, fixture validation, and a local validation CLI.

Runtime backend behavior remains out of scope until a later PRD explicitly opens it.
