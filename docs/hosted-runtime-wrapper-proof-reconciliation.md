# Source-Wire Hosted Runtime Wrapper Proof Reconciliation

Status: reconciliation checkpoint. Hosted runtime implementation remains blocked.

This document reconciles the older synthetic wrapper-runtime proof with the newer hosted-runtime planning gates from issues `#259` through `#264`. It does not add hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, npm publishing, a GitHub release, tags, or code contribution acceptance.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Purpose

The repository now has two related bodies of work:

1. The synthetic wrapper-runtime proof, which already proves a narrow policy wrapper and MCP adapter path with fake data.
2. The hosted-runtime planning gates, which now define the threat model, API contract, MCP contract, database posture, fixture plan, deployment boundary, and stop conditions.

This checkpoint answers one practical question:

```text
Can the existing synthetic wrapper proof be treated as aligned with the hosted-runtime gates?
```

Answer:

```text
Yes, as a synthetic proof only.
No, not as a real owner-hosted runtime yet.
```

## Reconciliation Verdict

The existing synthetic wrapper-runtime proof is aligned with the hosted-runtime gates because it preserves:

- owner-hosted first posture,
- no managed-hosted behavior,
- no real user data,
- no deployment,
- no database migrations,
- no direct `Source-Wire-Memory-Engine` merge,
- no AGPLv3 code copying,
- MCP routes through Source-Wire API policy,
- source evidence stays separate from trusted memory,
- trusted memory promotion remains owner or application controlled,
- synthetic fixtures only,
- public safety and claim boundary gates.

The proof does not make Source-Wire ready as a real memory backend. It remains a synthetic public-safe proof.

## Gate Mapping

| Hosted-runtime gate | Wrapper-runtime evidence | Status |
| --- | --- | --- |
| `#259` Threat model and trust boundary | [Wrapper Runtime Policy Contract](contracts/wrapper-runtime-policy-contract.md) plus wrapper stop conditions. | Aligned for synthetic proof. |
| `#260` API server runtime contract | [API Policy Wrapper Smoke](memory-engine-wrapper-runtime-api-policy-wrapper-smoke.md) and `npm run wrapper-runtime:api-policy-smoke`. | Aligned at policy seam only, no server runtime. |
| `#261` MCP server runtime contract | [MCP Adapter Policy Routing Smoke](memory-engine-wrapper-runtime-mcp-adapter-policy-routing-smoke.md) and `npm run wrapper-runtime:mcp-adapter-smoke`. | Aligned at adapter seam only, no MCP server runtime. |
| `#262` Database posture and data lifecycle | Wrapper proof has no database connection, no schema, and no migrations. | Aligned by absence, not by database implementation. |
| `#263` Public-safe fixture and verification plan | [Wrapper Runtime Fixture Matrix](memory-engine-wrapper-runtime-fixture-matrix.md) and `examples/fixtures/wrapper-runtime/wrapper-runtime-fixture-matrix.json`. | Aligned for synthetic fixture coverage. |
| `#264` Deployment boundary and stop conditions | [Wrapper Runtime Proof Docs And Stop Conditions](memory-engine-wrapper-runtime-proof-docs-stop-conditions.md). | Aligned because deployment remains blocked. |

## Required Commands

Run this reconciliation command:

```bash
npm run runtime:wrapper-reconciliation
```

It checks the reconciliation doc and verifies that the required wrapper and hosted-runtime artifacts exist.

Minimum supporting gates:

```bash
npm run runtime:threat-model
npm run runtime:api-contract
npm run runtime:mcp-contract
npm run runtime:database-posture
npm run runtime:fixture-plan
npm run runtime:deployment-boundary
npm run wrapper-runtime:api-policy-smoke
npm run wrapper-runtime:mcp-adapter-smoke
npm run wrapper-runtime:runtime-adapter-smoke
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run safety:scan
npm run claims:scan
```

## What This Allows Next

This reconciliation allows planning to move to the next approval gate:

```text
future narrow owner-hosted API policy wrapper and MCP adapter implementation unit
```

That next unit must be explicit and must stay synthetic unless the owner separately approves real owner-hosted runtime behavior.

## What This Does Not Allow

This checkpoint does not allow:

- production API runtime,
- production MCP runtime,
- database schema or migrations,
- live source imports,
- real source maintenance,
- real trusted-memory approval flows,
- Mission Control UI,
- owner-hosted setup wizard,
- Source-Wire-managed hosting,
- managed-hosted behavior,
- Docker packaging,
- installer packaging,
- `Source-Wire-Memory-Engine` integration,
- direct runtime merge,
- AGPLv3 code copying,
- npm release mutation,
- GitHub release mutation,
- public contribution acceptance,
- real user data,
- client data,
- deployment.

## Remaining Gap

The remaining gap to the actual product goal is still physical runtime capability.

Plain English:

```text
We have contracts and synthetic proof.
We do not yet have a real owner-run Source-Wire memory service that another person can fork, configure, connect to their own database, and call from MCP-capable tools.
```

The narrow owner-hosted runtime skeleton path is now recorded separately. That skeleton turns the proven policy seams into synthetic runnable package code while preserving all stop conditions.

The private proof trail and the next public-safe extraction gate are now summarized in [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md). Verify that checkpoint with:

```bash
npm run runtime:extraction-readiness
```
