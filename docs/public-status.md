# Source-Wire Public Status

Source-Wire is Apache-2.0 licensed.

It is not published to npm, not released on GitHub, not deployed, and not a hosted runtime.

## Current State

| Area | Status |
| --- | --- |
| Repository visibility | Public source repository |
| Package name | `@source-wire/contracts` |
| Package version | `0.0.0` |
| License | `Apache-2.0` |
| `LICENSE` file | Present |
| Source package reuse | Allowed under Apache-2.0 |
| npm publishing | Blocked |
| GitHub release | Blocked |
| Hosted runtime | Not included |
| MCP server runtime | Not included |
| Database or migrations | Not included |
| Real user data | Not included |
| Trusted memory auto-promotion | Not allowed |
| Code contribution acceptance | Blocked |

## Current Owner-Decision Issues

These public issues track the remaining owner decisions. They do not approve or execute the blocked work.

- [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255)
- [#256 Branch governance path](https://github.com/DanielJD1216/Source-Wire/issues/256)
- [#257 Hosted runtime PRD path](https://github.com/DanielJD1216/Source-Wire/issues/257)
- [#258 Contribution terms before accepting code](https://github.com/DanielJD1216/Source-Wire/issues/258)

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

- an npm package you can install from the registry,
- a GitHub release,
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

The Apache-2.0 license does not mean Source-Wire is published, released, deployed, hosted, production-ready, or accepting code contributions.

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
ok version 0.0.0
ok publishing blocked
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

This means Source-Wire can be shared as an Apache-2.0 licensed source package. It still cannot be described as npm-published, GitHub-released, deployed, hosted, production-ready, or open for code contributions.

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

- npm publishing,
- GitHub release publishing,
- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- Mission Control UI,
- real data examples,
- contribution license terms,
- code contribution acceptance.

Read:

- [Release Decision](release-decision.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [World-Share Readiness](world-share-readiness.md)
- [License Approval Rehearsal](license-approval-rehearsal.md)
- [License Decision Gate](license-decision-gate.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)

## Bottom Line

Source-Wire is ready for technical review and source package reuse under Apache-2.0.

It is not ready for npm publishing, GitHub release publishing, deployment, hosted runtime use, production runtime use, or code contribution acceptance.

For the first-time visitor audit, read [First-Time Visitor Share-Readiness Audit](first-time-visitor-share-readiness-audit.md).
