# Owner Open Issues Status

Status: live owner-side GitHub issue boundary check.

This command is read-only. It does not close issues, create issues, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.

## Purpose

Use this check before broad public sharing when you want to prove the visible open issue surface is limited to unresolved owner-decision gates.

The current expected open issues are:

- `#257` Owner decision: open hosted runtime PRD path
- `#258` Owner decision: define contribution terms before accepting code

Issues `#255` and `#256` are expected to be closed because the first public release path and minimal branch governance path are complete. Any extra open issue is treated as a failure because it means the public state has drifted and needs owner review before broad sharing.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Run with GitHub CLI authenticated:

```bash
npm run owner:open-issues-status
```

Expected markers:

```text
ok owner open issue boundary readable
ok completed owner decision #255 closed
ok exact release implementation approval retained
ok completed owner decision #256 closed
ok exact branch governance implementation approval retained
ok only unresolved owner decision issues open
blocked #257 hosted runtime PRD approval missing
ok #258 contribution terms PRD approval recorded while issue remains open
blocked owner decisions missing approval records
blocked unresolved owner decision issues remain open
```

## What It Proves

- GitHub issue access is working through `gh`.
- Open issues are exactly the unresolved owner-decision gates.
- Issue `#255` has recorded release implementation approval and is closed as completed release history.
- Issue `#256` has recorded branch governance implementation approval and is closed as completed branch-governance history.
- Issue `#257` still needs separate owner approval before hosted runtime PRD work opens.
- Issue `#258` has exact owner approval recorded for contribution terms PRD work, while code contribution acceptance remains blocked.
- No unreviewed public open issue is silently hiding behind the share-ready status.

## What It Does Not Prove

- It does not approve release execution.
- It does not approve repository ruleset governance.
- It does not approve hosted runtime PRD work.
- It does not itself approve contribution terms work or code contribution acceptance.
- It does not close or edit any issue.

## Related Commands

- `npm run owner:decision-status` checks whether exact owner approvals have been separately recorded on issues `#255` through `#258`.
- `npm run world:share-preflight` runs this command together with external links, live world-share status, launch decision status, and owner decision status.
- `npm run launch:decision-status` summarizes blocked launch channels without approving them.
