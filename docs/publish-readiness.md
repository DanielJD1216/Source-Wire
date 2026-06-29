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
- `npm run package:dry-run`
- `npm run safety:scan`

## Package Dry Run

Run only the package dry-run check:

```bash
npm run package:dry-run
```

The dry-run check builds the package, runs `npm pack --dry-run --json`, and verifies expected package contents.

It does not publish.

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
