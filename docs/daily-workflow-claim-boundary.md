# Daily Workflow Claim Boundary

Source-Wire now includes a synthetic daily workflow contract, fixture matrix, and smoke test.

This is not a production runtime.

## Safe Claims

It is safe to say:

- Source-Wire models a daily owner memory workflow.
- The workflow is synthetic and public-safe.
- Normal asks are read-only in the fixture model.
- Update packets require caller-supplied snapshots in the fixture model.
- Folder crawling is blocked in the fixture model.
- Trusted memory promotion remains owner or approved-application controlled.
- MCP cannot approve trusted memory directly in the fixture model.
- Follow-up answers separate approved trusted memory from pending, rejected, source-only, and gap evidence.

## Unsafe Claims

Do not claim:

- Source-Wire now has production API runtime for this workflow.
- Source-Wire now has MCP server runtime for this workflow.
- Source-Wire now includes database migrations for this workflow.
- Source-Wire connects to a real database.
- Source-Wire imports real user sources.
- Source-Wire crawls local folders.
- Source-Wire includes Mission Control UI.
- Source-Wire hosts user memory.
- Source-Wire copies non-public implementation code.
- Source-Wire copies AGPLv3 memory-engine code.
- Source-Wire automatically promotes trusted memory.

## Current Boundary

The current package can:

- export public TypeScript contracts,
- carry synthetic fixtures,
- run local synthetic smoke checks,
- document public claim boundaries.

The current package cannot:

- run a memory backend,
- serve an API,
- serve MCP tools,
- migrate a database,
- connect live sources,
- provide hosted memory.

## Related Docs

- [Daily Workflow Contract](contracts/daily-workflow-contract.md)
- [Daily Workflow Synthetic Smoke](daily-workflow-synthetic-smoke.md)
- [Public Status](public-status.md)
