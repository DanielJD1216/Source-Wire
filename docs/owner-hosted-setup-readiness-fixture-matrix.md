# Owner-Hosted Setup Readiness Fixture Matrix

This matrix defines synthetic readiness cases for the future BYO owner-hosted setup package.

It is fixture data only.

It does not start servers, connect databases, run migrations, crawl private folders, import real source data, deploy services, or create trusted memory.

## Fixture

Fixture file:

- [setup-readiness-fixture-matrix.json](../examples/fixtures/owner-hosted-setup/setup-readiness-fixture-matrix.json)

Fixture safety:

- synthetic owner,
- synthetic database references,
- synthetic API policy configuration,
- synthetic MCP harness configuration,
- synthetic source update packets,
- synthetic Mission Control setup health state.

## Covered Cases

| Area | Ready Case | Blocked Case |
| --- | --- | --- |
| Database | `database_ready` | `database_missing_owner_secret_blocked` |
| API | `api_policy_ready` | `api_missing_namespace_policy_blocked` |
| MCP | `mcp_adapter_ready` | `mcp_policy_bypass_blocked` |
| Source update | `source_update_snapshot_safe` | `source_update_folder_crawl_blocked` |
| Mission Control | `mission_control_setup_health_ready` | Future blocked UI cases belong in a later slice. |

## No-Auto-Promotion

The source update cases represent:

- `trustedMemoryRecordDelta: 0`,
- `noAutoPromotion: true`,
- owner-selected source packets,
- local path crawling blocked,
- broad import blocked.

Trusted memory promotion remains owner or application controlled.

## Mission Control Health

The Mission Control case represents the setup status a nontechnical owner should eventually see:

- database status,
- API policy status,
- MCP harness status,
- source update safety,
- review queue status.

This is not a Mission Control implementation.

It is an input fixture for later setup smoke and UI work.

## Stop Conditions

Any future setup smoke should block when:

- a real secret is requested,
- a real local path is crawled,
- a broad import is requested,
- MCP bypasses Source-Wire API policy,
- namespace policy is missing,
- trusted memory is promoted automatically,
- runtime or deployment starts without a separate approved implementation unit.

## Related Docs

- [Owner-Hosted Setup Contract](contracts/owner-hosted-setup-contract.md)
- [Owner-Hosted Setup PRD](owner-hosted-setup-prd.md)
- [Owner-Hosted Setup Issue Slices](owner-hosted-setup-issue-slices.md)
