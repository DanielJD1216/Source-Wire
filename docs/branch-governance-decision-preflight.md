# Source-Wire Branch Governance Decision Preflight

Status: owner-side read-only preflight.

This preflight does not enable branch protection, create repository rulesets, publish a new npm version, create a new GitHub release, create tags, deploy services, accept code contributions, approve hosted runtime use, or change package metadata.

## Purpose

Use this preflight before any future branch governance implementation unit touches live GitHub settings.

It proves the current public sharing state, owner-decision issue state, owner open-issue boundary, live branch state, approval request, implementation plan, and execution packet are all current before the owner decides whether to enable minimal branch protection.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run repository:branch-governance-preflight
```

Expected markers:

```text
ok branch governance decision preflight ready
ok world share preflight current
ok owner decision status current
ok owner open issue boundary current
ok live branch governance current
ok branch governance execution plan current
ok branch governance execution packet current
ok branch governance implementation dry run current
ok branch governance apply guard current
blocked branch governance implementation approval missing
```

## What It Runs

This command runs:

- `npm run world:share-preflight`
- `npm run owner:decision-status`
- `npm run owner:open-issues-status`
- `npm run repository:live-branch`
- `npm run repository:branch-governance-request`
- `npm run repository:branch-governance-plan`
- `npm run repository:branch-governance-execution-packet`
- `npm run repository:branch-governance-dry-run`
- `npm run repository:branch-governance-apply`

These checks are intentionally outside `npm run publish:readiness` because they use live GitHub state and owner-side access.

## Required Approval Before Execution

Issue `#256` must contain the exact owner approval text before a future implementation unit changes branch governance:

```text
Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

Until that exact approval is recorded, branch governance enforcement remains blocked.

## Still Blocked

This preflight does not allow:

- publishing a new npm package version,
- creating a new GitHub release,
- creating new release tags,
- package version changes,
- deployment,
- hosted runtime behavior,
- production runtime use,
- code contribution acceptance.

## Related Docs

- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Branch Governance Approval Request](branch-governance-approval-request.md)
- [Branch Governance Implementation Plan](branch-governance-implementation-plan.md)
- [Branch Governance Execution Packet](branch-governance-execution-packet.md)
- [Branch Governance Implementation Dry Run](branch-governance-implementation-dry-run.md)
- [Branch Governance Apply Guard](branch-governance-apply.md)
- [Repository Metadata](repository-metadata.md)
- [World Share Packet](world-share-packet.md)
