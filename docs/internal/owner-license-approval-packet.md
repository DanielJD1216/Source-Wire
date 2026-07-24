# Source-Wire Owner License Approval Packet

Date: 2026-06-30

Status: decision captured.

## Purpose

This packet records the Source-Wire license path chosen by the owner.

For the current one-page owner decision gate, read [License Decision Gate](license-decision-gate.md).

For the Apache-2.0 implementation record, read [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md).

For the implementation check, read [License Approval Rehearsal](license-approval-rehearsal.md).

For the machine-checked decision record, read [License Approval Decision Record](license-approval-decision-record.md).

For the exact owner choice, read [License Approval Request Packet](license-approval-request-packet.md).

For remaining legal or owner review questions, read [Legal Review Question Packet](legal-review-question-packet.md).

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.1.0` |
| `LICENSE` file | present |
| Source package reuse | allowed under Apache-2.0 |
| npm package | published as `@source-wire/contracts@0.1.0` |
| GitHub release | published as `v0.1.0` |
| Runtime backend | blocked |
| Code contribution acceptance | blocked |

## Selected Path

The owner selected Apache-2.0 implementation.

This approval applies only to the source package license. It does not approve a future npm package version, future GitHub release, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Practical Impact

| Path | Public adoption | Owner control | Commercial reuse | Enterprise comfort | Complexity |
| --- | --- | --- | --- | --- | --- |
| Apache-2.0 implemented | High for source package reuse | Lower than unlicensed | Allowed under license terms | High | Medium |
| future package versions | Blocked | Owner controlled | Not applicable here | Higher after release policy | Medium |
| Hosted runtime later | Blocked | Owner controlled | Separate future decision | Requires security review | High |
| Code contributions later | Blocked | Owner controlled | Requires contribution terms | Higher after policy | Medium |

## Approval Language

Implemented owner approval:

```text
Approved for a future Source-Wire license implementation unit: implement Apache-2.0 licensing. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

## Legal Review Warning

This packet is not legal advice.

Before accepting contributors, publishing a future npm package version, creating a future GitHub release, deploying services, or relying on Source-Wire as a production runtime, the owner should consider legal or governance review.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Use `npm run legal:packet` to verify the legal-review packet and current blocked boundary before that review.

## Future Publish Boundary

License approval is not approval for future package versions.

Do not run:

```bash
npm publish
```

for a future package version until a later approved release unit records owner approval.

## Runtime Boundary

License approval is not runtime approval.

A license decision does not approve:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record promotion.

## Current Decision

Current decision remains:

- keep `Apache-2.0`,
- keep version `0.1.0`,
- keep the license approval decision record implemented,
- keep first npm publication complete as `@source-wire/contracts@0.1.0`,
- keep first GitHub release complete as `v0.1.0`,
- keep future package versions and future GitHub releases blocked until a new approved release unit,
- keep runtime backend blocked,
- keep code contribution acceptance blocked.
