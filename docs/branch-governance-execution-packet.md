# Source-Wire Branch Governance Execution Packet

Status: execution packet only.

This packet does not enable branch protection, create repository rulesets, publish a new npm version, create a new GitHub release, create tags, deploy services, accept code contributions, add hosted runtime behavior, or approve production runtime use.

## Purpose

Use this packet after the owner records exact approval for issue `#256`.

The goal is to make the future branch governance implementation boring: one minimal branch protection rule for `main`, one required check, no contribution workflow changes, and a clear rollback path.

GitHub's protected branch docs state that branch protection rules can require status checks and, by default, block force pushes and branch deletion. GitHub also notes only one branch protection rule applies at a time, while rulesets are an alternative for more complex policy. See [About protected branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and [REST API endpoints for protected branches](https://docs.github.com/rest/branches/branch-protection).

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run repository:branch-governance-execution-packet
```

Expected markers:

```text
ok branch governance execution packet ready
ok minimal branch protection settings documented
ok branch governance implementation approval recorded
```

This command verifies the packet and docs only. It does not call GitHub APIs or change repository settings.

## Required Owner Approval

Issue `#256` records this exact approval:

```text
Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

## Pre-Execution Checks

Before changing live GitHub settings:

1. Run `npm run publish:readiness`.
2. Run `npm run repository:live-branch`.
3. Run `npm run repository:branch-governance-preflight`.
4. Run `npm run repository:branch-governance-dry-run`.
5. Run `npm run repository:branch-governance-apply` in dry-run mode.
6. Run `npm run owner:decision-status`.
7. Confirm issue `#256` has exact approval recorded.
8. Confirm latest `Package Checks` is green on `origin/main`.
9. Confirm local `main` and `origin/main` point to the same commit.
10. Confirm no new npm package version, GitHub release, tag, deployment, hosted runtime, or contribution acceptance is being opened in the same unit.

## Minimal Branch Protection Settings

Future implementation should use GitHub UI or an equivalent reviewed API call to create a branch protection rule with this intent:

| Setting | Future value |
| --- | --- |
| Branch name pattern | `main` |
| Require status checks before merging | enabled |
| Required status check | `Package Checks / Source-Wire package checks` |
| Require branches to be up to date before merging | disabled unless a later review chooses strict mode |
| Require pull request reviews | disabled |
| Restrict who can push | disabled |
| Allow force pushes | disabled |
| Allow deletions | disabled |
| Include administrators | disabled, to preserve owner emergency access |
| Repository rulesets | disabled for this first governance step |

Why this shape:

- it protects the public branch from unchecked merges when CI is failing,
- it keeps owner direct emergency access available,
- it does not invite or accept outside code contributions,
- it avoids ruleset complexity until the contribution policy is approved.

## Future Verification

After the future implementation changes live settings, run:

```bash
npm run repository:live-branch
npm run world:live-status
npm run publish:readiness
```

Expected minimal-branch-protection result:

```text
ok live branch governance readable
ok main branch matches origin
ok branch protection enabled
ok branch protection requires Source-Wire package checks
blocked repository rulesets not enabled
```

## Rollback

If the future branch protection rule blocks owner maintenance unexpectedly:

1. Disable the branch protection rule for `main`.
2. Run `npm run repository:live-branch`.
3. Run `npm run world:live-status`.
4. Record the incident and rollback in a private proof file.
5. Keep new npm publishing, new GitHub release creation, deployment, hosted runtime behavior, and code contribution acceptance blocked.

## Still Blocked

This packet does not approve:

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
- [Branch Governance Implementation Plan](branch-governance-implementation-plan.md)
- [Repository Metadata](repository-metadata.md)
- [World-Share Readiness](world-share-readiness.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
