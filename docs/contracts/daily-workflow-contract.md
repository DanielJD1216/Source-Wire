# Daily Workflow Contract

Source-Wire daily workflow models a public-safe owner memory loop:

```text
ask -> bounded update -> owner review -> follow-up answer -> Mission Control state
```

This contract is public and synthetic.

It is not a runtime implementation.

## Package Exports

The package root exports:

- `SOURCE_WIRE_DAILY_WORKFLOW_CONTRACT`
- `SOURCE_WIRE_DAILY_WORKFLOW_BOUNDARY`
- `SOURCE_WIRE_DAILY_WORKFLOW_PHASES`
- `SOURCE_WIRE_DAILY_WORKFLOW_REQUIRED_CASES`
- `summarizeDailyWorkflowContract`

It also exports matching TypeScript types:

- `SourceWireDailyWorkflowContract`
- `SourceWireDailyWorkflowBoundary`
- `SourceWireDailyWorkflowCase`
- `SourceWireDailyWorkflowFixtureMatrix`
- `SourceWireDailyWorkflowFailureRecord`
- `SourceWireDailyWorkflowSummary`

## Workflow

The contract covers:

- read-only daily ask,
- bounded update packet,
- owner review,
- follow-up answer,
- Mission Control state.

## Boundary

The daily workflow contract explicitly does not include:

- production runtime,
- API server runtime,
- MCP server runtime,
- database migrations,
- real database connections,
- live connectors,
- local path crawling,
- real user data,
- private implementation code,
- AGPLv3 code,
- automatic trusted memory promotion,
- MCP trusted-memory approval bypass,
- package version changes.

## Fixture

Synthetic fixture:

- [Daily workflow fixture matrix](../../examples/fixtures/daily-workflow/README.md)

The fixture is smoke-validated, not schema-validated.

## Related Docs

- [Daily Workflow Synthetic Smoke](../daily-workflow-synthetic-smoke.md)
- [Daily Workflow Claim Boundary](../daily-workflow-claim-boundary.md)
- [`second-brain.v1` Contract](second-brain-v1-contract.md)
