# Source-Wire Runtime Implementation Gate

Status: implementation gate with minimal synthetic runtime boundary, synthetic runtime skeleton, synthetic owner-hosted API and MCP runtime skeleton, synthetic threat-boundary package, synthetic API policy contract package, synthetic MCP adapter contract package, synthetic database posture package, synthetic hosted-runtime fixture package, and synthetic deployment-boundary package. Production runtime remains blocked.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Purpose

This gate prevents hosted Source-Wire runtime work from starting just because boundary docs, synthetic fixtures, and a minimal synthetic runtime boundary now exist.

Source-Wire is still a public contract package with exported synthetic policy proof code, a synthetic owner-hosted API and MCP runtime skeleton, a synthetic trust-boundary evaluator, a synthetic API policy contract evaluator, a synthetic MCP adapter contract evaluator, a synthetic database posture evaluator, a synthetic hosted-runtime fixture evaluator, and a synthetic deployment-boundary evaluator.

It does not host user memory.

It does not include a production API server, production MCP server runtime, database migrations, deployment, Mission Control UI, or live connectors.

It now includes a runtime-readiness matrix, redacted runtime-proof-intake manifest, and smoke commands. Those gates are for future runtime PRD work, not runtime approval.

## Current Decision

Hosted runtime implementation is still blocked.

The first eligible runtime lane is only:

```text
owner-hosted API boundary
  + MCP tool boundary
  + synthetic proof data
  + no database migrations until storage shape is approved
  + no Mission Control UI until API and MCP boundaries are stable
```

Unit 236 approved only the synthetic in-memory package proof version of that lane.

A later runtime implementation PRD must approve hosted runtime files before they are added.

The proposed first runtime PRD package is recorded in [First Runtime PRD Package](first-runtime-prd.md).

The current minimal runtime PRD package is recorded in [Minimal Runtime PRD](minimal-runtime-prd.md).

The hosted-runtime planning gates and existing synthetic wrapper proof are reconciled in [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md).

The current runtime-readiness gate is recorded in [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md). The redacted private-proof intake gate is recorded in [Runtime Proof Intake](runtime-proof-intake.md). The private-proof-to-runtime extraction checkpoint is recorded in [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md). They are verified by:

```bash
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run runtime:extraction-readiness
npm run runtime:wrapper-reconciliation
```

The current implementation approval packet is [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md). It is verified by:

```bash
npm run runtime:skeleton-packet
npm run runtime:skeleton-smoke
```

The owner-hosted runtime implementation boundary is recorded in [Owner-Hosted Runtime Implementation Packet](owner-hosted-runtime-implementation-packet.md), sliced in [Owner-Hosted Runtime Implementation Slices](owner-hosted-runtime-implementation-slices.md), and implemented as a synthetic in-process skeleton in [Owner-Hosted Runtime Implementation Proof](owner-hosted-runtime-implementation-proof.md). Production runtime remains blocked.

It is verified by:

```bash
npm run runtime:owner-hosted-smoke
```

The threat-model implementation is recorded in [Runtime Threat Boundary Implementation Proof](runtime-threat-boundary-implementation-proof.md). It is verified by:

```bash
npm run runtime:threat-boundary-smoke
npm run runtime:threat-implementation-packet
```

The API contract implementation is recorded in [API Policy Contract Implementation Proof](api-policy-contract-implementation-proof.md). It is verified by:

```bash
npm run runtime:api-policy-smoke
npm run runtime:api-implementation-packet
```

The MCP contract implementation is recorded in [MCP Adapter Contract Implementation Proof](mcp-adapter-contract-implementation-proof.md). It is verified by:

```bash
npm run runtime:mcp-adapter-smoke
npm run runtime:mcp-implementation-packet
```

The database posture implementation is recorded in [Database Posture Implementation Proof](database-posture-implementation-proof.md). It is verified by:

```bash
npm run runtime:database-posture-smoke
npm run runtime:database-implementation-packet
```

The public-safe fixture implementation is recorded in [Public-Safe Fixture Implementation Proof](public-safe-fixture-implementation-proof.md). It is verified by:

```bash
npm run runtime:fixture-smoke
npm run runtime:fixture-implementation-packet
```

The deployment-boundary implementation is recorded in [Deployment Boundary Implementation Proof](deployment-boundary-implementation-proof.md). It is verified by:

```bash
npm run runtime:deployment-boundary-smoke
npm run runtime:deployment-implementation-packet
```

To check all six implementation approval gates and their live GitHub issue approval status, run:

```bash
npm run runtime:implementation-approval-status
```

To see the recommended first implementation approval gate, run:

```bash
npm run runtime:first-implementation-recommendation
```

## What A Hosted Runtime PRD May Propose

A hosted runtime implementation PRD may propose public-safe versions of:

- owner-hosted API route contracts,
- MCP tool boundary contracts,
- synthetic request and response examples,
- namespace and permission examples,
- source evidence and trusted-memory separation checks,
- no-auto-promotion proof cases,
- local-only setup notes that do not imply Source-Wire hosts memory.

It must use synthetic data only.

It must run without secrets.

It must keep future package publishing blocked unless a new approved release execution path is completed.

## Required Proof Matrix

A hosted runtime implementation PRD must prove these cases before hosted runtime code merges:

| Case | Required behavior |
| --- | --- |
| Owner-hosted boundary | The runtime is controlled by the memory owner or an application acting for that owner. |
| No Source-Wire-hosted memory | Docs and examples do not imply Source-Wire stores user memory. |
| Authorized read | Allowed callers can read only permitted synthetic memory or source evidence. |
| Unauthorized read | Missing or invalid permission fails closed. |
| Wrong namespace | Cross-namespace access is denied without leaking content. |
| Source evidence search | Source-only evidence remains cited evidence, not trusted memory. |
| Source maintenance | Maintenance preserves `noAutoPromotion`. |
| Pending candidates | Candidate creation does not create trusted Memory Records. |
| Trusted-memory approval | Trusted memory requires owner or application approval. |
| Audit metadata | Tool or API results include audit-friendly caller, namespace, action, and result metadata. |
| Public safety | No real paths, tokens, domains, emails, account IDs, client names, private proof history, or production exports. |

The PRD must also pass the runtime-readiness and runtime-proof-intake gates before implementation:

```bash
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
```

## No-Go Conditions

Hosted runtime implementation must not start if any of these are true:

- examples require secrets,
- examples use real data,
- runtime docs imply Source-Wire hosts user memory,
- namespace isolation is not represented,
- MCP tools can bypass API policy,
- source maintenance can create trusted memory automatically,
- candidate approval is agent-controlled by default,
- database migrations are added before storage shape approval,
- deployment or publish behavior is bundled into the runtime PRD.

## Still Blocked

This gate does not add or approve:

- production API server runtime,
- production MCP server runtime,
- network service runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- npm publishing,
- GitHub release publishing,
- deployment,
- real user data,
- trusted Memory Record auto-promotion,
- private implementation code.

## Trust Boundary

Every future runtime PRD must preserve:

```text
Source evidence is not trusted memory.
Trusted memory requires an owner or application approval path.
```

Source-Wire may help define how evidence moves through a system.

It must not silently decide that evidence is trusted memory.

## Related Docs

- [Public Runtime Decision](public-runtime-decision.md)
- [First Runtime PRD Package](first-runtime-prd.md)
- [Minimal Runtime PRD](minimal-runtime-prd.md)
- [Minimal Runtime Issue Slices](minimal-runtime-issue-slices.md)
- [Minimal Runtime Implementation Scope](minimal-runtime-implementation-scope.md)
- [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md)
- [Runtime Skeleton Issue Slices](runtime-skeleton-issue-slices.md)
- [Owner-Hosted Runtime Implementation Packet](owner-hosted-runtime-implementation-packet.md)
- [Owner-Hosted Runtime Implementation Slices](owner-hosted-runtime-implementation-slices.md)
- [Owner-Hosted Runtime Implementation Proof](owner-hosted-runtime-implementation-proof.md)
- [Owner-Hosted Runtime Smoke](owner-hosted-runtime-smoke.md)
- [Runtime Skeleton Implementation Proof](runtime-skeleton-implementation-proof.md)
- [Runtime Skeleton Smoke](runtime-skeleton-smoke.md)
- [Runtime Threat Boundary Implementation Proof](runtime-threat-boundary-implementation-proof.md)
- [Runtime Threat Boundary Smoke](runtime-threat-boundary-smoke.md)
- [Threat Model Implementation Packet](threat-model-implementation-packet.md)
- [Threat Model Implementation Slices](threat-model-implementation-slices.md)
- [API Policy Contract Implementation Proof](api-policy-contract-implementation-proof.md)
- [API Policy Contract Smoke](api-policy-contract-smoke.md)
- [API Contract Implementation Packet](api-contract-implementation-packet.md)
- [API Contract Implementation Slices](api-contract-implementation-slices.md)
- [MCP Contract Implementation Packet](mcp-contract-implementation-packet.md)
- [MCP Contract Implementation Slices](mcp-contract-implementation-slices.md)
- [Runtime First Implementation Recommendation](runtime-first-implementation-recommendation.md)
- [Runtime Implementation Approval Status](runtime-implementation-approval-status.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Database Posture Implementation Slices](database-posture-implementation-slices.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Public-Safe Fixture Implementation Slices](public-safe-fixture-implementation-slices.md)
- [Deployment Boundary Implementation Packet](deployment-boundary-implementation-packet.md)
- [Deployment Boundary Implementation Slices](deployment-boundary-implementation-slices.md)
- [Deployment Boundary Implementation Proof](deployment-boundary-implementation-proof.md)
- [Deployment Boundary Smoke](deployment-boundary-smoke.md)
- [Minimal Synthetic Runtime Boundary](../examples/minimal-runtime/README.md)
- [Runtime Boundary Readiness](runtime-boundary-readiness.md)
- [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md)
- [Runtime Readiness Smoke](runtime-readiness-smoke.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md)
- [Hosted Runtime Wrapper Proof Reconciliation](hosted-runtime-wrapper-proof-reconciliation.md)
- [Runtime Boundary](runtime-boundary.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Architecture Map](architecture-map.md)
