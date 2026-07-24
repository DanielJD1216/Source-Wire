# Source-Wire Repository Ruleset Governance Preflight

Status: owner-side read-only preflight.

This preflight does not create repository rulesets, enable repository rulesets, publish npm, create a GitHub release, create tags, deploy services, accept code contributions, add hosted runtime behavior, or approve production runtime use.

## Purpose

Use this preflight before any future repository ruleset implementation unit.

The current approved governance state is minimal branch protection on `main`. Repository rulesets remain deferred until the owner records a separate exact approval.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run repository:ruleset-governance-preflight
```

Expected markers:

```text
ok repository ruleset governance preflight ready
ok minimal branch protection current
ok Package Checks current
blocked repository ruleset approval missing
blocked repository ruleset implementation
```

## Exact Approval Text

Do not implement repository rulesets until the owner approves this exact approval text:

```text
Approved for a future Source-Wire repository ruleset implementation unit: create a repository ruleset for main after current Package Checks are green. Require Package Checks before updates, block force pushes, block branch deletion, document bypass policy, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

## What This Preflight Verifies

- `main` is still the default branch.
- `origin/main` matches live GitHub `main`.
- Current Package Checks are green on `origin/main`.
- Minimal branch protection is enabled.
- Branch protection requires `Source-Wire package checks`.
- Force pushes and branch deletion remain blocked by branch protection.
- Active repository rulesets are absent.
- Repository ruleset approval is still missing.

## Still Blocked

- repository ruleset implementation,
- publishing a new npm package version,
- creating a new GitHub release,
- creating new release tags,
- deployment,
- hosted runtime behavior,
- production runtime use,
- code contribution acceptance.

## Related Docs

- [Branch Governance Approval Request](branch-governance-approval-request.md)
- [Branch Governance Implementation Plan](branch-governance-implementation-plan.md)
- [Branch Governance Execution Packet](branch-governance-execution-packet.md)
- [Repository Metadata](../reference/repository-metadata.md)
- [Publish Readiness](../guides/publish-readiness.md)
