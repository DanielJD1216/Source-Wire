# Source-Wire Owner Approval Recorder

Status: guarded owner-side approval recorder.

This command can record one exact approval comment on a tracked owner-decision issue only when the owner deliberately supplies the issue number, `--write`, and the exact approval text.

It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this command after the owner has chosen one approval from [Owner Approval Record Packet](owner-approval-record-packet.md).

The command exists to reduce copy/paste mistakes while keeping approval recording separate from recommendation text, status refreshes, proof comments, package publishing, GitHub releases, branch governance, hosted runtime work, and contribution acceptance.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

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

Dry-run status for the patch release implementation approval:

```bash
npm run owner:record-approval -- --target patch-release-implementation
```

Dry-run status for the hosted-runtime child issue publication approval:

```bash
npm run owner:record-approval -- --target hosted-runtime-child-issue-publication
```

Dry-run status for the runtime PRD refresh approval:

```bash
npm run owner:record-approval -- --target runtime-prd-refresh
```

Dry-run status for the owner-hosted runtime implementation approval:

```bash
npm run owner:record-approval -- --target owner-hosted-runtime-implementation
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

Write mode requires an exact issue number or target and the exact approval text from [Owner Approval Record Packet](owner-approval-record-packet.md).
For approval paths that share an issue, prefer the exact `--target` value.

Example shape:

```bash
npm run owner:record-approval -- --issue 255 --write --confirm-exact "<exact approval text>"
```

Hosted-runtime child issue publication shape:

```bash
npm run owner:record-approval -- --target hosted-runtime-child-issue-publication --write --confirm-exact "<exact approval text>"
```

Runtime PRD refresh shape:

```bash
npm run owner:record-approval -- --target runtime-prd-refresh --write --confirm-exact "<exact approval text>"
```

Owner-hosted runtime implementation shape:

```bash
npm run owner:record-approval -- --target owner-hosted-runtime-implementation --write --confirm-exact "<exact approval text>"
```

Patch release implementation shape:

```bash
npm run owner:record-approval -- --target patch-release-implementation --write --confirm-exact "<exact approval text>"
```

The command refuses to write when:

- the issue number or target is not known,
- the issue is not open,
- the exact approval is already recorded,
- `--write` is missing,
- `--confirm-exact` is missing,
- `--confirm-exact` does not match the known approval text exactly.

The patch release implementation target records on closed issue `#255` because the first release issue is completed history. The hosted-runtime child issue publication, runtime PRD refresh, and owner-hosted runtime implementation targets record on closed issue `#257` because the parent PRD issue is completed history. They still require `--write` and an exact `--confirm-exact` match.

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
| `#255`, target `patch-release-implementation` | Patch release path | Record approval before a future patch release for the immutable npm `0.1.0` exported-version mismatch. |
| `#256` | Branch governance path | Record approval before a future branch governance implementation unit. |
| `#257` | Hosted runtime PRD path | Record approval before a future hosted runtime PRD unit. |
| `#257`, target `hosted-runtime-child-issue-publication` | Hosted runtime child issue publication path | Approval recorded; six PRD/planning child issues are published as `#259` through `#264`; hosted runtime implementation remains blocked. |
| `#257`, target `runtime-prd-refresh` | Runtime PRD refresh path | Record approval before refreshing the public owner-hosted runtime PRD and wrapper-runtime gate from Unit 33 redacted metadata. |
| `#257`, target `owner-hosted-runtime-implementation` | Owner-hosted runtime implementation path | Approval recorded for a future narrow API server runtime skeleton and MCP server runtime skeleton implementation unit. |
| `#258` | Contribution terms path | Completed contribution terms PRD approval; code contribution acceptance still needs a separate future implementation approval. |

## After Recording

After recording an approval, run:

```bash
npm run owner:decision-status
```

For runtime PRD refresh approval only, also run:

```bash
npm run runtime:prd-refresh-approval-status
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
- [Patch Release Approval Request](release-patch-approval-request.md)
- [Hosted Runtime Slice Approval Request](hosted-runtime-slice-approval-request.md)
