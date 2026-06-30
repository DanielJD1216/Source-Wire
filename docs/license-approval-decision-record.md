# Source-Wire License Approval Decision Record

Status: pending owner decision.

This record does not approve a license change, public reuse, npm publishing, GitHub release publishing, deployment, hosted runtime behavior, or code contribution acceptance.

## Purpose

This is the single decision record to update before any future license implementation.

Until this record is changed by explicit owner approval in a future unit, Source-Wire remains:

- `UNLICENSED`,
- version `0.0.0`,
- without a `LICENSE` file,
- unpublished to npm,
- unreleased on GitHub,
- not accepting code contributions,
- not approved for broad public reuse.

## Machine-Checked Decision State

```text
license_decision_status: pending
approved_license: none
approval_scope: none
npm_publish_approval: blocked
github_release_approval: blocked
hosted_runtime_approval: blocked
contribution_acceptance: blocked
```

## Required Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run license:decision-record
```

Expected current markers:

```text
ok license decision record ready
blocked license decision pending
blocked license implementation missing
```

To request the exact owner choice, run:

```bash
npm run license:approval-request
```

To verify the full approval package before asking the owner, run:

```bash
npm run owner:license-preflight
```

## Future Approval Options

Only update this record in a future owner-approved unit.

Use one of the exact approval paths from [License Decision Gate](license-decision-gate.md):

- approve Apache-2.0 implementation,
- stay `UNLICENSED`,
- request legal review first,
- compare source-available options.

## Current Decision

No license change is approved.

Current decision remains:

```text
pending
```

## Related Docs

- [License Decision Gate](license-decision-gate.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [Owner License Approval Preflight](owner-license-approval-preflight.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [License Approval Rehearsal](license-approval-rehearsal.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [Launch Decision Status](launch-decision-status.md)
