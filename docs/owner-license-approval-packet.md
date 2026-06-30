# Source-Wire Owner License Approval Packet

Date: 2026-06-29

Status: decision packet only.

## Purpose

This packet helps the owner decide the future Source-Wire license path.

It does not approve or perform a license change.

For the current one-page owner decision gate, read [License Decision Gate](license-decision-gate.md).

For the exact future Apache-2.0 checklist, read [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md).

For the read-only pre-approval command check, read [License Approval Rehearsal](license-approval-rehearsal.md).

For the current machine-checked pending decision record, read [License Approval Decision Record](license-approval-decision-record.md).

For the exact owner choice prompt, read [License Approval Request Packet](license-approval-request-packet.md).

For legal or owner review questions before a license decision, read [Legal Review Question Packet](legal-review-question-packet.md).

## Current State

| Field | Current value |
| --- | --- |
| Package license | `UNLICENSED` |
| Package version | `0.0.0` |
| `LICENSE` file | none |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Runtime backend | blocked |

## Recommended Path

Keep Source-Wire `UNLICENSED` until the owner explicitly approves a license implementation PRD.

If the owner chooses a true permissive open-source release later, the current best candidate is:

```text
Apache-2.0
```

This packet does not approve switching to Apache-2.0 now.

## Owner Decision Options

| Option | Meaning | When to choose |
| --- | --- | --- |
| Approve Apache-2.0 later | Prepare a later PRD that changes package metadata and adds a `LICENSE` file. | Choose this when Source-Wire should become a true permissive open-source contract package. |
| Stay `UNLICENSED` | Keep public visibility but do not grant reuse rights yet. | Choose this when owner control matters more than adoption right now. |
| Explore source-available/noncommercial | Prepare a later decision prototype for source-visible but commercially restricted use. | Choose this if commercial reuse protection matters more than open-source adoption. |
| Request legal review first | Pause license implementation until legal review or counsel confirms the path. | Choose this before any meaningful public adoption, contributor intake, or business use. |

## Practical Impact

| Path | Public adoption | Owner control | Commercial reuse | Enterprise comfort | Complexity |
| --- | --- | --- | --- | --- | --- |
| Stay `UNLICENSED` | Low | High | Blocked until approval | Low | Low |
| Apache-2.0 later | High | Lower | Allowed under license terms | High | Medium |
| Source-available/noncommercial later | Medium | Higher | Restricted | Lower | Medium |
| Legal review first | Delayed | High | Not changed | Higher after review | Medium |

## Approval Language

Use one of these exact statements in a later owner approval step.

### Approve Apache-2.0 Implementation PRD

```text
Approved for a later Source-Wire license implementation PRD: prepare Apache-2.0 package metadata, LICENSE file, README updates, release decision updates, and release-gate updates. Do not publish npm, create a GitHub release, deploy services, or add runtime backend behavior.
```

### Stay Unlicensed

```text
Approved: keep Source-Wire UNLICENSED and version 0.0.0. Do not add a LICENSE file. Do not publish npm, create a GitHub release, deploy services, or add runtime backend behavior.
```

### Explore Source-Available Or Noncommercial

```text
Approved for a later decision prototype: compare source-available and noncommercial license paths for Source-Wire before any package metadata, LICENSE file, npm publishing, GitHub release, deployment, or runtime backend change.
```

### Request Legal Review First

```text
Approved: pause license implementation until legal review. Keep Source-Wire UNLICENSED, version 0.0.0, unpublished, undeployed, and runtime-blocked.
```

## Legal Review Warning

This packet is not legal advice.

Before accepting contributors, approving commercial reuse, publishing npm, or relying on Source-Wire as a public project, the owner should consider legal review.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Use `npm run legal:packet` to verify the legal-review packet and current blocked boundary before that review.

## No-Publish Boundary

License approval is not publish approval.

Even if the owner later approves a license implementation PRD, npm publishing still requires a separate release PRD.

Do not run:

```bash
npm publish
```

until a later PRD explicitly opens publishing and records owner approval.

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

No license change is approved by this packet.

Current decision remains:

- keep `UNLICENSED`,
- keep version `0.0.0`,
- keep the license approval decision record pending,
- keep npm publishing blocked,
- keep GitHub release publishing blocked,
- keep runtime backend blocked.
