# Source-Wire License Approval Rehearsal

Status: rehearsal only. This document does not approve or perform a license change.

## Purpose

This rehearsal lets a reviewer check the current blocked license state and preview the future Apache-2.0 transition before the owner approves it.

It exists to make the later license implementation small, predictable, and hard to confuse with npm publishing, GitHub release publishing, deployment, or hosted runtime work.

## Current State This Rehearsal Must Prove

| Field | Required current value |
| --- | --- |
| Package license | `UNLICENSED` |
| Package version | `0.0.0` |
| `LICENSE` file | not present |
| `publishConfig.access` | `restricted` |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Deployment scripts | blocked |

## Run The Rehearsal

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run license:rehearsal
```

Expected markers:

```text
ok license rehearsal current boundary
ok license rehearsal future checklist
```

## What The Command Does

The command reads local repository files and checks that:

- `package.json` still says `UNLICENSED`,
- package version is still `0.0.0`,
- `publishConfig.access` is still `restricted`,
- no `LICENSE` file exists,
- package scripts do not contain `npm publish`,
- package scripts do not contain `gh release`,
- package scripts do not contain common service deployment commands.

It also prints the future Apache-2.0 transition checklist.

## What The Command Does Not Do

The command does not:

- write files,
- add a `LICENSE` file,
- change package metadata,
- publish npm,
- create a GitHub release,
- deploy services,
- start a runtime,
- connect to a database,
- accept contributions,
- grant reuse rights.

## Future Apache-2.0 Transition Checklist

Only after explicit owner approval, the future license implementation should:

1. Add the unmodified Apache License 2.0 text as `LICENSE`.
2. Change `package.json` license from `UNLICENSED` to `Apache-2.0`.
3. Update `scripts/release-gate.mjs` to expect `Apache-2.0`.
4. Update `scripts/readiness-report.mjs` to report the new approved license state.
5. Update README and public license docs.
6. Keep package version `0.0.0`.
7. Keep npm publishing blocked.
8. Keep GitHub release publishing blocked.
9. Keep deployment blocked.
10. Keep hosted runtime backend blocked.

## Approval Still Required

The rehearsal does not replace owner approval.

Use the exact approval language in [License Decision Gate](license-decision-gate.md) before making the license change.

Use [License Approval Decision Record](license-approval-decision-record.md) to verify the current decision is still pending before any implementation unit.

## Related Docs

- [License Decision Gate](license-decision-gate.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [License And Version Policy](license-version-policy.md)
- [Release Decision](release-decision.md)
- [Publish Readiness](publish-readiness.md)
