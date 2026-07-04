# Source-Wire Threat Model Implementation Packet

Status: implemented as a synthetic trust-boundary package after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Answer

Source-Wire now has a public-safe synthetic threat model package, not a production runtime.

This packet records the exact unit implemented after owner approval:

```text
synthetic threat cases
  + synthetic trust-boundary fixtures
  + fail-closed validation smoke
  + no API server runtime
  + no MCP server runtime
  + no database connection
```

## Why This Is The Next Unit

The runtime skeleton proves the API policy route and MCP adapter shape.

The next limiting constraint is trust: the system must prove what happens when callers are unauthorized, namespaces are wrong, source text is hostile, audit durability is missing, secrets are present, backups are risky, or MCP tries to bypass the API policy boundary.

## Exact Approval Text

The owner approved this implementation unit:

```text
Approved for a future Source-Wire threat model implementation unit: build a public-safe synthetic trust-boundary package and validation smoke tests for unauthorized callers, cross-namespace access, source-to-memory separation, prompt-injection handling, secrets handling, audit gaps, backup and restore risk, deployment misconfiguration, MCP bypass prevention, and owner/application-controlled trusted memory approval. Use synthetic fixtures only. Do not add API server implementation, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.
```

## What Approval Unlocked

Only this:

- public-safe threat case contract types,
- synthetic unauthorized caller fixtures,
- synthetic cross-namespace denial fixtures,
- synthetic source-to-memory separation fixtures,
- synthetic prompt-injection fixtures,
- synthetic secrets-handling fixtures,
- synthetic audit-gap fixtures,
- synthetic backup and restore risk fixtures,
- synthetic deployment-misconfiguration fixtures,
- synthetic MCP bypass prevention fixtures,
- local smoke tests,
- docs and readiness gate updates.

## What Approval Would Not Unlock

Still blocked:

- API server implementation,
- MCP server runtime implementation,
- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- live connectors,
- Mission Control UI,
- deployment config,
- cloud provider config,
- Docker or container deployment config for runtime services,
- hosted services,
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

## Implementation Verification Gates

After implementation, run:

```bash
npm run runtime:threat-boundary-smoke
npm run runtime:threat-implementation-packet
npm run runtime:threat-model
npm run runtime:skeleton-smoke
npm run runtime:database-implementation-packet
npm run runtime:fixture-implementation-packet
npm run runtime:deployment-implementation-packet
npm run runtime-proof-intake:smoke
npm run runtime-readiness:smoke
npm run safety:scan
npm run claims:scan
```

## Implementation Slice Map

Use [Threat Model Implementation Slices](threat-model-implementation-slices.md) as the implementation slice map after approval.

## Owner Approval Recording

The explicit owner approval was recorded with:

```bash
npm run owner:record-approval -- --target threat-model-implementation --write --confirm-exact "<exact approval text>"
```

Then check:

```bash
npm run owner:decision-status
npm run owner:open-issues-status
```

## Related Docs

- [Runtime Threat Boundary Implementation Proof](runtime-threat-boundary-implementation-proof.md)
- [Runtime Threat Boundary Smoke](runtime-threat-boundary-smoke.md)
- [Threat Model Implementation Slices](threat-model-implementation-slices.md)
- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Deployment Boundary Implementation Packet](deployment-boundary-implementation-packet.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
