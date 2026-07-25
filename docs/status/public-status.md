# Source-Wire Public Status

Source-Wire is Apache-2.0 licensed.

It is published to npm and released on GitHub, but not deployed and not a hosted runtime.

## Current State

| Area | Status |
| --- | --- |
| Repository visibility | Public source repository |
| Package name | `@source-wire/contracts` |
| Current package version | `0.2.0` |
| License | `Apache-2.0` |
| `LICENSE` file | Present |
| Source package reuse | Allowed under Apache-2.0 |
| npm package | Published as `@source-wire/contracts@0.2.0` |
| GitHub release | Published as `v0.2.0` |
| Snapshot boundary | npm contracts versions `0.1.0` and `0.2.0`, deprecated local-runtime version `0.1.0-alpha.1`, reviewed local-runtime version `0.1.0-alpha.2`, plus GitHub releases `v0.1.0` and `v0.2.0`, are immutable snapshots. No local-runtime Git tag or GitHub release exists. |
| Known `v0.1.0` artifact issue | The immutable npm `0.1.0` package exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0`. Version `0.2.0` exports the corrected package version. |
| Hosted runtime | Not included |
| Local stdio MCP proposal and search process | Included only in latest source, established by Stories 2 and 3 and preserved by Story 4; hosted and production MCP remain excluded |
| Synthetic runtime skeleton | Included on latest `main` only |
| Local Alpha 1 Stories 1 through 5 developer runtime | Included in latest source and published local-runtime `0.1.0-alpha.2`, not in the contracts package |
| Local Story 6.1 CLI tracer | Included in latest source and published Alpha 2 for non-secret config creation and offline validation; hosting and production use are not included |
| Local Story 6.2 memory-only runner | Included in latest source and published Alpha 2 as a loopback API plus exactly two memory tools over stdio; verified only with generated disposable PostgreSQL state |
| Local Story 6.3 synthetic provider runner | Included in latest source for offline metadata checking, explicit connected readiness, immutable startup composition, and four-tool stdio proof with repository synthetic providers only |
| Local Story 6.4 fail-closed runner | Included in latest source for stable redacted failure results, child-crash teardown, API-independent process-credential invalidation, protocol separation, and disposable cleanup proof |
| Local Story 6.5 database control plane | Included in latest source for read-only runtime-role status, safe current and target migration planning, explicit apply, exact migrator posture, rollback, idempotency, and disposable cleanup proof |
| Local Story 6.6 owner-controlled export | Included in latest source for explicit namespace selection, exact owner authority, canonical bounded local output, default no-overwrite, interruption cleanup, and zero upload |
| Local Story 6.7 evidence-first compatibility | Included in latest source as synthetic cross-repository proof against a pinned private adapter that depends exactly on published `@source-wire/contracts@0.2.0`; no live connector or real evidence is included |
| Local Story 6.8 package release | Public `@source-wire/local-runtime@0.1.0-alpha.1` was published and is now deprecated with a security warning |
| Local Story 6.9 security Alpha | `0.1.0-alpha.2` is published to npm with pre-invocation owner and namespace binding, hard provider deadlines, cooperative abort, and unified protected search and exact-fetch handoff |
| Local-runtime registry tags | `alpha` resolves to reviewed `0.1.0-alpha.2`; npm's `latest` tag remains on deprecated `0.1.0-alpha.1`. Install exact `0.1.0-alpha.2`; do not use an unqualified install. |
| Database or migrations | Six explicit forward-only disposable Alpha 1 migrations are included in latest source; production and non-disposable use remain unapproved |
| Trusted-memory search | Included only as local active-only PostgreSQL full-text proof with audit-before-release receipts |
| Trusted-memory correction and revocation | Included only as owner-controlled, fix-forward local Story 4 proof |
| Export and recovery | Included only as bounded canonical export, fresh portable initialization, and isolated physical-recovery proof; not production backup tooling |
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

Source-Wire is a public contracts package plus the first local operating proof
for agent-first memory systems. The first local-runtime npm Alpha is
deprecated. The corrected `0.1.0-alpha.2` Alpha is published under the npm
`alpha` tag.

It currently includes:

- public architecture docs,
- TypeScript contract types,
- JSON schemas,
- synthetic fixtures,
- validation CLI,
- package-readiness checks,
- minimal synthetic in-memory runtime-boundary proof,
- synthetic owner-hosted API policy route and MCP adapter skeleton,
- published `@source-wire/local-runtime@0.1.0-alpha.2` and matching latest-source `apps/alpha1-runtime` workspace for disposable PostgreSQL bootstrap, credential lifecycle, authenticated health, a four-tool stdio MCP surface, pending candidates, owner-controlled approval or rejection, audited active trusted-memory search, owner correction and revocation, canonical export, fresh portable initialization, isolated physical recovery, and protected synthetic source-evidence reads,
- `source-wire-local` Story 6.1 tracer for owner-only non-secret configuration and dependency-free offline diagnostics,
- Story 6.2 one-command memory-only composition with migration inspection, loopback API policy, process-scoped credentials, and exactly two stdio MCP tools,
- Story 6.3 zero-or-one synthetic provider composition with offline and connected checks, exactly four stdio MCP tools, protected evidence reads, zero memory promotion, and restart-only replacement,
- Story 6.4 fail-closed startup, migration, provider, API, MCP, database, signal, protocol, credential-revocation, and cleanup behavior,
- Story 6.5 read-only database status and explicit apply-gated migration control with separate runtime and migrator authority,
- Story 6.6 exact-owner canonical local export with explicit namespaces, default no-overwrite, atomic owner-only files, and no upload,
- Story 6.7 cross-repository synthetic compatibility proof through the same provider-neutral CLI, API policy, audit, receipt, stdio MCP, and official-client path,
- deprecated public npm Alpha Story 6.8 snapshot and published Story 6.9 security Alpha with curated exports, package-content checks, exact advisory disposition, and clean installed-consumer proof,
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

That historical setup boundary states that Source-Wire is not managed hosting and `Source-Wire-Memory-Engine` remains separate. Alpha 1 Stories 1 through 5 add a disposable developer-runtime migration chain, stdio MCP proposal, memory search, evidence search and fetch, candidate, owner-decision, audited protected reads, owner correction and revocation, canonical export, fresh portable initialization, and isolated physical recovery. Story 6.1 adds non-secret config initialization and offline diagnostics. Story 6.2 composes the memory-only loopback API and two-tool stdio MCP path through one private local command. Story 6.3 uses the same command to compose one owner-selected repository synthetic provider into the four-tool protected-read path. Story 6.4 makes invalid startup, migration mismatch, provider mismatch, database outage, child crash, response interruption, process credential invalidation, and shutdown cleanup fail closed. Story 6.5 adds explicit read-only database status and exact apply-gated migrator control. Story 6.6 adds exact-owner canonical local export without adding an MCP administration tool or upload. Story 6.7 proves the separate evidence-first synthetic adapter against the same provider-neutral path while importing no private authority across repositories. Production runtime, managed database provisioning, external or live providers, production backup guarantees, and non-disposable database use remain blocked.

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
- run the generated disposable Story 1 through Story 5 conformance paths,
- inspect the deprecated `0.1.0-alpha.1` snapshot, but do not install or use it,
- run the Story 6.1 local config and offline-doctor tests,
- run the Story 6.2 memory-only launcher through the Story 2 disposable conformance path,
- run the Story 6.3 synthetic provider launcher through both Story 5 disposable conformance paths,
- run the Story 6.4 fail-closed matrix through both 27-case Story 5 adapter paths,
- run the Story 6.5 database control plane through the 42-case Story 1 disposable conformance path,
- run the Story 6.6 owner-controlled export through the 25-case Story 4 disposable conformance path,
- run the Story 6.7 evidence-first package smoke and 29-case cross-repository disposable conformance path,
- install exact `@source-wire/local-runtime@0.1.0-alpha.2` for supported local synthetic or disposable evaluation,
- open structured feedback issues using the provided templates.

The Apache-2.0 license alone does not mean Source-Wire is deployed, hosted, production-ready, or accepting code contributions.
The npm package and GitHub release do not mean Source-Wire is deployed, hosted, production-ready, or accepting code contributions.

## Release Snapshot Boundary

Use [Release Snapshot Boundary](release-snapshot-boundary.md) to distinguish the immutable npm and GitHub release snapshots from latest `main`.

Latest `main` may move ahead with public docs, issue gates, readiness checks,
and the local developer-alpha workspace. That does not mutate
already-published npm packages or GitHub release snapshots.

Known `v0.1.0` artifact issue: that npm package exports
`SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0` even though its package metadata is
`0.1.0`. Version `0.2.0` exports `0.2.0` and preserves the consumer-smoke guard.

Contracts version `0.2.0` is published and released. The exact
`@source-wire/local-runtime@0.1.0-alpha.1` npm Alpha is published but
deprecated. Reviewed `@source-wire/local-runtime@0.1.0-alpha.2` is published
under the `alpha` tag. npm's `latest` tag remains on the deprecated Alpha 1, so
consumers must install exact Alpha 2. Any future version requires new exact
approval after review and hosted verification.
Git tags, GitHub releases, deployment, hosted runtime behavior, production use,
live providers, real data, and code contribution acceptance remain blocked.

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
