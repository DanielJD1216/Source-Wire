# Wrapper Runtime Fixture Matrix

This fixture is fictional and synthetic.

It demonstrates the public-safe categories needed for the future Source-Wire wrapper runtime.

It is not a runtime test.

It is not currently schema-validated by the CLI.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../docs/quickstart.md).

## Files

| File | Purpose | CLI schema |
| --- | --- | --- |
| `wrapper-runtime-fixture-matrix.json` | Synthetic fixture categories and proof cases for the wrapper runtime policy boundary. | Not schema-validated by the current CLI. |

## Smoke Proof

Run the synthetic owner-hosted API policy wrapper smoke:

```bash
npm run wrapper-runtime:api-policy-smoke
```

Run the synthetic MCP adapter policy routing smoke:

```bash
npm run wrapper-runtime:mcp-adapter-smoke
```

Run the synthetic separate runtime adapter boundary smoke:

```bash
npm run wrapper-runtime:runtime-adapter-smoke
```

The smoke scripts live at:

- [owner-hosted-api-policy-wrapper-smoke.mjs](../../wrapper-runtime/owner-hosted-api-policy-wrapper-smoke.mjs)
- [mcp-adapter-policy-routing-smoke.mjs](../../wrapper-runtime/mcp-adapter-policy-routing-smoke.mjs)
- [separate-runtime-adapter-boundary-smoke.mjs](../../wrapper-runtime/separate-runtime-adapter-boundary-smoke.mjs)

## Covered Categories

The fixture covers:

- owner,
- namespace,
- harness caller,
- capability,
- source evidence,
- trusted memory,
- candidate,
- denied access,
- gaps,
- MCP calls,
- audit events,
- runtime adapter result.

## Rules

- Keep all IDs, token references, project names, timestamps, source text, and citations synthetic.
- Do not add real local paths.
- Do not add real domains, emails, account IDs, client names, tokens, screenshots, or production exports.
- Keep source evidence separate from trusted memory.
- Preserve `noAutoPromotion`.
- Preserve the rule that MCP routes through Source-Wire API policy.

## Related Docs

- [Wrapper Runtime Policy Contract](../../../docs/contracts/wrapper-runtime-policy-contract.md)
- [Wrapper Runtime Fixture Matrix](../../../docs/memory-engine-wrapper-runtime-fixture-matrix.md)
