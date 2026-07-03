# Runtime Implementation Decision Gate

Status: decision gate drafted. Runtime implementation remains blocked.

Date: 2026-07-03

## Direct Decision

Do not start public Source-Wire runtime implementation from the owner-hosted setup package alone.

Recommended next path:

```text
Private owner runtime proof first,
then extract a clean public Apache-2.0 runtime skeleton only after behavior is proven.
```

## Why

The owner-hosted setup package is now complete as a synthetic public proof.

It proves:

- what the owner brings,
- what setup must check,
- what source update safety means,
- what claims are safe,
- what remains blocked before runtime.

It does not prove:

- the correct production API shape,
- the correct database schema,
- the correct MCP server behavior,
- the correct installer path,
- the correct Mission Control setup UX,
- the real daily maintenance loop.

Those must be proven in the private owner implementation before public runtime code becomes valuable.

## Decision Matrix

| Path | Decision | Why |
| --- | --- | --- |
| Private owner runtime proof first | Go | Best path for product truth while keeping real data private. |
| Clean Apache-2.0 public runtime skeleton now | No-go for now | Could build the wrong runtime before private daily use proves behavior. |
| Optional adapter to separate runtime candidate | No-go for now | Needs stronger legal/setup boundary around the separate AGPLv3 candidate. |
| Public database migrations now | No-go | Storage shape is not approved for public Source-Wire. |
| Public MCP server runtime now | No-go | Tool behavior is proven synthetically, but production runtime is not approved. |
| Public Mission Control UI now | No-go for Source-Wire | UI could imply runtime readiness before runtime exists. Private UX proof can continue separately. |
| Managed hosting | No-go | The product direction remains BYO owner-hosted, not Source-Wire-managed hosting. |

## Required Future Approval

Before public runtime implementation starts, a new owner-approved unit must define:

- runtime scope,
- API server boundary,
- MCP server boundary,
- database and migration posture,
- Source-Wire-Memory-Engine relationship,
- license path,
- private-data exclusion rules,
- synthetic fixture requirements,
- verification gates,
- release and deployment boundaries.

## Minimum Runtime PRD Requirements

A future public runtime PRD must include:

- owner-hosted by default,
- no Source-Wire-hosted memory default,
- no managed hosting,
- no real user data,
- no copied AGPLv3 code,
- no copied private implementation code,
- MCP cannot bypass Source-Wire API policy,
- source evidence stays separate from trusted memory,
- source maintenance keeps `noAutoPromotion: true`,
- trusted memory promotion remains owner or application controlled,
- database migrations require explicit approval,
- deployment requires explicit approval,
- npm publishing and GitHub release mutation require explicit approval.

## Stop Conditions

Stop and require a new owner decision if next work asks for:

- API server runtime files,
- MCP server runtime files,
- database migrations,
- database connection code,
- live connector code,
- real source import,
- real owner or client data,
- deployment config,
- managed-hosted behavior,
- npm publishing,
- GitHub release creation,
- Source-Wire-Memory-Engine code copy,
- private implementation code copy,
- automatic trusted-memory promotion.

## Next Safe Action

Recommended next safe action:

```text
Continue private owner-hosted runtime proof and record public-safe extraction notes.
```

Public Source-Wire can continue to accept only:

- synthetic fixtures,
- contract clarifications,
- public-safe smoke cases,
- docs corrections,
- decision packets,
- extraction notes written without private data.

## Related Docs

- [Owner-Hosted Setup Final Proof](owner-hosted-setup-final-proof.md)
- [Owner-Hosted Setup Go/No-Go Gate](owner-hosted-setup-go-no-go-gate.md)
- [Owner-Hosted Runtime Direction Gate](owner-hosted-runtime-direction-gate.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md)
- [Memory Engine Baseline API And MCP Wrapper Boundary](memory-engine-baseline-api-mcp-wrapper-boundary.md)
