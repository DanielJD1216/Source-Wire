# Runtime Implementation Decision Gate

Status: decision gate refreshed. Runtime implementation remains blocked.

Date: 2026-07-04

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Direct Decision

Do not start public Source-Wire runtime implementation from the owner-hosted setup package, daily workflow fixtures, or Unit 33 runtime-readiness alignment alone.

Recommended next path:

```text
Refresh the public owner-hosted runtime PRD and wrapper-runtime gate from Unit 33 metadata,
then approve one narrow implementation boundary at a time.
```

## Why

The owner-hosted setup package, daily workflow package, and runtime-readiness package are now complete as synthetic public proofs.

They prove:

- what the owner brings,
- what setup must check,
- what source update safety means,
- what the daily ask, update, review, and follow-up loop should preserve,
- what runtime-readiness gates must stay green before public runtime work,
- what claims are safe,
- what remains blocked before runtime.

They do not prove:

- the correct production API shape,
- the correct database schema,
- the correct MCP server behavior,
- the correct installer path,
- the correct production Mission Control setup UX,
- the real public owner-hosted runtime lifecycle.

Private owner behavior has now been proven through the redacted Unit 33 alignment baseline, but that still must be translated into a clean public PRD or narrow implementation gate before runtime code becomes safe.

## Decision Matrix

| Path | Decision | Why |
| --- | --- | --- |
| Refresh public owner-hosted runtime PRD or wrapper gate from Unit 33 | Go | Uses proven private behavior as redacted metadata while keeping public code synthetic. |
| Clean Apache-2.0 public runtime skeleton now | No-go for now | Still needs a focused owner approval for the exact API, MCP, database, and adapter boundary. |
| Optional adapter to separate runtime candidate | No-go for now | Needs stronger legal/setup boundary around the separate AGPLv3 candidate and setup packaging. |
| Public database migrations now | No-go | Storage shape is not approved for public Source-Wire. |
| Public MCP server runtime now | No-go | Tool behavior is proven synthetically, but production runtime is not approved. |
| Public Mission Control UI now | No-go for Source-Wire | UI could imply runtime readiness before runtime exists. Private UX proof can continue separately. |
| Managed hosting | No-go | The product direction remains BYO owner-hosted, not Source-Wire-managed hosting. |

## Required Future Approval

Before public runtime implementation starts, a new owner-approved unit must define or refresh:

- runtime scope,
- API server boundary,
- MCP server boundary,
- database and migration posture,
- Source-Wire-Memory-Engine relationship,
- license path,
- Unit 33 redacted proof baseline use,
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
Refresh the public owner-hosted runtime PRD or wrapper-runtime gate using the Unit 33 baseline as redacted metadata only.
```

Public Source-Wire can continue to accept only:

- synthetic fixtures,
- contract clarifications,
- public-safe smoke cases,
- docs corrections,
- decision packets,
- extraction notes written without private data,
- redacted private-proof intake manifests that contain metadata only.

After the runtime-readiness synthetic gate, future runtime PRD work should use:

```bash
npm run daily-workflow:smoke
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run runtime:extraction-readiness
```

as a required local gate before any claim that public runtime implementation is ready to start.

## Related Docs

- [Owner-Hosted Setup Final Proof](owner-hosted-setup-final-proof.md)
- [Owner-Hosted Setup Go/No-Go Gate](owner-hosted-setup-go-no-go-gate.md)
- [Owner-Hosted Runtime Direction Gate](owner-hosted-runtime-direction-gate.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Runtime Readiness Fixture Matrix](runtime-readiness-fixture-matrix.md)
- [Runtime Readiness Smoke](runtime-readiness-smoke.md)
- [Runtime Proof Intake](runtime-proof-intake.md)
- [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md)
- [Daily Workflow Implementation Proof](daily-workflow-implementation-proof.md)
- [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md)
- [Memory Engine Baseline API And MCP Wrapper Boundary](memory-engine-baseline-api-mcp-wrapper-boundary.md)
