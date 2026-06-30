# Source-Wire Owner License Decision Intake

Status: owner decision intake only.

This intake records the captured owner license decision. This intake does not allow npm publishing, GitHub release publishing, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this file to verify the exact Source-Wire license decision that was captured and implemented.

The owner chose exactly one option: Apache-2.0 implementation.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run owner:decision-intake
```

Expected markers:

```text
ok owner decision intake ready
ok owner decision options available
ok owner decision captured
```

## Current Decision State

| Field | Current value |
| --- | --- |
| Decision captured | yes |
| Selected option | Apache-2.0 implementation |
| Package license | `Apache-2.0` |
| Package version | `0.0.0` |
| `LICENSE` file | present |
| Source package reuse | allowed under Apache-2.0 |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime | blocked |
| Contributions | blocked |

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

## Still Blocked After Intake

This intake does not allow:

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

- [Owner License Decision Workflow](owner-license-decision-workflow.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [License Decision Implementation Plan](license-decision-implementation-plan.md)
- [Owner License Approval Preflight](owner-license-approval-preflight.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [Launch Decision Status](launch-decision-status.md)
- [Publish Readiness](publish-readiness.md)
