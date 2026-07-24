# ADR 0001: Separate MemoryStore From External Knowledge Providers

Use Node.js 22 with npm for local checks. See the [Quickstart](../getting-started/quickstart.md).

Status: Accepted

Date: 2026-07-22

## Context

Source-Wire needs a clear answer to two different jobs:

1. Store durable, reviewed memory with lifecycle and audit rules.
2. Read supporting knowledge from systems selected by the owner.

Combining those jobs would blur ownership, trust, provider authority, and the line between source evidence and trusted memory.

## Decision

Source-Wire v1 uses two sibling ports behind Source-Wire API policy:

- `MemoryStore v1` stores candidates, trusted memory, provenance, idempotency, and audit in a dedicated logical schema inside adopter-owned PostgreSQL.
- `KnowledgeProvider v1` reads source evidence from an optional external knowledge base.

The adopter owns PostgreSQL infrastructure, credentials, backups, and deployed data. Source-Wire owns the `source_wire_memory` logical schema definition, lifecycle invariants, compatibility rules, and future migration definitions. The adopter controls future migration execution.

Knowledge providers are read-only. They cannot write a source, run arbitrary SQL, create or approve candidates, promote memory, or bypass Source-Wire API policy.

The memory system remains valid without a knowledge provider through owner assertions and prior-memory provenance.

## Trust Rules

- Source evidence remains untrusted.
- Provider content has no instruction authority.
- A candidate begins pending.
- Trusted memory requires explicit owner-controlled approval.
- Mutations and their audit events are atomic.
- Protected content requires durable read audit before release.
- Contract, capability, provenance, namespace, ACL, schema, and receipt mismatches fail closed.
- There is no automatic promotion or silent downgrade.

## Rejected Alternatives

### One database for knowledge and memory

Rejected because it would confuse source ownership with trusted-memory state and encourage accidental promotion.

### Managed Source-Wire database hosting

Rejected for v1. `sourceWireHostsUserMemory: false` remains true.

### Arbitrary adopter tables as MemoryStore

Rejected because Source-Wire cannot guarantee lifecycle, provenance, namespace, transaction, or audit invariants over arbitrary shapes.

### Multiple MemoryStore backends in v1

Rejected to keep one deterministic conformance target. PostgreSQL is the only v1 backend.

### Writable knowledge connectors

Rejected to keep provider authority narrow and reduce cross-system mutation risk.

## Consequences

Positive:

- Memory and knowledge have distinct trust models.
- Owners can choose their own knowledge system.
- Memory-only installations remain possible.
- Provider portability can be tested through one read-only contract.
- Source-Wire can define memory invariants without operating adopter infrastructure.

Tradeoffs:

- Fresh source evidence depends on provider availability.
- Real PostgreSQL grants, migrations, transactions, and provider authorization need separate future integration proof.
- Additional backends require a later contract decision.

## Current Implementation Boundary

This ADR authorizes TypeScript contracts, synthetic fixture matrices, deterministic evaluators, smoke tests, documentation, and CI wiring only.

It does not authorize SQL, migrations, database drivers, provider SDKs, credentials, connections, live connectors, provisioning, deployment, publication, or real data.

## Verification

```bash
npm run runtime:knowledge-provider-smoke
npm run runtime:memory-store-smoke
```

Related docs:

- [KnowledgeProvider v1 Contract](../contracts/knowledge-provider-v1-contract.md)
- [MemoryStore v1 Contract](../contracts/memory-store-v1-contract.md)
- [Knowledge Provider And Memory Store Boundary](../concepts/knowledge-provider-memory-store-boundary.md)
