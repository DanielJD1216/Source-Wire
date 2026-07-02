# Source-Wire Post-Share Monitor

Status: owner-side post-share monitor.

This monitor is read-only. It does not close issues, edit issues, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this after Source-Wire is shared publicly.

`npm run world:share-final-preflight` is the clean baseline before broad sharing. It expects only owner-decision issues to be open. After sharing, reviewers may file structured feedback issues, so the ongoing monitor needs a different rule:

- owner-decision issues stay allowed,
- structured reviewer feedback issues stay allowed,
- unstructured public issues fail the monitor,
- open pull requests fail the monitor because code contributions are still blocked.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run world:post-share-monitor
```

Expected markers:

```text
ok post-share monitor ready
ok structured reviewer issue intake current
blocked code contribution PRs
```

## Allowed Open Issues

The monitor allows:

- owner-decision issue `#257`,
- public reviewer issues with `reviewer-feedback`,
- reviewer issues with at least one topic label: `verification`, `docs`, `contracts`, `boundary`, or `safety`.

## Failure Conditions

The monitor fails if:

- a public issue is open without `reviewer-feedback`,
- a reviewer issue has no topic label,
- a pull request is open,
- GitHub labels used by reviewer templates are missing or changed,
- package metadata no longer says `@source-wire/contracts@0.1.0` and `Apache-2.0`,
- public docs required for safe feedback intake are missing.

## Why Open PRs Fail

Source-Wire is Apache-2.0 licensed for source reuse, and the contribution terms PRD is complete, but code contribution acceptance is still blocked until a separate contribution-acceptance implementation unit opens it.

Public review feedback belongs in issues, not pull requests, until that policy changes.

## What To Do When It Fails

If the monitor fails because of an unstructured issue:

1. Do not copy private data into another system.
2. Ask the reporter to refile using the right issue template.
3. Close or edit labels only through normal maintainer judgment.
4. Keep code contribution acceptance blocked.
5. Re-run `npm run world:post-share-monitor`.

If the monitor fails because an open pull request exists:

1. Do not merge it.
2. Respond with the current contribution boundary.
3. Ask the reporter to file structured issue feedback instead.
4. Keep code contribution acceptance blocked until a separate contribution-acceptance implementation unit opens it.

## Still Blocked

This monitor does not approve:

- repository ruleset governance,
- hosted runtime implementation,
- API server runtime,
- MCP server runtime,
- database migrations,
- deployment,
- production runtime use,
- accepting code contributions,
- real user data,
- trusted Memory Record auto-promotion.

## Related Docs

- [World Share Final Preflight](world-share-final-preflight.md)
- [World Share Packet](world-share-packet.md)
- [World Share Kit](world-share-kit.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [Reviewer Labels](reviewer-labels.md)
- [Public Status](public-status.md)
