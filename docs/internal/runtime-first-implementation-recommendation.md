# Source-Wire First Runtime Implementation Recommendation

Status: recommendation and preflight only. Runtime implementation remains blocked until exact owner approval is recorded on the focused implementation issue.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

The first runtime implementation approval should be issue `#259`, target `threat-model-implementation`.

Run:

```bash
npm run runtime:first-implementation-recommendation
```

This command explains why the threat model comes first, verifies the packet and slice map are present, prints the exact approval text, and keeps implementation blocked.

## Why Threat Model First

The threat model defines what every later layer must fail closed against:

- unauthorized callers,
- cross-namespace access,
- source evidence being treated as trusted memory,
- prompt injection,
- secret leakage,
- audit gaps,
- backup and restore risk,
- deployment misconfiguration,
- MCP bypass,
- owner or application controlled trusted-memory approval.

API, MCP, database, fixture, and deployment implementation slices should not begin before this boundary is explicit.

## Exact Approval Target

Issue:

```text
#259 Hosted Runtime Threat Model And Trust Boundary
```

Target:

```text
threat-model-implementation
```

Approval recorder dry run:

```bash
npm run owner:record-approval -- --target threat-model-implementation
```

## What This Recommendation Does Not Do

It does not:

- record owner approval,
- implement hosted runtime behavior,
- add API server runtime,
- add MCP server runtime,
- add route handlers,
- add database migrations,
- connect to PostgreSQL or pgvector,
- add live connectors,
- add Mission Control UI,
- deploy services,
- publish npm,
- create a GitHub release,
- create tags,
- accept code contributions,
- add real user data,
- approve production runtime use.

## Related Docs

- [Threat Model Implementation Packet](threat-model-implementation-packet.md)
- [Threat Model Implementation Slices](threat-model-implementation-slices.md)
- [Runtime Implementation Approval Status](runtime-implementation-approval-status.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)
