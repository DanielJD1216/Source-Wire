# Source-Wire Release Candidate Readiness

Status: release-candidate check only.

This page verifies whether Source-Wire remains ready after the first approved release. It does not publish a new npm version, create a new GitHub release, create a tag, change package version, deploy services, start hosted runtime behavior, or accept code contributions.

## Purpose

Use this check after the first release to confirm the local package shape still matches the published release boundary.

The check proves that the package is locally verifiable, the first release is represented as complete, and future release channels remain blocked until another owner-approved release unit exists.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:candidate-readiness
```

Expected markers:

```text
ok release candidate readiness ready
ok local package verification ready
ok release execution completed
```

## Current Candidate State

| Field | Current value |
| --- | --- |
| Package name | `@source-wire/contracts` |
| Package license | `Apache-2.0` |
| Package version | `0.1.0` |
| Local package verification | ready |
| npm publishing | published as `@source-wire/contracts@0.1.0` |
| GitHub release publishing | published as `v0.1.0` |
| Hosted runtime | blocked |
| Code contributions | blocked |

## What This Check Looks For

The command verifies:

- package name remains `@source-wire/contracts`,
- license remains `Apache-2.0`,
- version remains `0.1.0`,
- `publishConfig.access` remains `public`,
- `LICENSE` exists,
- release approval request docs exist,
- release decision docs exist,
- launch decision docs exist,
- package scripts do not include package-manager publish commands,
- package scripts do not include direct `gh release`,
- package scripts do not include release tag creation commands,
- package scripts do not include package version change commands,
- package scripts do not include deployment commands.

For artifact identity, run:

```bash
npm run release:artifact-manifest
```

That command prints the package filename, file count, size, shasum, and integrity without publishing.

Before any release mutation, run the complete owner-side preflight:

```bash
npm run release:decision-preflight
```

Expected final markers:

```text
ok release decision preflight ready
ok world share preflight current
ok owner open issue boundary current
ok release approval status current
ok release candidate evidence current
ok release artifact evidence current
ok release execution completed
```

## Next Action

If this check passes, the next action is to verify live release evidence and keep the remaining owner-decision gates explicit:

```bash
npm run registry:live-npm
npm run release:live-tags
npm run release:decision-preflight
```

Recorded release path:

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

Do not publish, tag, release, or deploy from this check.

## Related Docs

- [Release Approval Request Packet](release-approval-request-packet.md)
- [Release Artifact Manifest](release-artifact-manifest.md)
- [Release Decision](release-decision.md)
- [Launch Decision Status](launch-decision-status.md)
- [Publish Readiness](publish-readiness.md)
