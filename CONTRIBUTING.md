# Contributing To Source-Wire

Source-Wire is Apache-2.0 licensed as a source package.

Source reuse is allowed under Apache-2.0, but code contributions are not accepted until the owner approves contribution terms.

## What Is Welcome Now

Structured review feedback is welcome through GitHub issues:

- verification failures,
- docs or contract feedback,
- boundary or safety concerns.

Use:

- [Technical Reviewer Guide](docs/technical-reviewer-guide.md)
- [Reviewer Feedback Guide](docs/reviewer-feedback-guide.md)
- [Public Status](docs/public-status.md)

## What Is Not Accepted Yet

Do not submit:

- code contributions,
- production runtime implementations,
- database migrations,
- live connector code,
- real user data,
- private implementation history,
- private screenshots,
- copied private docs,
- real source payloads,
- package publishing changes,
- release tags,
- license changes.

These require separate owner approval and a later PRD.

## Feedback Safety Rules

Do not include:

- secrets,
- tokens,
- private data,
- local private paths,
- production exports,
- account IDs,
- client names,
- real chat logs,
- real memory records.

Use synthetic examples or public repo references only.

## Local Verification

Use Node.js 22 with npm:

```bash
npm install
npm run publish:readiness
```

Despite the command name, this does not publish npm.

Expected boundary markers:

```text
ok license Apache-2.0
ok version 0.0.0
ok publishing blocked
```

## Future Contribution Terms

Future contribution terms may be added only after explicit owner approval.

Until then, public issues are review feedback. They are not approval to publish npm, create GitHub releases, deploy services, host a runtime, claim production readiness, or contribute code to Source-Wire.
