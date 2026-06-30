# Source-Wire License Approval Request Packet

Status: owner approval request only.

Decision status: owner approval captured.

Approved and implemented: Apache-2.0

This packet records the approved source package license path. This packet does not approve a license change beyond the already implemented Apache-2.0 source package decision, npm publishing, GitHub release publishing, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this packet to verify the owner-approved Source-Wire license path and the boundaries that remain blocked.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run license:approval-request
```

For the owner approval preflight, run:

```bash
npm run owner:license-preflight
```

For the one-command decision workflow, run:

```bash
npm run owner:decision-workflow
```

For the decision intake point, run:

```bash
npm run owner:decision-intake
```

For the implementation map, run:

```bash
npm run license:implementation-plan
```

Expected markers:

```text
ok license approval request ready
ok owner license approval captured
ok license implementation complete
```

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.0.0` |
| `LICENSE` file | present |
| License decision record | implemented |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime | blocked |
| Contributions | blocked |

## Implemented Owner Decision

```text
Approved for a future Source-Wire license implementation unit: implement Apache-2.0 licensing. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

## Historical Owner Decision Options

These options were used to capture the owner decision. They are not new open decisions.

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

## What Approval Still Does Not Allow

Separate approval is still required for:

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
- accepting code contributions.

## Related Docs

- [License Approval Decision Record](license-approval-decision-record.md)
- [Owner License Approval Preflight](owner-license-approval-preflight.md)
- [Owner License Decision Intake](owner-license-decision-intake.md)
- [Owner License Decision Workflow](owner-license-decision-workflow.md)
- [License Decision Implementation Plan](license-decision-implementation-plan.md)
- [License Decision Gate](license-decision-gate.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [Launch Decision Status](launch-decision-status.md)
