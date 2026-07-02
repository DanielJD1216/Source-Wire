# Source-Wire World Share Kit

Status: public source-package and package-release share kit only.

This kit does not approve deployment, hosted runtime behavior, production runtime use, code contribution acceptance, or real data examples.

## Purpose

Use this page when sharing Source-Wire in public channels such as YouTube, Substack, X, LinkedIn, Discord, or a direct technical-review message.

The goal is simple: invite useful review without making people think Source-Wire is already a hosted service, production backend, or contribution-accepting project.

## One-Line Copy

```text
Source-Wire is an Apache-2.0 package of agent-first memory contracts and examples, published as @source-wire/contracts@0.1.0, with hosted runtime and production-use claims still blocked.
```

## Short Social Copy

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

## Longer Review Invite

```text
I am looking for technical review on Source-Wire.

Source-Wire is an Apache-2.0 source package skeleton for agent-first memory systems. It focuses on source-backed context, contracts, schemas, fixtures, examples, package verification, and no-auto-promotion boundaries for trusted memory.

Repo: https://github.com/DanielJD1216/Source-Wire

Known package issue: the immutable npm 0.1.0 artifact exports SOURCE_WIRE_PACKAGE_VERSION as 0.0.0; latest main fixes this for a future patch release.

Please do not assume hosted memory behavior, production runtime readiness, or code contribution acceptance yet.

Best first pass:
1. Read docs/public-status.md.
2. Read docs/share-for-review.md.
3. Run npm install.
4. Run npm run readiness:report.
5. Run npm run publish:readiness if you want the full local verification path.

Useful feedback: contract clarity, schema consistency, fixture realism, installed package behavior, readiness gate coverage, and whether any doc blurs the license, release, runtime, data, contribution, or trusted-memory boundaries.
```

## Reviewer Call To Action

Ask reviewers to inspect:

- public contracts,
- JSON schemas,
- synthetic fixtures,
- validation CLI behavior,
- TypeScript package exports,
- installed package smoke checks,
- minimal synthetic runtime-boundary proof,
- readiness and release gates,
- public safety boundaries,
- license, runtime, data, contribution, and trusted-memory wording.

## First Commands

Use Node.js 22 with npm.

```bash
git clone https://github.com/DanielJD1216/Source-Wire.git
cd Source-Wire
npm install
npm run readiness:report
```

For the full local gate:

```bash
npm run publish:readiness
```

Despite the command name, this does not publish npm.

Before broad public sharing, the owner can run the read-only world share preflight:

```bash
npm run world:share-preflight
```

Expected markers:

```text
ok world share preflight ready
ok external reviewer links reachable
ok live source-package boundary current
ok owner decision issues current
ok owner open issue boundary current
blocked production launch channels
```

For a single copy-and-command packet:

```bash
npm run world:share-packet
```

Expected markers:

```text
ok world share packet ready
ok public share copy current
blocked production launch channels
```

After public sharing starts, use the read-only post-share monitor:

```bash
npm run world:post-share-monitor
```

Expected markers:

```text
ok post-share monitor ready
ok structured reviewer issue intake current
blocked code contribution PRs
```

## Safe Claims

It is safe to say:

- Source-Wire is Apache-2.0 licensed.
- Source-Wire is ready for technical review.
- Source-Wire can be reused as a source package under Apache-2.0.
- Source-Wire has contracts, schemas, synthetic fixtures, examples, validation CLI, package dry-run checks, installed package smokes, and readiness gates.
- Source-Wire has a minimal synthetic in-memory runtime-boundary proof.
- Source-Wire is published to npm as `@source-wire/contracts@0.1.0`.
- Source-Wire has a GitHub release at `v0.1.0`.
- Source-Wire is not a hosted runtime.
- Source-Wire is not production-ready.
- Source-Wire is not accepting code contributions yet.

## Unsafe Claims

Do not say:

```text
Source-Wire is production-ready.
```

Do not say:

```text
Install it as a hosted runtime backend.
```

Do not say:

```text
This is the hosted memory backend.
```

Do not say:

```text
Contributions are open.
```

Do not say:

```text
Use this with real user memory now.
```

## Feedback Boundary

Ask for feedback through GitHub issue templates.

Useful feedback:

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

## Links To Include

- [Public Status](public-status.md)
- [Share For Technical Review](share-for-review.md)
- [Technical Reviewer Guide](technical-reviewer-guide.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [World Share Post-Share Monitor](world-share-post-share-monitor.md)
- [First-Time Visitor Share-Readiness Audit](first-time-visitor-share-readiness-audit.md)
- [World-Share Readiness](world-share-readiness.md)
- [Publish Readiness](publish-readiness.md)
