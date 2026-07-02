# Source-Wire Branch Governance Implementation Dry Run

Status: owner-side dry run only.

This dry run does not enable branch protection, create repository rulesets, publish npm, create a GitHub release, create tags, deploy services, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this command before the future branch governance implementation step.

It resolves the live successful GitHub Actions check-run name for `origin/main`, builds the reviewed minimal branch-protection payload, and confirms whether issue `#256` has the exact owner approval recorded.

The dry run exists because a branch protection rule can be technically enabled but still point at the wrong status check. This command makes the required check context explicit before any live settings change.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run repository:branch-governance-dry-run
```

Expected markers before approval:

```text
ok branch governance implementation dry run ready
ok branch protection payload documented
ok required status check resolved Source-Wire package checks
blocked branch governance implementation approval missing
```

Expected markers after approval is recorded but before live settings change:

```text
ok branch governance implementation dry run ready
ok branch protection payload documented
ok required status check resolved Source-Wire package checks
ok branch governance implementation approval recorded
blocked live branch governance mutation still requires focused implementation step
```

## Payload Shape

The dry run prints the reviewed future payload for:

- branch: `main`,
- required check context: `Source-Wire package checks`,
- status checks required before merging,
- strict up-to-date requirement disabled for owner-maintenance simplicity,
- admin enforcement disabled to preserve owner emergency access,
- pull request reviews disabled while code contributions remain blocked,
- force pushes disabled,
- branch deletions disabled,
- repository rulesets deferred.

GitHub's REST API for protected branches documents the `Update branch protection` endpoint and says protecting a branch requires admin or owner permissions. It also documents `required_status_checks`, `enforce_admins`, `required_pull_request_reviews`, and `restrictions` as part of the protected branch API surface.

## Required Owner Approval

Do not change live branch settings until this exact approval is recorded on issue `#256`:

```text
Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

## Future Implementation Boundary

After exact approval is recorded, a focused implementation step may use GitHub UI or the guarded [Branch Governance Apply Guard](branch-governance-apply.md) command.

The dry run itself does not execute that call.

After the future live settings change, run:

```bash
npm run repository:live-branch
npm run world:live-status
npm run publish:readiness
```

## Related Docs

- [Branch Governance Approval Request](branch-governance-approval-request.md)
- [Branch Governance Decision Preflight](branch-governance-decision-preflight.md)
- [Branch Governance Execution Packet](branch-governance-execution-packet.md)
- [Branch Governance Apply Guard](branch-governance-apply.md)
- [Branch Governance Implementation Plan](branch-governance-implementation-plan.md)
- [Owner Approval Recorder](owner-approval-recorder.md)
