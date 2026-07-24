# KnowledgeProvider v1 Contract

Use Node.js 22 with npm for local checks. See the [Quickstart](../getting-started/quickstart.md).

## Purpose

`KnowledgeProvider v1` lets an owner-selected knowledge base supply source evidence to Source-Wire through one optional, read-only port.

The provider does not own authentication, namespace policy, trusted-memory approval, response shaping, or durable audit policy. Those remain Source-Wire API policy responsibilities.

## Identity

- Contract ID: `source-wire.knowledge-provider`
- Contract version: `knowledge-provider.v1`

The major version must match exactly. There is no silent downgrade or legacy fallback.

## Public Interface

`SourceWireKnowledgeProviderV1` exposes:

- a read-only `profile`,
- `execute(request)` returning a typed result.

Allowed operations are exactly:

- `describe`
- `health`
- `search_evidence`
- `get_evidence`

Write, update, delete, synchronization, administration, arbitrary query, candidate, approval, promotion, and migration operations are not part of v1. A profile advertising mutation authority is incompatible.

## Profiles And Capabilities

Each profile declares its provider ID, opaque provider scope, family, exact version, read-only access, out-of-band credential posture, bounds, provenance requirement, capability descriptors, and `noAutoPromotion: true`.

The synthetic matrix proves two families through one evaluator:

- document index,
- predefined relational view.

Every core operation is a required capability. Unknown optional capabilities are ignored. Missing, unknown, or unsupported required capabilities deny the request.

The selected provider ID must resolve to an explicitly supplied profile. An unknown profile is denied. The conformance evaluator never substitutes a default provider for a missing profile.

## Evidence Requirements

Every evidence item requires:

- provider and provider-record IDs,
- source and segment IDs,
- owner and namespace IDs,
- an allowed ACL decision,
- source version,
- SHA-256 content digest,
- public-safe citation locator,
- title and bounded excerpt,
- media type and truncation state,
- sensitivity and freshness,
- retrieval time,
- `instructionAuthority: none`.

Missing or cross-scope evidence is excluded before ranking, counts, citations, caching, candidate creation, or caller release. Provider content and metadata cannot change policy, capabilities, namespace, tool routing, approval, or lifecycle state.

## Protected Release

Provider evidence returns to the internal coordinator with:

- `releaseState: internal_unreleased`,
- `readAuditRequired: true`,
- no provider mutation,
- no memory mutation,
- no trusted-memory creation.

The coordinator may release authorized evidence only after `MemoryStore v1` commits a matching durable read-audit receipt. Audit failure, receipt mismatch, or receipt replay releases zero protected content.

## Safe Errors

`SourceWireSafeErrorV1` exposes only:

- a declared error code,
- constant safe message,
- opaque trace ID,
- retryable flag,
- optional `retryAfterMs`, capped at `30000`,
- `detailsRedacted: true`.

Errors do not expose raw provider failures, queries, source content, restricted locators, credentials, owner or namespace details, existence data, or restricted counts.

## Synthetic Proof

Run:

```bash
npm run runtime:knowledge-provider-smoke
```

The fixture and evaluator prove both profiles use the same rules. They do not implement or connect a provider.

Related docs:

- [KnowledgeProvider Smoke](../reference/knowledge-provider-smoke.md)
- [Knowledge Provider And Memory Store Boundary](../concepts/knowledge-provider-memory-store-boundary.md)
- [ADR 0001](../adr/0001-memory-store-and-knowledge-provider-boundary.md)
