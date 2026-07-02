# Source-Wire World Share Packet

Status: public source-package and package-release sharing packet only.

This packet does not approve deployment, hosted runtime behavior, production runtime use, code contribution acceptance, or real data examples.

## Purpose

Use this page when you are ready to share Source-Wire publicly but want the exact safe wording, commands, links, and blocked boundaries in one place.

For the command version, run:

```bash
npm run world:share-packet
```

Expected markers:

```text
ok world share packet ready
ok public share copy current
blocked production launch channels
```

## One-Line Copy

```text
Source-Wire is an Apache-2.0 package of agent-first memory contracts and examples, published as @source-wire/contracts@0.1.0, with hosted runtime and production-use claims still blocked.
```

## Short Public Copy

```text
I opened Source-Wire for technical review.

It is an Apache-2.0 package for agent-first memory systems: contracts, schemas, fixtures, examples, and readiness gates.

Important boundary: it is version 0.1.0, published to npm, released on GitHub, undeployed, and not a hosted runtime.

Known package issue: the immutable npm 0.1.0 artifact exports SOURCE_WIRE_PACKAGE_VERSION as 0.0.0; latest main fixes this for a future patch release.

Repo: https://github.com/DanielJD1216/Source-Wire
npm: https://www.npmjs.com/package/@source-wire/contracts
Release: https://github.com/DanielJD1216/Source-Wire/releases/tag/v0.1.0
Start here: docs/public-status.md
```

## First Reviewer Commands

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

```bash
git clone https://github.com/DanielJD1216/Source-Wire.git
cd Source-Wire
npm install
npm run readiness:report
```

For the full local verification path:

```bash
npm run publish:readiness
```

Despite the command name, this does not publish a new package version.

## Owner Preflight Before Broad Sharing

Before broad public sharing, the owner can run:

```bash
npm run world:share-final-preflight
```

This command is read-only. It does not publish a new package version, create a new GitHub release, create new tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

For the lighter source-package-only preflight, run:

```bash
npm run world:share-preflight
```

For the short owner next-action summary, run:

```bash
npm run world:share-operator-summary
```

## Post-Share Monitor

After public sharing starts, run:

```bash
npm run world:post-share-monitor
```

This command is read-only. It expects owner-decision issues to stay closed and allows structured reviewer feedback issues, but fails on unstructured issues or open pull requests while code contribution acceptance remains blocked.

## Feedback Route

Use GitHub issue templates for:

- verification failures,
- docs or contract feedback,
- boundary or safety concerns.

Do not ask reviewers to send:

- secrets,
- tokens,
- private data,
- local private paths,
- private screenshots,
- production exports,
- account IDs,
- client names,
- real source payloads,
- real chat logs,
- real memory records.

## Still Blocked

- repository ruleset governance,
- hosted runtime,
- production runtime use,
- code contribution acceptance.

## Related Docs

- [Public Status](public-status.md)
- [World Share Kit](world-share-kit.md)
- [World Share Operator Summary](world-share-operator-summary.md)
- [Share For Technical Review](share-for-review.md)
- [World-Share Readiness](world-share-readiness.md)
- [World Share Post-Share Monitor](world-share-post-share-monitor.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
