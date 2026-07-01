# Source-Wire Release Auth Preflight

Status: owner-side authentication preflight only.

This command is read-only. It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this command before any approved release implementation attempts npm publishing or GitHub release creation.

It checks:

- npm registry reachability,
- npm authentication with `npm whoami`,
- GitHub authentication with `gh auth status`.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:auth-preflight
```

Expected markers when this machine is ready to publish and release:

```text
ok release auth preflight readable
ok release publish credentials ready
```

Expected markers when npm or GitHub auth is missing:

```text
ok release auth preflight readable
blocked release publish credentials missing
```

## Current Stop Condition

If `npm run release:auth-preflight` prints `blocked npm auth missing`, stop before:

- changing package version,
- publishing npm,
- creating a GitHub release,
- creating tags.

Configure npm authentication first, then rerun:

```bash
npm run release:auth-preflight
npm run release:execution-preflight
```

## Related Docs

- [Release Execution Preflight](release-execution-preflight.md)
- [Release Implementation Preparation](release-implementation-preparation.md)
- [Release Implementation Runbook](release-implementation-runbook.md)
