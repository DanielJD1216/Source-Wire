# Source-Wire Hosted Runtime Child Issue Publication Packet

Status: publication packet only.

This packet does not publish child issues, implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this packet after reading the [Hosted Runtime Slice Approval Request](hosted-runtime-slice-approval-request.md) and before any future child issue publication unit.

The packet makes the future GitHub issue payloads explicit so the publication step can stay mechanical after owner approval.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run runtime:child-issue-publication-packet
```

Expected markers:

```text
ok hosted runtime child issue publication packet ready
ok hosted runtime issue payloads validated
blocked child issue publication pending owner approval
blocked hosted runtime implementation
```

## Exact Approval Text

Do not publish child issues until the owner approves this exact approval text:

```text
Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.
```

## Parent Issue

Parent tracker:

```text
#257 Owner decision: open hosted runtime PRD path
```

## Shared Boundary For All Child Issues

Every child issue must include this boundary:

- Status: PRD/planning issue only.
- No implementation is approved by this issue.
- Hosted runtime implementation remains blocked.
- API server implementation remains blocked.
- MCP server runtime implementation remains blocked.
- Database migrations remain blocked.
- Deployment remains blocked.
- Production runtime use remains blocked.
- Real user data remains blocked.
- Code contribution acceptance remains blocked.
- Npm publishing remains blocked.
- GitHub release creation remains blocked.
- Tags remain blocked.

## Future Issue Payloads

### Issue 1: Hosted Runtime Threat Model And Trust Boundary

Labels:

- `boundary`
- `safety`
- `docs`

Type: HITL.

Blocked by: none.

User stories covered: 1, 2, 3, 4, 5, 6, 7, 15, 20.

Goal:

Define runtime threats, separate owner-hosted and managed-hosted risk, keep trusted memory approval owner or application controlled, and define fail-closed namespace and permission behavior.

Acceptance criteria:

- Threat model covers unauthorized callers, cross-namespace reads, source-to-memory confusion, prompt injection, secrets, audit gaps, backups, deployment misconfiguration, and MCP bypass.
- Owner-hosted first posture is explicit.
- Managed-hosted remains deferred.
- No implementation is added.

### Issue 2: API Server Runtime Contract

Labels:

- `contracts`
- `boundary`
- `docs`

Type: AFK after Slice 1.

Blocked by: Slice 1.

User stories covered: 3, 4, 5, 6, 7, 11, 13, 16.

Goal:

Define API server endpoints, authorization model, namespace model, audit metadata, and non-goals.

Acceptance criteria:

- API operations are grouped by read, search, source maintenance, candidate creation, trusted-memory approval, and audit.
- Every operation states required caller identity, namespace, action, and permission.
- Denied behavior fails closed without leaking content.
- No server code or deployment config is added.

### Issue 3: MCP Server Runtime Contract

Labels:

- `contracts`
- `boundary`
- `docs`

Type: AFK after Slice 1.

Blocked by: Slice 1.

User stories covered: 8, 9, 10, 12.

Goal:

Define MCP tool names, input and output boundaries, permissions, citation behavior, denied-result behavior, and API-bypass prohibition.

Acceptance criteria:

- MCP tools call the API policy boundary.
- Tool outputs preserve citations, gaps, denied counts, and audit-friendly metadata.
- Mutation-like tools require explicit authority.
- No MCP server runtime code is added.

### Issue 4: Database Posture And Data Lifecycle

Labels:

- `boundary`
- `safety`
- `docs`

Type: HITL.

Blocked by: Slice 1 and Slice 2.

User stories covered: 1, 4, 6, 13, 15, 20.

Goal:

Define storage posture before migrations, document PostgreSQL or alternative storage boundaries, and define tenant isolation, retention, backup, restore, deletion, and audit requirements.

Acceptance criteria:

- Database posture is explicit.
- Migrations remain blocked.
- Real user data remains blocked.
- Backup and restore risk is documented.
- Data lifecycle is tied to namespace and owner control.

### Issue 5: Public-Safe Fixture And Verification Plan

Labels:

- `verification`
- `safety`
- `docs`

Type: AFK after Slices 1, 2, and 3.

Blocked by: Slice 1, Slice 2, Slice 3.

User stories covered: 14, 16, 18, 19.

Goal:

Define synthetic fixtures and verification gates for later implementation.

Acceptance criteria:

- Fixtures use synthetic callers, namespaces, sources, candidates, trusted memory, and denied cases.
- Fixtures contain no real user data, private owner data, local paths, account IDs, emails, domains, tokens, screenshots, client data, or production exports.
- Verification includes readiness, safety, claim boundary, docs, and owner-side live gates.
- No fixture implementation is added unless a later implementation unit approves it.

### Issue 6: Deployment Boundary And Runtime Stop Conditions

Labels:

- `boundary`
- `safety`
- `docs`

Type: HITL.

Blocked by: Slices 1, 2, 3, and 4.

User stories covered: 1, 2, 16, 18, 20.

Goal:

Define what deployment would mean later without deploying anything now.

Acceptance criteria:

- Local, owner-hosted, and managed-hosted boundaries are separated.
- Production runtime claims remain blocked.
- Deployment config remains blocked.
- Rollback and stop conditions are explicit.
- No hosted service is created.

## Post-Publication Verification

After a separately approved publication unit creates child issues, run:

```bash
npm run owner:open-issues-status
npm run owner:decision-issues-freshness
npm run world:share-final-preflight
```

If the open-issue boundary changes because the six planning issues now exist, update the owner-open-issue guard in the same publication unit.

## Related Docs

- [Hosted Runtime PRD](hosted-runtime-prd.md)
- [Hosted Runtime PRD Slice Map](hosted-runtime-issue-slices.md)
- [Hosted Runtime Slice Approval Request](hosted-runtime-slice-approval-request.md)
- [Owner Open Issues Status](owner-open-issues-status.md)
