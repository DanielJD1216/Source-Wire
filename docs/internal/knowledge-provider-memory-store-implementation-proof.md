# Source-Wire Knowledge Provider And Memory Store Implementation Proof

Use Node.js 22 with npm for local checks. See the [Quickstart](../getting-started/quickstart.md).

Status: approved design Revision 5 is implemented and verified through implementation Revision 6 as a synthetic contract and conformance unit.

- Run ID: `2026-07-22_memory-system-kb-separation_7c4e91`
- Submission ID: `memory-system-kb-separation-build-r6`
- Approved design revision: `5`
- Implementation revision: `6`
- Package version: `0.1.0`

## Direct Answer

Source-Wire memory can operate without an external knowledge base. Owner assertions and prior-memory references provide the approved memory-only provenance paths.

External knowledge is optional. When present, it enters through a read-only `KnowledgeProvider v1` sibling port behind Source-Wire API policy. Durable memory uses the separate `MemoryStore v1` sibling port, whose only supported v1 posture is adopter-owned PostgreSQL with the Source-Wire-owned logical `source_wire_memory` schema.

## Implemented Surface

- public `KnowledgeProvider v1` contract and exports,
- one common conformance evaluator for synthetic document-index and relational-view profiles,
- public `MemoryStore v1` contract and exports,
- synthetic provider and store fixture matrices,
- focused provider and store conformance smokes,
- API reference, architecture, boundary, contract, smoke, ADR, fixture, CI, and package-index documentation,
- both focused smokes in `npm run ci:check`.

## Review Hardening

Revision 5 passed its declared cases but adversarial review found malformed-input fail-open paths. Revision 6 now denies missing or unknown decisions, read operations, read kinds, provenance kinds, provider profiles, provider audit context, schema-version types, and agent-harness revocation. Both smoke harnesses require exact counts and unique fixture and result IDs.

## Observed Verification

The following commands were run from the repository root against implementation Revision 6. Every command exited `0`.

| Command | Exact observed outcome |
| --- | --- |
| `npm run typecheck` | TypeScript completed with no diagnostics. |
| `npm run build` | TypeScript build completed with no diagnostics. |
| `npm test` | Typecheck, fixture validation, schema export validation, CLI smoke, and example typecheck completed successfully. |
| `npm run examples:typecheck` | Example typecheck completed with no diagnostics. |
| `npm run runtime:knowledge-provider-smoke` | All 37 exact, unique matrix cases passed, ending with `ok knowledge provider conformance smoke`. |
| `npm run runtime:memory-store-smoke` | All 107 exact, unique matrix cases passed, ending with `ok memory store conformance smoke`. |
| `npm run runtime:api-policy-smoke` | Completed successfully, ending with `ok api policy contract smoke`. |
| `npm run runtime:database-posture-smoke` | Completed successfully, ending with `ok database posture smoke`. |
| `npm run docs:links` | Reported `ok docs links 266 markdown files`. |
| `npm run docs:anchors` | Reported `ok docs anchors 0 anchor links across 266 markdown files`. |
| `npm run safety:scan` | Scanned 466 files with 0 high, 0 medium, and 0 low findings. |
| `npm run claims:scan` | Scanned 290 files with 0 findings, ending with `ok public claim boundary scan`. |
| `npm run ci:check` | The Revision 6 run exited `0`, included both expanded focused smokes, and ended with `ok public claim boundary scan`. |

Focused adversarial probes were rerun after the fixes. Every previously fail-open case returned denied with zero content and zero mutation.

## Synthetic Boundary

This proof covers contracts, type-level exports, synthetic fixtures, common conformance evaluation, policy behavior, and documentation only. It adds no:

- managed hosting,
- SQL or migration,
- database driver or connection,
- credential or connection string,
- provider SDK or live provider,
- deployment or production-runtime approval,
- real user or provider data,
- package publish, release, commit, or push.

It does not prove live PostgreSQL grants, row-level security, transaction behavior, durable receipt state, provider authentication, provider availability, provider latency, or production operations.

## Related Docs

- [Knowledge Provider And Memory Store Boundary](../concepts/knowledge-provider-memory-store-boundary.md)
- [KnowledgeProvider v1 Contract](../contracts/knowledge-provider-v1-contract.md)
- [MemoryStore v1 Contract](../contracts/memory-store-v1-contract.md)
- [KnowledgeProvider Smoke](../reference/knowledge-provider-smoke.md)
- [MemoryStore Smoke](../reference/memory-store-smoke.md)
- [ADR 0001: Memory Store And Knowledge Provider Boundary](../adr/0001-memory-store-and-knowledge-provider-boundary.md)
