# Source-Wire Hosted Runtime Deployment Boundary And Runtime Stop Conditions

Status: PRD/planning only for issue `#264`. Deployment and hosted services remain blocked.

This document defines what deployment would mean later without deploying anything now. It does not add hosted runtime implementation, API server code, MCP server runtime code, database migrations, deployment config, Docker config, cloud config, managed hosting, production runtime use, real user data, npm publishing, a GitHub release, tags, or code contribution acceptance.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Purpose

The project needs a plain boundary for running Source-Wire later.

The important distinction:

```text
Running software is not the same thing as Source-Wire hosting memory for people.
```

The first runtime path should stay owner-hosted. Each owner runs their own instance on their own device, local network, cloud account, or chosen infrastructure. Source-Wire does not become the operator of other people's memory unless a separate managed-hosted unit is approved later.

## Upstream Boundary

This plan inherits:

- owner-hosted first posture,
- managed-hosted deferred,
- API policy owns authorization,
- MCP calls API policy and cannot bypass it,
- database migrations remain blocked,
- public fixtures stay synthetic only,
- deployment remains blocked,
- production runtime use remains blocked,
- trusted memory approval remains owner or application controlled.

References:

- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)
- [Hosted Runtime MCP Server Contract](hosted-runtime-mcp-server-contract.md)
- [Hosted Runtime Database Posture And Data Lifecycle](hosted-runtime-database-posture-data-lifecycle.md)
- [Hosted Runtime Public-Safe Fixture And Verification Plan](hosted-runtime-public-safe-fixture-verification-plan.md)

## Deployment Vocabulary

| Term | Meaning | Current status |
| --- | --- | --- |
| Local development run | A developer runs code on their own machine for development or synthetic proof. | Allowed only for existing package checks and future separately approved implementation proofs. |
| Owner-hosted runtime | A memory owner runs their own API, MCP adapter, and database boundary on their own device or infrastructure. | Planned, not implemented. |
| Managed-hosted runtime | Source-Wire or another operator hosts memory runtime for other people. | Deferred and blocked. |
| Production runtime use | A real owner or business depends on the runtime for live memory operations. | Blocked. |
| Deployment config | Files or instructions that deploy Source-Wire services to a runtime environment. | Blocked. |
| Hosted service | A public or private service operated for others. | Blocked. |

## Local Development Boundary

Local development may later be used to prove synthetic behavior.

Allowed local development examples later, only after implementation approval:

- run a synthetic API policy wrapper locally,
- run a synthetic MCP adapter locally,
- run public-safe smoke tests,
- run fixture validation,
- run local package checks.

Local development must not:

- use real owner memory,
- use client data,
- use real production exports,
- crawl local files automatically,
- connect to live external accounts,
- imply production readiness,
- open inbound public access by default,
- include deployment config,
- require secrets for public proof.

## Owner-Hosted Boundary

Owner-hosted means the memory owner controls:

- where the API runs,
- where the MCP adapter runs,
- where the database lives,
- who can call the API,
- which namespaces exist,
- which sources are imported,
- which candidates become trusted memory,
- what gets backed up,
- what gets deleted.

Owner-hosted does not mean:

- Source-Wire pays for infrastructure,
- Source-Wire stores the owner's memory,
- Source-Wire operates a shared multi-tenant service,
- public examples can contain private owner data,
- agents can bypass owner or application approval.

## Managed-Hosted Boundary

Managed-hosted remains deferred.

Managed-hosted would mean some operator runs memory infrastructure for other people. That adds new risks:

- operator access,
- multi-tenant isolation,
- billing,
- support,
- abuse handling,
- breach response,
- compliance,
- data residency,
- backups,
- account recovery,
- service-level expectations.

Managed-hosted requires a separate future PRD, threat model, cost model, legal review, support model, security review, and owner approval before any implementation work starts.

## Production Runtime Claims

Production runtime claims remain blocked.

Public docs may say:

- Source-Wire defines contracts,
- Source-Wire includes synthetic fixtures,
- Source-Wire plans owner-hosted runtime boundaries,
- future runtime work requires approval.

Public docs must not say:

- Source-Wire hosts memory for users,
- Source-Wire is ready for live memory operations,
- Source-Wire includes a deployed API server,
- Source-Wire includes a deployed MCP server runtime,
- Source-Wire includes database migrations,
- Source-Wire can ingest real private sources out of the box,
- Source-Wire provides managed hosting.

## Deployment Stop Conditions

Stop immediately if a future change:

- adds deployment config,
- adds cloud provider config,
- adds Docker or container deployment config for runtime services,
- opens public network access,
- requires real secrets,
- requires a real database connection,
- adds database migrations without a migration approval unit,
- adds live connector sync,
- imports real user data,
- imports client data,
- uses real local paths in public examples,
- lets MCP bypass API policy,
- lets source evidence become trusted memory automatically,
- claims production readiness,
- creates a hosted service,
- creates billing or account management expectations,
- accepts public code contributions before contribution terms are approved.

## Rollback And Recovery Expectations

Before deployment is approved later, the implementation unit must define rollback for:

- bad API policy rules,
- bad MCP tool permission rules,
- bad namespace isolation,
- bad database migration,
- bad source import,
- bad candidate promotion,
- bad public claim wording,
- leaked secret or private data,
- unsafe deployment exposure.

Minimum rollback evidence later:

- exact change being rolled back,
- data classes affected,
- namespaces affected,
- whether source evidence, candidates, trusted memory, embeddings, caches, or audit events are affected,
- owner-visible impact,
- recovery command or manual recovery process,
- verification command after rollback.

This issue does not implement rollback behavior.

## Required Gates Before Deployment Work

Before any future deployment unit starts, the owner must have:

- accepted threat model,
- accepted API server contract,
- accepted MCP server contract,
- accepted database posture,
- accepted public-safe fixture plan,
- accepted deployment boundary,
- explicit implementation approval,
- no-private-data proof plan,
- rollback plan,
- safety scan,
- claim boundary scan,
- Package Checks green,
- owner decision issues fresh.

Required commands before asking for deployment implementation approval:

```bash
npm run runtime:threat-model
npm run runtime:api-contract
npm run runtime:mcp-contract
npm run runtime:database-posture
npm run runtime:fixture-plan
npm run runtime:deployment-boundary
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run safety:scan
npm run claims:scan
npm run owner:open-issues-status
```

## No Hosted Service Created

This issue creates no hosted service.

It does not:

- deploy services,
- create cloud resources,
- create a database,
- create DNS records,
- expose an API endpoint,
- expose an MCP endpoint,
- add auth provider config,
- add billing,
- add account management,
- add monitoring,
- add production logs,
- add production secrets,
- add support obligations.

## Deployment Non-Goals

This issue does not add:

- hosted runtime implementation,
- API server implementation,
- MCP server runtime implementation,
- database migrations,
- PostgreSQL setup,
- pgvector setup,
- deployment config,
- Docker deployment config,
- cloud infrastructure config,
- managed hosting,
- production runtime use,
- live connectors,
- local filesystem crawling,
- Mission Control UI,
- real user data,
- client data,
- trusted Memory Record auto-promotion,
- npm publishing,
- GitHub release creation,
- tags,
- code contribution acceptance.

## Acceptance Mapping

| Acceptance criterion | Status |
| --- | --- |
| Local, owner-hosted, and managed-hosted boundaries are separated. | Covered by deployment vocabulary and boundary sections. |
| Production runtime claims remain blocked. | Covered by production runtime claims. |
| Deployment config remains blocked. | Covered by stop conditions and non-goals. |
| Rollback and stop conditions are explicit. | Covered by stop conditions and rollback expectations. |
| No hosted service is created. | Covered by no hosted service created. |
