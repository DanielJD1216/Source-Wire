# Daily Workflow Synthetic Smoke

This smoke checks the daily workflow cases in the synthetic fixture matrix.

It does not start a server, connect a database, run MCP, crawl the local filesystem, import real sources, or promote trusted memory automatically.

## Command

Run from the repository root:

```bash
npm run daily-workflow:smoke
```

The smoke is also included in `npm run ci:check`.

## What It Checks

The smoke reads:

- [daily-workflow-fixture-matrix.json](../examples/fixtures/daily-workflow/daily-workflow-fixture-matrix.json)

It verifies:

- fixture safety is synthetic,
- runtime is not included,
- API and MCP server runtime are not included,
- database migrations and real database connections are not included,
- local path crawling is blocked,
- real user data is not included,
- AGPLv3 and private implementation code are not copied,
- automatic trusted memory promotion is blocked,
- MCP cannot approve trusted memory,
- normal asks keep trusted memory delta `0`,
- update packets keep trusted memory delta `0`,
- folder crawl requests are blocked,
- owner approval creates exactly one trusted memory record in the fixture model,
- owner rejection creates zero trusted memory records,
- follow-up answers use approved trusted memory,
- pending and rejected candidates are excluded from trusted answer evidence,
- blocked cases include shaped failure records.

## Required Cases

- `daily_ask_trusted_citation`
- `daily_ask_missing_evidence_gap`
- `bounded_update_pending_review`
- `bounded_update_missing_snapshot_blocked`
- `bounded_update_folder_crawl_blocked`
- `owner_review_approval`
- `owner_review_rejection`
- `owner_review_mcp_bypass_denied`
- `follow_up_uses_approved_memory`
- `follow_up_excludes_pending_candidate`
- `follow_up_excludes_rejected_candidate`
- `mission_control_daily_summary`

## Related Docs

- [Daily Workflow Contract](contracts/daily-workflow-contract.md)
- [Daily Workflow Claim Boundary](daily-workflow-claim-boundary.md)
