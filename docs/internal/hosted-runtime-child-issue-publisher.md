# Source-Wire Hosted Runtime Child Issue Publisher

Status: guarded owner-side publisher.

Default mode is read-only. Write mode requires the exact owner approval text, `--write`, `--confirm-exact`, a separately recorded exact approval on parent issue `#257`, no duplicate open child issues, and current runtime readiness plus proof-intake gates before any issue is created.

This command does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this command after the owner separately approves the exact child-issue publication text from the [Hosted Runtime Child Issue Publication Packet](hosted-runtime-child-issue-publication-packet.md).

The command creates the six hosted-runtime PRD/planning issues in dependency order only when the write gate is deliberately opened. Without write flags, it validates the local payloads and prints the exact future command.

Write mode also reads parent issue `#257` and refuses to create issues unless the exact child-issue publication approval is already recorded there in an `Owner Approval Record` section. After approval and duplicate checks pass, it reruns `runtime-readiness:smoke` and `runtime-proof-intake:smoke` before any GitHub issue creation.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Dry run:

```bash
npm run runtime:child-issue-publish
```

Expected dry-run markers:

```text
ok hosted runtime child issue publisher ready
ok hosted runtime issue payloads validated
blocked child issue publication requires --write
blocked hosted runtime implementation
```

Fixture smoke:

```bash
npm run runtime:child-issue-publish:smoke
```

Expected fixture-smoke markers:

```text
ok hosted runtime child issue publisher smoke
blocked child issue publication approval missing
blocked child issue duplicate publication
blocked hosted runtime implementation
```

Write mode, only after exact owner approval:

```bash
npm run runtime:child-issue-publish -- --write --confirm-exact "<exact approval text>"
```

Expected marker if write mode is attempted before the approval is recorded on `#257`:

```text
blocked child issue publication approval missing
blocked hosted runtime implementation
```

Expected marker if write mode is attempted after matching planning issue titles already exist:

```text
blocked child issue duplicate publication
blocked hosted runtime implementation
```

Expected marker if write mode is attempted while a required runtime gate fails:

```text
blocked child issue publication runtime gate failed
blocked hosted runtime implementation
```

Expected write markers:

```text
ok runtime readiness gate current
ok runtime proof intake gate current
ok hosted runtime child issue publisher ready
ok hosted runtime child issues published
blocked hosted runtime implementation
```

## Exact Approval Text

Do not run write mode until the owner approves this exact approval text:

```text
Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/internal/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.
```

## Write Boundary

Write mode may only:

- create six GitHub issues from `docs/internal/hosted-runtime-issue-slices.md`,
- attach the planned labels,
- include the shared blocked boundary in every issue.

Write mode must first verify:

- exact `--confirm-exact` text is provided,
- exact child-issue publication approval is recorded on issue `#257`,
- matching open child issue titles do not already exist.
- `runtime-readiness:smoke` passes at write time,
- `runtime-proof-intake:smoke` passes at write time.

Write mode must not:

- implement runtime code,
- add API server code,
- add MCP server runtime code,
- add database migrations,
- deploy services,
- publish npm,
- create a GitHub release,
- create tags,
- accept code contributions,
- add real user data,
- approve production runtime use.

## Post-Publication Verification

After a separately approved publication unit creates child issues, run:

```bash
npm run owner:open-issues-status
npm run owner:decision-issues-freshness
npm run world:share-final-preflight
```

If the open-issue boundary changes because the six planning issues now exist, update the owner-open-issue guard in the same publication unit.

## Related Docs

- [Hosted Runtime PRD](hosted-runtime-prd.md)
- [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md)
- [Hosted Runtime Slice Approval Request](hosted-runtime-slice-approval-request.md)
- [Hosted Runtime Child Issue Publication Packet](hosted-runtime-child-issue-publication-packet.md)
- [Owner Open Issues Status](owner-open-issues-status.md)
