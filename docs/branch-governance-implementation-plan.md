# Source-Wire Branch Governance Implementation Plan

Status: implementation plan only.

This plan does not enable branch protection, create repository rulesets, publish a new npm version, create a new GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.

## Purpose

Use this plan as the preserved implementation record after the owner approved branch governance implementation.

Source-Wire is currently shareable as an Apache-2.0 source package, and `main` now has minimal branch protection. This record preserves the implementation plan and keeps repository rulesets deferred.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run repository:branch-governance-plan
```

Expected markers:

```text
ok branch governance implementation plan ready
ok branch governance recommended path documented
ok branch governance implementation approval recorded
```

This command verifies the plan and docs only. It does not change GitHub settings.

## Required Preflight

Before any future branch governance implementation unit changes live GitHub settings:

1. Run `npm run publish:readiness`.
2. Run `npm run repository:live-branch`.
3. Run `npm run repository:branch-governance-preflight`.
4. Run `npm run repository:branch-governance-dry-run`.
5. Run `npm run repository:branch-governance-apply` in dry-run mode.
6. Confirm latest `Package Checks` is green on `origin/main`.
7. Confirm `origin/main` matches local `main`.
8. Confirm no new npm publishing, new GitHub release, deployment, hosted runtime, or contribution acceptance is being opened in the same unit.

## Option A: Minimal Branch Protection

Recommended first implementation path: Option A.

Minimal branch protection should:

- target `main`,
- require `Package Checks`,
- block force pushes,
- block branch deletion,
- keep owner emergency access documented,
- avoid requiring public pull requests while code contributions remain blocked,
- avoid enabling contribution workflows,
- avoid changing package version, npm publish state, releases, tags, deployment, or runtime behavior.

Why this first:

- it protects the public branch with the least policy surface,
- it keeps owner maintenance simple while contribution acceptance is still blocked,
- it can be verified by `npm run repository:live-branch` and `npm run world:live-status`.

## Option B: Repository Ruleset Governance

Repository ruleset governance should wait unless the owner wants stronger GitHub-side policy.

A future ruleset should:

- target `main`,
- require `Package Checks`,
- block force pushes,
- block branch deletion,
- document bypass policy,
- document owner emergency access,
- preserve the current no-contribution boundary unless contribution terms are separately approved.

Why not first:

- rulesets add more knobs and bypass behavior,
- Source-Wire is not yet accepting code contributions,
- minimal branch protection is enough for the current source-package sharing state.

## Required Post-Change Verification

After a future implementation unit changes branch governance, run:

```bash
npm run repository:live-branch
npm run world:live-status
npm run publish:readiness
```

Expected future outcome for minimal branch protection:

```text
ok live branch governance readable
ok main branch matches origin
ok branch protection enabled
ok branch protection requires Source-Wire package checks
blocked repository rulesets not enabled
```

Expected future outcome for repository ruleset governance:

```text
ok live branch governance readable
ok main branch matches origin
ok repository rulesets active
```

## Rollback Plan

If branch governance blocks owner maintenance unexpectedly:

1. Disable the new branch protection rule or repository ruleset.
2. Run `npm run repository:live-branch`.
3. Record the failure and rollback in a proof file.
4. Keep new npm publishing, new GitHub release creation, deployment, hosted runtime behavior, and code contribution acceptance blocked.

## What This Still Would Not Allow

Branch governance approval would not allow:

- publishing a new npm package version,
- creating a new GitHub release,
- creating new release tags,
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

- [Branch Governance Approval Request](branch-governance-approval-request.md)
- [Branch Governance Decision Preflight](branch-governance-decision-preflight.md)
- [Branch Governance Implementation Dry Run](branch-governance-implementation-dry-run.md)
- [Branch Governance Apply Guard](branch-governance-apply.md)
- [Branch Governance Execution Packet](branch-governance-execution-packet.md)
- [Repository Metadata](repository-metadata.md)
- [World-Share Readiness](world-share-readiness.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Publish Readiness](publish-readiness.md)
- [CI Checks](ci-checks.md)
