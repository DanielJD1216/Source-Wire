# Source-Wire License Decision Gate

Status: decision implemented.

## Purpose

This gate records the owner decision that moved Source-Wire from an unlicensed public review repo to an Apache-2.0 licensed source package.

Source-Wire is now Apache-2.0 licensed as a source package. It is version `0.1.0`, published to npm, released on GitHub, undeployed, and not a hosted runtime.

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.1.0` |
| `LICENSE` file | present |
| Source package reuse | allowed under Apache-2.0 |
| npm package | published as `@source-wire/contracts@0.1.0` |
| GitHub release | published as `v0.1.0` |
| Hosted runtime backend | blocked |
| Code contribution acceptance | blocked |

## Implemented Decision

The selected path was:

| Option | What it means | Status |
| --- | --- | --- |
| Apache-2.0 implementation | Make Source-Wire a permissive open-source contract package. | Implemented |
| Stay unlicensed | Would have kept the repo visible without granting source reuse rights. | Not selected |
| Legal review first | Pause licensing until counsel confirms the reuse and contributor path. | Not selected |
| Source-available comparison | Explore noncommercial or source-available options before deciding. | Not selected |

## Owner Approval Language

```text
Approved for a future Source-Wire license implementation unit: implement Apache-2.0 licensing. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

## Commands

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

To verify the decision record:

```bash
npm run license:decision-record
```

To verify the owner choice:

```bash
npm run license:approval-request
npm run owner:decision-workflow
```

To verify the implementation map:

```bash
npm run license:implementation-plan
```

To verify the remaining launch blockers:

```bash
npm run launch:decision-status
```

## What Approval Does Not Allow

Apache-2.0 license approval does not allow:

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
