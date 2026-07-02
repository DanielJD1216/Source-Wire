# Source-Wire Branch Governance Apply Guard

Status: guarded owner-side apply command.

Default mode is read-only. Write mode is blocked unless issue `#256` records exact owner approval and the command receives both `--write` and `--confirm-exact`.

This command does not publish npm, create a GitHub release, create tags, deploy services, accept code contributions, implement hosted runtime behavior, approve production runtime use, or create repository rulesets.

## Purpose

Use this command as the future implementation path for minimal branch protection after branch governance approval is recorded.

The guard exists so the branch protection payload, required status check context, approval state, and write intent are checked in one place before live GitHub settings change.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Default dry-run mode:

```bash
npm run repository:branch-governance-apply
```

Expected markers before approval:

```text
ok branch governance apply guard ready
ok branch protection payload documented
ok required status check resolved Source-Wire package checks
blocked branch governance implementation approval missing
```

Expected markers after approval is recorded but before write mode:

```text
ok branch governance apply guard ready
ok branch governance implementation approval recorded
blocked branch governance apply requires --write
```

## Write Mode

Write mode must not run until issue `#256` records this exact approval:

```text
Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

After that approval is recorded and the focused branch governance implementation unit is active, run:

```bash
npm run repository:branch-governance-apply -- --write --confirm-exact "<exact approval text>"
```

Successful write-mode markers:

```text
ok branch governance apply guard ready
ok branch governance implementation approval recorded
ok branch protection apply completed
blocked repository rulesets not enabled
```

## Payload

The command applies the reviewed minimal branch protection payload:

- branch: `main`,
- required check context: `Source-Wire package checks`,
- status checks required before merging,
- strict up-to-date requirement disabled for owner-maintenance simplicity,
- admin enforcement disabled to preserve owner emergency access,
- pull request reviews disabled while code contributions remain blocked,
- push restrictions disabled,
- force pushes disabled,
- branch deletions disabled,
- repository rulesets deferred.

## Required Verification After Write Mode

After the future live settings change, run:

```bash
npm run repository:live-branch
npm run world:live-status
npm run publish:readiness
```

Expected minimal branch-protection result:

```text
ok live branch governance readable
ok main branch matches origin
ok branch protection enabled
ok branch protection requires Source-Wire package checks
blocked repository rulesets not enabled
```

## Still Blocked

This command does not approve:

- publishing a new npm package version,
- creating a new GitHub release,
- creating release tags,
- deployment,
- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record auto-promotion,
- accepting code contributions.

## Related Docs

- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Owner Approval Recorder](owner-approval-recorder.md)
- [Branch Governance Approval Request](branch-governance-approval-request.md)
- [Branch Governance Decision Preflight](branch-governance-decision-preflight.md)
- [Branch Governance Execution Packet](branch-governance-execution-packet.md)
- [Branch Governance Implementation Dry Run](branch-governance-implementation-dry-run.md)
- [Branch Governance Implementation Plan](branch-governance-implementation-plan.md)
