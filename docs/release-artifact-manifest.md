# Source-Wire Release Artifact Manifest

Status: release artifact manifest only.

This check does not publish a new npm version, create a new GitHub release, create a tag, change package version, deploy services, start hosted runtime behavior, or accept code contributions.

## Purpose

Use this check to see the exact package artifact identity for the current published package shape.

The command runs `npm pack --dry-run --json`, validates the required package paths, blocks private or source-only paths, and prints the package filename, file count, size, shasum, and integrity.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:artifact-manifest
```

Expected markers:

```text
ok release artifact manifest ready
ok release artifact package identity @source-wire/contracts@0.1.0
ok release artifact integrity recorded
ok release artifact publication recorded
```

## What This Check Proves

The command verifies:

- package name remains `@source-wire/contracts`,
- package version remains `0.1.0`,
- package license remains `Apache-2.0`,
- `publishConfig.access` remains `public`,
- every required package path is included,
- source-only paths such as `src/` and `scripts/` are not included,
- local or private files such as `.env`, `.env.local`, `package-lock.json`, and `tsconfig.json` are not included,
- npm dry-run returns a shasum and sha512 integrity value.

## Why This Exists

`npm run package:dry-run` proves the package shape is valid.

`npm run release:artifact-manifest` gives the owner and future release implementer a compact artifact identity record for the current package shape.

If a future approved release implementation changes the package version, this manifest should be rerun after the version change and before publishing the new version.

## Current Boundary

Until a future owner-approved release implementation unit exists:

- publishing a new npm package version remains blocked,
- creating a new GitHub release remains blocked,
- creating a new release tag remains blocked,
- package version remains `0.1.0`,
- deployment remains blocked,
- hosted runtime behavior remains blocked,
- production runtime claims remain blocked,
- code contribution acceptance remains blocked.

## Related Docs

- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Implementation Runbook](release-implementation-runbook.md)
- [Publish Readiness](publish-readiness.md)
- [CI Checks](ci-checks.md)
