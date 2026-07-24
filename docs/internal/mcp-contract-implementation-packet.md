# Source-Wire MCP Contract Implementation Packet

Status: implemented as a synthetic MCP adapter contract package after exact owner approval.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

The Source-Wire MCP-related unit is now a public-safe synthetic MCP adapter contract package, not an MCP server runtime.

This packet records the exact unit implemented after owner approval:

```text
synthetic tool declarations
  + synthetic input validation fixtures
  + synthetic MCP-to-API envelope fixtures
  + synthetic denied-result, citation, gap, and audit checks
  + no running MCP server
  + no API bypass
  + no database connection
```

## Why This Is The Next Unit

The API contract defines where policy is enforced.

The MCP contract defines how agent harnesses reach that policy boundary. Codex, Claude Code, OpenClaw, and other MCP-capable tools should get simple tool shapes, but MCP must not become a second permission system.

## Exact Approval Text

Copy this only when the owner is ready to approve the future implementation unit:

```text
Approved for a future Source-Wire MCP contract implementation unit: build a public-safe synthetic MCP adapter contract package and validation smoke tests for tool declarations, input validation, MCP-to-API envelopes, capability mapping, namespace forwarding, denied results, citation and gap preservation, audit metadata, source evidence search, trusted memory search, context assembly, candidate review, source maintenance, handoff and status evidence, and trusted-memory approval boundaries. Use synthetic fixtures only. Do not add MCP server runtime implementation, API server implementation, route handlers, database migrations, real database connections, PostgreSQL or pgvector setup, runtime adapter implementation, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.
```

## What Approval Unlocked

Only this was unlocked:

- public-safe MCP adapter contract types,
- synthetic tool declaration fixtures,
- synthetic input validation fixtures,
- synthetic MCP-to-API envelope fixtures,
- synthetic capability mapping fixtures,
- synthetic namespace forwarding fixtures,
- synthetic denied-result fixtures,
- synthetic citation and gap preservation fixtures,
- synthetic audit metadata fixtures,
- synthetic source evidence search fixtures,
- synthetic trusted memory search fixtures,
- synthetic context assembly fixtures,
- synthetic candidate review fixtures,
- synthetic source maintenance fixtures,
- synthetic handoff and status evidence fixtures,
- synthetic trusted-memory approval boundary fixtures,
- local smoke tests,
- docs and readiness gate updates.

The approved synthetic MCP adapter contract package is recorded in [MCP Adapter Contract Implementation Proof](mcp-adapter-contract-implementation-proof.md).

## What Approval Would Not Unlock

Still blocked:

- MCP server runtime implementation,
- API server implementation,
- route handlers,
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

The implementation was allowed only after these gates passed:

```bash
npm run runtime:mcp-implementation-packet
npm run runtime:mcp-contract
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

## Implementation Verification

After implementation, run:

```bash
npm run runtime:mcp-adapter-smoke
npm run runtime:mcp-implementation-packet
```

## Implementation Slice Map

Use [MCP Contract Implementation Slices](mcp-contract-implementation-slices.md) as the implementation slice map after approval.

## Owner Approval Recording

After explicit owner approval, record it with:

```bash
npm run owner:record-approval -- --target mcp-contract-implementation --write --confirm-exact "<exact approval text>"
```

Then check:

```bash
npm run owner:decision-status
npm run owner:open-issues-status
```

## Related Docs

- [MCP Contract Implementation Slices](mcp-contract-implementation-slices.md)
- [MCP Adapter Contract Implementation Proof](mcp-adapter-contract-implementation-proof.md)
- [MCP Adapter Contract Smoke](mcp-adapter-contract-smoke.md)
- [Hosted Runtime MCP Server Contract](hosted-runtime-mcp-server-contract.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)
- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [API Contract Implementation Packet](api-contract-implementation-packet.md)
- [Threat Model Implementation Packet](threat-model-implementation-packet.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Deployment Boundary Implementation Packet](deployment-boundary-implementation-packet.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
