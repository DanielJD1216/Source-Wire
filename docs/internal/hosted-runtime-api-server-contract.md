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

## Authentication-Derived Authorization Context

Issue `#286` clarifies that the future remote API cannot trust identity or
authority copied from a model-generated request body. The access plane must
authenticate and bind these fields before the operation payload is evaluated:

- human principal;
- client application;
- workspace and channel context when a channel adapter is involved;
- agent session;
- credential audience and resource;
- sender-constrained credential proof: DPoP key thumbprint for interactive and
  public clients or mTLS certificate thumbprint for confidential and workload
  clients;
- owner and tenant;
- allowed namespaces and capabilities;
- monotonic authorization and deletion epochs;
- immutable destination tuple;
- complete multi-hop audience chain;
- destination release ceiling.

**Tool payload identity fields are not grants.** Payload values such as
`caller.id`, `ownerId`, `namespaceId`, `requiredCapability`, client identity,
or sensitivity ceiling can only act as selectors inside the server-derived
authorization context. They cannot widen it.

The effective scope is the intersection of authenticated principal, client,
workspace/channel audience, active session, credential audience,
server-authorized namespaces, server-authorized capabilities, and destination
tuple and audience chain, and the release ceiling for every hop. Missing or contradictory context fails closed without
revealing content, counts, or resource existence.

Bearer-only access tokens fail before policy evaluation. The access plane
validates the token `cnf` binding plus DPoP method, URI, nonce, issuance time,
and replay state, or the bound mTLS certificate, before any Source Wire lookup.
A copied valid token without its bound key or certificate releases zero content.

The destination tuple identifies the actual delivery surface,
workspace/channel/thread, model provider/account/endpoint, locality, and
retention class. It comes from registered routes and verified adapters. A tool
payload cannot claim or substitute it. Search, exact fetch, and release use the
same immutable destination and audience-chain digests.

Reference: [ADR 0002: Global Owner-Hosted Runtime V1](../adr/0002-global-owner-hosted-runtime-v1.md).

### Evidence-Bound Search And Exact Fetch

Search creates a short-lived, one-use opaque citation handle whose server-side
record binds owner, namespace, principal, client, session/replay scope,
credential and authorization epoch, immutable destination and audience-chain
digests, provider, source, segment, source version, content digest, sensitivity,
expiry, and redemption state. Exact fetch atomically redeems the handle using
the same authenticated context and revalidates lifecycle, version, digest,
deletion epoch, and destination release before content is returned.

A stable citation receipt ID is an audit pointer, not a content capability. Its
immutable server-side record binds provider, source, segment, source version,
content digest, sensitivity, original authorization epoch, release trace,
principal, client, and destination/audience-chain digests. Resolution
re-authenticates the principal and client and rechecks namespace and capability
authorization, lifecycle and deletion state, source version and digest, and
current destination release policy. A copied, replayed,
destination-substituted, stale, deleted, or digest-mismatched receipt fails
closed. Guessed source or segment IDs cannot replace the short-lived exact-fetch
handle, and receipt resolution never recreates an expired or redeemed handle.

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

PostgreSQL 16 policy is the sole grant authority. A KnowledgeProvider may apply
stricter provider-local source ACL metadata, but it cannot add an owner,
namespace, capability, classification, or destination grant. Evidence retrieval
uses bounded delegation and final release reauthorizes against the current
PostgreSQL 16 authorization and deletion epochs.

Revocation and deletion acknowledgment requires a synchronous append to the
independently restored epoch-and-tombstone journal. Journal outage denies the
mutation, and restore cannot become ready before the latest journal is applied.

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
| `caller.id` | yes | Transport-derived human principal or synthetic fixture ID. A payload copy must match. |
| `caller.kind` | yes | Transport-derived client class: `owner`, `application`, `agent_harness`, `connector`, or `runtime_adapter`. |
| `caller.harnessLabel` | when agent | Registered client application label such as Codex or Claude Code. |
| `ownerId` | yes | Server-bound owner boundary. Public examples use synthetic IDs. |
| `namespaceId` | yes | Selector inside the server-authorized project, user, team, or agent workspace set. |
| `action` | yes | Operation being requested. |
| `requiredCapability` | yes | Minimum capability needed for the action; the server decides whether it is granted. |
| `traceId` | yes | Safe request correlation ID. |
| `authorizationEpoch` | yes | Server-derived monotonic policy epoch. Payload copies cannot override it. |
| `deletionEpoch` | when evidence enabled | Server-derived monotonic lifecycle epoch. |
| `destinationDigest` | yes | Digest of the transport-derived immutable destination tuple. |
| `audienceChainDigest` | yes | Digest of every verified downstream audience hop. |
| `sourcePolicy` | when relevant | Source evidence freshness and sensitivity posture. |
| `approvalPolicy` | when relevant | Whether trusted-memory approval is owner or application controlled. |

No operation should silently widen the namespace when `namespaceId` is missing or denied.
Any payload copy of transport-derived identity, destination, audience, or epoch
must match exactly or the request is denied before policy or retrieval.

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
- candidate creation accepts only a stable citation receipt ID plus
  independently authenticated owner intent and canonical candidate arguments,
- the server resolves and validates the receipt under current principal,
  client, namespace, lifecycle, digest, and destination policy,
- provider, source, segment, source version, content digest, stable receipt,
  release trace, principal, and client are derived from server-side receipt and
  request context rather than client-supplied provenance fields,
- candidates persist those immutable provenance fields,
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

