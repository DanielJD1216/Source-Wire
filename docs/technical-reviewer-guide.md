# Source-Wire Technical Reviewer Guide

This guide is for technical reviewers who want to inspect Source-Wire after its first npm and GitHub release, before it is deployed or turned into a hosted runtime.

For the shortest status summary, read [Public Status](public-status.md).

For safe copy/paste invite text and the shortest review path, read [Share For Technical Review](share-for-review.md).

## Current Review Boundary

Source-Wire is currently a public contract package skeleton.

Current state:

- package license is `Apache-2.0`,
- package version is `0.1.0`,
- `LICENSE` file exists,
- npm package is published as `@source-wire/contracts@0.1.0`,
- GitHub release is published as `v0.1.0`,
- hosted runtime backend work is blocked.

Known `v0.1.0` package issue: the immutable npm artifact exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0` even though the package metadata is `0.1.0`. Latest `main` fixes this for a future owner-approved patch release.

The Apache-2.0 license plus first release grants source package reuse rights. It does not mean Source-Wire is deployed, hosted, production-ready, or accepting code contributions.

## What You Can Review Today

You can review:

- public contracts,
- JSON schemas,
- synthetic fixtures,
- validation CLI behavior,
- TypeScript package exports,
- minimal synthetic runtime-boundary policy proof,
- synthetic owner-hosted API policy route and MCP adapter skeleton,
- installed package smoke checks,
- public-safety boundaries,
- readiness and release gates.

You cannot review a production backend yet because one is intentionally not included.

## Clone And Install

Use Node.js 22 with npm.

```bash
git clone https://github.com/DanielJD1216/Source-Wire.git
cd Source-Wire
npm install
```

## Fast First Pass

Run the readiness report first:

```bash
npm run readiness:report
```

This prints the current package posture, exports, readiness commands, required readiness docs, installed package smokes, and blocked scope.

Expected high-signal markers:

```text
Package: @source-wire/contracts
Version: 0.1.0
License: Apache-2.0
Publish boundary: npm package public at @source-wire/contracts@0.1.0, hosted runtime blocked
Runtime boundary: synthetic in-memory boundary plus synthetic API/MCP skeleton, threat-boundary package, API policy contract package, MCP adapter contract package, database posture package, hosted-runtime fixture package, and deployment-boundary package only, no backend runtime included
ok readiness report
```

## Full Local Verification

Run the full local readiness gate:

```bash
npm run publish:readiness
```

Despite the name, this does not publish npm.

It verifies typecheck, build, tests, fixture validation, schema exports, CLI smoke, package dry-run, installed package smokes, runtime-boundary smokes, docs links, command-doc setup, public-safety scan, and marker smoke.

Use [Publish Readiness](publish-readiness.md) for the marker map.

## Package Dry Run

To inspect the package artifact without running the full gate:

```bash
npm run package:dry-run
```

Expected markers:

```text
ok package dry-run @source-wire/contracts@0.1.0
ok package file count
ok package filename source-wire-contracts-0.1.0.tgz
```

This builds and checks the package contents. It does not publish.

## Contract Surfaces To Inspect

Start with:

- [Architecture Map](architecture-map.md)
- [API Reference](api-reference.md)
- [Source Graph Adapter Contract](contracts/source-graph-adapter-contract.md)
- [Source Connection Contract](contracts/source-connection-contract.md)
- [`second-brain.v1` Contract](contracts/second-brain-v1-contract.md)
- [MCP Tool Behavior Contract](contracts/mcp-tool-behavior-contract.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)

The package exports TypeScript contract types from `@source-wire/contracts` and JSON schemas from stable subpaths.

## Synthetic Runtime-Boundary Review

Review these files when checking whether the boundary is honest:

- [Runtime Boundary](runtime-boundary.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Boundary Readiness](runtime-boundary-readiness.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [Runtime Skeleton Smoke](runtime-skeleton-smoke.md)
- [Minimal Synthetic Runtime Boundary](../examples/minimal-runtime/README.md)
- [Synthetic Runtime Skeleton Example](../examples/runtime-skeleton/README.md)
- [Synthetic Runtime Boundary Example](../examples/runtime-boundary/README.md)

Run:

```bash
npm run minimal-runtime:smoke
npm run runtime:skeleton-smoke
npm run runtime:skeleton-packet
npm run runtime-boundary:smoke
npm run runtime-boundary:installed-smoke
npm run runtime-boundary:diagnostics-smoke
```

These commands prove local synthetic policy behavior. The runtime skeleton also proves MCP calls route through the Source-Wire API policy path. They do not start an API server, MCP server, database, connector, memory engine, or hosted backend.

## Useful Feedback

Useful feedback is specific and testable.

Good review questions:

- Are the contract names clear enough for another agent-memory project?
- Do the schemas make required fields obvious?
- Do the fixtures show realistic source-backed evidence without using real data?
- Are the no-auto-promotion and owner-approval boundaries clear?
- Are the runtime-blocked claims consistent across README, docs, examples, and readiness output?
- Are the installed-package smokes proving the right things?
- Is any doc implying that Source-Wire hosts memory when it does not?
- Is any command name confusing enough to cause misuse?

Less useful feedback:

- requests to add real user data,
- requests to publish a new npm version without a future approved release unit,
- requests to add hosted runtime behavior before the runtime gate opens,
- requests to remove owner approval from trusted-memory promotion.

## Do Not Add During Review

Do not add:

- real user data,
- private implementation history,
- local machine paths,
- domains, emails, account IDs, client names, or tokens,
- screenshots from private systems,
- production exports,
- database migrations,
- hosted runtime behavior,
- live connectors,
- automatic trusted-memory promotion.

Public examples must remain synthetic.

## If Something Fails

When a command fails, capture:

- command,
- observed error,
- operating system,
- Node.js version,
- npm version,
- whether dependencies were freshly installed,
- the first failing marker from [Publish Readiness](publish-readiness.md).

Then open an issue with the failure details.

Use [Reviewer Feedback Guide](reviewer-feedback-guide.md) to choose the right issue template and avoid unsafe data.

Use `verification failure` for command or marker failures, `docs or contract feedback` for unclear docs, schemas, fixtures, examples, or contracts, and `boundary or safety concern` for license, runtime, privacy, publishing, or trusted-memory boundary risks.

## What Approval Would Unlock Later

Separate owner approvals are still needed for:

- Apache-2.0 license implementation,
- npm publishing,
- GitHub release publishing,
- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- Mission Control UI,
- real data examples.

Read [License Decision Gate](license-decision-gate.md) and [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md) for the license path.
