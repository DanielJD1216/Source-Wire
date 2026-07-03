# Owner-Hosted Setup Fixture

This fixture is fictional and synthetic.

It demonstrates the owner-brings setup contract for future BYO owner-hosted Source-Wire usage.

It is not a runtime test.

It does not connect to a database, start an API server, start an MCP server, deploy services, import private sources, or create trusted memory.

## Files

| File | Purpose | CLI schema |
| --- | --- | --- |
| `owner-hosted-setup-checklist.json` | Synthetic owner-brings setup checklist and stop conditions. | Not schema-validated by the current CLI. |

## Covered Requirements

The fixture covers:

- owner device or server,
- PostgreSQL-compatible database,
- owner-controlled secrets,
- owner-selected sources,
- MCP-capable harness,
- owner review time.

## Rules

- Keep all names, IDs, secret references, source labels, and harness names synthetic.
- Do not add real local paths.
- Do not add real domains, emails, account IDs, client names, tokens, or production exports.
- Keep Source-Wire-hosted memory off by default.
- Preserve owner or application-controlled trusted memory promotion.

## Related Docs

- [Owner-Hosted Setup PRD](../../../docs/owner-hosted-setup-prd.md)
- [Owner-Hosted Setup Issue Slices](../../../docs/owner-hosted-setup-issue-slices.md)
