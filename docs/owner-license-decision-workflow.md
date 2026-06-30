# Source-Wire Owner License Decision Workflow

Status: owner decision workflow only.

This workflow records the captured owner license decision. It does not approve npm publishing, GitHub release publishing, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this to understand the owner license decision path and which launch decisions remain blocked.

The owner license decision has been captured: Apache-2.0 source package licensing is implemented.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run owner:decision-workflow
```

Expected markers:

```text
ok owner decision workflow ready
ok owner decision options available
ok owner license decision captured
```

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.0.0` |
| `LICENSE` file | present |
| Source package reuse | allowed under Apache-2.0 |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime | blocked |
| Contributions | blocked |

## Decision Workflow

1. Run `npm run owner:license-preflight`.
2. Read [License Approval Request Packet](license-approval-request-packet.md).
3. Read [Owner License Decision Intake](owner-license-decision-intake.md).
4. Confirm the owner chose exactly one option.
5. Confirm [License Approval Decision Record](license-approval-decision-record.md) says `license_decision_status: implemented`.
6. Keep npm, GitHub release, hosted runtime, production runtime, and contribution decisions in separate future units.

To inspect the implementation map, read [License Decision Implementation Plan](license-decision-implementation-plan.md) or run:

```bash
npm run license:implementation-plan
```

## Exact Owner Decision Options

The owner chose exactly one option.

### Option 1: Approve Apache-2.0 Implementation

```text
Approved for a future Source-Wire license implementation unit: implement Apache-2.0 licensing. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Option 2: Stay Unlicensed

```text
Approved for a future Source-Wire license decision unit: keep Source-Wire UNLICENSED and version 0.0.0. Do not add a LICENSE file. Update public docs to record that public reuse remains blocked. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Option 3: Request Legal Review First

```text
Approved for a future Source-Wire legal review unit: prepare and route license, contributor, commercial reuse, support, security, brand, hosted runtime, and private-data boundary questions for legal or owner review. Keep Source-Wire UNLICENSED, version 0.0.0, unpublished, unreleased, undeployed, hosted-runtime blocked, and contribution acceptance blocked.
```

### Option 4: Compare Source-Available Options

```text
Approved for a future Source-Wire license comparison unit: compare source-available and noncommercial license options before any package metadata, LICENSE file, npm publishing, GitHub release, deployment, hosted runtime, or contribution acceptance change.
```

## What This Still Does Not Allow

Even after this workflow is ready, separate approval is still required for:

- npm publishing,
- GitHub release publishing,
- deployment,
- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record auto-promotion,
- accepting code contributions,
- production runtime use.

## Related Docs

- [Owner License Approval Preflight](owner-license-approval-preflight.md)
- [Owner License Decision Intake](owner-license-decision-intake.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [License Decision Implementation Plan](license-decision-implementation-plan.md)
- [License Decision Gate](license-decision-gate.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Launch Decision Status](launch-decision-status.md)
- [Publish Readiness](publish-readiness.md)
