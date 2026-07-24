# Owner-Hosted Setup Readiness Smoke

This smoke checks the synthetic setup readiness matrix.

It does not start servers, connect databases, run migrations, connect MCP harnesses, crawl private folders, import real source data, deploy services, or create trusted memory.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Command

Run from the repository root:

```bash
npm run owner-hosted-setup:readiness-smoke
```

The smoke is also included in `npm run ci:check`.

## What It Checks

The smoke reads:

- [setup-readiness-fixture-matrix.json](../../examples/fixtures/owner-hosted-setup/setup-readiness-fixture-matrix.json)

It verifies:

- fixture safety is synthetic,
- Source-Wire-hosted memory is off,
- managed hosting is off,
- API and MCP servers are not started,
- database connection and migration are not attempted,
- real source data is absent,
- local path crawling is blocked,
- automatic trusted memory promotion is blocked,
- every required setup readiness case exists,
- ready cases can continue with zero failure records,
- blocked cases cannot continue,
- blocked cases include `failurePoint`, `observedError`, `supportedCause`, `impact`, and `nextAction`,
- source update cases preserve `trustedMemoryRecordDelta: 0` and `noAutoPromotion: true`.

## Required Cases

- `database_ready`
- `database_missing_owner_secret_blocked`
- `api_policy_ready`
- `api_missing_namespace_policy_blocked`
- `mcp_adapter_ready`
- `mcp_policy_bypass_blocked`
- `source_update_snapshot_safe`
- `source_update_folder_crawl_blocked`
- `mission_control_setup_health_ready`

## Related Docs

- [Owner-Hosted Setup Readiness Fixture Matrix](owner-hosted-setup-readiness-fixture-matrix.md)
- [Owner-Hosted Setup Contract](../contracts/owner-hosted-setup-contract.md)
- [Owner-Hosted Setup Issue Slices](owner-hosted-setup-issue-slices.md)
