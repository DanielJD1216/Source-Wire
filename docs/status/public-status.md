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
| Local stdio MCP proposal and search process | Included only in latest source Stories 2 and 3; hosted and production MCP remain excluded |
| Synthetic runtime skeleton | Included on latest `main` only |
| Local Alpha 1 Stories 1 through 3 developer runtime | Included in latest source as an unpublished npm workspace, not in the published package |
| Database or migrations | Three explicit forward-only disposable Alpha 1 migrations are included in latest source; production and non-disposable use remain unapproved |
| Trusted-memory search | Included only as local active-only PostgreSQL full-text proof with audit-before-release receipts |
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

Source-Wire is a public contracts package plus the first unpublished local operating proof for agent-first memory systems.

It currently includes:

- public architecture docs,
- TypeScript contract types,
- JSON schemas,
- synthetic fixtures,
- validation CLI,
- package-readiness checks,
- minimal synthetic in-memory runtime-boundary proof,
- synthetic owner-hosted API policy route and MCP adapter skeleton,
- unpublished npm `apps/alpha1-runtime` workspace for disposable PostgreSQL bootstrap, credential lifecycle, authenticated health, a two-tool stdio MCP surface, pending candidates, owner-controlled approval or rejection, and audited active trusted-memory search,
- issue templates for structured public feedback,
- GitHub-visible support, security, and contribution-boundary files,
- Apache-2.0 licensing for source package reuse.

## What This Repo Is Not Yet

Source-Wire is not yet:

- a hosted memory service,
- a hosted or production API server,
- a hosted or production MCP service,
- a complete database-backed memory engine,
- a connector framework,
- a Mission Control UI,
- a place for real user data,
- a project accepting code contributions.

For the current owner-hosted setup boundary, read [Owner-Hosted Setup Claim Boundary](../internal/owner-hosted-setup-claim-boundary.md).

That historical setup boundary states that Source-Wire is not managed hosting and `Source-Wire-Memory-Engine` remains separate. Alpha 1 Stories 1 through 3 now add a disposable developer-runtime migration chain, stdio MCP proposal and search, candidate, owner-decision, and audited protected-read path. Production runtime and non-disposable database use remain blocked.

The current setup package closeout is recorded in [Owner-Hosted Setup Final Proof](../internal/owner-hosted-setup-final-proof.md), [Owner-Hosted Setup Docs Audit](../internal/owner-hosted-setup-docs-audit.md), and [Owner-Hosted Setup Go/No-Go Gate](../internal/owner-hosted-setup-go-no-go-gate.md).

The post-setup runtime decision is recorded in [Runtime Implementation Decision Gate](../internal/runtime-implementation-decision-gate.md). The first clean public extraction is now a synthetic owner-hosted API policy route and MCP adapter skeleton on latest `main`; production runtime implementation remains blocked and still needs separate owner approval. Read [Runtime Skeleton Implementation Proof](../internal/runtime-skeleton-implementation-proof.md) and [Runtime Skeleton Smoke](../internal/runtime-skeleton-smoke.md).

## Allowed Actions

You may:

- clone the repo,
- inspect and reuse the source package under Apache-2.0,
- run local verification commands,
- inspect public docs, schemas, contracts, fixtures, and examples,
- run local package dry-run checks,
- run synthetic runtime-boundary smokes,
- run synthetic runtime-skeleton smokes,
- run the generated disposable Story 1, Story 2, and Story 3 conformance paths,
- open structured feedback issues using the provided templates.

The Apache-2.0 license alone does not mean Source-Wire is deployed, hosted, production-ready, or accepting code contributions.
The npm package and GitHub release do not mean Source-Wire is deployed, hosted, production-ready, or accepting code contributions.

## Release Snapshot Boundary

Use [Release Snapshot Boundary](release-snapshot-boundary.md) to distinguish the immutable npm package, the immutable `v0.1.0` release snapshot, and latest `main`.

Latest `main` may move ahead with public docs, issue gates, readiness checks, and an unpublished local developer-alpha workspace. That does not mutate the already-published npm package or the already-published `v0.1.0` release snapshot.

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

For a full marker map, read [Publish Readiness](../guides/publish-readiness.md).

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

- [Share For Technical Review](../guides/share-for-review.md)
- [World Share Kit](../internal/world-share-kit.md)
- [Technical Reviewer Guide](../guides/technical-reviewer-guide.md)
- [Reviewer Feedback Guide](../guides/reviewer-feedback-guide.md)
- [Repository Metadata](../reference/repository-metadata.md)

Use the GitHub issue templates for:

- verification failures,
- docs or contract feedback,
- boundary or safety concerns.

Do not include secrets, tokens, private data, local private paths, private screenshots, production exports, account IDs, client names, real source payloads, real chat logs, or real memory records.

## Approvals Required Before Product Launch Channels

Separate owner approvals are still required before any of these happen:

- hosted runtime backend,
- hosted or production MCP service,
- non-disposable or production database setup,
- live connectors,
- Mission Control UI,
- real data examples,
- code contribution acceptance,
- contribution enforcement or maintainer workflow changes.

Read:

- [Release Decision](../internal/release-decision.md)
- [Owner Launch Checklist](../internal/owner-launch-checklist.md)
- [Legal Review Question Packet](../internal/legal-review-question-packet.md)
- [World-Share Readiness](../internal/world-share-readiness.md)
- [License Approval Rehearsal](../internal/license-approval-rehearsal.md)
- [License Decision Gate](../internal/license-decision-gate.md)
- [Apache-2.0 License Implementation Readiness](../internal/apache-2-license-implementation-readiness.md)

## Bottom Line

Source-Wire is ready for technical review, npm package installation, GitHub release review, and source package reuse under Apache-2.0.

It is not ready for deployment, hosted runtime use, production runtime use, or code contribution acceptance.

For the first-time visitor audit, read [First-Time Visitor Share-Readiness Audit](../internal/first-time-visitor-share-readiness-audit.md).
