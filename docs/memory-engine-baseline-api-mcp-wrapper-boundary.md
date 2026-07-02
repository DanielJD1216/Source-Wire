# Memory Engine Baseline API And MCP Wrapper Boundary

Status: Slice 3 local boundary packet complete. Runtime implementation remains blocked.

Date: 2026-07-02

## Scope

This document defines how Source-Wire should wrap or call a runtime through owner-hosted API and MCP boundaries while preserving policy checks.

This is a planning and boundary document only.

It does not add:

- API server runtime,
- MCP server runtime,
- database migrations,
- memory-engine integration code,
- Docker or installer bundling,
- real user data,
- Mission Control UI,
- deployment,
- npm publishing,
- GitHub release publishing.

## Prior Inputs

- [Memory Engine Baseline Runtime Capability Audit](memory-engine-baseline-runtime-capability-audit.md)
- [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [MCP Tool Behavior Contract](contracts/mcp-tool-behavior-contract.md)
- [`second-brain.v1` Contract](contracts/second-brain-v1-contract.md)
- [Owner-hosted API plus MCP boundary fixture](../examples/fixtures/owner-hosted-api-mcp-boundary/README.md)
- `src/runtime/minimal-boundary.ts`

## Core Boundary Decision

The owner-hosted API owns policy.

The MCP server owns agent ergonomics.

The memory engine owns low-level retrieval and storage primitives.

```text
Agent harness
  -> MCP tool
  -> owner-hosted API policy boundary
  -> Source-Wire source/memory/context policy
  -> optional separate runtime adapter
  -> Source-Wire-shaped response
```

MCP must not call the memory engine directly for any operation that can reveal, import, update, delete, prepare, approve, or promote memory.

Plain English:

```text
MCP is the doorway.
The API is the guard.
The runtime is the machinery behind the guard.
```

## Required API Policy Checks

Every owner-hosted API action must check:

| Check | Purpose | Fail behavior |
| --- | --- | --- |
| Owner identity | Confirms the caller belongs to the memory owner or an owner-controlled app. | Deny without private content. |
| Harness token | Confirms which agent/tool is calling. | Deny without private content. |
| Capability scope | Confirms the token can perform the requested action. | Deny with omitted/restricted count. |
| Namespace scope | Confirms requested namespace is allowed for the caller. | Deny without cross-namespace leakage. |
| Sensitivity scope | Confirms content sensitivity is allowed. | Omit restricted content and count omissions. |
| Source policy | Confirms source read/import/maintenance is allowed. | Return denied or partial success with findings. |
| Trusted-memory policy | Confirms whether trusted memory read/write/promotion is allowed. | Deny promotion unless owner or approved app controls the path. |
| Audit event write | Preserves who called what, for which namespace, with what result. | Fail closed if audit is required and unavailable. |
| Response shaping | Ensures citations, gaps, stale warnings, no-auto-promotion, and denied counts are returned. | Return structured error or gap, not raw backend output. |

Minimum capability names should include:

- `read_trusted_memory`,
- `read_source_evidence`,
- `import_or_maintain_sources`,
- `prepare_candidates`,
- `approve_trusted_memory`,
- `read_handoff_evidence`,
- `write_handoff_evidence`,
- `assemble_context`.

Agent harness tokens should not receive `approve_trusted_memory` by default.

## Required MCP Tool Behavior

MCP tools should be thin adapters over API policy routes.

| MCP tool group | Example tool | Required API capability | Must preserve |
| --- | --- | --- | --- |
| Memory search | `search_memory` | `read_trusted_memory` | namespace, citations, restricted counts, gaps |
| Source search | `search_sources` | `read_source_evidence` | source-only label, citations, stale warnings |
| Source maintenance | `maintain_source_connection` | `import_or_maintain_sources` | imported/changed/stale/skipped/error counts, `noAutoPromotion` |
| Candidate preparation | internal or owner-app call | `prepare_candidates` | pending-only state, review requirement |
| Context assembly | `assemble_project_context` | `assemble_context` | ranked evidence, trusted/source distinction, gaps |
| Second brain wrapper | `/2nd-brain` style tool | depends on intent | `second-brain.v1`, radius, no surprise maintenance |
| Handoff | `write_agent_session_handoff`, `read_agent_session_handoff` | handoff capabilities | operational evidence, no trusted-memory promotion |

MCP tools should:

- require explicit tool calls,
- pass caller identity and token scope to the API,
- never embed broad admin secrets,
- never bypass namespace checks,
- never return hidden restricted content,
- never auto-approve trusted memory,
- return stable Source-Wire response shapes instead of raw memory-engine payloads.

## Metadata Expectations

Every API and MCP response should carry enough metadata for agents and owners to understand the result.

### Citation Metadata

For each claim that depends on evidence, return:

- source ID,
- source segment ID or trusted memory record ID,
- source class,
- namespace,
- freshness state,
- sensitivity state when safe to reveal,
- address or public-safe locator,
- evidence kind: `trusted_memory`, `source_evidence`, `handoff_evidence`, or `runtime_result`.

### Gap Metadata

Return gaps when:

- evidence is missing,
- evidence is stale,
- evidence is weak,
- source maintenance is needed,
- permissions blocked relevant evidence,
- runtime search degraded,
- embedding fallback or retrieval fallback happened.

### Denied Result Metadata

Denied responses should include:

- status: `denied`,
- denial reason code,
- omitted count when safe,
- namespace requested,
- capability required,
- trace ID,
- no private content.

Denied responses should not include:

- raw restricted text,
- cross-namespace IDs that leak content,
- local filesystem paths,
- tokens,
- credentials.

### Namespace Metadata

Every request and response should carry:

- owner ID or owner-safe alias,
- namespace ID,
- namespace label when safe,
- whether namespace was explicit or defaulted,
- omitted or restricted namespace count when relevant.

No default namespace should silently widen access.

### Caller Metadata

Audit records should preserve:

- caller kind: MCP tool, owner-hosted API client, owner-controlled app,
- harness name or synthetic/public-safe harness ID,
- token ID or token fingerprint, never raw token,
- capability set evaluated,
- request ID or trace ID,
- result.

### Audit Metadata

Every policy decision should be auditable.

Minimum audit fields:

- event type,
- timestamp,
- owner ID,
- namespace ID,
- caller kind,
- token reference or fingerprint,
- tool name or API route,
- required capability,
- policy result: allowed, denied, partial success,
- affected source IDs or memory IDs when safe,
- citation count,
- omitted count,
- error count,
- trace ID.

## Wrapper Relationship To The Separate Runtime Candidate

`Source-Wire-Memory-Engine` may be used as a separate runtime candidate only behind a Source-Wire adapter.

Allowed relationship:

```text
Source-Wire API policy
  -> runtime adapter
  -> separate memory-engine HTTP/MCP API
  -> runtime result
  -> Source-Wire response assembler
```

The adapter may ask the separate runtime for:

- low-level memory search,
- low-level memory list,
- embedding-backed retrieval,
- RLM-style decomposition or reranking,
- runtime health or diagnostics.

The adapter must not delegate these policy decisions to the runtime:

- owner authentication,
- namespace authorization,
- harness capability checks,
- trusted-memory promotion,
- source evidence trust boundary,
- candidate approval,
- denied-result shaping,
- public-safe citation shaping,
- audit logging.

The runtime's direct `save_memory` or `delete_memory` style operations must not be exposed to agent MCP clients unless Source-Wire API policy explicitly wraps them and the operation is owner or application controlled.

## Forbidden Bypass Paths

These paths are explicitly forbidden:

```text
MCP tool -> memory engine save_memory
MCP tool -> memory engine delete_memory
MCP tool -> database
MCP tool -> source filesystem
MCP tool -> trusted memory promotion
MCP tool -> cross-namespace search without API policy
```

Allowed pattern:

```text
MCP tool -> Source-Wire API policy -> approved adapter action -> shaped response
```

## Trusted Memory Promotion Boundary

Trusted memory promotion remains owner or application controlled.

Agent-callable MCP tools may:

- search trusted memory,
- search source evidence,
- maintain sources when explicitly called,
- prepare pending candidates if policy allows,
- assemble context,
- explain gaps.

Agent-callable MCP tools must not:

- approve their own candidates,
- silently create trusted Memory Records from source imports,
- hard-delete trusted memory,
- bypass owner review,
- hide maintenance side effects.

`approve_trusted_memory` should be reserved for:

- owner-controlled Mission Control action,
- owner-controlled local app action,
- future explicitly approved application workflow.

## Minimal Route Shape For Future Runtime

This is not an implementation requirement yet. It is the boundary shape later implementation should respect.

Future owner-hosted API groups:

- `/v1/memory/search`
- `/v1/sources/search`
- `/v1/sources/maintain`
- `/v1/context/assemble`
- `/v1/second-brain`
- `/v1/candidates/prepare`
- `/v1/candidates/:id/approve`
- `/v1/candidates/:id/reject`
- `/v1/handoffs`
- `/v1/audit/events`
- `/v1/runtime/health`

Future MCP tool groups should map to those API groups and should not expose database or runtime internals.

## Proof Requirements For A Later Implementation

Before runtime implementation starts, public-safe fixtures should prove:

- authorized trusted-memory read,
- unauthorized trusted-memory denial,
- wrong-namespace denial,
- source evidence search with citations,
- source maintenance with `noAutoPromotion`,
- pending candidate creation without trusted memory creation,
- owner/application-controlled approval path,
- MCP-to-API policy path,
- runtime adapter cannot bypass policy,
- audit event emitted for allowed, denied, and partial-success results.

Existing synthetic fixture evidence already models part of this path:

- [Owner-hosted API plus MCP boundary fixture](../examples/fixtures/owner-hosted-api-mcp-boundary/README.md)
- `src/runtime/minimal-boundary.ts`

## Open Questions For Later Slices

- Which auth mechanism should the first runtime use: static owner token, signed local token, OAuth/OIDC later, or platform-specific secret store?
- Should the first public runtime implement Source-Wire API in TypeScript or keep API policy separate from the Python memory-engine candidate?
- Should the first runtime adapter call the memory engine over HTTP, MCP, or direct process only for local proof?
- Which minimal Mission Control actions are required for nontechnical owners in Slice 4?
- Which synthetic fixtures must be added before the go/no-go gate in Slice 6?

## Slice 3 Decision

Proceed to Slice 4 after this packet.

Default boundary:

```text
MCP calls Source-Wire API.
Source-Wire API enforces all policy.
Source-Wire API may call a separate runtime adapter.
The runtime adapter never owns trust, auth, namespace, approval, citation, or audit policy.
```

Runtime implementation remains blocked.

## Still Blocked

- API server implementation,
- MCP server implementation,
- database migrations,
- memory-engine code copy,
- Docker or installer bundling with the AGPLv3 runtime,
- live connector implementation,
- Mission Control UI implementation,
- real user data,
- production runtime use,
- managed-hosted operation,
- public contribution acceptance,
- new npm publishing,
- new GitHub release or tag.
