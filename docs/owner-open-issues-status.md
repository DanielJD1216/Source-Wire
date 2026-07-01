# Owner Open Issues Status

Status: live owner-side GitHub issue boundary check.

This command is read-only. It does not close issues, create issues, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.

## Purpose

Use this check before broad public sharing when you want to prove the visible open issue surface is limited to the tracked owner-decision gates.

The current expected open issues are:

- `#255` Owner decision: approve first public release path
- `#256` Owner decision: approve branch governance path
- `#257` Owner decision: open hosted runtime PRD path
- `#258` Owner decision: define contribution terms before accepting code

Any extra open issue is treated as a failure because it means the public state has drifted and needs owner review before broad sharing.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Run with GitHub CLI authenticated:

```bash
npm run owner:open-issues-status
```

Expected markers:

```text
ok owner open issue boundary readable
ok only owner decision issues open
blocked owner decisions remain open
```

## What It Proves

- GitHub issue access is working through `gh`.
- Open issues are exactly the tracked owner-decision gates.
- No unreviewed public open issue is silently hiding behind the share-ready status.

## What It Does Not Prove

- It does not approve release execution.
- It does not approve branch governance enforcement.
- It does not approve hosted runtime PRD work.
- It does not approve contribution terms work.
- It does not close or edit any issue.

## Related Commands

- `npm run owner:decision-status` checks whether exact owner approvals have been separately recorded on issues `#255` through `#258`.
- `npm run world:share-preflight` runs this command together with external links, live world-share status, launch decision status, and owner decision status.
- `npm run launch:decision-status` summarizes blocked launch channels without approving them.
