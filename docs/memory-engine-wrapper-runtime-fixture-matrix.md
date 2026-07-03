# Source-Wire Memory Engine Wrapper Runtime Fixture Matrix

Status: Slice 2 fixture matrix complete. Runtime implementation remains blocked for later slices.

Date: 2026-07-02

## Purpose

This document defines the synthetic fixture coverage required for the wrapper runtime unit.

It supports the [Wrapper Runtime Policy Contract](contracts/wrapper-runtime-policy-contract.md) without using real owner data, client data, private paths, tokens, domains, screenshots, production exports, live connectors, database rows, or runtime services.

## Fixture Boundary

The wrapper runtime fixture matrix is:

- synthetic,
- public-safe,
- local,
- non-runtime,
- not connected to a database,
- not connected to MCP,
- not connected to `Source-Wire-Memory-Engine`,
- not a deployment proof.

Fixture files:

- [Wrapper runtime fixture README](../examples/fixtures/wrapper-runtime/README.md)
- [Wrapper runtime fixture matrix](../examples/fixtures/wrapper-runtime/wrapper-runtime-fixture-matrix.json)

## Required Categories

| Category | Fixture coverage | Safe example IDs |
| --- | --- | --- |
| Owner | A fake owner identity that owns the memory boundary. | `owner_demo_wrapper_001` |
| Namespace | Fake project and client namespaces with explicit separation. | `ns_demo_wrapper_project`, `ns_demo_wrapper_client` |
| Harness caller | Fake MCP harness callers with scoped token refs. | `harness_demo_codex`, `token_demo_codex_read` |
| Capability | Capability sets for read, source, maintenance, candidate, approval, and audit actions. | `read_trusted_memory`, `prepare_candidates` |
| Source evidence | Fake source segment and citation data. | `source_demo_note_001`, `segment_demo_note_001_a` |
| Trusted memory | Fake approved memory record. | `memory_demo_trusted_001` |
| Candidate | Fake pending candidate that is not trusted memory. | `candidate_demo_pending_001` |
| Denied access | Missing capability and wrong namespace cases. | `denial_missing_capability`, `denial_namespace_not_allowed` |
| Gap | Missing, stale, weak, and permission-blocked evidence cases. | `gap_demo_stale_source` |
| MCP call | Fake MCP-shaped tool calls that must route through API policy. | `mcp_call_demo_search_memory` |
| Audit event | Fake allowed, denied, and partial audit records. | `audit_demo_allowed_001` |
| Runtime adapter result | Fake low-level runtime result requiring Source-Wire shaping. | `runtime_result_demo_search_001` |

## Proof Cases

The fixture matrix must cover these behavior cases:

- authorized trusted-memory read,
- unauthorized trusted-memory denial,
- wrong-namespace denial,
- source evidence search with citation,
- source maintenance with `noAutoPromotion`,
- pending candidate creation without trusted memory creation,
- owner or application-controlled approval path,
- MCP-to-API policy routing,
- runtime adapter result shaping,
- audit-safe allowed result,
- audit-safe denied result,
- stale or weak evidence gap.

## Safety Rules

Fixtures must not include:

- real names,
- real users,
- real client names,
- real local paths,
- real account IDs,
- real emails,
- real domains,
- real tokens,
- real API keys,
- real screenshots,
- real provider payloads,
- real database rows,
- production exports.

Fixtures should use:

- `demo`,
- `synthetic`,
- `example`,
- fake IDs,
- fake timestamps,
- fake source text,
- fake token references.

## Validation Or Smoke Proof

Current status:

```text
The fixture matrix is public-safe fixture documentation plus JSON data.
It is not yet schema-validated by the CLI.
```

Later implementation slices may add schema validation or smoke proof.

Before claiming wrapper runtime readiness, a later slice must prove:

- fixture matrix is present,
- fixture values are synthetic,
- public safety scan passes,
- claim-boundary scan passes,
- API and MCP policy behavior uses these categories.

## Non-Goals

This fixture matrix does not add:

- API server runtime,
- MCP server runtime,
- database migrations,
- runtime adapter code,
- memory-engine integration,
- Mission Control UI,
- live connectors,
- deployment,
- real user data,
- npm publishing,
- GitHub release publishing,
- public code contribution acceptance.

## Related Docs

- [Wrapper Runtime Policy Contract](contracts/wrapper-runtime-policy-contract.md)
- [Source-Wire Memory Engine Wrapper Runtime PRD](memory-engine-wrapper-runtime-prd.md)
- [Source-Wire Memory Engine Wrapper Runtime Issue Slices](memory-engine-wrapper-runtime-issue-slices.md)
- [Source-Wire Fixtures](../examples/fixtures/README.md)
