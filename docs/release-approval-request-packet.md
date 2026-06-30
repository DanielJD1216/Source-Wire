# Source-Wire Release Approval Request Packet

Status: release approval request only.

This packet does not approve npm publishing, GitHub release publishing, release tags, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this packet when the owner is ready to choose the next Source-Wire release path.

Source-Wire is Apache-2.0 licensed as a source package. It is not yet npm-published, GitHub-released, deployed, hosted, production-ready, or open for code contributions.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

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
blocked npm publishing not approved
blocked github release not approved
blocked version release not approved
```

Before asking the owner for a release implementation decision, run the complete read-only decision preflight:

```bash
npm run release:decision-preflight
```

This runs:

- `npm run world:share-preflight`
- `npm run release:candidate-readiness`
- `npm run release:artifact-manifest`
- `npm run release:approval-request`
- `npm run launch:decision-status`

Expected final markers:

```text
ok release decision preflight ready
ok world share preflight current
ok release candidate evidence current
ok release artifact evidence current
blocked release implementation approval missing
```

This command does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.0.0` |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Git tag creation | blocked |
| Hosted runtime | blocked |
| Code contributions | blocked |

## Exact Owner Decision Options

Choose exactly one later.

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
- [Publish Readiness](publish-readiness.md)
