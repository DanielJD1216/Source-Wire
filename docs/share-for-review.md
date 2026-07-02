# Source-Wire Share For Technical Review

Status: Apache-2.0 licensed source package.

Source-Wire is Apache-2.0 licensed.

Source-Wire is public so reviewers and adopters can inspect and reuse the source package boundary: contracts, schemas, fixtures, examples, and readiness gates.

It is published as `@source-wire/contracts@0.1.0` and released on GitHub as `v0.1.0`, but it is not deployed and not a hosted runtime.

For public-channel copy such as YouTube, Substack, X, LinkedIn, Discord, or direct review messages, read [World Share Kit](world-share-kit.md).

## Safe Invite Copy

Use this when sharing the repo with a reviewer:

```text
I am looking for technical review on Source-Wire, an agent-first memory contract package skeleton.

Repo: https://github.com/DanielJD1216/Source-Wire

Important boundary: Source-Wire is Apache-2.0 licensed as a source package. It is version 0.1.0, published to npm, released on GitHub, undeployed, and not a hosted runtime. Please do not assume production readiness, hosted memory behavior, or code contribution acceptance yet.

Reviewer-safe first pass:
1. Read docs/public-status.md.
2. Read docs/share-for-review.md.
3. Run npm install.
4. Run npm run readiness:report.
5. Run npm run world:readiness to see the current sharing boundary.
6. Run npm run share:audit to verify the first-visitor share boundary.
7. Run npm run publish:readiness if you want the full local verification path.

Useful feedback: contract clarity, schema consistency, fixture realism, package install behavior, readiness gate coverage, and whether any doc blurs the license, runtime, data, contribution, or trusted-memory boundaries.
```

Owner-only preflight before broad public sharing:

```bash
npm run world:share-final-preflight
npm run world:post-share-monitor
```

## Short Safe Version

```text
Source-Wire is Apache-2.0 licensed as a source package. Its `0.1.0` package and GitHub release are live. Please review the contracts, schemas, fixtures, docs, and readiness gates without assuming production readiness or code contribution acceptance.
```

## Current Owner-Decision Status

These public issues track completed release history and remaining owner decisions. They do not approve the blocked work.

- Completed: [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255)
- Completed: [#256 Branch governance path](https://github.com/DanielJD1216/Source-Wire/issues/256)
- Completed: [#257 Hosted runtime PRD path](https://github.com/DanielJD1216/Source-Wire/issues/257)
- Completed: [#258 Contribution terms before accepting code](https://github.com/DanielJD1216/Source-Wire/issues/258)

## Unsafe Wording To Avoid

Do not say:

```text
Source-Wire is production-ready.
```

Do not say:

```text
You can build your product on this now.
```

Do not say:

```text
Contributions are open.
```

Do not say:

```text
This is the hosted memory backend.
```

## First Reviewer Path

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

```bash
git clone https://github.com/DanielJD1216/Source-Wire.git
cd Source-Wire
npm install
npm run readiness:report
```

To smoke-test that same first-pass path from a temporary clean checkout-style copy:

```bash
npm run reviewer:smoke
```

Expected first-pass markers:

```text
Package: @source-wire/contracts
Version: 0.1.0
License: Apache-2.0
Publish boundary: npm package public at @source-wire/contracts@0.1.0, hosted runtime blocked
Runtime boundary: synthetic in-memory boundary only, no backend runtime included
ok readiness report
```

For the full local verification path:

```bash
npm run publish:readiness
```

Despite the command name, this does not publish a new package version.

To check the owner launch approval order:

```bash
npm run owner:launch-checklist
```

Expected markers:

```text
ok owner launch checklist ready
blocked launch channels missing
```

To check the current source sharing boundary:

```bash
npm run world:readiness
```

Expected markers:

```text
ok world share open source ready
blocked production launch channels
```

To audit the first-visitor share boundary:

```bash
npm run share:audit
```

Expected markers:

```text
ok first visitor share audit ready
ok apache 2 reuse ready
blocked production launch channels
```

Before broad public sharing, the owner can run the read-only owner preflight:

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

This checks public external links, live world-share status, launch decision blockers, owner-decision issue status, and the owner open-issue boundary. It does not publish a new package version, create a new GitHub release, create new tags, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.

For one public-safe copy packet:

```bash
npm run world:share-packet
```

Expected markers:

```text
ok world share packet ready
ok public share copy current
blocked production launch channels
```

## What To Review

High-value review areas:

- Are the contracts understandable to another agent-memory project?
- Are JSON schemas and TypeScript types aligned?
- Are fixtures realistic enough while staying synthetic?
- Are package exports usable from an installed package?
- Do readiness gates prove the right claims?
- Are license, release, runtime, data, contribution, and trusted-memory boundaries clear?
- Does any doc imply Source-Wire hosts memory when it does not?
- Does any workflow imply trusted memory can be created without owner or application approval?

## Where To Send Feedback

Use the GitHub issue templates:

- verification failure,
- docs or contract feedback,
- boundary or safety concern.

Read [Reviewer Feedback Guide](reviewer-feedback-guide.md) before opening an issue.

## What Not To Share

Do not include:

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
- real memory records,
- private implementation history.

Use synthetic examples or public repo references only.

## Still Blocked

Apache-2.0 source package licensing does not approve:

- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- Mission Control UI,
- real data examples,
- contribution license terms,
- code contribution acceptance,
- production runtime use.

## Related Docs

- [Public Status](public-status.md)
- [World Share Kit](world-share-kit.md)
- [First-Time Visitor Share-Readiness Audit](first-time-visitor-share-readiness-audit.md)
- [Technical Reviewer Guide](technical-reviewer-guide.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [Publish Readiness](publish-readiness.md)
- [License Decision Gate](license-decision-gate.md)
