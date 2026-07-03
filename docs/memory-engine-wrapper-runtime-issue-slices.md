# Source-Wire Memory Engine Wrapper Runtime Issue Slices

Status: draft local issue slices. Implementation and public GitHub issue publication remain blocked until exact owner approval.

Date: 2026-07-02

This slice map converts the [Source-Wire Memory Engine Wrapper Runtime PRD](memory-engine-wrapper-runtime-prd.md) into independently reviewable units.

It does not approve implementation, deployment, real data, npm publishing, GitHub release publishing, managed hosting, code contribution acceptance, or AGPLv3 code copying.

Issue-ready local payloads are drafted in [Memory Engine Wrapper Runtime Issue Drafts](issues/memory-engine-wrapper-runtime/README.md).

## Parent

Parent PRD:

```text
Source-Wire Memory Engine Wrapper Runtime PRD
```

## Proposed Slices

### Slice 1: Wrapper Runtime Policy Contract And Threat Boundary

Issue draft: [01 Wrapper Runtime Policy Contract And Threat Boundary](issues/memory-engine-wrapper-runtime/01-wrapper-runtime-policy-contract-and-threat-boundary.md).

Local artifact: [Wrapper Runtime Policy Contract](contracts/wrapper-runtime-policy-contract.md).

Type: HITL.

Blocked by: none.

User stories covered: 1, 2, 3, 4, 5, 6, 7, 8, 21, 26, 27, 30.

Goal:

- define the exact policy contract for the future wrapper runtime,
- preserve owner-hosted, no-copy, no-real-data, no-deploy, and no-MCP-bypass boundaries,
- define stop conditions before code starts.

Acceptance criteria:

- owner, harness, namespace, capability, source, trusted-memory, citation, gap, denied-result, audit, and runtime-adapter policy terms are defined,
- MCP bypass remains forbidden,
- no-auto-promotion remains required,
- direct runtime merge and AGPLv3 code copy remain blocked,
- no implementation is added.

### Slice 2: Synthetic Wrapper Runtime Fixture Matrix

Issue draft: [02 Synthetic Wrapper Runtime Fixture Matrix](issues/memory-engine-wrapper-runtime/02-synthetic-wrapper-runtime-fixture-matrix.md).

Local artifact: [Source-Wire Memory Engine Wrapper Runtime Fixture Matrix](memory-engine-wrapper-runtime-fixture-matrix.md).

Fixture artifact: [Wrapper runtime fixture matrix](../examples/fixtures/wrapper-runtime/README.md).

Type: AFK after Slice 1.

Blocked by: Slice 1.

User stories covered: 13, 24, 26, 28, 30.

Goal:

- define and, if separately approved inside the implementation unit, add synthetic fixtures for the wrapper runtime behavior.

Acceptance criteria:

- fixture categories include owner, namespace, harness caller, source evidence, trusted memory, candidates, denied access, gaps, MCP calls, audit events, and runtime adapter result,
- fixtures use obviously fake values,
- fixtures contain no real user data, client data, private paths, tokens, account IDs, emails, domains, screenshots, or production exports,
- fixture validation or smoke proof is defined.

### Slice 3: Owner-Hosted API Policy Wrapper Smoke

Issue draft: [03 Owner-Hosted API Policy Wrapper Smoke](issues/memory-engine-wrapper-runtime/03-owner-hosted-api-policy-wrapper-smoke.md).

Local artifact: [Source-Wire Memory Engine Wrapper Runtime API Policy Wrapper Smoke](memory-engine-wrapper-runtime-api-policy-wrapper-smoke.md).

Smoke command:

```bash
npm run wrapper-runtime:api-policy-smoke
```

Type: AFK after Slices 1 and 2.

Blocked by: Slice 1 and Slice 2.

User stories covered: 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 21, 25.

Goal:

- implement the narrowest synthetic owner-hosted API policy wrapper proof.

Acceptance criteria:

- authorized read succeeds,
- unauthorized caller fails closed,
- wrong namespace fails closed,
- source evidence remains separate from trusted memory,
- pending candidates do not become trusted memory,
- owner or application approval path is represented,
- denied, gap, citation, namespace, caller, and audit metadata are shaped safely,
- no database migration, deployment, real data, or direct runtime merge is added.

### Slice 4: MCP Adapter Policy Routing Smoke

Issue draft: [04 MCP Adapter Policy Routing Smoke](issues/memory-engine-wrapper-runtime/04-mcp-adapter-policy-routing-smoke.md).

Local artifact: [Source-Wire Memory Engine Wrapper Runtime MCP Adapter Policy Routing Smoke](memory-engine-wrapper-runtime-mcp-adapter-policy-routing-smoke.md).

Smoke command:

```bash
npm run wrapper-runtime:mcp-adapter-smoke
```

Type: AFK after Slice 3.

Blocked by: Slice 3.

User stories covered: 3, 16, 17, 18, 19, 20, 22, 30.

Goal:

- implement the narrowest MCP adapter proof that calls the API policy wrapper instead of any runtime candidate directly.

Acceptance criteria:

- MCP-shaped tool calls are mapped to API policy requests,
- MCP preserves citations, gaps, denied counts, namespace metadata, and caller metadata,
- maintenance-like calls preserve `noAutoPromotion`,
- MCP cannot approve trusted memory by default,
- tests prove no direct memory-engine save/delete path is exposed.

### Slice 5: Separate Runtime Adapter Boundary Smoke

Issue draft: [05 Separate Runtime Adapter Boundary Smoke](issues/memory-engine-wrapper-runtime/05-separate-runtime-adapter-boundary-smoke.md).

Local artifact: [Source-Wire Memory Engine Wrapper Runtime Separate Runtime Adapter Boundary Smoke](memory-engine-wrapper-runtime-separate-runtime-adapter-boundary-smoke.md).

Smoke command:

```bash
npm run wrapper-runtime:runtime-adapter-smoke
```

Type: AFK after Slice 3.

Blocked by: Slice 3.

User stories covered: 2, 17, 18, 21, 23, 27, 30.

Goal:

- implement the narrowest adapter boundary proof for calling a separate runtime candidate result without delegating Source-Wire policy to that runtime.

Acceptance criteria:

- adapter uses synthetic runtime results only,
- Source-Wire policy remains outside the runtime candidate,
- runtime result is shaped before reaching MCP,
- adapter cannot own auth, namespace, approval, citation, denied-result, or audit policy,
- no AGPLv3 code is copied,
- no Docker or installer bundling is added.

### Slice 6: Wrapper Runtime Proof, Docs, And Stop Conditions

Issue draft: [06 Wrapper Runtime Proof Docs And Stop Conditions](issues/memory-engine-wrapper-runtime/06-wrapper-runtime-proof-docs-and-stop-conditions.md).

Type: AFK after Slices 2, 3, 4, and 5.

Blocked by: Slice 2, Slice 3, Slice 4, and Slice 5.

User stories covered: 14, 15, 26, 28, 29, 30.

Goal:

- prove the wrapper runtime unit remains public-safe, owner-hosted, synthetic, no-copy, no-deploy, no-release, and no-managed-hosting.

Acceptance criteria:

- package checks pass,
- fixture validation and smoke proofs pass,
- docs links and anchors pass,
- public safety scan passes,
- claim-boundary scan passes,
- docs state runtime status accurately,
- implementation stop conditions are still visible,
- no npm publish, GitHub release, deployment, real data, managed hosting, or contribution acceptance occurs.

## Recommended Dependency Order

1. Slice 1: Wrapper Runtime Policy Contract And Threat Boundary.
2. Slice 2: Synthetic Wrapper Runtime Fixture Matrix.
3. Slice 3: Owner-Hosted API Policy Wrapper Smoke.
4. Slice 4: MCP Adapter Policy Routing Smoke.
5. Slice 5: Separate Runtime Adapter Boundary Smoke.
6. Slice 6: Wrapper Runtime Proof, Docs, And Stop Conditions.

## Open Approval Questions

Before implementation or public issue publication, confirm:

- whether this six-slice granularity is right,
- whether Slice 1 should remain HITL,
- whether Slice 5 should happen before Slice 4 or in parallel after Slice 3,
- whether Slice 2 is allowed to add new synthetic fixtures during the future implementation unit,
- whether any database migration or Mission Control UI work must remain in a separate later PRD.

## Still Blocked

- implementation until exact owner approval,
- public GitHub issue publication until exact owner approval,
- direct runtime merge,
- AGPLv3 code copy,
- database migrations,
- live connectors,
- deployment,
- production runtime use,
- managed-hosted operation,
- real user data,
- code contribution acceptance,
- new npm publishing,
- new GitHub release or tag.
