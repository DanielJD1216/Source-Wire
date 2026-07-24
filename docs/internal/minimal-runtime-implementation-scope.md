# Source-Wire Minimal Runtime Implementation Scope

Status: minimal synthetic runtime boundary implemented. Hosted runtime implementation remains blocked.

## Allowed Runtime Shape

The first implementation is only:

```text
synthetic in-memory policy boundary
  + owner-hosted API route facade
  + MCP tool facade
  + local smoke tests
```

The runtime stays synthetic, local, and owner-hosted.

## Public File Areas

Unit 236 uses public paths under:

- `src/runtime/`
- `examples/minimal-runtime/`
- public docs that link the smoke proof

Hosted runtime file lists must be approved before implementation starts.

## Required Runtime Behaviors

The minimal runtime boundary must:

- deny missing permissions,
- deny wrong namespaces,
- preserve omitted counts without leaking denied content,
- return citations for source evidence,
- label trusted memory separately from source evidence,
- keep pending candidates out of trusted memory,
- require owner or application control for approval,
- keep `noAutoPromotion` true for source maintenance,
- make MCP tools call API policy,
- return audit-friendly metadata.

## Required Non-Behaviors

The minimal runtime boundary must not:

- connect to a database,
- require secrets,
- crawl local files,
- connect live sources,
- run a real MCP server process unless explicitly approved in that later implementation unit,
- create trusted Memory Records automatically,
- store user memory,
- imply Source-Wire hosts memory,
- publish npm,
- deploy anything.

## Verification Requirements

Before running repository commands, use the [Quickstart](../getting-started/quickstart.md) for Node.js 22, npm, and repository-root setup.

Unit 236 and later runtime-boundary units must pass:

- `npm run typecheck`,
- `npm run build`,
- `npm run test`,
- `npm run cli:smoke`,
- `npm run minimal-runtime:smoke`,
- `npm run runtime-boundary:smoke`,
- `npm run safety:scan`,
- `npm run publish:readiness`.

## Stop Conditions

Stop runtime implementation if any of these become necessary:

- real credentials,
- real user data,
- database migrations,
- storage schema,
- public deployment,
- Mission Control UI,
- memory-engine integration,
- live connector access,
- automatic trusted-memory promotion.
