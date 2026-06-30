# Source-Wire First-Time Visitor Share-Readiness Audit

This audit answers what a first-time GitHub visitor can safely conclude from the public Source-Wire repository.

## Verdict

Source-Wire is ready to share for technical review.

Source-Wire is not ready to share for broad reuse, redistribution, publishing, deployment, or production use.

## Why Technical Review Is Ready

The public repo now has enough evidence for a technical reviewer to understand and verify the contract package skeleton:

- public status page,
- technical reviewer guide,
- reviewer feedback guide,
- support policy,
- security policy,
- contribution-boundary file,
- structured issue templates,
- CI badge and package checks workflow,
- local readiness gate,
- package dry-run,
- installed package smokes,
- public-safety scan,
- synthetic fixtures,
- TypeScript contract types,
- JSON schemas,
- validation CLI,
- minimal synthetic runtime-boundary proof.

## What A Reviewer Can Do

A reviewer can:

- clone the repo,
- run local verification,
- inspect public docs and contracts,
- validate synthetic fixtures,
- inspect schema exports,
- run package dry-run,
- run installed package smokes,
- run synthetic runtime-boundary smokes,
- file structured feedback issues.

## Primary Verification Path

Use Node.js 22 with npm:

```bash
npm install
npm run publish:readiness
```

Despite the command name, this does not publish npm.

Expected boundary markers:

```text
ok release gate
ok license UNLICENSED
ok version 0.0.0
ok publishing blocked
```

## Evidence To Check

| Evidence | Where |
| --- | --- |
| Current public boundary | [Public Status](public-status.md) |
| GitHub metadata and CI visibility | [Repository Metadata](repository-metadata.md) |
| Review path | [Technical Reviewer Guide](technical-reviewer-guide.md) |
| Feedback path | [Reviewer Feedback Guide](reviewer-feedback-guide.md) |
| Local readiness marker map | [Publish Readiness](publish-readiness.md) |
| CI marker map | [CI Checks](ci-checks.md) |
| License blocker | [License Decision Gate](license-decision-gate.md) |
| Future Apache-2.0 checklist | [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md) |

## Why Broad Reuse Is Not Ready

Broad reuse remains blocked because:

- package license is `UNLICENSED`,
- no `LICENSE` file exists,
- npm publishing is blocked,
- GitHub release publishing is blocked,
- package version remains `0.0.0`,
- contribution license terms are not approved,
- code contributions are not accepted,
- no hosted runtime exists,
- no real MCP server runtime exists,
- no database setup exists,
- no live connectors exist,
- no real user data examples are approved.

## What A Visitor Must Not Assume

A visitor must not assume:

- public visibility means open-source permission,
- the repo can be reused or redistributed,
- npm publishing is approved,
- a GitHub release exists,
- Source-Wire hosts memory,
- Source-Wire includes a production backend,
- Source-Wire accepts code contributions,
- synthetic runtime-boundary checks are a deployed runtime.

## Next Required Owner Decision

The next hard decision is license approval.

Recommended decision if the goal is broad public reuse:

```text
Approve Apache-2.0 implementation for Source-Wire while keeping npm publishing, GitHub releases, deployment, and hosted runtime blocked until separate approvals.
```

Without that decision, Source-Wire should remain review-only.

## Share Guidance

Safe wording:

```text
Source-Wire is public for technical review. It is currently UNLICENSED, unreleased, unpublished, and not a hosted runtime. Please review the contracts, docs, fixtures, and readiness gates, but do not assume reuse or redistribution rights yet.
```

Unsafe wording:

```text
Source-Wire is open source and ready to use.
```

## Final Status

Ready for technical review: yes.

Ready for broad public reuse: no.

Main blocker: owner-approved license implementation.
