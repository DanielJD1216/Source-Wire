# Source-Wire Owner Launch Checklist

Status: owner decision checklist only.

This checklist does not approve npm publishing, GitHub release publishing, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this when the owner asks:

```text
Can I share Source-Wire with the world now?
```

Short answer:

```text
As an Apache-2.0 licensed source package, yes.
As an npm package, GitHub release, hosted runtime, or production runtime, not yet.
```

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run owner:launch-checklist
```

Expected markers:

```text
ok owner launch checklist ready
blocked launch channels missing
```

The command verifies the current guarded boundary and prints the approval order. It does not publish npm, create a GitHub release, deploy services, accept contributions, or approve production runtime use.

For a single status report across all launch decisions, run:

```bash
npm run launch:decision-status
```

For the public owner-decision issue approval records, run:

```bash
npm run owner:decision-status
```

Expected current markers:

```text
ok owner decision status readable
blocked owner decisions missing approval records
```

This command reads issues `#255` through `#258` and checks for separate exact owner approval records or approval comments. It intentionally does not count recommended approval text as approval.

## Current Decision State

| Decision | State | What unlocks it |
| --- | --- | --- |
| Technical review sharing | Ready | Use [Share For Technical Review](share-for-review.md). |
| Source package reuse | Ready under Apache-2.0 | Read [LICENSE](../LICENSE). |
| Legal or owner review | Ready | Use [Legal Review Question Packet](legal-review-question-packet.md). |
| License decision record | Implemented | Use [License Approval Decision Record](license-approval-decision-record.md). |
| License approval request | Captured | Use [License Approval Request Packet](license-approval-request-packet.md). |
| Owner license preflight | Captured | Use [Owner License Approval Preflight](owner-license-approval-preflight.md). |
| Owner decision workflow | Captured | Use [Owner License Decision Workflow](owner-license-decision-workflow.md). |
| npm publishing | Blocked | Separate publish PRD. |
| GitHub release publishing | Blocked | Separate release PRD. |
| Branch protection or repository rulesets | Blocked | Separate branch governance approval, then use [Branch Governance Implementation Plan](branch-governance-implementation-plan.md). |
| Hosted runtime | Blocked | Separate runtime PRD. |
| Code contribution acceptance | Blocked | Explicit contribution terms. |

## Approval Order

1. Apache-2.0 source package reuse is approved and implemented.
2. Run `npm run release:decision-preflight`.
3. Decide whether npm publishing plus a matching GitHub release should open in a separate release implementation unit.
4. Decide whether branch protection or repository rulesets should open in a separate governance unit.
5. Run `npm run runtime:prd-decision-preflight`.
6. Decide whether hosted runtime work should open in a separate PRD.
7. Decide whether and how code contributions can be accepted.

Recommended next owner choice, if the release-decision preflight passes:

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

## Owner Decision Issues

The command prints the current public owner-decision issues:

- [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255)
- [#256 Branch governance path](https://github.com/DanielJD1216/Source-Wire/issues/256)
- [#257 Hosted runtime PRD path](https://github.com/DanielJD1216/Source-Wire/issues/257)
- [#258 Contribution terms before accepting code](https://github.com/DanielJD1216/Source-Wire/issues/258)

## Exact Current Safe Share Copy

```text
Source-Wire is Apache-2.0 licensed as a source package. It is version 0.0.0, unpublished to npm, unreleased on GitHub, undeployed, and not a hosted runtime.
```

## What Not To Say Yet

Do not say:

```text
Source-Wire is production-ready.
```

Do not say:

```text
You can install Source-Wire from npm.
```

Do not say:

```text
This is the hosted memory backend.
```

Do not say:

```text
Contributions are open.
```

## Related Docs

- [World-Share Readiness](world-share-readiness.md)
- [Launch Decision Status](launch-decision-status.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [Owner License Approval Preflight](owner-license-approval-preflight.md)
- [Owner License Decision Workflow](owner-license-decision-workflow.md)
- [Branch Governance Approval Request](branch-governance-approval-request.md)
