# Source-Wire Owner Approval Record Packet

Status: owner approval copy packet only.

This packet does not approve npm publishing, GitHub release publishing, release tags, package version changes, deployment, branch governance enforcement, hosted runtime behavior, production runtime use, code contribution acceptance, or real data examples.

## Purpose

Use this packet when the owner is ready to record an exact approval for one of the remaining Source-Wire decision issues.

Approval must be recorded separately in the matching public issue, either in an `Owner Approval Record` section or in an issue comment containing the exact approval text.

Do not edit package metadata, publish npm, create a GitHub release, create tags, deploy services, enable branch governance, accept code contributions, or start hosted runtime work from this packet.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run owner:approval-packet
```

Expected markers:

```text
ok owner approval packet ready
ok exact owner approval texts available
blocked approval recording is manual owner action
```

For a guarded dry-run or exact-text issue-comment recorder, run:

```bash
npm run owner:record-approval
npm run owner:record-approval -- --issue 255
```

The recorder does not write unless `--write` and a matching `--confirm-exact` value are supplied.

After recording an approval separately, check status with:

```bash
npm run owner:decision-status
```

For release approval only, also run:

```bash
npm run release:approval-status
```

## Current Approval Targets

| Issue | Decision | Current execution boundary |
| --- | --- | --- |
| `#255` | First public release path | Record approval before a future release implementation unit. |
| `#256` | Branch governance path | Record approval before a future branch governance implementation unit. |
| `#257` | Hosted runtime PRD path | Record approval before a future hosted runtime PRD unit. |
| `#258` | Contribution terms path | Record approval before a future contribution terms PRD unit. |

## Exact Approval Texts

Copy exactly one of these only when the owner is ready to approve that future unit.

### Issue #255: First public release path

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

### Issue #256: Branch governance path

```text
Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Issue #257: Hosted runtime PRD path

```text
Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit.
```

### Issue #258: Contribution terms path

```text
Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit.
```

## Manual Recording Options

Option A: add an issue comment containing the exact approval text.

Option B: edit the issue body and add:

```text
## Owner Approval Record

<exact approval text>
```

The status checks intentionally require this separate record so approval text in docs or scripts is not mistaken for an actual owner decision.

## Still Blocked

Until a matching exact approval is recorded and a focused implementation unit runs, these stay blocked:

- npm publishing,
- GitHub release publishing,
- release tags,
- package version change,
- branch governance enforcement,
- hosted runtime,
- production runtime use,
- code contribution acceptance.

## Related Docs

- [Owner Launch Checklist](owner-launch-checklist.md)
- [Owner Approval Recorder](owner-approval-recorder.md)
- [Launch Decision Status](launch-decision-status.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
- [Branch Governance Approval Request](branch-governance-approval-request.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
