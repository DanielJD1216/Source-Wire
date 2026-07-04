# Runtime Readiness Contract

Source-Wire runtime readiness means the repo can prove the gates that must pass before public owner-hosted runtime implementation starts.

This contract is public and synthetic.

It is not a runtime implementation.

## Package Exports

The package root exports:

- `SOURCE_WIRE_RUNTIME_READINESS_CONTRACT`
- `SOURCE_WIRE_RUNTIME_READINESS_BOUNDARY`
- `SOURCE_WIRE_RUNTIME_READINESS_REQUIRED_CASES`
- `summarizeRuntimeReadinessContract`

It also exports matching TypeScript types:

- `SourceWireRuntimeReadinessContract`
- `SourceWireRuntimeReadinessBoundary`
- `SourceWireRuntimeReadinessCase`
- `SourceWireRuntimeReadinessCategory`
- `SourceWireRuntimeReadinessFailureRecord`
- `SourceWireRuntimeReadinessFixtureMatrix`
- `SourceWireRuntimeReadinessStatus`
- `SourceWireRuntimeReadinessSummary`

## What It Checks

The readiness contract covers:

- private owner workflow proof exists,
- public-safe extraction notes exist,
- API policy is defined without starting a server,
- MCP routes through Source-Wire API policy,
- database posture and migrations remain blocked until approved,
- source updates require caller-supplied snapshots,
- local path crawling and broad private import stay blocked,
- `Source-Wire-Memory-Engine` stays separate,
- AGPLv3 code and private implementation code are not copied,
- release mutation and deployment remain blocked.

## Boundary

The readiness contract explicitly does not include:

- runtime implementation,
- API server runtime,
- MCP server runtime,
- database migrations,
- database connection attempts,
- live connectors,
- deployment,
- managed hosting,
- real user data,
- copied private implementation code,
- copied AGPLv3 code,
- automatic trusted memory promotion,
- package version changes.

## Fixture

Synthetic fixture:

- [Runtime readiness fixture matrix](../../examples/fixtures/runtime-readiness/README.md)

Smoke command:

```bash
npm run runtime-readiness:smoke
```

## Related Docs

- [Runtime Readiness Fixture Matrix](../runtime-readiness-fixture-matrix.md)
- [Runtime Readiness Smoke](../runtime-readiness-smoke.md)
- [Runtime Implementation Decision Gate](../runtime-implementation-decision-gate.md)
- [Owner-Hosted Setup Go/No-Go Gate](../owner-hosted-setup-go-no-go-gate.md)
