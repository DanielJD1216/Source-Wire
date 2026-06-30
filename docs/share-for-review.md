# Source-Wire Share For Technical Review

Status: technical review only.

Source-Wire is public so technical reviewers can inspect the contracts, schemas, fixtures, examples, and readiness gates.

It is not licensed for reuse, not published, not released, and not a hosted runtime.

## Safe Invite Copy

Use this when sharing the repo with a reviewer:

```text
I am looking for technical review on Source-Wire, an agent-first memory contract package skeleton.

Repo: https://github.com/DanielJD1216/Source-Wire

Important boundary: the repo is public for review only. It is currently UNLICENSED, version 0.0.0, unpublished, unreleased, and not a hosted runtime. Please do not assume reuse, redistribution, production use, or contribution rights yet.

Best first pass:
1. Read docs/public-status.md.
2. Read docs/share-for-review.md.
3. Run npm install.
4. Run npm run readiness:report.
5. Run npm run publish:readiness if you want the full local verification path.

Useful feedback: contract clarity, schema consistency, fixture realism, package install behavior, readiness gate coverage, and whether any doc blurs the license, runtime, data, or trusted-memory boundaries.
```

## Short Safe Version

```text
Source-Wire is public for technical review only. It is UNLICENSED, unpublished, unreleased, and not a hosted runtime. Please review the contracts, schemas, fixtures, docs, and readiness gates, but do not assume reuse or redistribution rights.
```

## Unsafe Wording To Avoid

Do not say:

```text
Source-Wire is open source and ready to use.
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

Expected first-pass markers:

```text
Package: @source-wire/contracts
Version: 0.0.0
License: UNLICENSED
Publish boundary: npm publishing blocked, publishConfig.access restricted
Runtime boundary: synthetic in-memory boundary only, no backend runtime included
ok readiness report
```

For the full local verification path:

```bash
npm run publish:readiness
```

Despite the command name, this does not publish npm.

## What To Review

High-value review areas:

- Are the contracts understandable to another agent-memory project?
- Are JSON schemas and TypeScript types aligned?
- Are fixtures realistic enough while staying synthetic?
- Are package exports usable from an installed package?
- Do readiness gates prove the right claims?
- Are license, release, runtime, data, and trusted-memory boundaries clear?
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

Technical review does not approve:

- Apache-2.0 license implementation,
- reuse or redistribution,
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

## Related Docs

- [Public Status](public-status.md)
- [First-Time Visitor Share-Readiness Audit](first-time-visitor-share-readiness-audit.md)
- [Technical Reviewer Guide](technical-reviewer-guide.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [Publish Readiness](publish-readiness.md)
- [License Decision Gate](license-decision-gate.md)
