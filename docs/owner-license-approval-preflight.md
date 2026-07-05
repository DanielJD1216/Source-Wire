# Source-Wire Owner License Approval Preflight

Status: read-only owner approval preflight.

This preflight records the implemented owner license approval. It does not approve a future npm package version, future GitHub release, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

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
- package version remains `0.1.0`,
- `LICENSE` file exists,
- first npm package publication is complete,
- the license approval request packet exists,
- the decision record is implemented,
- the license decision gate exists,
- the legal review question packet exists,
- the owner launch checklist exists,
- the launch decision status docs exist.

## Current Owner Action

Apache-2.0 implementation is complete.

Release path approval is recorded in [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255).

The first npm publication and matching GitHub release are complete. Future release mutation remains blocked until a new approved release unit and current release preflights pass.

Current release execution command path:

```bash
npm run release:auth-handoff
npm login --registry=https://registry.npmjs.org/
npm whoami
npm run release:auth-preflight
npm run release:execution-preflight
```

Remaining owner choices are separate:

- keep code contribution acceptance blocked until a separate contribution-acceptance implementation unit opens it,
- keep runtime PRD refresh approval recorded as completed planning history,
- keep hosted runtime implementation blocked until a separate implementation approval opens it.

Current runtime approval check:

```bash
npm run runtime:prd-refresh-approval-status
npm run runtime:prd-refresh-proof
```

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
