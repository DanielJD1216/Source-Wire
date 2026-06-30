# Source-Wire Release Artifact Manifest

Status: release artifact manifest only.

This check does not publish npm, create a GitHub release, create a tag, change package version, deploy services, start hosted runtime behavior, or accept code contributions.

## Purpose

Use this check before any future release implementation decision to see the exact package artifact identity that would be released.

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
ok release artifact package identity @source-wire/contracts@0.0.0
ok release artifact integrity recorded
blocked release artifact publish not approved
```

## What This Check Proves

The command verifies:

- package name remains `@source-wire/contracts`,
- package version remains `0.0.0`,
- package license remains `Apache-2.0`,
- `publishConfig.access` remains `restricted`,
- every required package path is included,
- source-only paths such as `src/` and `scripts/` are not included,
- local or private files such as `.env`, `.env.local`, `package-lock.json`, and `tsconfig.json` are not included,
- npm dry-run returns a shasum and sha512 integrity value.

## Why This Exists

`npm run package:dry-run` proves the package shape is valid.

`npm run release:artifact-manifest` gives the owner and future release implementer a compact artifact identity record before any release channel opens.

If a future approved release implementation changes version from `0.0.0` to `0.1.0`, this manifest should be rerun after the version change and before publishing.

## Current Boundary

Until a separate owner-approved release implementation unit exists:

- npm publishing remains blocked,
- GitHub release publishing remains blocked,
- release tag creation remains blocked,
- package version remains `0.0.0`,
- deployment remains blocked,
- hosted runtime behavior remains blocked,
- production runtime claims remain blocked,
- code contribution acceptance remains blocked.

## Related Docs

- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Implementation Runbook](release-implementation-runbook.md)
- [Publish Readiness](publish-readiness.md)
- [CI Checks](ci-checks.md)
