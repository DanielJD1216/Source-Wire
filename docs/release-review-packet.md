# Source-Wire Release Review Packet

Status: release review only.

This packet does not approve npm publishing, GitHub release publishing, release tags, package version changes, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this packet before approved release execution.

It collects the release decision inputs that matter before publishing Source-Wire beyond source-repo sharing while release execution remains unperformed.

## Current Release State

| Field | Current value |
| --- | --- |
| Package name | `@source-wire/contracts` |
| Package license | `Apache-2.0` |
| Package version | `0.0.0` |
| npm registry state | `E404 Not Found` observed on 2026-06-30 from local `npm view` |
| GitHub release state | no releases observed on 2026-06-30 from local `gh release list` |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime | blocked |
| Code contributions | blocked |

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

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
blocked release execution not performed
```

## Release Review Inputs

Before approving npm publishing or GitHub release publishing, review:

- [First Release Version Recommendation](release-version-recommendation.md)
- [Draft GitHub Release Notes](release-notes-draft.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Decision](release-decision.md)
- [Public Status](public-status.md)
- [CI Checks](ci-checks.md)

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
- Publishing and release creation remain blocked until npm authentication and final release execution preflights pass.
- Hosted runtime and contribution acceptance remain separate decisions.

## Release Risks To Keep Visible

- A `0.0.0` npm publish is possible technically, but it creates a weak public signal. Prefer choosing a real pre-release or first release version in the release implementation unit.
- A GitHub release without npm can be useful for visibility, but it may confuse users if package installation remains registry-blocked.
- npm publishing without a GitHub release can work, but it gives users less context.
- Code contribution acceptance still needs separate contribution terms.
- Hosted runtime work still needs a separate runtime PRD.

## Still Blocked

- npm publishing,
- GitHub release publishing,
- release tag creation,
- package version change,
- deployment,
- hosted runtime behavior,
- production runtime claims,
- code contribution acceptance.
