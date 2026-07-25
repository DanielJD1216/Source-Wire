# Source-Wire Release Snapshot Boundary

Status: release snapshot boundary only.

This check does not publish a new npm version, create a new GitHub release, create a tag, change package version, deploy services, start hosted runtime behavior, or accept code contributions.

## Purpose

Use this check to distinguish release snapshots from latest source:

- the immutable npm packages `@source-wire/contracts@0.1.0` and
  `@source-wire/contracts@0.2.0`,
- the immutable and deprecated npm package
  `@source-wire/local-runtime@0.1.0-alpha.1`,
- the immutable reviewed npm package
  `@source-wire/local-runtime@0.1.0-alpha.2`,
- the immutable GitHub release snapshots `v0.1.0` and `v0.2.0`,
- the latest `main` branch, which may contain post-release documentation and
  unpublished runtime proof.

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
ok latest main can differ from v0.2.0 release snapshot
ok npm artifact immutable at @source-wire/contracts@0.2.0
blocked future release mutation approval missing
```

## What This Check Proves

The command verifies:

- package name remains `@source-wire/contracts`,
- latest-source package version is `0.2.0`,
- package license remains `Apache-2.0`,
- `publishConfig.access` remains `public`,
- the public remote release tag is `v0.2.0`,
- the public remote release tag target remains commit
  `180896b8ab8a0c4e587226ef79dc2ec53bbe6749`,
- the live npm package version is `0.2.0`,
- the live npm latest dist-tag is `0.2.0`,
- the live npm artifact has tarball, shasum, and integrity metadata.

The command also prints whether `origin/main` currently matches the release target or contains post-release changes.

## Reader Guidance

Use a GitHub release when you want an exact public release snapshot.

Use latest `main` when you want the newest docs, public-readiness checks, owner-decision issue evidence, and reviewer-safety wording.

Use the npm package when you want the immutable published contract artifact.

Do not use deprecated `@source-wire/local-runtime@0.1.0-alpha.1`. Reviewed
`@source-wire/local-runtime@0.1.0-alpha.2` is published under the npm `alpha`
tag. That npm publication did not create or approve a Git tag or GitHub
release.

## Current Boundary

Version `0.2.0` is published. Future release mutation is not pre-approved:

- publishing another npm package version requires a new exact approval,
- creating another GitHub release requires a new exact approval,
- creating another release tag requires a new exact approval,
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
