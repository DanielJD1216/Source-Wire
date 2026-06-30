# Source-Wire License Approval Rehearsal

Status: implementation check only.

## Purpose

This check lets a reviewer verify the current Apache-2.0 implementation boundary.

It exists to keep license implementation small, predictable, and hard to confuse with npm publishing, GitHub release publishing, deployment, hosted runtime work, production runtime use, or code contribution acceptance.

## Current State This Check Must Prove

| Field | Required current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.0.0` |
| `LICENSE` file | present |
| `publishConfig.access` | `restricted` |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Deployment scripts | blocked |

## Run The Check

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
ok license implementation current boundary
ok license implementation checklist complete
```

## What The Command Does

The command reads local repository files and checks that:

- `package.json` says `Apache-2.0`,
- package version is still `0.0.0`,
- `publishConfig.access` is still `restricted`,
- `LICENSE` file exists,
- package scripts do not contain package-manager publish commands,
- package scripts do not contain `gh release`,
- package scripts do not contain release tag creation commands,
- package scripts do not contain package version change commands,
- package scripts do not contain common service deployment commands.

It also confirms the Apache-2.0 implementation checklist is complete.

## What The Command Does Not Do

The command does not:

- publish npm,
- create a GitHub release,
- deploy services,
- start a runtime,
- connect to a database,
- accept contributions,
- approve production runtime use.

## Still Blocked After Apache-2.0

The implementation check does not approve:

1. npm publishing.
2. GitHub release publishing.
3. Deployment.
4. Hosted runtime backend work.
5. Code contribution acceptance.
6. Production runtime use.

## Related Docs

- [License Decision Gate](license-decision-gate.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [License And Version Policy](license-version-policy.md)
- [Release Decision](release-decision.md)
- [Publish Readiness](publish-readiness.md)
