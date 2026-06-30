# Source-Wire Owner Launch Checklist

Status: owner decision checklist only.

This checklist does not approve a license change, public reuse, npm publishing, GitHub release publishing, deployment, hosted runtime behavior, or code contribution acceptance.

## Purpose

Use this when the owner asks:

```text
Can I share Source-Wire with the world now?
```

Short answer:

```text
For technical review, yes.
For broad public reuse, not yet.
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
blocked owner launch approval missing
```

The command verifies the current blocked boundary and prints the approval order. It does not approve licensing, add a `LICENSE` file, change package metadata, publish npm, create a GitHub release, deploy services, accept contributions, or grant reuse rights.

For a single status report across all launch decisions, run:

```bash
npm run launch:decision-status
```

## Current Decision State

| Decision | State | What unlocks it |
| --- | --- | --- |
| Technical review sharing | Ready | Use [Share For Technical Review](share-for-review.md). |
| Legal or owner review | Ready | Use [Legal Review Question Packet](legal-review-question-packet.md). |
| Broad public reuse | Blocked | Owner approves and implements a license path. |
| License decision record | Pending | Use [License Approval Decision Record](license-approval-decision-record.md). |
| License approval request | Ready | Use [License Approval Request Packet](license-approval-request-packet.md). |
| Owner license preflight | Ready | Use [Owner License Approval Preflight](owner-license-approval-preflight.md). |
| Open-source launch | Blocked | Owner approves license implementation and a later release posture. |
| npm publishing | Blocked | Separate publish PRD after licensing. |
| GitHub release publishing | Blocked | Separate release PRD. |
| Hosted runtime | Blocked | Separate runtime PRD. |
| Code contribution acceptance | Blocked | Explicit contribution terms. |

## Approval Order

1. Share for technical review using [Share For Technical Review](share-for-review.md).
2. Prepare legal or owner review using [Legal Review Question Packet](legal-review-question-packet.md).
3. Choose the license path using [License Decision Gate](license-decision-gate.md).
4. Implement the approved license path in a separate PRD.
5. Decide whether npm publishing should open in a separate PRD.
6. Decide whether GitHub release publishing should open in a separate PRD.
7. Decide whether hosted runtime work should open in a separate PRD.
8. Decide whether and how code contributions can be accepted.

## Exact Current Safe Share Copy

```text
Source-Wire is public for technical review only. It is UNLICENSED, unpublished, unreleased, and not a hosted runtime. Please review the contracts, schemas, fixtures, docs, and readiness gates, but do not assume reuse or redistribution rights.
```

## What Not To Say Yet

Do not say:

```text
Source-Wire is open source.
```

Do not say:

```text
Source-Wire is ready to use in production.
```

Do not say:

```text
You can build your product on Source-Wire now.
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
- [Legal Review Question Packet](legal-review-question-packet.md)
- [License Decision Gate](license-decision-gate.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Publish Readiness](publish-readiness.md)
- [Public Status](public-status.md)
