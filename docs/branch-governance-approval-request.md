# Source-Wire Branch Governance Approval Request

Status: branch governance approval request only.

This packet does not enable branch protection, create repository rulesets, publish a new npm version, create a new GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.

## Purpose

Use this packet when the owner is ready to decide whether Source-Wire `main` should move from owner-direct maintenance to protected branch governance.

Source-Wire is Apache-2.0 licensed as a source package and published as `@source-wire/contracts@0.1.0` with GitHub release `v0.1.0`. It is not deployed, hosted, production-runtime-ready, or open for code contributions.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run repository:branch-governance-request
```

Expected markers:

```text
ok branch governance approval request ready
blocked branch protection approval missing
blocked repository ruleset approval missing
```

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.1.0` |
| Default branch | `main` |
| Branch protection | not enabled |
| Repository rulesets | none |
| npm publishing | published as `@source-wire/contracts@0.1.0` |
| GitHub release publishing | published as `v0.1.0` |
| Hosted runtime | blocked |
| Code contributions | blocked |

Confirm live state with:

```bash
npm run repository:live-branch
```

## Exact Owner Decision Options

Choose exactly one later.

### Option 1: Approve minimal branch protection

```text
Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Option 2: Approve repository ruleset governance

```text
Approved for a future Source-Wire repository ruleset implementation unit: create a repository ruleset for main after current Package Checks are green. Require Package Checks before updates, block force pushes, block branch deletion, document bypass policy, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Option 3: Keep owner-direct maintenance for now

```text
Approved for a future Source-Wire branch governance decision unit: keep branch protection and repository rulesets disabled for now. Continue using owner-direct maintenance with local and live verification commands. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Option 4: Request governance review first

```text
Approved for a future Source-Wire branch governance review unit: review branch protection, repository rulesets, required checks, bypass policy, emergency owner access, release workflow impact, and contribution boundary before changing any GitHub branch or repository rule settings.
```

## What Branch Governance Approval Still Would Not Allow

Separate approval is still required for:

- publishing a new npm package version,
- creating a new GitHub release,
- creating new release tags,
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

- [Repository Metadata](repository-metadata.md)
- [Publish Readiness](publish-readiness.md)
- [CI Checks](ci-checks.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
