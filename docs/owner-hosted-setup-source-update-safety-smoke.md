# Owner-Hosted Setup Source Update Safety Smoke

This smoke checks the source update safety cases in the synthetic setup readiness matrix.

It does not run live connectors, import a vault, crawl the local filesystem, start a server, connect a database, or promote trusted memory.

## Command

Run from the repository root:

```bash
npm run owner-hosted-setup:source-update-safety-smoke
```

The smoke is also included in `npm run ci:check`.

## What It Checks

The smoke reads:

- [setup-readiness-fixture-matrix.json](../examples/fixtures/owner-hosted-setup/setup-readiness-fixture-matrix.json)

It verifies:

- fixture safety is synthetic,
- no real source data is included,
- local path crawling is blocked at the boundary,
- automatic trusted memory promotion is blocked at the boundary,
- safe source update requires a caller-supplied snapshot,
- safe source update requires an owner-selected source,
- local folder crawling stays blocked,
- broad private import stays blocked,
- trusted memory delta stays `0`,
- `noAutoPromotion: true` is visible,
- pending review remains `owner_or_application_controlled`,
- the blocked folder-crawl case includes shaped failure records.

## Required Source Update Cases

- `source_update_snapshot_safe`
- `source_update_folder_crawl_blocked`

## Related Docs

- [Owner-Hosted Setup Readiness Smoke](owner-hosted-setup-readiness-smoke.md)
- [Owner-Hosted Setup Readiness Fixture Matrix](owner-hosted-setup-readiness-fixture-matrix.md)
- [Owner-Hosted Setup Issue Slices](owner-hosted-setup-issue-slices.md)
