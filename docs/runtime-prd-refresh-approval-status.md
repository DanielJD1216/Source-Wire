# Source-Wire Runtime PRD Refresh Approval Status

Status: owner-side read-only approval status.

This command checks whether the exact runtime PRD refresh approval has been separately recorded. It does not refresh the PRD, implement hosted runtime behavior, add API server runtime, add MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, copy private implementation code, copy AGPLv3 code, or approve production runtime use.

## Purpose

Use this command to separate three questions:

- Is the hosted runtime PRD approved? That is tracked by issue `#257`.
- Is the later runtime PRD refresh approved? That needs the separate exact approval text below.
- Is hosted runtime implementation approved? No. Hosted runtime implementation remains blocked.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:prd-refresh-approval-status
```

This command uses live GitHub issue state and owner-side `gh` access, so it is intentionally not part of the public reviewer `npm run publish:readiness` gate.

Expected markers before approval:

```text
ok runtime PRD refresh approval status readable
blocked runtime PRD refresh approval missing
blocked hosted runtime implementation
```

Expected markers after exact approval is separately recorded:

```text
ok runtime PRD refresh approval status readable
ok exact runtime PRD refresh approval recorded
blocked hosted runtime implementation
```

## Exact Approval Text

Do not refresh the public owner-hosted runtime PRD or wrapper-runtime gate as an implementation unit until the owner approves this exact text or an equivalent narrower instruction:

```text
Approved for a future Source-Wire owner-hosted runtime PRD refresh unit: refresh the public owner-hosted runtime PRD and wrapper-runtime gate using the Unit 33 runtime-readiness alignment baseline as redacted metadata only. Keep Source-Wire synthetic-only. Do not add production API runtime, MCP runtime, database migrations, real database connections, live connectors, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, private data, private implementation code, AGPLv3 code copying, or automatic trusted memory promotion. Keep Source-Wire-Memory-Engine separate. MCP must not bypass Source-Wire API policy.
```

## Related Docs

- [Runtime PRD Refresh Approval Request](runtime-prd-refresh-approval-request.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Owner Approval Recorder](owner-approval-recorder.md)
- [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md)
- [Runtime Implementation Decision Gate](runtime-implementation-decision-gate.md)
