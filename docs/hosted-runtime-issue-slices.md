# Source-Wire Hosted Runtime PRD Slice Map

Status: draft issue slices. Implementation remains blocked.

This slice map converts the hosted runtime PRD into independently reviewable units. It does not approve implementation, deploy services, add real data, publish npm, create a GitHub release, or accept code contributions.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Parent

Parent PRD:

```text
Source-Wire Hosted Runtime PRD
```

## Proposed Slices

### Slice 1: Hosted Runtime Threat Model And Trust Boundary

Type: HITL.

Blocked by: none.

User stories covered: 1, 2, 3, 4, 5, 6, 7, 15, 20.

Goal:

- define runtime threats,
- separate owner-hosted and managed-hosted risk,
- keep trusted memory approval owner or application controlled,
- define fail-closed namespace and permission behavior.

Acceptance criteria:

- threat model covers unauthorized callers, cross-namespace reads, source-to-memory confusion, prompt injection, secrets, audit gaps, backups, deployment misconfiguration, and MCP bypass,
- owner-hosted first posture is explicit,
- managed-hosted remains deferred,
- no implementation is added.

Planning artifact:

- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)

Verification:

```bash
npm run runtime:threat-model
```

### Slice 2: API Server Runtime Contract

Type: AFK after Slice 1.

Blocked by: Slice 1.

User stories covered: 3, 4, 5, 6, 7, 11, 13, 16.

Goal:

- define API server endpoints, authorization model, namespace model, audit metadata, and non-goals.

Acceptance criteria:

- API operations are grouped by read, search, source maintenance, candidate creation, trusted-memory approval, and audit,
- every operation states required caller identity, namespace, action, and permission,
- denied behavior fails closed without leaking content,
- no server code or deployment config is added.

Planning artifact:

- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)

Verification:

```bash
npm run runtime:api-contract
```

### Slice 3: MCP Server Runtime Contract

Type: AFK after Slice 1.

Blocked by: Slice 1.

User stories covered: 8, 9, 10, 12.

Goal:

- define MCP tool names, input and output boundaries, permissions, citation behavior, denied-result behavior, and API-bypass prohibition.

Acceptance criteria:

- MCP tools call the API policy boundary,
- tool outputs preserve citations, gaps, denied counts, and audit-friendly metadata,
- mutation-like tools require explicit authority,
- no MCP server runtime code is added.

Planning artifact:

- [Hosted Runtime MCP Server Contract](hosted-runtime-mcp-server-contract.md)

Verification:

```bash
npm run runtime:mcp-contract
```

### Slice 4: Database Posture And Data Lifecycle

Type: HITL.

Blocked by: Slice 1 and Slice 2.

User stories covered: 1, 4, 6, 13, 15, 20.

Goal:

- define storage posture before migrations,
- document PostgreSQL or alternative storage boundaries,
- define tenant isolation, retention, backup, restore, deletion, and audit requirements.

Acceptance criteria:

- database posture is explicit,
- migrations remain blocked,
- real user data remains blocked,
- backup and restore risk is documented,
- data lifecycle is tied to namespace and owner control.

Planning artifact:

- [Hosted Runtime Database Posture And Data Lifecycle](hosted-runtime-database-posture-data-lifecycle.md)

Verification:

```bash
npm run runtime:database-posture
```

### Slice 5: Public-Safe Fixture And Verification Plan

Type: AFK after Slices 1, 2, and 3.

Blocked by: Slice 1, Slice 2, Slice 3.

User stories covered: 14, 16, 18, 19.

Goal:

- define synthetic fixtures and verification gates for later implementation.

Acceptance criteria:

- fixtures use synthetic callers, namespaces, sources, candidates, trusted memory, and denied cases,
- fixtures contain no real user data, private owner data, local paths, account IDs, emails, domains, tokens, screenshots, client data, or production exports,
- verification includes readiness, safety, claim boundary, docs, and owner-side live gates,
- no fixture implementation is added unless a later implementation unit approves it.

### Slice 6: Deployment Boundary And Runtime Stop Conditions

Type: HITL.

Blocked by: Slices 1, 2, 3, and 4.

User stories covered: 1, 2, 16, 18, 20.

Goal:

- define what deployment would mean later without deploying anything now.

Acceptance criteria:

- local, owner-hosted, and managed-hosted boundaries are separated,
- production runtime claims remain blocked,
- deployment config remains blocked,
- rollback and stop conditions are explicit,
- no hosted service is created.

## Recommended Dependency Order

1. Slice 1: Hosted Runtime Threat Model And Trust Boundary.
2. Slice 2: API Server Runtime Contract.
3. Slice 3: MCP Server Runtime Contract.
4. Slice 4: Database Posture And Data Lifecycle.
5. Slice 5: Public-Safe Fixture And Verification Plan.
6. Slice 6: Deployment Boundary And Runtime Stop Conditions.

## Open Approval Question

Before publishing child issues, confirm:

- `npm run runtime-readiness:smoke` passes,
- `npm run runtime-proof-intake:smoke` passes,
- whether Slice 4 should stay HITL because database posture affects long-term architecture,
- whether Slice 6 should stay HITL because deployment posture affects public claims,
- whether Slice 2 and Slice 3 should be separate issues or merged into one runtime interface issue.

## Still Blocked

- hosted runtime implementation,
- API server implementation,
- MCP server runtime implementation,
- database migrations,
- deployment,
- production runtime use,
- real user data,
- code contribution acceptance,
- new npm publishing,
- new GitHub release or tag.
