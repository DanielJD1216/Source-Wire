# Source-Wire API Contract Implementation Packet

Status: implemented as a synthetic API policy contract package after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

The next Source-Wire API-related unit should be a public-safe synthetic API policy contract package, not an API server.

This packet defines the exact unit that was implemented after owner approval:

```text
synthetic request envelopes
  + synthetic endpoint group fixtures
  + synthetic capability, namespace, denied-result, citation, gap, and audit checks
  + no route handlers
  + no API server runtime
  + no database connection
```

## Why This Is The Next Unit

The threat model defines what must fail closed.

The API contract defines where policy must be enforced. Future MCP tools, connectors, runtime adapters, and agent harnesses must route through this API policy boundary instead of inventing their own permission logic.

## Exact Approval Text

Copy this only when the owner is ready to approve the future implementation unit:

```text
Approved for a future Source-Wire API contract implementation unit: build a public-safe synthetic API policy contract package and validation smoke tests for request envelopes, endpoint groups, capability checks, namespace resolution, denied results, citations and gaps, audit metadata, source maintenance, candidate review, trusted-memory approval boundaries, handoff and status evidence, and MCP-through-API policy routing. Use synthetic fixtures only. Do not add API server implementation, route handlers, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, runtime adapter implementation, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.
```

## What Approval Would Unlock

Only this was unlocked:

- public-safe API policy contract types,
- synthetic request envelope fixtures,
- synthetic endpoint group fixtures,
- synthetic capability-check fixtures,
- synthetic namespace-resolution fixtures,
- synthetic denied-result fixtures,
- synthetic citation and gap fixtures,
- synthetic audit metadata fixtures,
- synthetic source-maintenance fixtures,
- synthetic candidate-review fixtures,
- synthetic trusted-memory approval boundary fixtures,
- synthetic handoff and status evidence fixtures,
- synthetic MCP-through-API routing fixtures,
- local smoke tests,
- docs and readiness gate updates.

## Implementation Proof

The approved synthetic API policy contract package is recorded in [API Policy Contract Implementation Proof](api-policy-contract-implementation-proof.md).

It is verified by:

```bash
npm run runtime:api-policy-smoke
npm run runtime:api-implementation-packet
```

## What Approval Would Not Unlock

Still blocked:

- API server implementation,
- route handlers,
- MCP server runtime implementation,
- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- runtime adapter implementation,
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

## Pre-Implementation Gates

Before implementation starts, run:

```bash
npm run runtime:api-implementation-packet
npm run runtime:api-contract
npm run runtime:threat-implementation-packet
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

Use [API Contract Implementation Slices](api-contract-implementation-slices.md) as the implementation slice map.

## Owner Approval Recording

After explicit owner approval, record it with:

```bash
npm run owner:record-approval -- --target api-contract-implementation --write --confirm-exact "<exact approval text>"
```

Then check:

```bash
npm run owner:decision-status
npm run owner:open-issues-status
```

## Related Docs

- [API Contract Implementation Slices](api-contract-implementation-slices.md)
- [API Policy Contract Implementation Proof](api-policy-contract-implementation-proof.md)
- [API Policy Contract Smoke](api-policy-contract-smoke.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)
- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Threat Model Implementation Packet](threat-model-implementation-packet.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Deployment Boundary Implementation Packet](deployment-boundary-implementation-packet.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
