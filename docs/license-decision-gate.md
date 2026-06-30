# Source-Wire License Decision Gate

Status: decision gate only. No license change is approved by this document.

## Purpose

This gate turns the current Source-Wire license blocker into one owner decision.

Source-Wire is technically package-ready for local validation, but it is not open source yet because the package is still `UNLICENSED`.

## Current State

| Field | Current value |
| --- | --- |
| Package license | `UNLICENSED` |
| Package version | `0.0.0` |
| `LICENSE` file | none |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime backend | blocked |

## Decision Needed

Choose exactly one path before broad public reuse.

| Option | What it means | Next unit |
| --- | --- | --- |
| Apache-2.0 implementation | Make Source-Wire a permissive open-source contract package. | Open an Apache-2.0 license implementation PRD. |
| Stay `UNLICENSED` | Keep the repo visible but do not grant reuse rights. | Record an explicit hold decision and keep release gate unchanged. |
| Legal review first | Pause licensing until counsel confirms the reuse and contributor path. | Use the [Legal Review Question Packet](legal-review-question-packet.md). |
| Source-available comparison | Explore noncommercial or source-available options before deciding. | Run a source-available license decision prototype. |

## Recommended Path

If the goal is broad public sharing and reuse, the recommended next unit is:

```text
Source-Wire Apache-2.0 License Implementation Gate
```

That unit should still keep npm publishing, GitHub release publishing, deployment, and hosted runtime blocked unless separate PRDs approve them.

For the exact future implementation checklist, read [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md).

Before executing any future license implementation, run the read-only [License Approval Rehearsal](license-approval-rehearsal.md) to verify the current blocked boundary and preview the transition checklist.

Before treating any license path as approved, run the pending [License Approval Decision Record](license-approval-decision-record.md):

```bash
npm run license:decision-record
```

To request the actual owner choice, use [License Approval Request Packet](license-approval-request-packet.md):

```bash
npm run license:approval-request
```

For the step-by-step owner decision workflow, use [Owner License Decision Workflow](owner-license-decision-workflow.md):

```bash
npm run owner:decision-workflow
```

Before requesting legal or owner review, run:

```bash
npm run legal:packet
```

## Exact Owner Approval Language

Use one of these exact statements.

### Approve Apache-2.0 Implementation

```text
Approved for Unit 240: implement Apache-2.0 licensing for Source-Wire. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, or add hosted runtime behavior.
```

### Stay Unlicensed

```text
Approved for Unit 240: keep Source-Wire UNLICENSED and version 0.0.0. Do not add a LICENSE file. Update public docs to record that public reuse remains blocked. Do not publish npm, create a GitHub release, deploy services, or add hosted runtime behavior.
```

### Request Legal Review First

```text
Approved for Unit 240: prepare a legal-review question packet for Source-Wire licensing, contributor policy, public support boundary, and commercial reuse. Keep Source-Wire UNLICENSED, version 0.0.0, unpublished, unreleased, undeployed, and hosted-runtime blocked.
```

### Compare Source-Available Options

```text
Approved for Unit 240: compare source-available and noncommercial license options for Source-Wire before any package metadata, LICENSE file, npm publishing, GitHub release, deployment, or hosted runtime change.
```

## What Approval Does Not Allow

License decision approval does not allow:

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
- trusted Memory Record auto-promotion.

## Required Checks For A Later License Implementation

When a later owner-approved implementation PRD opens license changes, use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Expected pre-implementation check:

```bash
npm run license:rehearsal
```

Expected post-implementation checks for an Apache-2.0 implementation unit:

```bash
test -f LICENSE
npm run release:gate
npm run publish:readiness
git diff --check
```

Do not run:

```bash
npm publish
```

unless a later publishing PRD explicitly approves it.

## Related Docs

- [Owner License Approval Packet](owner-license-approval-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [Owner License Decision Workflow](owner-license-decision-workflow.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [Future License Change Plan](future-license-change-plan.md)
- [License And Version Policy](license-version-policy.md)
- [Release Decision](release-decision.md)
- [Publish Readiness](publish-readiness.md)
