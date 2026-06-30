# Source-Wire Minimal Runtime Issue Slices

Status: implemented for minimal synthetic in-memory runtime boundary. Hosted runtime implementation remains blocked.

## Parent

Implemented parent:

```text
Source-Wire Minimal Runtime Boundary Implementation
```

## Slice 1: Runtime Boundary Contracts And File Scope

Goal:

- define exact public implementation files,
- keep runtime scope owner-hosted API plus MCP boundary only,
- prove no database, deployment, Mission Control, memory engine, live connectors, real data, or npm publishing.

Acceptance criteria:

- implementation file list is exact,
- package remains contracts-first,
- no secret or real data is required,
- public safety scan remains clean.

## Slice 2: Minimal Owner-Hosted API Boundary

Goal:

- add a tiny API policy boundary that validates synthetic caller, namespace, action, and permission inputs.

Acceptance criteria:

- authorized synthetic read passes,
- unauthorized read fails closed,
- wrong namespace fails closed without content leakage,
- source evidence and trusted memory remain separate,
- audit metadata is returned.

## Slice 3: Minimal MCP Tool Boundary

Goal:

- add a tiny MCP-facing facade that calls the API boundary and cannot bypass policy.

Acceptance criteria:

- MCP read tool calls API policy,
- MCP source maintenance tool preserves `noAutoPromotion`,
- MCP denied namespace result returns omitted counts without leaked content,
- MCP results preserve citations and gaps.

## Slice 4: Synthetic Runtime Fixtures And Smokes

Goal:

- wire the owner-hosted API plus MCP boundary fixture into runtime smoke tests.

Acceptance criteria:

- all synthetic proof cases pass,
- failure diagnostics name the failed case and next action,
- no real data is required,
- no external services are required.

## Slice 5: Public Docs And Readiness

Goal:

- document the minimal runtime boundary and keep package readiness green.

Before running repository commands, use the [Quickstart](quickstart.md) for Node.js 22, npm, and repository-root setup.

Acceptance criteria:

- docs state Source-Wire still does not host memory,
- docs state database migrations remain blocked,
- docs state Mission Control remains blocked,
- `npm run minimal-runtime:smoke` passes,
- `npm run publish:readiness` passes,
- public safety scan reports 0 high, 0 medium, and 0 low findings.

## Still Blocked After These Slices

Even after the minimal runtime boundary exists, these remain blocked until later PRDs:

- database migrations,
- PostgreSQL or pgvector setup,
- storage schema,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- deployment,
- npm publishing,
- GitHub release publishing,
- real user data,
- trusted-memory auto-promotion.
