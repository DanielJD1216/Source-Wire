# Source-Wire Public-Safe Fixture Implementation Proof

Status: implemented as a synthetic hosted-runtime fixture package after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

Source-Wire now includes a synthetic hosted-runtime fixture package.

It proves caller identity, namespace access, source evidence, memory candidates, trusted memory, denied results, audit metadata, MCP-through-API policy routing, and no automatic trusted memory promotion without adding database migrations, real database connections, PostgreSQL setup, pgvector setup, API server runtime, MCP server runtime, live connectors, Mission Control UI, deployment, managed hosting, real data, client data, private implementation code, or AGPLv3 code.

## Implemented Surface

- `src/contracts/hosted-runtime-fixtures.ts`
- `examples/fixtures/hosted-runtime/hosted-runtime-fixture-matrix.json`
- `examples/fixtures/hosted-runtime/README.md`
- `examples/hosted-runtime-fixtures/hosted-runtime-fixtures-smoke.mjs`
- `examples/hosted-runtime-fixtures/README.md`
- `docs/public-safe-fixture-smoke.md`
- `docs/public-safe-fixture-implementation-packet.md`
- `docs/public-safe-fixture-implementation-slices.md`

## What It Proves

- authorized owner and owner-agent calls can read allowed synthetic records,
- unauthorized callers are denied without leaking restricted content,
- wrong namespace requests are denied without leaking restricted content,
- source evidence search preserves citation behavior,
- memory candidates can be prepared without trusted-memory auto-promotion,
- trusted memory reads depend on approved fixture state,
- source maintenance preserves no-auto-promotion,
- MCP requests must route through the Source-Wire API policy envelope,
- allowed and denied cases both keep audit metadata,
- stale or deleted source evidence returns a gap instead of private content,
- owner or application control is required for trusted-memory approval.

## Still Blocked

- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- production API runtime,
- production MCP runtime,
- live connectors,
- Mission Control UI,
- deployment,
- managed hosting,
- npm publishing,
- GitHub release creation,
- package version changes,
- public contribution acceptance,
- Source-Wire-Memory-Engine code merge,
- AGPLv3 code copying,
- private implementation code copying,
- real user data,
- client data,
- real local paths,
- account IDs,
- emails,
- domains,
- tokens,
- screenshots,
- production exports,
- private proof content,
- automatic trusted memory promotion.

## Verification

```bash
npm run runtime:fixture-smoke
npm run runtime:fixture-implementation-packet
```

Expected markers:

```text
ok hosted runtime fixture smoke
ok synthetic public-safe fixture implementation recorded
ok public-safe fixture implementation slices complete
blocked hosted runtime implementation
```

## Related Docs

- [Public-Safe Fixture Smoke](public-safe-fixture-smoke.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Public-Safe Fixture Implementation Slices](public-safe-fixture-implementation-slices.md)
- [Hosted Runtime Public-Safe Fixture And Verification Plan](hosted-runtime-public-safe-fixture-verification-plan.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
