# Owner-Hosted API Plus MCP Boundary Fixture

This fixture is fictional and synthetic.

It demonstrates proof cases for the future owner-hosted API plus MCP boundary.

It is not a runtime test.

It is not schema-validated by the current CLI.

## Files

| File | Purpose | CLI schema |
| --- | --- | --- |
| `boundary-proof-cases.json` | Synthetic proof cases for future API and MCP runtime boundaries. | Not schema-validated by the current CLI. |

## Covered Cases

The fixture covers:

- authorized read,
- unauthorized read,
- wrong-namespace denial,
- source evidence search with citations,
- source maintenance with `noAutoPromotion`,
- pending candidate creation without trusted memory promotion,
- trusted-memory approval through an owner or application-controlled path,
- audit-friendly result metadata.

## Rules

- Keep all IDs, tokens, project names, timestamps, and citations synthetic.
- Do not add real local paths.
- Do not add real domains, emails, account IDs, client names, tokens, or production exports.
- Keep source evidence separate from trusted memory.
- Preserve `noAutoPromotion` in maintenance and candidate examples.

## Related Docs

- [Owner-Hosted API Plus MCP Boundary Contract](../../../docs/contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Public Runtime Decision](../../../docs/public-runtime-decision.md)
