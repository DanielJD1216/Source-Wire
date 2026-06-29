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
- `npm run docs:links`
- `npm run safety:scan`

## Package Dry Run

Run only the package dry-run check:

```bash
npm run package:dry-run
```

The dry-run check builds the package, runs `npm pack --dry-run --json`, and verifies expected package contents.

It does not publish.

## Consumer Smoke

Run only the consumer smoke check:

```bash
npm run consumer:smoke
```

The consumer smoke check builds and packs Source-Wire locally, creates a temporary external TypeScript project, installs the local tarball, typechecks package-root imports from `@source-wire/contracts`, runs a tiny compiled import check, and removes the temporary project.

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
- public contract docs
- schema docs
- validation CLI docs
- CI docs
- synthetic examples
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
