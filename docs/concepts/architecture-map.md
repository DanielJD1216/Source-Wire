# Source-Wire Architecture Map

## Direct Answer

Source-Wire is the governed memory layer between owner-selected knowledge and AI agents.

The repository currently has two distinct surfaces:

1. A published contracts package that defines public behavior and safety boundaries.
2. An unpublished, loopback-only Alpha 1 workspace that proves a narrow local lifecycle using generated disposable PostgreSQL state.

Neither surface is a hosted or production memory service.

![Source-Wire system overview](../assets/source-wire-overview.svg)

## System Shape

```text
Owner-selected sources or knowledge base
  -> KnowledgeProvider v1, optional and read-only
  -> Source-Wire API policy
       -> identity, capability, owner, namespace, ACL
       -> pending memory candidate
       -> explicit owner decision
       -> MemoryStore v1
            -> trusted revisions, corrections, revocation, audit
            -> adopter-owned PostgreSQL
  -> MCP adapter
  -> authorized AI agents
```

MCP does not connect directly to a provider, memory store, or database. Source-Wire API policy remains responsible for identity, capability, owner, namespace, approval, audit, and safe response shaping.

## Published Contracts Package

`@source-wire/contracts@0.1.0` includes:

- TypeScript contract types,
- JSON schemas,
- validation helpers and CLI behavior,
- synthetic fixtures,
- conformance evaluators,
- minimal synthetic policy proofs,
- package, documentation, safety, and claim checks.

The package does not export a hosted backend, production API server, production MCP server, database client, connector engine, memory engine, or user interface.

## Latest-Source Alpha Proof

`apps/alpha1-runtime/` is an unpublished npm workspace. Using generated disposable PostgreSQL state, Stories 1 through 4 prove:

- local bootstrap and scoped credentials,
- an exact two-tool stdio MCP surface for proposal and trusted-memory search,
- pending-only candidate persistence,
- owner-controlled approval or rejection,
- audit-before-release active-memory search,
- fix-forward correction and revocation,
- canonical export and fresh portable initialization,
- isolated physical-recovery invalidation,
- fail-closed denial and cleanup behavior.

The Alpha workspace does not prove hosting, deployment, production availability, production backup guarantees, live-provider support, public network exposure, non-disposable database use, or real-data safety.

Follow the [Alpha 1 Story guides](../README.md#run-and-evaluate) in order.

## Knowledge Provider And Memory Store

Source-Wire defines two sibling ports behind API policy:

| Port | Responsibility | Required? |
| --- | --- | --- |
| `KnowledgeProvider v1` | Return bounded, cited, authorized source evidence from an owner-selected system | No |
| `MemoryStore v1` | Govern candidates, trusted revisions, provenance, corrections, revocation, and audit | Yes for durable memory |

Memory can operate without external knowledge through owner assertions and prior-memory provenance. A knowledge provider may support a candidate but cannot approve it or write directly into trusted memory.

Read [Knowledge Provider And Memory Store Boundary](knowledge-provider-memory-store-boundary.md), [KnowledgeProvider v1](../contracts/knowledge-provider-v1-contract.md), [MemoryStore v1](../contracts/memory-store-v1-contract.md), and [ADR 0001](../adr/0001-memory-store-and-knowledge-provider-boundary.md).

## Trust Boundary

![Trusted memory lifecycle](../assets/trusted-memory-lifecycle.svg)

Architecture invariants:

- Source evidence, pending candidates, and trusted memory are different states.
- Evidence and model output cannot become trusted memory automatically.
- Owner or owner-application control governs approval, correction, and revocation.
- Protected content is not released unless its audit requirements succeed.
- Revoked and superseded revisions are excluded from active reads.
- Provider content has no instruction authority.
- Namespace, ACL, provenance, citation, freshness, sensitivity, and version fields remain attached to protected context.

## Ownership Boundary

| Surface | Responsible party |
| --- | --- |
| Source-Wire contracts, logical schema rules, and lifecycle invariants | Source-Wire project |
| Infrastructure, credentials, deployed data, backups, availability, and migration execution | Adopter |
| External knowledge corpus and provider credentials | Adopter or knowledge-system owner |
| Memory approval, correction, and revocation policy | Owner or owner-controlled application |
| Agent behavior outside the Source-Wire boundary | Agent-harness owner |

## Repository Surfaces

| Path | Purpose |
| --- | --- |
| [`src/contracts/`](https://github.com/DanielJD1216/Source-Wire/tree/main/src/contracts) | Public contract types and synthetic evaluators |
| [`src/runtime-skeleton/`](https://github.com/DanielJD1216/Source-Wire/tree/main/src/runtime-skeleton) | Synthetic API-policy and MCP-routing proof |
| [`src/owner-hosted-runtime/`](https://github.com/DanielJD1216/Source-Wire/tree/main/src/owner-hosted-runtime) | Narrow in-process owner-hosted skeleton proof |
| [`apps/alpha1-runtime/`](https://github.com/DanielJD1216/Source-Wire/tree/main/apps/alpha1-runtime) | Unpublished local Alpha 1 workspace |
| [`schemas/`](../../schemas) | Public JSON schemas |
| [`examples/`](../../examples) | Synthetic fixtures, examples, and conformance checks |
| [`docs/`](..) | Public documentation and historical project records |
| [`scripts/`](https://github.com/DanielJD1216/Source-Wire/tree/main/scripts) | Verification and boundary checks |

## What To Inspect Next

- First local evaluation: [Quickstart](../getting-started/quickstart.md)
- Package integration: [API Reference](../reference/api-reference.md)
- Current availability: [Public Status](../status/public-status.md)
- Runtime limits: [Runtime Boundary](runtime-boundary.md)
- AI-agent workflow: [AGENTS.md](https://github.com/DanielJD1216/Source-Wire/blob/main/AGENTS.md)
