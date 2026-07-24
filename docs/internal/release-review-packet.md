# Source-Wire Release Review Packet

Status: release review only.

This packet does not approve publishing a new npm version, creating a new GitHub release, release tags, package version changes, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this packet to inspect the first release decision inputs and keep future release boundaries clear.

It records the release decision inputs that mattered before publishing Source-Wire beyond source-repo sharing and now shows the first release as completed.

## Current Release State

| Field | Current value |
| --- | --- |
| Package name | `@source-wire/contracts` |
| Package license | `Apache-2.0` |
| Package version | `0.1.0` |
| npm registry state | Published as `@source-wire/contracts@0.1.0` |
| GitHub release state | Published as `v0.1.0` |
| npm publishing | complete for `0.1.0` |
| GitHub release publishing | complete for `v0.1.0` |
| Hosted runtime | blocked |
| Code contributions | blocked |

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:review
```

Expected markers:

```text
ok release review packet ready
ok release decision inputs documented
ok release execution completed
```

## Release Review Inputs

Before approving npm publishing or GitHub release publishing, review:

- [First Release Version Recommendation](release-version-recommendation.md)
- [Draft GitHub Release Notes](release-notes-draft.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Decision](release-decision.md)
- [Public Status](../status/public-status.md)
- [CI Checks](../reference/ci-checks.md)

## Recorded Release Path

Recorded release approval:

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

Reason:

- Source package licensing is complete.
- Local package readiness is verified.
- Public CI is green.
- Exact owner release approval is recorded in issue `#255`.
- Publishing and release creation are complete for `0.1.0`.
- Future new package versions and GitHub releases remain blocked without separate owner approval.
- Hosted runtime and contribution acceptance remain separate decisions.

## Release Risks To Keep Visible

- Future package versions still need explicit owner approval and fresh release evidence.
- GitHub releases should stay paired with the matching npm package version.
- Code contribution acceptance still needs separate contribution terms.
- Hosted runtime work still needs a separate runtime PRD.

## Still Blocked

- publishing a new npm package version,
- creating a new GitHub release,
- creating a new release tag,
- package version change,
- deployment,
- hosted runtime behavior,
- production runtime claims,
- code contribution acceptance.
