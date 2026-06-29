# Source-Wire Runtime-Adjacent Recommendation

Date: 2026-06-29

## Current Recommendation

The next Source-Wire runtime-adjacent unit should be:

**Source-Wire Public Runtime Decision Package**

This should be a decision and documentation unit, not a runtime implementation unit.

## Why This Is Next

The original runtime-adjacent recommendation selected JSON Schema package exports as the safest next package-surface step.

That recommendation was correct and has now been completed.

Source-Wire now has the core public package surface needed before runtime work:

- TypeScript contract types.
- JSON schemas.
- JSON schema package exports.
- Validation CLI.
- Synthetic fixtures.
- TypeScript examples.
- CI package checks.
- Public safety scan.
- Package readiness report.
- Package dry-run.
- Installed-package smoke checks.
- Public adopter walkthrough.
- Public architecture map.
- Refreshed runtime boundary.

The limiting constraint is no longer "make the contract package consumable."

The limiting constraint is choosing the first public runtime boundary without accidentally shipping server, database, MCP, connector, or trusted-memory behavior before the owner approves it.

## What The Next Unit Should Decide

The public runtime decision package should answer:

1. Which runtime layer opens first:
   - API server,
   - MCP server runtime,
   - database migrations,
   - source connector runtime,
   - Mission Control UI,
   - or none yet.

2. What stays private in Jinni versus what becomes public in Source-Wire.

3. Which proof is required before any runtime code is added.

4. How the trust boundary is preserved:

```text
Source evidence is not trusted memory.
Trusted memory requires an owner or application approval path.
```

5. Which public examples remain synthetic and which runtime docs can mention owner-hosted deployments without implying that Source-Wire hosts user data.

## Current Recommended Shape

The safest next unit should produce:

- a public runtime decision doc,
- a runtime option matrix,
- a recommended first runtime lane,
- explicit non-goals,
- acceptance criteria for the first future runtime PRD,
- updated docs links if needed.

It should not add runtime code.

## Historical Recommendation

The original recommendation was:

**Unit 25: JSON Schema Package Exports**

That work is now complete.

The main completed follow-ups are:

1. JSON schema package exports.
2. Tiny validation CLI.
3. CI checks and public safety scan.
4. Package metadata and release gates.
5. Package dry-run and readiness checks.
6. Consumer and installed-package smokes.
7. Public adopter walkthrough.
8. Public architecture map.
9. Runtime boundary refresh.

## What The Next Unit Should Not Build

The next runtime-adjacent unit should not add:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- npm publishing,
- GitHub release publishing,
- deployment,
- real user data,
- trusted Memory Record promotion,
- private implementation code.

## Why Not Runtime Code First

Runtime code carries hard-to-reverse choices:

- storage model,
- auth and namespace boundary,
- owner-hosted deployment shape,
- MCP tool permissions,
- source maintenance permissions,
- trusted-memory approval policy,
- public versus private implementation split.

Those decisions should be explicit before the first public runtime slice.

## Boundary Confirmation

This recommendation does not open runtime implementation.

It keeps Source-Wire as a contracts-only package until a later PRD explicitly opens a runtime lane.
