# Source-Wire Release Candidate Readiness

Status: release-candidate check only.

This page verifies whether Source-Wire is ready for an owner release decision. It does not publish npm, create a GitHub release, create a tag, change package version, deploy services, start hosted runtime behavior, or accept code contributions.

## Purpose

Use this check before asking the owner whether to open a release implementation unit.

The check proves that the package is locally verifiable and that public release channels remain blocked until explicit approval.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:candidate-readiness
```

Expected markers:

```text
ok release candidate readiness ready
ok local package verification ready
blocked release implementation approval missing
```

## Current Candidate State

| Field | Current value |
| --- | --- |
| Package name | `@source-wire/contracts` |
| Package license | `Apache-2.0` |
| Package version | `0.0.0` |
| Local package verification | ready |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime | blocked |
| Code contributions | blocked |

## What This Check Looks For

The command verifies:

- package name remains `@source-wire/contracts`,
- license remains `Apache-2.0`,
- version remains `0.0.0`,
- `publishConfig.access` remains `restricted`,
- `LICENSE` exists,
- release approval request docs exist,
- release decision docs exist,
- launch decision docs exist,
- package scripts do not include direct `npm publish`,
- package scripts do not include direct `gh release`,
- package scripts do not include deployment commands.

## Next Action

If this check passes, the next owner decision is whether to open a future release implementation unit.

Do not publish, tag, release, or deploy from this check.

## Related Docs

- [Release Approval Request Packet](release-approval-request-packet.md)
- [Release Decision](release-decision.md)
- [Launch Decision Status](launch-decision-status.md)
- [Publish Readiness](publish-readiness.md)
