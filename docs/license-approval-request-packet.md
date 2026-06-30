# Source-Wire License Approval Request Packet

Status: owner approval request only.

This packet does not approve a license change, public reuse, npm publishing, GitHub release publishing, deployment, hosted runtime behavior, or code contribution acceptance.

## Purpose

Use this packet when the owner is ready to choose the Source-Wire license path.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

The current decision record is still pending. Then run:

```bash
npm run license:approval-request
```

Before asking for the final owner decision, run:

```bash
npm run owner:license-preflight
```

Expected markers:

```text
ok license approval request ready
blocked owner license approval missing
blocked license decision pending
```

## Current State

| Field | Current value |
| --- | --- |
| Package license | `UNLICENSED` |
| Package version | `0.0.0` |
| `LICENSE` file | none |
| License decision record | pending |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime | blocked |
| Contributions | blocked |

## Exact Owner Decision Options

Choose exactly one.

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

Even if one option is approved later, separate approval is still required for:

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
- [License Decision Gate](license-decision-gate.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [Launch Decision Status](launch-decision-status.md)
