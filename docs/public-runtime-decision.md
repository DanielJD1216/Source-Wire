# Source-Wire Public Runtime Decision

Date: 2026-06-29

Status: decision package only. No runtime implementation is included.

## Decision

Source-Wire should stay a contracts-only public package for now.

The first future runtime lane should be a narrow **owner-hosted API plus MCP boundary** only after a separate runtime PRD approves it.

That future PRD must prove owner control, namespace boundaries, synthetic examples, and no automatic trusted-memory promotion before any runtime code is added to Source-Wire.

The boundary is defined in the [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md).

Before adding runtime files, future work must pass the [Runtime Implementation Gate](runtime-implementation-gate.md).

The proposed first runtime PRD package is recorded in [First Runtime PRD Package](first-runtime-prd.md).

The current minimal runtime PRD package is recorded in [Minimal Runtime PRD](minimal-runtime-prd.md).

## Why This Decision

Source-Wire now has a useful public package surface:

- contract docs,
- TypeScript contract types,
- JSON schemas,
- schema exports,
- validation CLI,
- synthetic fixtures,
- TypeScript examples,
- package readiness checks,
- installed-package smokes,
- public adopter walkthrough,
- public architecture map.

The next risk is not package usability.

The next risk is opening runtime work too broadly.

Runtime code carries hard-to-reverse choices:

- storage model,
- auth and namespace boundary,
- owner-hosted deployment shape,
- MCP tool permissions,
- source maintenance permissions,
- trusted-memory approval policy,
- public versus private implementation split.

Those choices should be explicit before Source-Wire ships runtime behavior.

## Runtime Lane Options

| Option | Public value | Main risk | Decision |
| --- | --- | --- | --- |
| Stay contracts-only | Keeps current package stable and safe. | Runtime users still need their own implementation. | Current state. |
| Owner-hosted API boundary | Gives adopters a clear service shape. | Auth, namespace, deployment, and data handling must be right. | Best first future runtime lane. |
| MCP server runtime | Matches the agent-first product shape. | Tool permissions can mutate source state or memory too early. | Pair with API boundary after PRD approval. |
| Database migrations | Makes storage reproducible. | Locks schema choices too early and may expose private implementation assumptions. | Not first. |
| Source connector runtime | Helps real ingestion. | High permission and privacy risk across platforms. | Later. |
| Mission Control UI | Helps non-technical owners. | UI implies runtime, auth, data, and hosted assumptions. | Later. |

## Recommended First Runtime Lane

The first future runtime lane should be:

```text
Owner-hosted API boundary
  + MCP tool boundary
  + synthetic proof data
  + no database migrations until storage shape is approved
  + no Mission Control UI until API and MCP boundaries are stable
```

This lane fits Source-Wire's agent-first direction without starting from the heaviest pieces.

It should expose behavior through contracts and synthetic proof fixtures first.

## What Stays Private In Jinni

Keep these private until a separate PRD approves extraction:

- real owner data,
- real client data,
- private project history,
- private source imports,
- private Mission Control behavior,
- private database migrations,
- private memory-engine integration,
- private harness tokens,
- private local paths,
- private operational proofs.

## What May Become Public In Source-Wire

A later runtime PRD may add public-safe versions of:

- owner-hosted API route contracts,
- MCP tool contracts and smoke fixtures,
- synthetic request and response examples,
- namespace and permission examples,
- no-auto-promotion proofs,
- local-only setup docs,
- deployment-agnostic runtime boundary docs.

These should use synthetic data only.

## First Runtime PRD Acceptance Criteria

Before Source-Wire adds runtime code, the first runtime PRD must prove:

- owner-hosted boundary is explicit,
- no Source-Wire-hosted user memory is implied,
- all examples and fixtures are synthetic,
- namespace isolation is represented,
- tool permission boundaries are represented,
- source evidence is separate from trusted memory,
- trusted memory is never created automatically,
- no real local paths, tokens, domains, emails, account IDs, client names, or production exports are included,
- package remains safe to run without secrets,
- future package versions remain blocked unless a separate approved release unit opens them.

## Trust Boundary

Every future runtime PRD must preserve:

```text
Source evidence is not trusted memory.
Trusted memory requires an owner or application approval path.
```

Source-Wire may help move evidence through a system.

It must not silently decide that evidence is trusted memory.

## Non-Goals

This decision does not add:

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

## Related Docs

- [Architecture Map](architecture-map.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [First Runtime PRD Package](first-runtime-prd.md)
- [Minimal Runtime PRD](minimal-runtime-prd.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Runtime Boundary](runtime-boundary.md)
- [Runtime-Adjacent Recommendation](decision-prototypes/runtime-adjacent-recommendation.md)
- [Release Decision](release-decision.md)
