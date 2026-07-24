# Source-Wire Memory Engine Baseline Audit Issue Slices

Status: draft issue slices. Issue publication and implementation remain blocked until owner approval.

This slice map converts the [Memory Engine Baseline Audit PRD](memory-engine-baseline-audit-prd.md) into independently reviewable units.

It does not approve runtime implementation, deployment, real data, npm publishing, GitHub release publishing, or code contribution acceptance.

Issue-ready local payloads are drafted in [Memory Engine Baseline Audit Issue Drafts](issues/memory-engine-baseline-audit/README.md).

## Parent

Parent PRD:

```text
Source-Wire Memory Engine Baseline Audit PRD
```

## Proposed Slices

### Slice 1: Runtime Baseline Capability Audit

Issue draft: [01 Runtime Baseline Capability Audit](issues/memory-engine-baseline-audit/01-runtime-baseline-capability-audit.md).

Local artifact: [Memory Engine Baseline Runtime Capability Audit](memory-engine-baseline-runtime-capability-audit.md).

Type: AFK.

Blocked by: none.

User stories covered: 2, 7, 8, 13, 14, 19.

Goal:

- map the current `Source-Wire-Memory-Engine` runtime capabilities,
- compare them against Source-Wire contracts,
- identify keep, wrap, rewrite, and defer areas.

Acceptance criteria:

- uses the deterministic Understand pass at commit `5ecfc82` as evidence,
- documents existing engine capabilities without copying runtime code,
- maps capabilities to Source-Wire contracts,
- lists gaps and unknowns,
- keeps AGPLv3 code outside Apache-2.0 Source-Wire,
- adds no runtime implementation.

### Slice 2: License Path Decision Packet

Issue draft: [02 License Path Decision Packet](issues/memory-engine-baseline-audit/02-license-path-decision-packet.md).

Local artifact: [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md).

Type: HITL.

Blocked by: Slice 1.

User stories covered: 3, 15, 18, 20, 21.

Goal:

- define license path options before any runtime code movement.

Acceptance criteria:

- compares AGPLv3 reference runtime, Apache-2.0 clean rewrite, dual-license owned code, and separate package options,
- states implications for public adopters, future SaaS, contribution posture, and package boundaries,
- recommends one default path for the next implementation unit,
- records what still needs legal review,
- adds no runtime implementation.

### Slice 3: Owner-Hosted API And MCP Wrapper Boundary

Issue draft: [03 Owner-Hosted API And MCP Wrapper Boundary](issues/memory-engine-baseline-audit/03-owner-hosted-api-and-mcp-wrapper-boundary.md).

Local artifact: [Memory Engine Baseline API And MCP Wrapper Boundary](memory-engine-baseline-api-mcp-wrapper-boundary.md).

Type: AFK after Slice 1.

Blocked by: Slice 1.

User stories covered: 9, 10, 11, 12, 14, 17.

Goal:

- define how Source-Wire would wrap or call a runtime through API and MCP boundaries without bypassing policy.

Acceptance criteria:

- identifies required API policy checks,
- identifies required MCP tool behavior,
- maps citation, gap, denied-result, namespace, caller, and audit metadata expectations,
- states how the wrapper would call a separate runtime candidate,
- explicitly prevents MCP bypass of API policy,
- adds no API or MCP server implementation.

### Slice 4: BYO Self-Hosted Setup Path For Nontechnical Owners

Issue draft: [04 BYO Self-Hosted Setup Path For Nontechnical Owners](issues/memory-engine-baseline-audit/04-byo-self-hosted-setup-path.md).

Local artifact: [Memory Engine Baseline BYO Self-Hosted Setup Path](memory-engine-baseline-byo-self-hosted-setup-path.md).

Type: HITL.

Blocked by: Slice 1 and Slice 3.

User stories covered: 1, 4, 5, 6, 8, 9.

Goal:

- define the future setup path for owners who bring their own device/server, database, model/API keys, sources, and harnesses.

Acceptance criteria:

- separates local device, local network, cloud VM, and managed database paths,
- explains PostgreSQL-compatible database requirements in plain English,
- explains owner-supplied model/API key requirements,
- explains MCP harness connection expectations,
- defines the minimum nontechnical Mission Control needs without implementing UI,
- keeps Source-Wire-managed hosting out of scope.

### Slice 5: Public-Safe Fixtures And Verification Gates

Issue draft: [05 Public-Safe Fixtures And Verification Gates](issues/memory-engine-baseline-audit/05-public-safe-fixtures-and-verification-gates.md).

Local artifact: [Memory Engine Baseline Public-Safe Fixtures And Verification Gates](memory-engine-baseline-public-safe-fixtures-and-verification-gates.md).

Type: AFK after Slices 1, 2, and 3.

Blocked by: Slice 1, Slice 2, Slice 3.

User stories covered: 16, 17, 20, 22.

Goal:

- define fixtures and checks required before any runtime implementation starts.

Acceptance criteria:

- defines synthetic fixture categories for owner, namespace, source evidence, trusted memory, candidates, denied access, and MCP calls,
- prohibits real user data, client data, private paths, tokens, account IDs, emails, domains, screenshots, and production exports,
- defines link checks, safety scans, claim-boundary checks, package checks, and diagram checks,
- defines what proof must exist before implementation can start,
- adds no fixture implementation unless separately approved.

### Slice 6: Runtime Implementation Go/No-Go Gate

Issue draft: [06 Runtime Implementation Go/No-Go Gate](issues/memory-engine-baseline-audit/06-runtime-implementation-go-no-go-gate.md).

Local artifact: [Memory Engine Baseline Runtime Implementation Go/No-Go Gate](memory-engine-baseline-runtime-implementation-go-no-go-gate.md).

Type: HITL.

Blocked by: Slices 1, 2, 3, 4, and 5.

User stories covered: 6, 17, 18, 20, 21, 22.

Goal:

- create the final decision gate that says whether Source-Wire should proceed with a runtime implementation unit.

Acceptance criteria:

- summarizes baseline fit, license path, wrapper boundary, owner-hosted setup path, fixture strategy, and remaining blockers,
- states whether the next unit is keep separate, wrap, rewrite, or defer,
- lists exact no-go conditions,
- lists exact owner approval needed before implementation,
- does not deploy services, publish npm, create a release, accept code contributions, or add real data.

## Recommended Dependency Order

1. Slice 1: Runtime Baseline Capability Audit.
2. Slice 2: License Path Decision Packet.
3. Slice 3: Owner-Hosted API And MCP Wrapper Boundary.
4. Slice 4: BYO Self-Hosted Setup Path For Nontechnical Owners.
5. Slice 5: Public-Safe Fixtures And Verification Gates.
6. Slice 6: Runtime Implementation Go/No-Go Gate.

## Open Approval Questions

Before publishing public GitHub issues, confirm:

- whether these six slices are the right granularity,
- whether Slice 4 should remain HITL because it defines nontechnical setup and deployment posture,
- whether Slice 2 should require legal review before any implementation issue opens,
- whether Slice 3 and Slice 4 should remain separate or merge into one wrapper plus setup issue,
- whether Slice 6 should be a required parent gate before runtime code starts.

## Still Blocked

- runtime implementation,
- API server implementation,
- MCP server implementation,
- database migrations,
- memory-engine code copy,
- Mission Control UI,
- live connectors,
- deployment,
- production runtime use,
- managed-hosted operation,
- real user data,
- code contribution acceptance,
- new npm publishing,
- new GitHub release or tag.
