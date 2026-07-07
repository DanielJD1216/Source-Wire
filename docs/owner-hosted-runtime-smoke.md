# Source-Wire Owner-Hosted Runtime Smoke

Status: implemented as a local synthetic smoke test. Production runtime remains blocked.

Use Node.js 22 with npm from the repository root.

## Command

```bash
npm run runtime:owner-hosted-smoke
```

## Checked Cases

The smoke test checks:

- authorized trusted-memory read,
- source evidence search with citation and gap preservation,
- missing capability denial,
- wrong namespace denial,
- source maintenance without automatic trusted-memory promotion,
- candidate review without trusted-memory creation,
- MCP policy bypass denial,
- MCP source evidence routing,
- MCP source maintenance routing,
- agent trusted-memory approval denial,
- owner or application trusted-memory approval allowance,
- audit metadata preservation.

## Safety Checks

The smoke test also checks:

- fixture safety is `synthetic`,
- Source-Wire does not host user memory,
- no network listener starts,
- no database is touched,
- no live connector is touched,
- no private data is touched,
- no MCP call bypasses API policy,
- no direct database or runtime-adapter MCP tools are exposed,
- no automatic trusted-memory promotion occurs,
- no secret-like or local-path-shaped fixture markers are present.

## Related Files

- `src/owner-hosted-runtime/index.ts`
- `examples/owner-hosted-runtime/owner-hosted-runtime-smoke.mjs`
- `examples/fixtures/owner-hosted-runtime/owner-hosted-runtime-fixture-matrix.json`
