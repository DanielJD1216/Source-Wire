# Source-Wire Hosted Runtime API Server Contract

Status: PRD/planning only for issue `#260`. API server implementation remains blocked.

This document defines the owner-hosted API server contract for a future Source-Wire runtime. It does not add API server code, MCP server runtime code, database migrations, deployment config, live connectors, real user data, npm publishing, a GitHub release, tags, or code contribution acceptance.

## Purpose

The future Source-Wire runtime needs one policy authority.

That authority is the owner-hosted API boundary. MCP tools, agent harnesses, connectors, and runtime adapters must call through this boundary instead of owning their own permission logic.

This contract defines endpoint groups, caller identity, namespace rules, capability checks, audit metadata, denied-result behavior, and non-goals before implementation starts.

## Upstream Boundary

This contract inherits the Slice 1 trust model:

- owner-hosted first,
- managed-hosted deferred,
- API policy boundary owns authorization,
- namespace access fails closed,
- source evidence is not trusted memory,
- trusted memory approval remains owner or application controlled,
- MCP must not bypass API policy.

Reference: [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md).

## API Responsibility Summary

The future API server owns:

- caller authentication,
- owner and namespace resolution,
- action authorization,
- capability checks,
- source evidence policy,
- candidate review state,
- trusted-memory approval policy,
- context assembly policy,
- denied-result shape,
- audit metadata,
- response citation and gap metadata.

The future API server does not own:

- managed-hosted operation,
- public fixture real data,
- direct MCP tool behavior,
- database schema implementation,
- deployment posture,
- billing,
- support policy,
- contribution acceptance.

## Required Request Envelope

Every future API operation should resolve this policy envelope before doing work:

| Field | Required | Purpose |
| --- | --- | --- |
| `caller.id` | yes | Stable owner-safe caller identity or synthetic fixture ID. |
| `caller.kind` | yes | `owner`, `application`, `agent_harness`, `connector`, or `runtime_adapter`. |
| `caller.harnessLabel` | when agent | Human-readable harness label such as Codex or Claude Code. |
| `ownerId` | yes | Owner-controlled memory boundary. Public examples use synthetic IDs. |
| `namespaceId` | yes | Project, client, user, team, or agent workspace boundary. |
| `action` | yes | Operation being requested. |
| `requiredCapability` | yes | Capability needed for the action. |
| `traceId` | yes | Safe request correlation ID. |
| `sourcePolicy` | when relevant | Source evidence freshness and sensitivity posture. |
| `approvalPolicy` | when relevant | Whether trusted-memory approval is owner or application controlled. |

No operation should silently widen the namespace when `namespaceId` is missing or denied.

## Capability Model

Minimum capability groups:

| Capability | Allows | Does not allow |
| --- | --- | --- |
| `read_trusted_memory` | Search or read approved trusted Memory Records in the authorized namespace. | Source import, candidate creation, approval, cross-namespace reads. |
| `read_source_evidence` | Search or read source evidence with citations in the authorized namespace. | Treating source evidence as trusted memory. |
| `assemble_context` | Combine trusted memory and allowed source evidence into cited context. | Mutating sources or approving trusted memory. |
| `import_or_maintain_sources` | Submit source snapshots, source deltas, and maintenance metadata. | Promoting trusted memory automatically. |
| `prepare_candidates` | Create pending candidates for owner review. | Approving or rejecting trusted memory. |
| `approve_trusted_memory` | Promote a candidate through owner or owner-approved application control. | Agent-only promotion by default. |
| `reject_candidates` | Reject pending candidates with audit metadata. | Deleting source evidence unless separately authorized. |
| `read_handoff_evidence` | Read handoff/status evidence in the namespace. | Writing handoff evidence. |
| `write_handoff_evidence` | Write handoff/status evidence with provenance. | Trusted-memory approval. |
| `read_audit` | Read safe audit metadata. | Reading hidden content or raw secrets. |

Agent harness callers should not receive `approve_trusted_memory` by default.

## Endpoint Groups

These are contract groups, not implemented routes.

### Read And Search

Purpose:

- read trusted memory,
- search trusted memory,
- search source evidence,
- assemble cited context,
- answer `/2nd-brain` style requests through policy.

Required envelope:

- caller identity,
- owner ID,
- namespace ID,
- action,
- required capability,
- trace ID.

Required capabilities:

- `read_trusted_memory`,
- `read_source_evidence`,
- `assemble_context`,
- `read_handoff_evidence` when handoff evidence is requested.

Response requirements:

- citations,
- evidence kind,
- freshness state when known,
- gaps for missing, stale, denied, or weak evidence,
- denied count when safe,
- `noAutoPromotion: true` when source evidence or candidates are involved.

### Source Maintenance

Purpose:

- import source snapshots,
- process source deltas later,
- record stale, skipped, changed, imported, and errored files,
- prepare candidates only when policy allows.

Required capability:

- `import_or_maintain_sources`.

Optional capability:

- `prepare_candidates`.

Required behavior:

- source maintenance does not create trusted memory automatically,
- source evidence remains source evidence,
- maintenance returns owner-facing counts and gaps,
- local path and secret values are not returned in public-safe examples.

### Candidate Creation And Review

Purpose:

- create pending memory candidates from source evidence,
- list pending candidates,
- reject candidates,
- prepare owner review state.

Required capabilities:

- `prepare_candidates`,
- `reject_candidates` for rejection.

Required behavior:

- candidates start as pending,
- candidates preserve source provenance,
- candidates do not become trusted memory without approval,
- rejected candidates do not create trusted memory.

### Trusted-Memory Approval

Purpose:

- promote approved candidate into trusted memory.

Required capability:

- `approve_trusted_memory`.

Required caller:

- owner,
- or owner-approved application path.

Required behavior:

- agent-only approval fails closed by default,
- approval preserves provenance and audit metadata,
- source import cannot call this implicitly,
- MCP cannot bypass this through a lower-level runtime adapter.

### Handoff And Status Evidence

Purpose:

- read or write agent handoff/status evidence,
- support current-state answers,
- preserve session and project continuity.

Required capabilities:

- `read_handoff_evidence`,
- `write_handoff_evidence`.

Required behavior:

- handoff evidence is not automatically trusted memory,
- handoff writes must preserve provenance,
- status reads return citations and gaps.

### Audit

Purpose:

- record allowed, denied, partial, and failed policy decisions,
- read safe audit summaries.

Required capability:

- `read_audit` for audit reads.

Required audit metadata:

- timestamp,
- owner-safe ID,
- namespace ID,
- caller kind,
- harness label or token fingerprint,
- action,
- required capability,
- policy result,
- citation count,
- denied count when safe,
- omitted count when safe,
- error count,
- trace ID.

Audit must not include raw tokens, credentials, private local paths, real account values, or restricted content.

## Denied Result Contract

Denied behavior must fail closed without leaking content.

Minimum denied result:

```json
{
  "status": "denied",
  "reasonCode": "missing_capability",
  "requiredCapability": "read_source_evidence",
  "namespaceId": "synthetic_namespace_alpha",
  "traceId": "synthetic_trace_001",
  "omittedCount": 0,
  "safeMessage": "The caller is not allowed to read source evidence in this namespace."
}
```

Denied results must not include:

- hidden memory text,
- cross-namespace content,
- raw source text,
- raw tokens,
- credentials,
- private local paths,
- account IDs,
- real emails or domains,
- production exports.

## Namespace Rules

Every request must resolve exactly one namespace before content access.

Rules:

- missing namespace fails closed,
- malformed namespace fails closed,
- unauthorized namespace fails closed,
- default namespace must not widen access,
- citations cannot reveal denied namespace content,
- denied or omitted counts may be returned only when safe,
- future team or RBAC work must preserve this boundary.

## Source Evidence Versus Trusted Memory

Source evidence:

- can be searched,
- can be cited,
- can produce gaps,
- can prepare candidates,
- cannot become trusted memory automatically.

Trusted memory:

- must come from owner or owner-approved application approval,
- must preserve provenance,
- must stay namespace-scoped,
- must be auditable.

## API Non-Goals

This issue does not approve:

- API server implementation,
- route handlers,
- database migrations,
- PostgreSQL or pgvector setup,
- MCP server runtime implementation,
- runtime adapter implementation,
- live connectors,
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

Issue `#260` is reconciled when:

- endpoint groups are defined,
- every operation group states required caller identity, namespace, action, and permission,
- denied behavior fails closed without leaking content,
- audit metadata is explicit,
- API non-goals are explicit,
- no server implementation is added.

## Next Planning Issue

After this contract is accepted, issue `#261` can define the MCP tool contract that calls this API policy boundary without bypassing it.

