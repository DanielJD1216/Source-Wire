# Source-Wire Owner Approval Recorder

Status: guarded owner-side approval recorder.

This command can record one exact approval comment on a tracked owner-decision issue only when the owner deliberately supplies the issue number, `--write`, and the exact approval text.

It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this command after the owner has chosen one approval from [Owner Approval Record Packet](owner-approval-record-packet.md).

The command exists to reduce copy/paste mistakes while keeping approval recording separate from recommendation text, status refreshes, proof comments, package publishing, GitHub releases, branch governance, hosted runtime work, and contribution acceptance.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Dry-run helper for known approval issues:

```bash
npm run owner:record-approval
```

Dry-run status for one issue:

```bash
npm run owner:record-approval -- --issue 255
```

Expected no-issue markers:

```text
ok owner approval recorder ready
blocked approval recording requires known --issue
```

Expected issue-specific dry-run markers:

```text
ok owner approval recorder ready
blocked approval recording requires --write
```

## Write Mode

Write mode requires an exact issue number and the exact approval text from [Owner Approval Record Packet](owner-approval-record-packet.md).

Example shape:

```bash
npm run owner:record-approval -- --issue 255 --write --confirm-exact "<exact approval text>"
```

The command refuses to write when:

- the issue number is not one of `#255`, `#256`, `#257`, or `#258`,
- the issue is not open,
- the exact approval is already recorded,
- `--write` is missing,
- `--confirm-exact` is missing,
- `--confirm-exact` does not match the known approval text exactly.

Successful write-mode markers:

```text
ok owner approval recorder ready
ok exact <approval name> approval recorded
blocked execution still requires focused implementation unit
```

## Current Approval Targets

| Issue | Decision | Current execution boundary |
| --- | --- | --- |
| `#255` | First public release path | Record approval before a future release implementation unit. |
| `#256` | Branch governance path | Record approval before a future branch governance implementation unit. |
| `#257` | Hosted runtime PRD path | Record approval before a future hosted runtime PRD unit. |
| `#258` | Contribution terms path | Record approval before a future contribution terms PRD unit. |

## After Recording

After recording an approval, run:

```bash
npm run owner:decision-status
```

For release approval only, also run:

```bash
npm run release:approval-status
npm run release:decision-preflight
```

## Still Blocked

Even after an exact approval is recorded, execution still requires a focused implementation unit.

The recorder does not execute any of these:

- npm publishing,
- GitHub release publishing,
- release tags,
- package version change,
- repository ruleset governance,
- hosted runtime,
- production runtime use,
- code contribution acceptance.

## Related Docs

- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Launch Decision Status](launch-decision-status.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
