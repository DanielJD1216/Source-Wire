# Source-Wire World-Share Readiness

Source-Wire can be shared as an Apache-2.0 licensed source package.

It is an npm-published package and GitHub release, but not a deployed service, hosted runtime, or production runtime.

## Purpose

This page prevents one mistake:

```text
Apache-2.0 source package equals production launch.
```

That is false for Source-Wire today.

Apache-2.0 currently means reviewers and adopters can inspect and reuse the source package. npm publication and the GitHub release are live. None of that means Source-Wire is deployed, hosted, production-ready, or accepting code contributions.

## Current Share State

| Area | Current state |
| --- | --- |
| Technical review | Ready |
| Source package reuse | Ready under Apache-2.0 |
| Open-source licensing | Implemented |
| npm package | Published as `@source-wire/contracts@0.1.0` |
| GitHub release | Published as `v0.1.0` |
| Hosted runtime | Blocked |
| Production runtime use | Blocked |
| Code contributions | Blocked |
| Real user data examples | Blocked |

## Current Owner-Decision Issues

These public issues track the remaining owner decisions. They do not enable branch governance, start hosted runtime work, or accept code contributions.

- [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255)
- [#256 Branch governance path](https://github.com/DanielJD1216/Source-Wire/issues/256)
- [#257 Hosted runtime PRD path](https://github.com/DanielJD1216/Source-Wire/issues/257)
- [#258 Contribution terms before accepting code](https://github.com/DanielJD1216/Source-Wire/issues/258)

## Release Execution Boundary

Issue [#255](https://github.com/DanielJD1216/Source-Wire/issues/255) records the owner-approved public release path.

That release path has been executed for `0.1.0`. The public npm package and matching GitHub release are live.

Current live release:

- npm: `@source-wire/contracts@0.1.0`
- GitHub release: `v0.1.0`

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run world:readiness
```

Expected markers:

```text
ok world share open source ready
blocked production launch channels
```

This command does not publish a new package version, create a new GitHub release, deploy services, accept contributions, start runtime services, connect to a database, or approve production runtime use.

For the copy-and-command packet used when sharing publicly, run:

```bash
npm run world:share-packet
```

Expected markers:

```text
ok world share packet ready
ok public share copy current
blocked production launch channels
```

This command does not publish a new package version, create a new GitHub release, create new tags, deploy services, enable branch protection, create repository rulesets, accept code contributions, start runtime services, connect to a database, or approve production runtime use.

## Owner Live Status

Before broad public sharing, the owner can run the complete read-only owner preflight:

```bash
npm run world:share-final-preflight
```

This runs the live source-package preflight plus the release, branch governance, hosted runtime PRD, and contribution terms PRD decision preflights.

Expected final markers:

```text
ok world share final preflight ready
ok world share preflight current
ok release decision preflight current
ok branch governance decision preflight current
ok hosted runtime PRD decision preflight current
ok contribution terms PRD decision preflight current
ok reviewer labels current
ok owner decision issue boundary current
ok owner decision issue freshness current
blocked production launch channels
blocked owner approvals missing
```

This command does not publish a new package version, create a new GitHub release, create new tags, deploy services, enable branch protection, create repository rulesets, accept code contributions, start runtime services, connect to a database, or approve production runtime use.

## Post-Share Monitor

After broad public sharing starts, reviewer issues may exist. Use the read-only post-share monitor instead of the pre-share open-issue boundary:

```bash
npm run world:post-share-monitor
```

Expected markers:

```text
ok post-share monitor ready
ok structured reviewer issue intake current
blocked code contribution PRs
```

This command allows owner-decision issues and structured reviewer feedback issues, but fails on unstructured issues or open pull requests while code contribution acceptance remains blocked.

For the lighter source-package-only preflight, run:

```bash
npm run world:share-preflight
```

This runs:

- `npm run docs:external-links`
- `npm run world:live-status`
- `npm run launch:decision-status`
- `npm run owner:decision-status`
- `npm run owner:open-issues-status`

Expected markers:

```text
ok world share preflight ready
ok external reviewer links reachable
ok live source-package boundary current
ok owner decision issues current
ok owner open issue boundary current
blocked production launch channels
```

This command does not publish a new package version, create a new GitHub release, create new tags, deploy services, enable branch protection, create repository rulesets, accept code contributions, start runtime services, connect to a database, or approve production runtime use.

For the public owner-decision issues only, run:

```bash
npm run owner:decision-status
```

Expected current markers:

```text
ok owner decision status readable
blocked release execution not performed
blocked branch governance implementation approval missing
blocked hosted runtime PRD approval missing
blocked contribution terms PRD approval missing
blocked owner decisions missing approval records
```

This read-only check verifies that issues `#255` through `#258` are readable and that exact approvals are not accidentally inferred from recommended approval text.

For the live open issue boundary only, run:

```bash
npm run owner:open-issues-status
```

Expected current markers:

```text
ok owner open issue boundary readable
ok only owner decision issues open
ok #255 release implementation approval recorded while issue remains open
blocked #256 branch governance implementation approval missing
blocked #257 hosted runtime PRD approval missing
blocked #258 contribution terms PRD approval missing
blocked owner decisions missing approval records
blocked owner decision issues remain open
```

This read-only check verifies that the only open public issues are the tracked owner-decision gates `#255` through `#258`, and distinguishes recorded approval on `#255` from missing approvals on `#256` through `#258`.

For the live repo and live launch channels only, run:

```bash
npm run world:live-status
```

This read-only check verifies:

- live GitHub metadata, topics, visibility, default branch, and Apache-2.0 license,
- live `Package Checks` is green for `origin/main`,
- live GitHub secret scanning and push protection are enabled,
- package metadata and package-lock root metadata stay aligned on `0.1.0`, `Apache-2.0`, and the installed CLI bin,
- npm package is published as `@source-wire/contracts@0.1.0`,
- local tags, remote tags, and GitHub release include `v0.1.0`,
- branch protection and repository ruleset state are visible,
- package version remains `0.1.0`,
- hosted runtime, production runtime use, and code contribution acceptance remain blocked.

Expected markers:

```text
ok live world share status ready
ok source repo sharing ready
ok live public surface green
ok live package lock Apache-2.0
ok npm package published @source-wire/contracts@0.1.0
ok release channels published v0.1.0
blocked production launch channels
blocked branch governance enforcement not approved
```

This command does not publish npm, create a GitHub release, create tags, deploy services, enable branch protection, create repository rulesets, accept code contributions, start runtime services, connect to a database, or approve production runtime use.

To audit first-visitor share wording and unsafe wording guardrails, run:

```bash
npm run share:audit
```

Expected markers:

```text
ok first visitor share audit ready
ok apache 2 reuse ready
blocked production launch channels
```

## What You Can Do Now

Use [Share For Technical Review](share-for-review.md) to send the repo to a technical reviewer or source-package adopter.

Use [World Share Kit](world-share-kit.md) for public-channel copy and unsafe-claim guardrails.

Safe current action:

```text
Please review Source-Wire as an Apache-2.0 licensed source package. It is version 0.1.0, published to npm, released on GitHub, undeployed, and not hosted.
```

## What Must Happen Before Product Launch

Separate future approvals are still required for:

- deployment,
- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- live connectors,
- Mission Control UI,
- real user data examples,
- trusted Memory Record auto-promotion,
- code contribution acceptance.

Read:

- [Owner Launch Checklist](owner-launch-checklist.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [Future License Change Plan](future-license-change-plan.md)

## Bottom Line

Source-Wire can be shared as an Apache-2.0 licensed source package now.

Source-Wire cannot be shared as an npm-published package, GitHub release, hosted memory service, production runtime, or contribution-accepting project until those separate decisions are approved.
