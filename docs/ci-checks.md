# Source-Wire CI Checks

Source-Wire uses GitHub Actions to run package checks on push and pull request.

The workflow is for release confidence only. It does not publish, deploy, run a backend, or call private services.

## Workflow

Workflow file:

```text
.github/workflows/package-checks.yml
```

The workflow runs:

```bash
npm ci
npm run ci:check
```

## Local Mirror

Run the same package check set locally:

```bash
npm run ci:check
```

## Check Coverage

The local CI mirror runs:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run validate:fixtures`
- `npm run verify:schema-exports`
- `npm run cli:smoke`
- `npm run safety:scan`

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

## Current Boundary

Source-Wire remains a public contract package with schema exports, fixture validation, and a local validation CLI.

Runtime backend behavior remains out of scope until a later PRD explicitly opens it.
