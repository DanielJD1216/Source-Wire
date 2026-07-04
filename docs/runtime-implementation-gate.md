# Source-Wire Runtime Implementation Gate

Status: implementation gate with one minimal synthetic in-memory runtime boundary. Hosted runtime implementation remains blocked.

## Purpose

This gate prevents hosted Source-Wire runtime work from starting just because boundary docs, synthetic fixtures, and a minimal synthetic runtime boundary now exist.

Source-Wire is still a public contract package skeleton with exported synthetic policy proof code.

It does not host user memory.

It does not include an API server, MCP server runtime, database migrations, deployment, Mission Control UI, or live connectors.

It now includes a runtime-readiness matrix and smoke command. That matrix is a gate for future runtime PRD work, not runtime approval.

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

The current runtime-readiness gate is recorded in [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md) and verified by:

```bash
npm run runtime-readiness:smoke
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

The PRD must also pass the runtime-readiness gate before implementation:

```bash
npm run runtime-readiness:smoke
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

- API server runtime,
- MCP server runtime,
- runtime scaffolding,
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
- [Minimal Synthetic Runtime Boundary](../examples/minimal-runtime/README.md)
- [Runtime Boundary Readiness](runtime-boundary-readiness.md)
- [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md)
- [Runtime Readiness Smoke](runtime-readiness-smoke.md)
- [Runtime Boundary](runtime-boundary.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Architecture Map](architecture-map.md)
