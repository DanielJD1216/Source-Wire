# Source-Wire Hosted Runtime Child Issue Publication Preflight

Status: owner-side read-only preflight.

This preflight does not publish child issues, implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this command before any future hosted-runtime child issue publication unit.

It proves the publication packet, runtime-readiness gate, runtime-proof-intake gate, guarded publisher, missing-approval status, duplicate-publication guard, open-issue boundary, and launch blockers are current before any GitHub issue mutation is attempted.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:child-issue-publication-preflight
```

Expected markers:

```text
ok hosted runtime child issue publication preflight ready
ok child issue publication packet current
ok child issue publisher dry run current
ok child issue publisher guard smoke current
ok runtime readiness gate current
ok runtime proof intake gate current
ok child issue approval status current
ok owner open issue boundary current
ok owner open issue future planning smoke current
ok hosted runtime child issue publication approval recorded
ok hosted runtime child planning issues published
blocked hosted runtime implementation
```

## What It Verifies

- The world-share preflight is current.
- Hosted runtime PRD approval remains recorded on issue `#257`.
- Hosted runtime PRD preparation and execution evidence are current without nesting the full PRD decision preflight.
- The runtime-readiness smoke passes.
- The runtime-proof-intake smoke passes.
- The child issue publication packet is current.
- The child issue publisher dry run validates payloads without writing.
- The publisher smoke proves missing-approval and duplicate-publication guards.
- The child issue approval status is readable.
- Current public open issues have no unresolved owner-decision gates.
- The future hosted-runtime planning issue fixture remains accepted by the open-issue guard.
- Launch status still blocks hosted runtime implementation.

## Current Expected Result

The current expected result is published planning issues and blocked implementation:

```text
ok hosted runtime child issue publication approval recorded
ok hosted runtime child planning issues published
blocked hosted runtime implementation
```

That is not a failure. It means the child issue publication path is complete, while hosted runtime implementation still needs a separate approved unit.

Dry-run the guarded approval recorder before any write:

```bash
npm run owner:record-approval -- --target hosted-runtime-child-issue-publication
```

## Exact Approval Text

Do not publish child issues until the owner approves this exact approval text:

```text
Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/internal/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.
```

## Related Docs

- [Hosted Runtime PRD](hosted-runtime-prd.md)
- [Hosted Runtime PRD Decision Preflight](hosted-runtime-prd-decision-preflight.md)
- [Runtime Readiness Smoke](runtime-readiness-smoke.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md)
- [Hosted Runtime Slice Approval Request](hosted-runtime-slice-approval-request.md)
- [Hosted Runtime Child Issue Publication Packet](hosted-runtime-child-issue-publication-packet.md)
- [Hosted Runtime Child Issue Publisher](hosted-runtime-child-issue-publisher.md)
- [Owner Approval Recorder](owner-approval-recorder.md)
- [Owner Open Issues Status](owner-open-issues-status.md)
