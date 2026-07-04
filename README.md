# Source-Wire

[![Package Checks](https://github.com/DanielJD1216/Source-Wire/actions/workflows/package-checks.yml/badge.svg)](https://github.com/DanielJD1216/Source-Wire/actions/workflows/package-checks.yml)

Source-Wire is an agent-first memory architecture skeleton.

It is designed for systems where AI agents need to search, cite, update, and reason over source-backed context without turning every imported note or chat message into trusted memory automatically.

Current public status: Source-Wire is Apache-2.0 licensed as a source package. It is published to npm, released on GitHub, undeployed, and not a hosted runtime. Read [Public Status](docs/public-status.md) before deployment, hosted-runtime, production-use, or contribution assumptions.

Product direction: Source-Wire is intended to become a public BYO, owner-hosted memory system that adopters can run with their own device/server, PostgreSQL-compatible database, API keys, data sources, and MCP-capable agent harnesses. The current repo is the contracts-first public package, not that full runtime yet. Read [Product Direction](docs/product-direction.md).

Memory-engine baseline path: `Source-Wire-Memory-Engine` is an AGPLv3 reference runtime candidate. It stays separate while Source-Wire audits the boundary, license path, and owner-hosted setup path. Read [Memory Engine Baseline Audit PRD](docs/memory-engine-baseline-audit-prd.md).

Owner-hosted setup path: the next public planning lane is a synthetic-only owner-hosted setup package for adopters who bring their own device/server, PostgreSQL-compatible database, credentials, source packets, and MCP-capable harnesses. Read [Owner-Hosted Setup PRD](docs/owner-hosted-setup-prd.md) and [Owner-Hosted Setup Issue Slices](docs/owner-hosted-setup-issue-slices.md). This does not approve API server runtime, MCP server runtime, database migrations, managed hosting, deployment, npm publishing, GitHub release creation, real data, AGPLv3 code copying, or private implementation code copying.

Owner-hosted setup contract: Source-Wire now exports a synthetic owner-brings checklist contract for future BYO setup work. Read [Owner-Hosted Setup Contract](docs/contracts/owner-hosted-setup-contract.md). It does not start a runtime, connect a database, deploy services, import private data, or create trusted memory.

Owner-hosted setup readiness: Source-Wire also includes a synthetic readiness fixture matrix for database, API, MCP, source update safety, and Mission Control setup health. Read [Owner-Hosted Setup Readiness Fixture Matrix](docs/owner-hosted-setup-readiness-fixture-matrix.md). It does not run real setup checks yet.

Owner-hosted setup smoke: `npm run owner-hosted-setup:readiness-smoke` checks that synthetic setup readiness cases are complete and blocked cases include shaped failure records. Read [Owner-Hosted Setup Readiness Smoke](docs/owner-hosted-setup-readiness-smoke.md). It does not require secrets or external services.

Source update safety smoke: `npm run owner-hosted-setup:source-update-safety-smoke` proves the synthetic update path requires caller-supplied snapshots, blocks folder crawling and broad private import, keeps trusted memory delta `0`, and preserves owner or application-controlled review. Read [Owner-Hosted Setup Source Update Safety Smoke](docs/owner-hosted-setup-source-update-safety-smoke.md).

Daily workflow synthetic path: Source-Wire now exports a synthetic daily owner memory workflow contract and fixture matrix. `npm run daily-workflow:smoke` proves read-only asks, bounded updates, owner review, follow-up evidence separation, Mission Control summary shape, no runtime inclusion, no folder crawling, no MCP approval bypass, and no automatic trusted memory promotion. Read [Daily Workflow Contract](docs/contracts/daily-workflow-contract.md), [Daily Workflow Synthetic Smoke](docs/daily-workflow-synthetic-smoke.md), and [Daily Workflow Claim Boundary](docs/daily-workflow-claim-boundary.md).

Runtime readiness gate: Source-Wire now exports a synthetic runtime-readiness contract and fixture matrix. `npm run runtime-readiness:smoke` proves private-proof, API policy, MCP policy, database posture, source update, memory-engine boundary, and release boundary gates while keeping API runtime, MCP runtime, database migrations, deployment, managed hosting, real data, AGPLv3 code copying, private implementation copying, and automatic trusted memory promotion blocked. Read [Runtime Readiness Contract](docs/contracts/runtime-readiness-contract.md), [Runtime Readiness Fixture Matrix](docs/runtime-readiness-fixture-matrix.md), and [Runtime Readiness Smoke](docs/runtime-readiness-smoke.md).

Runtime proof intake gate: Source-Wire now includes a synthetic redacted private-proof intake manifest. `npm run runtime-proof-intake:smoke` proves private proof metadata can be acknowledged for PRD refresh without importing private repo paths, raw private content, real data, secrets, AGPLv3 code, private implementation code, runtime implementation, database migrations, or deployment. Read [Runtime Proof Intake Contract](docs/contracts/runtime-proof-intake-contract.md) and [Runtime Proof Intake](docs/runtime-proof-intake.md).

Owner-hosted setup claim boundary: latest `main` documents a BYO setup direction, not managed hosting or production runtime. Database migrations remain blocked, and `Source-Wire-Memory-Engine` stays separate. Read [Owner-Hosted Setup Claim Boundary](docs/owner-hosted-setup-claim-boundary.md).

Owner-hosted setup closeout: the setup package is complete as a synthetic proof. Source-Wire now includes a narrow synthetic owner-hosted API policy route, MCP adapter skeleton, synthetic threat-boundary package, synthetic API policy contract package, and synthetic MCP adapter contract package, but production runtime implementation remains blocked unless separately approved. Read [Owner-Hosted Setup Final Proof](docs/owner-hosted-setup-final-proof.md), [Owner-Hosted Setup Go/No-Go Gate](docs/owner-hosted-setup-go-no-go-gate.md), [Runtime Skeleton Implementation Proof](docs/runtime-skeleton-implementation-proof.md), [Runtime Skeleton Smoke](docs/runtime-skeleton-smoke.md), [Runtime Threat Boundary Implementation Proof](docs/runtime-threat-boundary-implementation-proof.md), [Runtime Threat Boundary Smoke](docs/runtime-threat-boundary-smoke.md), [API Policy Contract Implementation Proof](docs/api-policy-contract-implementation-proof.md), [API Policy Contract Smoke](docs/api-policy-contract-smoke.md), [MCP Adapter Contract Implementation Proof](docs/mcp-adapter-contract-implementation-proof.md), and [MCP Adapter Contract Smoke](docs/mcp-adapter-contract-smoke.md).

Next runtime gate: the next recommended approval paths are database posture, public-safe fixture, and deployment-boundary implementation packets, not API runtime, MCP runtime, route handlers, migrations, real database connections, live runtime services, deployment config, or hosted services. Threat-model, API contract, and MCP contract implementations already exist as synthetic packages. Read [MCP Contract Implementation Packet](docs/mcp-contract-implementation-packet.md), [MCP Contract Implementation Slices](docs/mcp-contract-implementation-slices.md), [Database Posture Implementation Packet](docs/database-posture-implementation-packet.md), [Database Posture Implementation Slices](docs/database-posture-implementation-slices.md), [Public-Safe Fixture Implementation Packet](docs/public-safe-fixture-implementation-packet.md), [Public-Safe Fixture Implementation Slices](docs/public-safe-fixture-implementation-slices.md), [Deployment Boundary Implementation Packet](docs/deployment-boundary-implementation-packet.md), and [Deployment Boundary Implementation Slices](docs/deployment-boundary-implementation-slices.md).

Threat model implementation: `npm run runtime:threat-boundary-smoke` validates the approved synthetic trust-boundary package for unauthorized callers, cross-namespace access, source-memory separation, prompt injection, secrets, audit gaps, backup restore drift, deployment exposure, MCP bypass prevention, and owner/application-controlled trusted memory approval. It does not add a server, database, deployment, connector, real data, private code, AGPLv3 code, or automatic trusted memory promotion.

API contract implementation: `npm run runtime:api-policy-smoke` validates the approved synthetic API policy contract package for request envelopes, endpoint groups, capability checks, namespace resolution, denied results, citations and gaps, audit metadata, source maintenance, candidate review, trusted-memory approval boundaries, handoff/status evidence, and MCP-through-API policy routing. It does not add an API server, route handlers, MCP server runtime, database, deployment, connector, real data, private code, AGPLv3 code, or automatic trusted memory promotion.

MCP contract implementation: `npm run runtime:mcp-adapter-smoke` validates the approved synthetic MCP adapter contract package for tool declarations, input validation, MCP-to-API envelopes, capability mapping, namespace forwarding, denied results, citations and gaps, audit metadata, source evidence search, trusted memory search, context assembly, candidate review, source maintenance, handoff/status evidence, and trusted-memory approval boundaries. It does not add an MCP server runtime, API server, route handlers, database, deployment, connector, real data, private code, AGPLv3 code, or automatic trusted memory promotion.

Runtime implementation decision: after setup closeout, the next public runtime decision is no-go for runtime code from setup alone. The recommended path is private owner runtime proof first, then clean Apache-2.0 public extraction later. Read [Runtime Implementation Decision Gate](docs/runtime-implementation-decision-gate.md).

Share for review: use [Share For Technical Review](docs/share-for-review.md) for safe invite copy, first commands, feedback routing, and review-only boundaries.

Public share kit: use [World Share Kit](docs/world-share-kit.md) for YouTube, Substack, social, Discord, and direct-review copy that preserves release, runtime, data, and contribution boundaries.

World share packet: use [World Share Packet](docs/world-share-packet.md) or `npm run world:share-packet` for the exact safe copy, first reviewer commands, owner preflight, feedback route, and blocked launch channels in one place.

Operator summary: use [World Share Operator Summary](docs/world-share-operator-summary.md) or `npm run world:share-operator-summary` for the short current-state answer before deciding what to share or approve next.

Post-share monitor: after public sharing, use [World Share Post-Share Monitor](docs/world-share-post-share-monitor.md) or `npm run world:post-share-monitor` to verify open reviewer feedback stays structured while pull requests remain blocked.

Share-readiness audit: Source-Wire is ready for technical review, npm package installation, GitHub release review, and source package reuse under Apache-2.0, but not deployment, hosted runtime use, production runtime use, or code contribution acceptance. Read the [First-Time Visitor Share-Readiness Audit](docs/first-time-visitor-share-readiness-audit.md).

Snapshot boundary: npm `@source-wire/contracts@0.1.0` and GitHub release `v0.1.0` are immutable first-release snapshots. Latest `main` may contain post-release documentation and readiness hardening. Read [Release Snapshot Boundary](docs/release-snapshot-boundary.md).

Known `v0.1.0` package issue: the immutable npm artifact exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0` even though package metadata is `0.1.0`. Latest `main` fixes this source export and adds a consumer-smoke guard. Correcting the registry artifact requires a future owner-approved patch release.

Current owner-decision status:

- Completed: [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255)
- Completed: [#256 Branch governance path](https://github.com/DanielJD1216/Source-Wire/issues/256)
- Completed: [#257 Hosted runtime PRD path](https://github.com/DanielJD1216/Source-Wire/issues/257)
- Completed: [#258 Contribution terms before accepting code](https://github.com/DanielJD1216/Source-Wire/issues/258)

## First Reviewer Quickstart

Use Node.js 22 with npm. For complete setup details, read [Quickstart](docs/quickstart.md).

```bash
git clone https://github.com/DanielJD1216/Source-Wire.git
cd Source-Wire
npm install
npm run readiness:report
```

To prove the same first-reviewer path from a temporary clean checkout-style copy:

```bash
npm run reviewer:smoke
```

For the full local verification gate:

```bash
npm run publish:readiness
```

Despite the command name, `publish:readiness` is now a local readiness and boundary gate. It does not publish a new package version.

Use [World Share Packet](docs/world-share-packet.md), [Share For Technical Review](docs/share-for-review.md), and [Reviewer Feedback Guide](docs/reviewer-feedback-guide.md) when sharing the repo or sending feedback.

## Still Blocked

- repository ruleset governance,
- hosted runtime,
- production runtime use,
- code contribution acceptance.

## What This Public Skeleton Includes

- Source Graph Adapter Contract.
- Source Connection Contract.
- `second-brain.v1` response contract.
- MCP tool behavior contract.
- Owner-hosted setup checklist contract.
- Daily workflow synthetic contract and fixture matrix.
- Runtime readiness synthetic contract and fixture matrix.
- Runtime proof intake synthetic contract and redacted manifest.
- Synthetic fixtures for notes, chat exports, project context, and `/2nd-brain` examples.
- Threat model implementation approval packet and slice map.
- Synthetic threat-boundary package and fixture matrix.
- API contract implementation approval packet and slice map.
- Synthetic API policy contract package and fixture matrix.
- Database posture implementation approval packet and slice map.
- A public extraction checklist for future safety reviews.
- A lightweight TypeScript package boundary.
- A minimal synthetic in-memory runtime boundary for owner-hosted API plus MCP policy proof.
- A narrow synthetic owner-hosted API policy route and MCP adapter skeleton that keeps MCP behind Source-Wire API policy.
- A synthetic trust-boundary evaluator that keeps source evidence separate from trusted memory and requires owner or application-controlled approval for trusted memory creation.

## What Is Intentionally Not Included Yet

- Hosted runtime backend code.
- Database migrations or database connection code.
- Mission Control UI.
- Real user data.
- Real Memory Records or Sources.
- Private proof history.
- Screenshots.
- Database values or migrations.
- Memory-engine fork code.
- Live connectors.
- Tokens, local paths, domains, emails, account IDs, client names, or private project history.

## Documentation

- [Docs Index](docs/index.md)
- [Product Direction](docs/product-direction.md)
- [Memory Engine Baseline Audit PRD](docs/memory-engine-baseline-audit-prd.md)
- [Memory Engine Baseline Audit Issue Slices](docs/memory-engine-baseline-audit-issue-slices.md)
- [Memory Engine Baseline Audit Issue Drafts](docs/issues/memory-engine-baseline-audit/README.md)
- [Owner-Hosted Setup PRD](docs/owner-hosted-setup-prd.md)
- [Owner-Hosted Setup Issue Slices](docs/owner-hosted-setup-issue-slices.md)
- [Owner-Hosted Setup Contract](docs/contracts/owner-hosted-setup-contract.md)
- [Owner-Hosted Setup Readiness Fixture Matrix](docs/owner-hosted-setup-readiness-fixture-matrix.md)
- [Owner-Hosted Setup Readiness Smoke](docs/owner-hosted-setup-readiness-smoke.md)
- [Owner-Hosted Setup Source Update Safety Smoke](docs/owner-hosted-setup-source-update-safety-smoke.md)
- [Daily Workflow Contract](docs/contracts/daily-workflow-contract.md)
- [Daily Workflow Synthetic Smoke](docs/daily-workflow-synthetic-smoke.md)
- [Daily Workflow Claim Boundary](docs/daily-workflow-claim-boundary.md)
- [Runtime Readiness Contract](docs/contracts/runtime-readiness-contract.md)
- [Runtime Readiness Fixture Matrix](docs/runtime-readiness-fixture-matrix.md)
- [Runtime Readiness Smoke](docs/runtime-readiness-smoke.md)
- [Runtime Readiness Implementation Proof](docs/runtime-readiness-implementation-proof.md)
- [Runtime Proof Intake Contract](docs/contracts/runtime-proof-intake-contract.md)
- [Runtime Proof Intake](docs/runtime-proof-intake.md)
- [Hosted Runtime PRD Proof Intake Gate Refresh](docs/hosted-runtime-prd-proof-intake-gate-refresh.md)
- [Hosted Runtime Child Issue Proof Intake Gate Refresh](docs/hosted-runtime-child-issue-proof-intake-gate-refresh.md)
- [Hosted Runtime Child Issue Publisher Write Gate Refresh](docs/hosted-runtime-child-issue-publisher-write-gate-refresh.md)
- [Owner-Hosted Setup Claim Boundary](docs/owner-hosted-setup-claim-boundary.md)
- [Owner-Hosted Setup Final Proof](docs/owner-hosted-setup-final-proof.md)
- [Owner-Hosted Setup Docs Audit](docs/owner-hosted-setup-docs-audit.md)
- [Owner-Hosted Setup Go/No-Go Gate](docs/owner-hosted-setup-go-no-go-gate.md)
- [Runtime Implementation Decision Gate](docs/runtime-implementation-decision-gate.md)
- [Runtime Implementation Decision Proof](docs/runtime-implementation-decision-proof.md)
- [Runtime Threat Boundary Implementation Proof](docs/runtime-threat-boundary-implementation-proof.md)
- [Runtime Threat Boundary Smoke](docs/runtime-threat-boundary-smoke.md)
- [API Policy Contract Implementation Proof](docs/api-policy-contract-implementation-proof.md)
- [API Policy Contract Smoke](docs/api-policy-contract-smoke.md)
- [Owner-Hosted Setup Issue Drafts](docs/issues/owner-hosted-setup/README.md)
- [Public Status](docs/public-status.md)
- [World Share Kit](docs/world-share-kit.md)
- [World Share Packet](docs/world-share-packet.md)
- [World Share Operator Summary](docs/world-share-operator-summary.md)
- [World Share Post-Share Monitor](docs/world-share-post-share-monitor.md)
- [Share For Technical Review](docs/share-for-review.md)
- [First-Time Visitor Share-Readiness Audit](docs/first-time-visitor-share-readiness-audit.md)
- [Repository Metadata](docs/repository-metadata.md)
- [Technical Reviewer Guide](docs/technical-reviewer-guide.md)
- [Reviewer Feedback Guide](docs/reviewer-feedback-guide.md)
- [Contributing Boundary](CONTRIBUTING.md)
- [Support Boundary](SUPPORT.md)
- [Security Policy](SECURITY.md)
- [Public Adopter Walkthrough](docs/adopter-walkthrough.md)
- [Architecture Map](docs/architecture-map.md)
- [Quickstart](docs/quickstart.md)
- [API Reference](docs/api-reference.md)
- [TypeScript Examples](examples/typescript/README.md)
- [Minimal Runtime TypeScript Example](examples/typescript/minimal-runtime.ts)
- [Runtime Implementation Gate](docs/runtime-implementation-gate.md)
- [Runtime Boundary Readiness](docs/runtime-boundary-readiness.md)
- [Minimal Synthetic Runtime Boundary](examples/minimal-runtime/)
- [Synthetic Runtime Boundary Example](examples/runtime-boundary/)

## Contracts

- [Owner-Hosted Setup Contract](docs/contracts/owner-hosted-setup-contract.md)
- [Daily Workflow Contract](docs/contracts/daily-workflow-contract.md)
- [Runtime Readiness Contract](docs/contracts/runtime-readiness-contract.md)
- [Runtime Proof Intake Contract](docs/contracts/runtime-proof-intake-contract.md)
- [Source Graph Adapter Contract](docs/contracts/source-graph-adapter-contract.md)
- [Source Connection Contract](docs/contracts/source-connection-contract.md)
- [`second-brain.v1` Contract](docs/contracts/second-brain-v1-contract.md)
- [MCP Tool Behavior Contract](docs/contracts/mcp-tool-behavior-contract.md)
- [Runtime Boundary](docs/runtime-boundary.md)
- [Runtime Implementation Gate](docs/runtime-implementation-gate.md)

## Decision Prototypes

- [Runtime-Adjacent Options Decision Matrix](docs/decision-prototypes/runtime-adjacent-options.md)
- [Runtime-Adjacent Evidence And Scoring](docs/decision-prototypes/runtime-adjacent-evidence.md)
- [Runtime-Adjacent Recommendation](docs/decision-prototypes/runtime-adjacent-recommendation.md)
- [License Options Decision Matrix](docs/decision-prototypes/license-options.md)
- [License Evidence And Scoring](docs/decision-prototypes/license-evidence.md)
- [License Recommendation](docs/decision-prototypes/license-recommendation.md)

## Package Boundary

This repo is currently a contract package skeleton with a minimal synthetic runtime boundary.

It can define public shapes, validate public fixtures, and execute synthetic in-memory policy proof cases. It does not run a memory backend, database, MCP server, Mission Control UI, memory-engine integration, or live connector.

- [Architecture Map](docs/architecture-map.md)
- [API Reference](docs/api-reference.md)
- [TypeScript Examples](examples/typescript/README.md)

## Schema Exports

Source-Wire exposes its current JSON schemas through stable package subpaths and a typed schema registry.

- [Schema Exports](docs/schema-exports.md)

## Validation CLI

Source-Wire includes a tiny local CLI for validating explicit files against explicit schema names.

- [Validation CLI](docs/validation-cli.md)

## CI Checks

Source-Wire runs package checks and public-safety scanning on push and pull request.

- [CI Checks](docs/ci-checks.md)
- [Repository Metadata](docs/repository-metadata.md)

The CI docs include a stable log marker map for reading GitHub Actions Package Checks output.

## Publish Readiness

Source-Wire can run a full local readiness gate with package dry-run, installed package smokes, runtime-boundary smokes, docs links, command-doc setup checks, and public-safety checks. The public package is `@source-wire/contracts@0.1.0`, and the first GitHub release is `v0.1.0`.

- [Publish Readiness](docs/publish-readiness.md)
- [World-Share Readiness](docs/world-share-readiness.md)
- [World Share Packet](docs/world-share-packet.md)
- [World Share Operator Summary](docs/world-share-operator-summary.md)
- [World Share Post-Share Monitor](docs/world-share-post-share-monitor.md)
- [Owner Launch Checklist](docs/owner-launch-checklist.md)
- [Release Implementation Runbook](docs/release-implementation-runbook.md)
- [Release Review Packet](docs/release-review-packet.md)
- [Release Approval Request Packet](docs/release-approval-request-packet.md)
- [Owner Approval Record Packet](docs/owner-approval-record-packet.md)
- [Release Candidate Readiness](docs/release-candidate-readiness.md)
- [Release Snapshot Boundary](docs/release-snapshot-boundary.md)
- [Hosted Runtime PRD](docs/hosted-runtime-prd.md)
- [Hosted Runtime PRD Slice Map](docs/hosted-runtime-issue-slices.md)
- [Hosted Runtime Slice Approval Request](docs/hosted-runtime-slice-approval-request.md)
- [Hosted Runtime Child Issue Publication Packet](docs/hosted-runtime-child-issue-publication-packet.md)
- [Hosted Runtime PRD Preparation](docs/hosted-runtime-prd-preparation.md)
- [Contribution Terms PRD Preparation](docs/contribution-terms-prd-preparation.md)
- [Contribution Terms PRD](docs/contribution-terms-prd.md)
- [Contribution Policy](docs/contribution-policy.md)
- [Legal Review Question Packet](docs/legal-review-question-packet.md)
- [License Approval Rehearsal](docs/license-approval-rehearsal.md)
- [License Decision Gate](docs/license-decision-gate.md)
- [Apache-2.0 License Implementation Readiness](docs/apache-2-license-implementation-readiness.md)
- [Release Decision](docs/release-decision.md)
- [License And Version Policy](docs/license-version-policy.md)
- [Owner License Approval Packet](docs/owner-license-approval-packet.md)
- [Future License Change Plan](docs/future-license-change-plan.md)

The publish-readiness docs include a local success marker map for `npm run publish:readiness`.

Run the license implementation check before any future package version, hosted runtime, or contribution work:

```bash
npm run license:rehearsal
```

It verifies the current Apache-2.0 license implementation and confirms deployment, hosted runtime, production runtime use, and code contribution acceptance remain blocked.

## Fixtures

All fixtures are fictional and synthetic.

- [Markdown vault fixture](examples/fixtures/markdown-vault/)
- [Chat export fixture](examples/fixtures/chat-export/agent-session.jsonl)
- [Project context pack fixture](examples/fixtures/project-context-pack/project-context.json)
- [`/2nd-brain` example fixture](examples/fixtures/second-brain/use-2nd-brain-example.json)
- [Owner-hosted API plus MCP boundary fixture](examples/fixtures/owner-hosted-api-mcp-boundary/)
- [Runtime readiness fixture](examples/fixtures/runtime-readiness/)
- [Runtime skeleton fixture](examples/fixtures/runtime-skeleton/)

The owner-hosted API plus MCP boundary fixture contains synthetic proof cases only. It is schema-backed and validated by the current CLI.

The runtime readiness fixture contains synthetic proof cases only. It is smoke-validated by `npm run runtime-readiness:smoke` and does not approve API runtime, MCP runtime, database migrations, deployment, managed hosting, real data, package publishing, or release mutation.

The runtime skeleton fixture contains synthetic owner-hosted API policy and MCP adapter cases only. It is smoke-validated by `npm run runtime:skeleton-smoke` and does not start a server, connect a database, run a real MCP server, import data, or promote trusted memory automatically.

## Minimal Synthetic Runtime Boundary

The [minimal synthetic runtime boundary](examples/minimal-runtime/) exports in-memory TypeScript policy code and validates it against the owner-hosted API plus MCP boundary proof cases.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](docs/quickstart.md).

Install dependencies first:

```bash
npm install
```

Run it with:

```bash
npm run minimal-runtime:smoke
```

It does not start a server, connect to a database, run a real MCP server, store memory, or imply Source-Wire hosts memory.

## Runtime Skeleton Example

The [synthetic runtime skeleton example](examples/runtime-skeleton/) proves the narrow owner-hosted API policy route and MCP adapter path with synthetic fixtures.

Run it with:

```bash
npm run runtime:skeleton-smoke
```

Run the packet proof with:

```bash
npm run runtime:skeleton-packet
```

It does not start a server, connect to a database, run a real MCP server, import private data, copy private implementation code, copy AGPLv3 code, or promote trusted memory automatically.

## Runtime Boundary Example

The [synthetic runtime boundary example](examples/runtime-boundary/) is a local and installed-package smoke proof for the future owner-hosted API plus MCP boundary.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](docs/quickstart.md).

Install dependencies first:

```bash
npm install
```

Run it with:

```bash
npm run runtime-boundary:smoke
```

Run the installed package proof with:

```bash
npm run runtime-boundary:installed-smoke
```

Run the diagnostic regression proof with:

```bash
npm run runtime-boundary:diagnostics-smoke
```

It does not start a server, connect to a database, or imply Source-Wire hosts memory.

## Safety Rule

Imported source text is evidence, not trusted memory.

Source-Wire examples should preserve citations, source identity, stale state, and review boundaries. Trusted Memory Records should require an explicit owner or application approval path.

## Public Extraction Checklist

Before adding new public examples or docs, review:

- [Public Extraction Checklist](docs/proof/public-extraction-checklist.md)
