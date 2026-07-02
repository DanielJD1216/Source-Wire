# Source-Wire Public Status

Source-Wire is Apache-2.0 licensed.

It is published to npm and released on GitHub, but not deployed and not a hosted runtime.

## Current State

| Area | Status |
| --- | --- |
| Repository visibility | Public source repository |
| Package name | `@source-wire/contracts` |
| Package version | `0.1.0` |
| License | `Apache-2.0` |
| `LICENSE` file | Present |
| Source package reuse | Allowed under Apache-2.0 |
| npm package | Published as `@source-wire/contracts@0.1.0` |
| GitHub release | Published as `v0.1.0` |
| Snapshot boundary | npm `@source-wire/contracts@0.1.0` and GitHub release `v0.1.0` are immutable first-release snapshots. Latest `main` may contain post-release documentation and readiness hardening. |
| Known `v0.1.0` artifact issue | The immutable npm `0.1.0` package exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0`. Latest `main` fixes this for a future owner-approved patch release. |
| Hosted runtime | Not included |
| MCP server runtime | Not included |
| Database or migrations | Not included |
| Real user data | Not included |
| Trusted memory auto-promotion | Not allowed |
| Code contribution acceptance | Blocked |

## Current Owner-Decision Status

These public issues track completed release, branch-governance, hosted-runtime PRD, and contribution-terms history. They do not approve or execute blocked work.

- Completed: [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255)
- Completed: [#256 Branch governance path](https://github.com/DanielJD1216/Source-Wire/issues/256)
- Completed: [#257 Hosted runtime PRD path](https://github.com/DanielJD1216/Source-Wire/issues/257)
- Completed: [#258 Contribution terms before accepting code](https://github.com/DanielJD1216/Source-Wire/issues/258)

## What This Repo Is Today

Source-Wire is a public contract package skeleton for agent-first memory systems.

It currently includes:

- public architecture docs,
- TypeScript contract types,
- JSON schemas,
- synthetic fixtures,
- validation CLI,
- package-readiness checks,
- minimal synthetic in-memory runtime-boundary proof,
- issue templates for structured public feedback,
- GitHub-visible support, security, and contribution-boundary files,
- Apache-2.0 licensing for source package reuse.

## What This Repo Is Not Yet

Source-Wire is not yet:

- a hosted memory service,
- an API server,
- an MCP server runtime,
- a database-backed memory engine,
- a connector framework,
- a Mission Control UI,
- a place for real user data,
- a project accepting code contributions.

## Allowed Actions

You may:

- clone the repo,
- inspect and reuse the source package under Apache-2.0,
- run local verification commands,
- inspect public docs, schemas, contracts, fixtures, and examples,
- run local package dry-run checks,
- run synthetic runtime-boundary smokes,
- open structured feedback issues using the provided templates.

The Apache-2.0 license alone does not mean Source-Wire is deployed, hosted, production-ready, or accepting code contributions.
The npm package and GitHub release do not mean Source-Wire is deployed, hosted, production-ready, or accepting code contributions.

## Release Snapshot Boundary

Use [Release Snapshot Boundary](release-snapshot-boundary.md) to distinguish the immutable npm package, the immutable `v0.1.0` release snapshot, and latest `main`.

Latest `main` may move ahead with public docs, issue gates, and readiness checks. That does not mutate the already-published npm package or the already-published `v0.1.0` release snapshot.

Known `v0.1.0` artifact issue: the published npm package exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0` even though the package metadata is `0.1.0`. Latest `main` corrects the source export and adds a consumer-smoke guard. The npm artifact remains immutable, so correcting the public registry artifact requires a future owner-approved patch release.

Until a future owner-approved release implementation unit exists, publishing a new package version, creating a new release, creating a new tag, deploying services, starting hosted runtime behavior, and accepting code contributions remain blocked.

## Main Verification Command

Use Node.js 22 with npm.

```bash
npm install
npm run publish:readiness
```

Despite the command name, this does not publish npm.

Expected boundary markers include:

```text
ok release gate
ok license Apache-2.0
ok package lock Apache-2.0
ok version 0.1.0
ok npm public access ready
```

For a full marker map, read [Publish Readiness](publish-readiness.md).

To audit the first-visitor share boundary directly, run:

```bash
npm run share:audit
```

Expected markers:

```text
ok first visitor share audit ready
ok apache 2 reuse ready
blocked production launch channels
```

## World-Share Readiness

To verify the current sharing boundary directly, run:

```bash
npm run world:readiness
```

Expected markers:

```text
ok world share open source ready
blocked production launch channels
```

This means Source-Wire can be shared as an Apache-2.0 licensed source package. It can now be described as npm-published and GitHub-released, but not deployed, hosted, production-ready, or open for code contributions.

## How To Give Feedback

Start with:

- [Share For Technical Review](share-for-review.md)
- [World Share Kit](world-share-kit.md)
- [Technical Reviewer Guide](technical-reviewer-guide.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [Repository Metadata](repository-metadata.md)

Use the GitHub issue templates for:

- verification failures,
- docs or contract feedback,
- boundary or safety concerns.

Do not include secrets, tokens, private data, local private paths, private screenshots, production exports, account IDs, client names, real source payloads, real chat logs, or real memory records.

## Approvals Required Before Product Launch Channels

Separate owner approvals are still required before any of these happen:

- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- Mission Control UI,
- real data examples,
- code contribution acceptance,
- contribution enforcement or maintainer workflow changes.

Read:

- [Release Decision](release-decision.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [World-Share Readiness](world-share-readiness.md)
- [License Approval Rehearsal](license-approval-rehearsal.md)
- [License Decision Gate](license-decision-gate.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)

## Bottom Line

Source-Wire is ready for technical review, npm package installation, GitHub release review, and source package reuse under Apache-2.0.

It is not ready for deployment, hosted runtime use, production runtime use, or code contribution acceptance.

For the first-time visitor audit, read [First-Time Visitor Share-Readiness Audit](first-time-visitor-share-readiness-audit.md).
