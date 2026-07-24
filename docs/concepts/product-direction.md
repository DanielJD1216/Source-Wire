# Source-Wire Product Direction

## Direct Answer

Source-Wire is intended to become a public, bring-your-own, owner-hosted memory system for AI agents.

The target is not a shared hosted service by default. An adopter should be able to run Source-Wire with their own infrastructure, data, credentials, knowledge sources, and agent harnesses.

## Target Product

```text
Your knowledge sources
  -> Source-Wire trust and memory lifecycle
  -> your PostgreSQL
  -> your authorized AI agents
```

The knowledge base remains optional and replaceable. Source-Wire owns the logical memory contract and trust rules, while the adopter owns the deployed system and data.

## Current Position

| Surface | Current state |
| --- | --- |
| Public contract package | Published as `@source-wire/contracts@0.1.0` |
| GitHub release | `v0.1.0` |
| License | Apache-2.0 |
| Contracts, schemas, synthetic fixtures, validation | Available |
| Local developer Alpha | Stories 1 through 4 in latest source, unpublished and loopback-only |
| PostgreSQL proof | Generated disposable state only |
| Hosted or production runtime | Not available |
| Live knowledge connectors | Not available |
| Real user data support | Not approved |
| Automatic trusted-memory promotion | Forbidden |

The local Alpha proves that the core lifecycle can operate across real processes and disposable PostgreSQL. It does not convert the repository into a hosted, deployed, or production-ready product.

## Product Principles

### Owner control

Owners or owner-controlled applications approve, correct, and revoke trusted memory. Agent harnesses cannot take those actions through MCP.

### Replaceable knowledge

An adopter may use no knowledge base or plug in an owner-selected system through the read-only `KnowledgeProvider v1` contract.

### Adopter-owned infrastructure

The adopter owns the PostgreSQL server, credentials, networking, stored data, backups, availability, and migration execution.

### Evidence before memory

Source evidence may support a pending candidate. It cannot directly create trusted memory.

### Portable policy

Different agent harnesses should retrieve context through the same identity, namespace, provenance, lifecycle, and audit rules.

## From Evidence To Memory

![Source-Wire knowledge and memory boundary](../assets/knowledge-vs-memory.svg)

The intended product loop is:

1. Retrieve authorized evidence or accept an explicit owner assertion.
2. Preserve provenance and propose a pending candidate.
3. Require an explicit owner-controlled decision.
4. Store approved memory as a versioned trusted revision.
5. Serve only active, authorized memory with durable audit evidence.
6. Correct by creating a new revision, or revoke to exclude memory from active reads.

## What Productization Still Requires

Alpha 1 is local proof, not product completion. A future productization unit would still need separate approval and evidence for:

- non-disposable installation and migration workflows,
- production authentication and secret custody,
- operational backup, recovery, and encryption policy,
- supported live provider adapters,
- deployment and upgrade procedures,
- monitoring and incident response,
- real-data privacy and retention controls,
- user-facing owner review and administration,
- production support and contribution policy.

This direction document does not approve any of that work.

## Historical Runtime Baseline

`DanielJD1216/Source-Wire-Memory-Engine` was evaluated as a reference runtime candidate with an AGPLv3 posture. It may inform architecture, but its code must not be copied into Apache-2.0 Source-Wire without a deliberate license path or clean implementation decision.

The historical audit and decision records remain in [`docs/internal/`](../internal/README.md). They provide provenance, not current onboarding.

## Hard Boundaries

Still blocked until separately approved:

- hosted or production API runtime,
- hosted or production MCP runtime,
- non-disposable or production database migrations,
- live connectors,
- deployment,
- production runtime use,
- real user data,
- managed hosting,
- code contribution acceptance,
- new npm publishing,
- new GitHub releases or tags.

Read [Public Status](../status/public-status.md) for current availability and [Release Snapshot Boundary](../status/release-snapshot-boundary.md) for the difference between `v0.1.0` and latest `main`.
