# Source-Wire Runtime Implementation Gate

Status: implementation gate only. No runtime implementation is included.

## Purpose

This gate prevents Source-Wire runtime work from starting just because boundary docs and synthetic fixtures now exist.

Source-Wire is still a public contract package skeleton.

It does not host user memory.

It does not include an API server, MCP server runtime, database migrations, deployment, Mission Control UI, or live connectors.

## Current Decision

Runtime implementation is still blocked.

The first eligible runtime lane is only:

```text
owner-hosted API boundary
  + MCP tool boundary
  + synthetic proof data
  + no database migrations until storage shape is approved
  + no Mission Control UI until API and MCP boundaries are stable
```

This gate does not approve that runtime lane.

A later runtime implementation PRD must approve it before runtime files are added.

The proposed first runtime PRD package is recorded in [First Runtime PRD Package](first-runtime-prd.md).

## What A First Runtime PRD May Propose

A first runtime implementation PRD may propose public-safe versions of:

- owner-hosted API route contracts,
- MCP tool boundary contracts,
- synthetic request and response examples,
- namespace and permission examples,
- source evidence and trusted-memory separation checks,
- no-auto-promotion proof cases,
- local-only setup notes that do not imply Source-Wire hosts memory.

It must use synthetic data only.

It must run without secrets.

It must keep npm publishing blocked unless a separate release PRD approves publishing.

## Required Proof Matrix

A future runtime implementation PRD must prove these cases before runtime code merges:

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

## No-Go Conditions

Runtime implementation must not start if any of these are true:

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
- [Runtime Boundary](runtime-boundary.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Architecture Map](architecture-map.md)
