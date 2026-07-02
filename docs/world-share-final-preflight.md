# Source-Wire World Share Final Preflight

Status: owner-side final preflight before broad public sharing.

This preflight is read-only. It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this command immediately before broad public sharing when the owner wants one live check that the public source-package state and all completed owner-decision gates are current.

This is stronger than `npm run world:share-preflight` because it also runs the release, branch governance, hosted runtime PRD, hosted runtime child issue publication, and contribution terms PRD decision preflights.

After public sharing starts and reviewer feedback issues may be open, use [World Share Post-Share Monitor](world-share-post-share-monitor.md) instead of treating open reviewer issues as a pre-share failure.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run world:share-final-preflight
```

This runs:

- `npm run world:share-preflight`
- `npm run release:decision-preflight`
- `npm run repository:branch-governance-preflight`
- `npm run runtime:prd-decision-preflight`
- `npm run runtime:child-issue-publication-preflight`
- `npm run runtime:child-issue-approval-status`
- `npm run contribution:terms-decision-preflight`
- `npm run owner:decision-status`
- `npm run owner:open-issues-status`
- `npm run owner:open-issues-status:smoke`
- `npm run owner:decision-issues-freshness`
- `npm run launch:decision-status`

Expected final markers:

```text
ok world share final preflight ready
ok world share preflight current
ok release decision preflight current
ok branch governance decision preflight current
ok hosted runtime PRD decision preflight current
ok hosted runtime child issue publication preflight current
ok hosted runtime child issue approval status current
ok contribution terms PRD decision preflight current
ok reviewer labels current
ok owner decision issue boundary current
ok owner open issue future planning smoke current
ok owner decision issue freshness current
blocked production launch channels
blocked focused implementation units required
```

## Why This Is Outside CI

This command uses live owner-side checks for GitHub, npm, branch governance, releases, tags, and owner-decision issues.

It intentionally stays outside `npm run publish:readiness` and GitHub Actions Package Checks so CI does not depend on owner-side credentials or live external state.

## Stop Conditions

Stop broad public sharing if:

- this command fails,
- `Package Checks` is not green on `origin/main`,
- unexpected public issues are open,
- the future hosted-runtime planning issue smoke fails,
- any owner-decision issue accidentally records approval,
- npm publishing is no longer blocked without a release implementation unit,
- GitHub releases or tags exist without a release implementation unit,
- branch protection or repository rulesets changed without owner approval,
- hosted runtime behavior appears in public docs or package surfaces,
- the child issue publication preflight is not current,
- the child issue publication approval status is unreadable,
- code contribution acceptance appears before a separate implementation unit explicitly opens it,
- private data, real user data, local private paths, real chat logs, screenshots, client names, account IDs, tokens, or production exports appear in public package contents.

## Still Blocked

This preflight keeps these blocked:

- npm publishing,
- GitHub release publishing,
- release tags,
- package version changes,
- deployment,
- repository ruleset governance,
- hosted runtime implementation,
- API server runtime,
- MCP server runtime,
- database migrations,
- production runtime use,
- code contribution acceptance,
- real user data.

## Related Docs

- [World Share Packet](world-share-packet.md)
- [World Share Post-Share Monitor](world-share-post-share-monitor.md)
- [World-Share Readiness](world-share-readiness.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Launch Decision Status](launch-decision-status.md)
- [Release Decision Preflight](release-approval-request-packet.md)
- [Branch Governance Decision Preflight](branch-governance-decision-preflight.md)
- [Hosted Runtime PRD Decision Preflight](hosted-runtime-prd-decision-preflight.md)
- [Hosted Runtime Child Issue Publication Preflight](hosted-runtime-child-issue-publication-preflight.md)
- [Contribution Terms PRD Decision Preflight](contribution-terms-prd-decision-preflight.md)
