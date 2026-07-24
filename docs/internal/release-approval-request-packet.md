# Source-Wire Release Approval Request Packet

Status: release approval request with recorded owner decision.

This packet records the first release approval. It does not approve a future npm package version, future GitHub release, future release tags, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this packet to see the recorded Source-Wire release path and the remaining post-release blockers.

Source-Wire is Apache-2.0 licensed as a source package. It is npm-published, GitHub-released, undeployed, not hosted, not production-ready, and not open for code contributions.

Issue [#255](https://github.com/DanielJD1216/Source-Wire/issues/255) records the owner decision to use Option 1: npm plus GitHub release implementation.

That decision authorized the first npm publication and matching GitHub release. Future release mutation remains blocked until a new approved release unit and final release preflights pass.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:approval-request
```

Expected markers:

```text
ok release approval request ready
ok npm publishing completed @source-wire/contracts@0.1.0
ok github release completed v0.1.0
ok version release completed 0.1.0
```

Before any future release mutation, run the complete read-only decision preflight:

```bash
npm run release:decision-preflight
```

This runs:

- `npm run world:share-preflight`
- `npm run owner:open-issues-status`
- `npm run release:approval-status`
- `npm run release:candidate-readiness`
- `npm run release:artifact-manifest`
- `npm run release:approval-request`
- `npm run launch:decision-status`

Expected final markers:

```text
ok release decision preflight ready
ok world share preflight current
ok owner open issue boundary current
ok release approval status current
ok release candidate evidence current
ok release artifact evidence current
ok release execution completed
```

This command does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.

To check only whether issue `#255` has separate exact owner approval evidence, run:

```bash
npm run release:approval-status
```

Expected current markers after recorded owner approval:

```text
ok release approval status readable
ok exact release approval recorded
ok release execution completed
```

This check intentionally ignores the recommended approval text in this packet. Approval must be recorded separately in issue `#255`, either in an `Owner Approval Record` section or in an issue comment containing the exact approval text. The `Approval evidence` row shows which route is present.

## Current Recorded Decision

| Field | Current value |
| --- | --- |
| Release decision issue | [`#255`](https://github.com/DanielJD1216/Source-Wire/issues/255) |
| Selected path | Option 1: npm plus GitHub release implementation |
| Approval state | recorded |
| npm auth | complete for first release |
| Release execution | complete for first release |

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.1.0` |
| npm package | published as `@source-wire/contracts@0.1.0` |
| GitHub release | published as `v0.1.0` |
| Git tag | `v0.1.0` |
| Hosted runtime | blocked |
| Code contributions | blocked |

## Historical Owner Decision Options

These were the exact choices presented before issue `#255` recorded Option 1. Keep this section for audit history and exact-text matching.

### Option 1: Approve npm plus GitHub release implementation (recommended)

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

### Option 2: Approve npm publishing only

```text
Approved for a future Source-Wire npm publish implementation unit: prepare and publish the npm package after final release-candidate verification. Do not create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Option 3: Approve GitHub release only

```text
Approved for a future Source-Wire GitHub release implementation unit: create a GitHub release from the verified source package state. Do not publish npm, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Option 4: Keep release publishing blocked

```text
Approved for a future Source-Wire release decision unit: keep npm publishing and GitHub release publishing blocked. Keep version 0.0.0, do not create a release tag, do not deploy services, and do not accept code contributions.
```

### Option 5: Request release review first

```text
Approved for a future Source-Wire release review unit: review versioning, npm publishing, GitHub release notes, support, security, and contribution boundaries before any package version, npm publishing, GitHub release, deployment, hosted runtime, or contribution acceptance change.
```

## What Release Approval Still Would Not Allow

Separate approval is still required for:

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

- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Decision](release-decision.md)
- [Launch Decision Status](launch-decision-status.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Publish Readiness](../guides/publish-readiness.md)
