# Source-Wire Owner License Approval Preflight

Status: read-only owner approval preflight.

This preflight records the implemented owner license approval. It does not approve npm publishing, GitHub release publishing, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Run this to confirm the owner license approval package is complete and the Apache-2.0 decision is captured.

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
ok owner license approval captured
```

## What It Verifies

The command verifies:

- package license remains `Apache-2.0`,
- package version remains `0.0.0`,
- `LICENSE` file exists,
- npm publishing is still blocked,
- the license approval request packet exists,
- the decision record is implemented,
- the license decision gate exists,
- the legal review question packet exists,
- the owner launch checklist exists,
- the launch decision status docs exist.

## Current Owner Action

Apache-2.0 implementation is complete.

Next owner choices are separate:

- keep npm publishing blocked until a publish PRD,
- keep GitHub release publishing blocked until a release PRD,
- keep hosted runtime work blocked until a runtime PRD,
- keep code contribution acceptance blocked until contribution terms exist.

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
