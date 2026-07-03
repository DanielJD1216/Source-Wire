# Owner-Hosted Setup Fixture

This fixture is fictional and synthetic.

It demonstrates the owner-brings setup contract for future BYO owner-hosted Source-Wire usage.

It is not a runtime test.

It does not connect to a database, start an API server, start an MCP server, deploy services, import private sources, or create trusted memory.

## Files

| File | Purpose | CLI schema |
| --- | --- | --- |
| `owner-hosted-setup-checklist.json` | Synthetic owner-brings setup checklist and stop conditions. | Not schema-validated by the current CLI. |
| `setup-readiness-fixture-matrix.json` | Synthetic ready and blocked setup cases for database, API, MCP, source update safety, and Mission Control health. | Not schema-validated by the current CLI. |

## Covered Requirements

The fixture covers:

- owner device or server,
- PostgreSQL-compatible database,
- owner-controlled secrets,
- owner-selected sources,
- MCP-capable harness,
- owner review time.

## Readiness Matrix

The readiness matrix covers:

- database ready and blocked,
- API policy ready and blocked,
- MCP adapter ready and blocked,
- source update safe and blocked,
- Mission Control setup health,
- no automatic trusted memory promotion.

The matrix is fixture data only.

It does not connect to a database, start an API server, start an MCP server, crawl folders, import private source data, or create trusted memory.

## Rules

- Keep all names, IDs, secret references, source labels, and harness names synthetic.
- Do not add real local paths.
- Do not add real domains, emails, account IDs, client names, tokens, or production exports.
- Keep Source-Wire-hosted memory off by default.
- Preserve owner or application-controlled trusted memory promotion.

## Related Docs

- [Owner-Hosted Setup PRD](../../../docs/owner-hosted-setup-prd.md)
- [Owner-Hosted Setup Issue Slices](../../../docs/owner-hosted-setup-issue-slices.md)
