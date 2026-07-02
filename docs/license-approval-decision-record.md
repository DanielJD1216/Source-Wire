# Source-Wire License Approval Decision Record

Status: owner decision implemented.

Apache-2.0 license implementation is approved and complete.

This record approves only the source package license change. It does not approve a future npm package version, future GitHub release, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

This is the single decision record for the Source-Wire source package license implementation.

Source-Wire current state:

- Apache-2.0 licensed,
- version `0.1.0`,
- with a `LICENSE` file,
- published to npm as `@source-wire/contracts@0.1.0`,
- released on GitHub as `v0.1.0`,
- undeployed,
- not a hosted runtime,
- not accepting code contributions.

## Machine-Checked Decision State

```text
license_decision_status: implemented
approved_license: Apache-2.0
approval_scope: source_package_license_only
npm_publish_approval: blocked
github_release_approval: blocked
hosted_runtime_approval: blocked
contribution_acceptance: blocked
```

## Owner Approval Text

```text
Approved for a future Source-Wire license implementation unit: implement Apache-2.0 licensing. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
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
ok license decision captured
ok license implementation complete
```

To verify the public source sharing boundary, run:

```bash
npm run world:readiness
npm run share:audit
```

## Current Decision

The source package license is implemented as Apache-2.0.

Current decision remains:

```text
implemented
```

## Remaining Approvals Needed

Separate future approvals are still required for:

- future npm package versions,
- future GitHub releases,
- hosted runtime work,
- production runtime use,
- code contribution acceptance.

## Related Docs

- [License Decision Gate](license-decision-gate.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [License Decision Implementation Plan](license-decision-implementation-plan.md)
- [Owner License Approval Preflight](owner-license-approval-preflight.md)
- [Owner License Decision Workflow](owner-license-decision-workflow.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [License Approval Rehearsal](license-approval-rehearsal.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [Launch Decision Status](launch-decision-status.md)
