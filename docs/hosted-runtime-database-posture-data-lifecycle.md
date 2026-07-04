# Source-Wire Hosted Runtime Database Posture And Data Lifecycle

Status: PRD/planning only for issue `#262`. Database migrations remain blocked.

This document defines storage posture and data lifecycle rules for a future owner-hosted Source-Wire runtime. It does not add database migrations, database connection code, PostgreSQL setup, pgvector setup, API server code, MCP server runtime code, deployment config, live connectors, real user data, npm publishing, a GitHub release, tags, or code contribution acceptance.

## Purpose

The future Source-Wire runtime will need durable storage, but database work is one of the easiest places to accidentally create a production system before the trust model is ready.

This document defines what must be true before migrations or database-backed runtime claims can start.

## Upstream Boundary

This contract inherits:

- owner-hosted first posture,
- managed-hosted deferred,
- API policy owns authorization,
- MCP calls API policy and cannot bypass it,
- namespace access fails closed,
- source evidence is not trusted memory,
- trusted memory approval remains owner or application controlled,
- public examples stay synthetic only.

References:

- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)
- [Hosted Runtime MCP Server Contract](hosted-runtime-mcp-server-contract.md)

## Storage Posture

Recommended first posture:

- owner-hosted PostgreSQL-compatible database,
- optional vector capability when semantic retrieval requires it,
- owner brings and pays for the database,
- Source-Wire does not host the memory database by default,
- public fixtures do not require a real database connection.

PostgreSQL is a practical default because it can support relational records, audit rows, structured filters, and vector search through extensions such as pgvector. This document does not require pgvector setup and does not add migrations.

Alternative storage may be considered later if it preserves:

- owner control,
- namespace isolation,
- source evidence versus trusted memory separation,
- candidate review state,
- audit durability,
- backup and restore boundaries,
- public-safe verification.

## Data Classes

Future storage must separate these classes:

| Data class | Trust level | Lifecycle owner | Notes |
| --- | --- | --- | --- |
| Owner profile | high sensitivity | owner | Must not appear in public fixtures. |
| Namespace | policy boundary | owner/application | Separates projects, clients, users, teams, and agents. |
| Source connection | source metadata | owner/application | Defines a source, not trusted memory. |
| Source evidence | evidence only | owner/application | Imported/synced material used for citations and candidates. |
| Source segment | evidence only | owner/application | Chunked or segmented source evidence. |
| Candidate memory | pending review | owner/application | Can become trusted only after approval. |
| Trusted Memory Record | approved context | owner/application | Requires owner or approved application promotion. |
| Handoff evidence | operational evidence | owner/application | Not trusted memory by default. |
| Audit event | policy evidence | owner/application | Records allowed, denied, partial, and failed actions. |
| Embedding/vector | derived evidence | owner/application | Must retain source/trusted ownership and namespace. |
| Cache | derived temporary data | owner/application | Must not widen access or outlive retention policy accidentally. |
| Backup/export | high sensitivity | owner | Must preserve owner and namespace boundaries. |

## Namespace And Tenant Isolation

Every stored record must carry enough boundary metadata to enforce policy:

- owner ID,
- namespace ID,
- data class,
- provenance,
- source or candidate linkage when relevant,
- created/updated timestamps,
- deletion or stale state when relevant,
- audit trace when relevant.

Rules:

- missing owner or namespace fails closed,
- cross-namespace reads fail closed,
- cross-tenant access is out of scope until managed-hosted is separately approved,
- citations cannot reveal denied namespace content,
- embeddings and caches inherit the namespace and sensitivity of their source,
- backups and restores must preserve owner and namespace boundaries.

## Lifecycle States

Source evidence lifecycle:

```text
submitted
  -> imported
  -> segmented
  -> indexed
  -> stale | active | deleted
  -> retained | purged
```

Candidate lifecycle:

```text
prepared
  -> pending_review
  -> approved | rejected
  -> superseded | retained | purged
```

Trusted memory lifecycle:

```text
approved
  -> active
  -> superseded | revoked | deleted
  -> retained | purged
```

Audit lifecycle:

```text
recorded
  -> retained
  -> exported by owner | purged by owner policy
```

No lifecycle transition may promote source evidence to trusted memory without owner or owner-approved application control.

## Retention And Deletion Posture

Retention is owner-controlled.

Future runtime planning must define retention rules for:

- source evidence,
- trusted memory,
- candidates,
- handoff evidence,
- audit events,
- embeddings,
- caches,
- backups,
- exports.

Deletion rules:

- deleting source evidence should mark dependent citations stale or deleted,
- deleting trusted memory should prevent future retrieval,
- deleting a candidate should not delete original source evidence unless explicitly requested and authorized,
- deleting a namespace must not silently leak or preserve retrievable records outside that namespace,
- audit deletion must follow owner policy and legal/privacy requirements,
- cache and embedding deletion must follow the parent record.

## Backup And Restore Risk

Backup and restore are high-risk because they can move many records at once.

Required rules:

- backup artifacts are owner-controlled,
- restore must preserve owner ID and namespace IDs,
- restore must not import data into the wrong namespace,
- restore must not convert source evidence into trusted memory,
- restore must not bypass candidate review,
- restore must not expose secrets, raw local paths, or private connector payloads in public examples,
- restore should produce audit metadata when implemented later.

Managed-hosted backup and restore remain deferred because they add operator access, multi-tenant isolation, support, cost, compliance, and breach impact.

## Migration Posture

Migrations remain blocked in this issue.

Before migrations are approved later, Source-Wire must have:

- accepted threat model,
- accepted API server contract,
- accepted MCP server contract,
- accepted database posture,
- public-safe fixtures,
- explicit migration scope,
- rollback plan,
- migration safety checks,
- no-private-data verification,
- owner approval for an implementation unit.

This issue may discuss tables or data classes, but it must not create migration files.

## Public-Safe Fixture Rule

Public database examples may include:

- synthetic owner IDs,
- synthetic namespace IDs,
- synthetic source IDs,
- synthetic candidate IDs,
- synthetic trusted memory IDs,
- synthetic audit IDs,
- synthetic vector capability flags,
- fake database readiness states.

Public database examples must not include:

- real database connection strings,
- real hostnames,
- real IP addresses,
- real account IDs,
- real emails or domains,
- tokens,
- credentials,
- real local paths,
- client data,
- private owner data,
- production exports.

## Audit Requirements

Future storage must support audit evidence for:

- allowed reads,
- denied reads,
- source maintenance,
- candidate creation,
- candidate rejection,
- trusted-memory approval,
- handoff writes,
- backup and restore actions when implemented,
- deletion and purge actions when implemented.

Audit rows must preserve safe metadata without storing raw secrets or restricted content.

## Database Non-Goals

This issue does not approve:

- database migrations,
- database connection code,
- PostgreSQL installation,
- pgvector installation,
- schema files,
- seed data,
- API server implementation,
- MCP server runtime implementation,
- runtime adapter implementation,
- live connectors,
- local filesystem crawling,
- Mission Control UI,
- managed hosting,
- deployment,
- production runtime use,
- real user data,
- trusted Memory Record auto-promotion,
- npm publishing,
- GitHub release creation,
- tags,
- code contribution acceptance.

## Verification Expectations

Issue `#262` is reconciled when:

- database posture is explicit,
- migrations remain blocked,
- real user data remains blocked,
- backup and restore risk is documented,
- data lifecycle is tied to owner and namespace control,
- deletion, retention, audit, cache, embedding, and backup boundaries are named,
- no database implementation is added.

## Next Planning Issue

After this contract is accepted, issue `#263` can define public-safe fixtures and verification plans across the threat, API, MCP, and database contracts.

