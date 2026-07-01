# Owner Decision Issue Refresh

Status: owner-side issue maintenance only.

Use this command after a Source-Wire readiness or preflight commit changes the current commit, Package Checks run, release artifact manifest, or final preflight proof shown in public owner-decision issues.

## Quickstart

Prerequisites:

- Node.js 22 or newer.
- Run `npm install` from the Source-Wire repo root.
- GitHub CLI authenticated with permission to edit issues in `DanielJD1216/Source-Wire`.
- Local `HEAD` must match `origin/main`.
- Latest Package Checks must be successful on the same commit.

Run:

```bash
npm run owner:refresh-decision-issues
```

Read-only freshness check:

```bash
npm run owner:decision-issues-freshness
```

## What It Updates

The command refreshes public owner-decision issues:

- `#255` first public release path.
- `#256` branch governance path.
- `#257` hosted runtime PRD path.
- `#258` contribution terms path.

It updates each issue with:

- current Source-Wire commit,
- current commit message,
- latest successful Package Checks run,
- `npm run world:share-final-preflight` as the final owner-side preflight,
- the issue-specific gate command,
- current final-preflight proof markers,
- current issue-specific gate proof markers.

Issue `#255` also receives the current release artifact manifest block.

## Output Markers

Expected successful markers:

```text
ok owner decision issue #255 refreshed
ok owner decision issue #256 refreshed
ok owner decision issue #257 refreshed
ok owner decision issue #258 refreshed
ok owner decision issue refresh ready
ok owner decision issue bodies current
blocked owner approvals missing
```

## Boundaries

This command mutates GitHub issue bodies only.

It does not record owner approval, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

This command stays outside `npm run publish:readiness` because it depends on live GitHub issue mutation.

The read-only freshness check is also owner-side because it depends on live GitHub issue state and the latest public Package Checks run.
