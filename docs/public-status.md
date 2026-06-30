# Source-Wire Public Status

Source-Wire is public for technical review.

It is not released, not licensed for reuse, not published to npm, and not a hosted runtime.

## Current State

| Area | Status |
| --- | --- |
| Repository visibility | Public review repository |
| Package name | `@source-wire/contracts` |
| Package version | `0.0.0` |
| License | `UNLICENSED` |
| `LICENSE` file | Not present |
| npm publishing | Blocked |
| GitHub release | Blocked |
| Hosted runtime | Not included |
| MCP server runtime | Not included |
| Database or migrations | Not included |
| Real user data | Not included |
| Trusted memory auto-promotion | Not allowed |

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
- GitHub-visible support, security, and contribution-boundary files.

## What This Repo Is Not Yet

Source-Wire is not yet:

- an open-source licensed package,
- an npm package you can install from the registry,
- a GitHub release,
- a hosted memory service,
- an API server,
- an MCP server runtime,
- a database-backed memory engine,
- a connector framework,
- a Mission Control UI,
- a place for real user data.

## Allowed Review Actions

You may:

- clone the repo for review,
- run local verification commands,
- inspect public docs, schemas, contracts, fixtures, and examples,
- run local package dry-run checks,
- run synthetic runtime-boundary smokes,
- open structured feedback issues using the provided templates.

Review does not grant permission to reuse, redistribute, sell, host, publish, or package Source-Wire.

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
ok license UNLICENSED
ok version 0.0.0
ok publishing blocked
```

For a full marker map, read [Publish Readiness](publish-readiness.md).

## How To Give Feedback

Start with:

- [Technical Reviewer Guide](technical-reviewer-guide.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [Repository Metadata](repository-metadata.md)

Use the GitHub issue templates for:

- verification failures,
- docs or contract feedback,
- boundary or safety concerns.

Do not include secrets, tokens, private data, local private paths, private screenshots, production exports, account IDs, client names, real source payloads, real chat logs, or real memory records.

## Approvals Required Before Broad Reuse

Separate owner approvals are still required before any of these happen:

- Apache-2.0 license implementation,
- npm publishing,
- GitHub release publishing,
- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- Mission Control UI,
- real data examples,
- contribution license terms.

Read:

- [Release Decision](release-decision.md)
- [License Approval Rehearsal](license-approval-rehearsal.md)
- [License Decision Gate](license-decision-gate.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)

## Bottom Line

Source-Wire is ready for technical review.

It is not ready for reuse, redistribution, publishing, deployment, or production use.

For the first-time visitor audit, read [First-Time Visitor Share-Readiness Audit](first-time-visitor-share-readiness-audit.md).
