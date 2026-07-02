# Source-Wire Hosted Runtime Child Issue Approval Status

Status: owner-side read-only approval status.

This command checks whether the exact hosted-runtime child issue publication approval has been separately recorded. It does not publish child issues, implement hosted runtime behavior, add API server runtime, add MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this command before any future child issue publication unit to separate two questions:

- Is the hosted runtime PRD approved? That is tracked by issue `#257`.
- Is child issue publication approved? That needs the separate exact approval text below.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:child-issue-approval-status
```

This command uses live GitHub issue state and owner-side `gh` access, so it is intentionally covered by `npm run world:share-final-preflight` instead of the public reviewer `npm run publish:readiness` gate.

Current expected markers before approval:

```text
ok hosted runtime child issue approval status readable
blocked hosted runtime child issue publication approval missing
blocked hosted runtime implementation
```

Expected markers after exact approval is separately recorded:

```text
ok hosted runtime child issue approval status readable
ok exact hosted runtime child issue publication approval recorded
blocked hosted runtime implementation
```

## Exact Approval Text

Do not publish child issues until the owner approves this exact approval text:

```text
Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.
```

## Related Docs

- [Hosted Runtime Child Issue Publication Packet](hosted-runtime-child-issue-publication-packet.md)
- [Hosted Runtime Child Issue Publisher](hosted-runtime-child-issue-publisher.md)
- [Hosted Runtime Slice Approval Request](hosted-runtime-slice-approval-request.md)
- [World Share Final Preflight](world-share-final-preflight.md)
