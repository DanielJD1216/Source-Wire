# Source-Wire Owner License Approval Preflight

Status: read-only owner approval preflight.

This preflight does not approve a license change, public reuse, npm publishing, GitHub release publishing, deployment, hosted runtime behavior, or code contribution acceptance.

## Purpose

Run this immediately before asking the owner to choose a Source-Wire license path.

It proves the approval package is complete and the decision is still pending.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run owner:license-preflight
```

Expected markers:

```text
ok owner license approval preflight ready
ok owner approval package complete
blocked owner license approval missing
```

## What It Verifies

The command verifies:

- package license remains `UNLICENSED`,
- package version remains `0.0.0`,
- no `LICENSE` file exists,
- npm publishing is still blocked,
- the license approval request packet exists,
- the pending decision record exists,
- the license decision gate exists,
- the legal review question packet exists,
- the owner launch checklist exists,
- the launch decision status docs exist.

## Current Owner Action

Read [License Approval Request Packet](license-approval-request-packet.md), then choose one option:

- approve Apache-2.0 implementation later,
- stay `UNLICENSED`,
- request legal review first,
- compare source-available options first.

For the step-by-step owner path, read [Owner License Decision Workflow](owner-license-decision-workflow.md) or run:

```bash
npm run owner:decision-workflow
```

## Related Docs

- [License Approval Request Packet](license-approval-request-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [Owner License Decision Workflow](owner-license-decision-workflow.md)
- [License Decision Gate](license-decision-gate.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Launch Decision Status](launch-decision-status.md)
- [Publish Readiness](publish-readiness.md)
