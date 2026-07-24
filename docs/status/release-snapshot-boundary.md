# Source-Wire Release Snapshot Boundary

Status: release snapshot boundary only.

This check does not publish a new npm version, create a new GitHub release, create a tag, change package version, deploy services, start hosted runtime behavior, or accept code contributions.

## Purpose

Use this check to distinguish three things that can otherwise blur together:

- the immutable npm package `@source-wire/contracts@0.1.0`,
- the immutable GitHub release snapshot `v0.1.0`,
- the latest `main` branch, which may contain post-release documentation or readiness hardening.

After a release is published, `main` can keep improving public docs, issue gates, and reviewer safety checks without changing the already-published npm tarball or GitHub release snapshot.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:snapshot-boundary
```

Expected markers:

```text
ok release snapshot boundary ready
ok latest main can differ from v0.1.0 release snapshot
ok npm artifact immutable at @source-wire/contracts@0.1.0
blocked future release mutation approval missing
```

## What This Check Proves

The command verifies:

- package name remains `@source-wire/contracts`,
- package version remains `0.1.0`,
- package license remains `Apache-2.0`,
- `publishConfig.access` remains `public`,
- the public remote release tag is `v0.1.0`,
- the public remote release tag target remains the first release snapshot commit,
- the live npm package version remains `0.1.0`,
- the live npm latest dist-tag remains `0.1.0`,
- the live npm artifact has tarball, shasum, and integrity metadata.

The command also prints whether `origin/main` currently matches the release target or contains post-release changes.

## Reader Guidance

Use the GitHub release when you want the exact first public release snapshot.

Use latest `main` when you want the newest docs, public-readiness checks, owner-decision issue evidence, and reviewer-safety wording.

Use the npm package when you want the immutable published package artifact for `0.1.0`.

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

- [Release Artifact Manifest](../internal/release-artifact-manifest.md)
- [Release Candidate Readiness](../internal/release-candidate-readiness.md)
- [Release Implementation Runbook](../internal/release-implementation-runbook.md)
- [Publish Readiness](../guides/publish-readiness.md)
- [Public Status](public-status.md)
