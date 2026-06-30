# Source-Wire Repository Metadata

This page explains the GitHub-visible files and status surfaces in Source-Wire.

## Current Boundary

Source-Wire is public for technical review.

It is still:

- `UNLICENSED`,
- version `0.0.0`,
- unpublished to npm,
- unreleased on GitHub,
- not a hosted runtime,
- not accepting code contributions.

## GitHub-Visible Files

| File | Purpose |
| --- | --- |
| `README.md` | Main public entrypoint and current status summary. |
| `SECURITY.md` | Safe security and boundary concern reporting rules. |
| `SUPPORT.md` | Review support boundaries and verification-first support path. |
| `CONTRIBUTING.md` | Structured feedback path and code-contribution boundary. |
| `.github/ISSUE_TEMPLATE/*.yml` | Structured issue intake for verification, docs/contracts, and boundary concerns. |
| `.github/workflows/package-checks.yml` | GitHub Actions package readiness workflow. |

## CI Visibility

Package checks run through:

```text
.github/workflows/package-checks.yml
```

The README links the workflow status and the [CI Checks](ci-checks.md) marker map.

The workflow runs:

```bash
npm ci
npm run publish:readiness
```

Despite the command name, this does not publish npm.

The release gate must still print:

```text
ok license UNLICENSED
ok version 0.0.0
ok publishing blocked
```

## What Metadata Does Not Approve

Repository metadata does not approve:

- Apache-2.0 license implementation,
- reuse or redistribution,
- code contribution acceptance,
- npm publishing,
- GitHub release publishing,
- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- real data examples.

## Related Docs

- [Public Status](public-status.md)
- [First-Time Visitor Share-Readiness Audit](first-time-visitor-share-readiness-audit.md)
- [Technical Reviewer Guide](technical-reviewer-guide.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [CI Checks](ci-checks.md)
- [Publish Readiness](publish-readiness.md)
