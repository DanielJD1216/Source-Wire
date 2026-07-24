# Knowledge Provider And Memory Store Boundary

## Direct Answer

Source-Wire is the memory system. A knowledge base is optional and remains separate.

An adopter can use Source-Wire with only PostgreSQL-backed memory, or plug in an owner-selected knowledge base by implementing the read-only `KnowledgeProvider v1` contract.

## System Shape

```text
Agent harness
  -> MCP adapter
  -> Source-Wire API policy
  -> coordinator
       -> MemoryStore v1
            -> adopter-owned PostgreSQL
            -> Source-Wire source_wire_memory logical schema
       -> KnowledgeProvider v1, optional and read-only
            -> owner-selected external knowledge base
```

MCP never connects directly to a provider, store, or database. Source-Wire API policy remains responsible for identity, capability, owner, namespace, approval, audit policy, and safe response shaping.

## What Memory Means Here

Memory is durable state the owner wants the agent system to remember and govern. It includes:

- pending candidates,
- reviewed trusted memories,
- corrections and immutable revisions,
- supersession and revocation,
- provenance,
- idempotency,
- audit evidence.

Memory has a lifecycle. Source evidence does not become trusted memory automatically.

## What Knowledge Means Here

Knowledge stays in the owner's selected system. It may be a document index, a wiki, a search service, or a PostgreSQL-backed knowledge base exposed through predefined read-only views.

Source-Wire receives bounded evidence with citations, versions, hashes, namespace, ACL, freshness, and sensitivity. It does not treat arbitrary knowledge tables as memory tables and does not write back to the provider.

## Memory-Only Installation

A KnowledgeProvider is optional. Owners can create pending candidates from:

- an explicit owner assertion,
- a prior-memory reference.

Those provenance forms let the memory system work without external knowledge.

## Knowledge-Assisted Installation

When a provider is present:

1. Source-Wire policy authorizes the read.
2. The provider returns source evidence into an internal unreleased buffer.
3. Source-Wire validates scope, ACL, provenance, version, hash, locator, freshness, and sensitivity.
4. MemoryStore commits a safe read-audit receipt.
5. Source-Wire releases only the evidence bound to that receipt.
6. Evidence may support a pending candidate.
7. Only explicit owner-controlled approval can create trusted memory.

## Ownership Boundary

| Surface | Owner |
| --- | --- |
| PostgreSQL server, database, networking, credentials, backups, availability | Adopter |
| Deployed schema instance and stored data | Adopter |
| `source_wire_memory` logical schema definition and invariants | Source-Wire project |
| Future migration definitions | Source-Wire project |
| Future migration timing and execution | Adopter |
| External knowledge corpus | Knowledge-base owner |
| Provider credentials | Adopter |
| Managed hosting | Not provided in v1 |

## Failure Behavior

| Failure | Safe behavior |
| --- | --- |
| One provider is unavailable | Return valid memory and other provider evidence with a visible gap |
| Provider scope, ACL, or provenance is invalid | Discard evidence and release no restricted metadata |
| Provider version or required capability is incompatible | Disable that provider for the request, with no downgrade |
| MemoryStore or PostgreSQL posture is unavailable | Deny protected memory reads and all mutations |
| Durable audit fails | Release no protected content and apply no mutation |
| Read-audit receipt mismatches or is replayed | Release nothing |
| Schema is outside the supported range | Deny memory operations, with no automatic migration or downgrade |

## Current Evidence Limit

The package includes synthetic contracts and conformance smokes. It does not include a live provider, database connection, SQL schema, migration, credential, deployment, or real data.

Related docs:

- [ADR 0001](../adr/0001-memory-store-and-knowledge-provider-boundary.md)
- [KnowledgeProvider v1 Contract](../contracts/knowledge-provider-v1-contract.md)
- [MemoryStore v1 Contract](../contracts/memory-store-v1-contract.md)
