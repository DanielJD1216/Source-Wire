# Source-Wire Hosted Runtime MCP Server Contract

Status: PRD/planning only for issue `#261`. MCP server runtime implementation remains blocked.

This document defines the future owner-hosted MCP server contract for Source-Wire. It does not add MCP server runtime code, API server code, database migrations, deployment config, live connectors, real user data, npm publishing, a GitHub release, tags, or code contribution acceptance.

## Purpose

The future MCP server is the agent-facing adapter for Source-Wire.

It should make tools easy for Codex, Claude Code, OpenClaw, and other MCP-capable harnesses to call, but it must not become a second policy engine.

The MCP server must call the owner-hosted API policy boundary defined in [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md).

## Upstream Boundary

This contract inherits:

- owner-hosted first posture,
- managed-hosted deferred,
- API policy owns authorization,
- every request needs caller, namespace, action, and capability,
- source evidence stays separate from trusted memory,
- trusted-memory approval remains owner or application controlled,
- denied results fail closed without leaking content.

References:

- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)

## Transport-Derived Fields

Issue `#286` separates transport identity from tool input. For a future remote
runtime, the MCP adapter receives authenticated human principal, client
application, workspace/channel audience, agent session, credential audience,
sender-constrained DPoP or mTLS proof binding,
owner, namespace grants, capability grants, authorization and deletion epochs,
immutable destination tuple, complete multi-hop audience chain, and destination
release ceiling from the access plane.

**MCP tool arguments must not supply grants.** Model-generated `caller.id`,
`ownerId`, `namespaceId`, `requiredCapability`, client identity, workspace,
channel, or sensitivity ceiling values are not authority. A requested namespace
is only a selector inside the server-authorized namespace set.

The planned shared transport is **private-network authenticated Streamable HTTP MCP**.
That is a future security boundary requiring separate implementation
approval. The existing local `stdio` Alpha remains evaluation-only until
remote and local behavior have synthetic parity proof.

KnowledgeProvider v1 does not advertise per-filter support. The adapter must not
advertise cursor, freshness, sensitivity, pagination, or filter inputs until a
future Gate B implementation negotiates the additive, versioned
`knowledge-provider.query-features.v1` descriptor. Unsupported or unnegotiated
options fail with an actionable compatibility result instead of being silently
ignored.

Search returns a one-use opaque citation handle bound to owner, namespace,
principal, client, session/replay scope, authorization epoch, immutable
destination and audience-chain digests, provider, source, segment, source
version, content digest, sensitivity, expiry, and redemption state. Exact fetch
atomically redeems, reauthorizes, and revalidates that binding. Evidence-backed
candidate creation preserves source-evidence provenance, but proposal remains
disabled until that provenance is implemented. Trusted-memory approval remains outside MCP.

Reference: [ADR 0002: Global Owner-Hosted Runtime V1](../adr/0002-global-owner-hosted-runtime-v1.md).

## Global V1 Activation Overlay

The older proposed tool groups below describe a long-term action taxonomy. They
are not the initial remote discovery surface.

The four-tool Global V1 product direction is:

1. `search_trusted_memory`
2. `search_source_evidence`
3. `get_source_evidence`
4. `propose_memory_candidate`

Memory-only discovery advertises only `search_trusted_memory`; it does not
advertise evidence search, exact fetch, or proposal and has no provider/model
readiness dependency. Evidence-enabled discovery adds
`search_source_evidence` and `get_source_evidence` only while the complete
evidence chain is ready. These three tools form the evidence-enabled read-only
surface. `propose_memory_candidate` remains disabled until evidence-backed candidate
provenance preserves provider, source, segment, source version, content digest,
citation, release trace, principal, and client. Trusted-memory approval remains
outside MCP.

`assemble_context`, `use_2nd_brain`, maintenance, review, approval, handoff
write, connector administration, export, and database control are not V1 remote
tools unless a later contract and owner approval explicitly activate them.

Discovery is readiness-sensitive. If evidence readiness becomes false, the
adapter removes or denies evidence tools without disturbing independently ready
trusted-memory search. A client caching an older discovery result receives a
safe retryable compatibility response, never a fallthrough to memory-only data.

## MCP Responsibility Summary

The future MCP server owns:

- tool names and descriptions,
- input validation before forwarding,
- shaping agent-friendly requests into the API request envelope,
- preserving citations, gaps, denied counts, and audit-friendly metadata,
- returning safe denied results,
- exposing no direct database, filesystem, or runtime-adapter access.

The future MCP server does not own:

- authentication policy,
- namespace authorization,
- capability authorization,
- trusted-memory approval policy,
- source evidence trust policy,
- database access,
- runtime adapter access,
- deployment posture.

## Required MCP-To-API Envelope

Every MCP tool call must forward enough metadata for the API policy boundary:

| MCP field | API envelope target | Rule |
| --- | --- | --- |
| `toolName` | `action` | Tool name maps to a specific API action. |
| `caller.id` | `caller.id` | Transport-derived. A payload copy is diagnostic only and must match or fail closed. |
| `caller.kind` | `caller.kind` | Transport-derived client class. A model cannot select it. |
| `caller.harnessLabel` | `caller.harnessLabel` | Registered client label such as Codex or Claude Code, not free-form authority. |
| `ownerId` | `ownerId` | Server-bound owner. A request may not choose another owner. |
| `namespaceId` | `namespaceId` | Selector inside the server-authorized namespace set. Missing or denied scope fails closed. |
| `requiredCapability` | `requiredCapability` | Tool determines the minimum; Source Wire policy decides whether it is granted. |
| `traceId` | `traceId` | Required safe request correlation ID. |
| `authorizationEpoch` | `authorizationEpoch` | Transport-derived monotonic policy epoch. A model cannot select it. |
| `deletionEpoch` | `deletionEpoch` | Required for evidence mode and transport-derived. |
| `destinationDigest` | `destinationDigest` | Digest of the immutable registered route and actual destination. |
| `audienceChainDigest` | `audienceChainDigest` | Digest of every verified downstream audience hop. |
| `input` | operation payload | Must not include secrets in public examples. |

MCP must not silently choose a broader namespace or capability than the tool requires.

## Proposed Tool Groups

These are contract names and behavior groups, not implemented MCP tools.

### `search_trusted_memory`

Purpose:

- search approved trusted Memory Records.

Required API capability:

- `read_trusted_memory`.

Must preserve:

- citations,
- trusted memory IDs or public-safe locators,
- namespace ID,
- confidence or quality metadata when available,
- gaps for missing or denied evidence.

Must not:

- search source evidence unless explicitly requested,
- cross namespaces,
- mutate memory.

### `search_source_evidence`

Purpose:

- search source-only evidence such as notes, chat exports, documents, connector snapshots, and imported records.

Required API capability:

- `read_source_evidence`.

Must preserve:

- source citations,
- freshness state,
- stale or deleted markers,
- sensitivity state when safe,
- gaps and denied counts.

Must not:

- treat source evidence as trusted memory,
- promote source evidence,
- expose raw local paths or private locators in public-safe output.

### `get_source_evidence`

Purpose:

- hydrate one exact evidence segment selected from a prior search.

Required API capability:

- `read_source_evidence`.

Input:

- exactly one short-lived opaque hydration handle;
- no provider, source, segment, owner, namespace, destination, or identity override.

Must preserve:

- exact source version and content digest;
- stable citation receipt ID and release trace;
- freshness, sensitivity, truncation, gaps, and safe denial metadata;
- the original principal, client, session/replay scope, authorization epoch,
  destination tuple, and audience-chain binding.

Must not:

- accept guessed source or segment IDs;
- redeem a handle more than once;
- release after lifecycle, epoch, destination, or audience substitution;
- reveal existence on denial.

### `propose_memory_candidate`

Purpose:

- create one pending MemoryStore candidate from explicitly selected evidence.

Required API capability:

- `prepare_candidates`.

Input:

- explicit owner intent independent of evidence content;
- candidate text and canonical argument digest;
- stable citation receipt IDs, never expiring hydration handles;
- separate short-lived mutation authorization bound to principal, client,
  destination, `prepare_candidates`, and the argument digest, issued by the
  access-plane approval service after signed trusted-UI or verified-channel
  confirmation.

Must preserve:

- provider, source, segment, source version, content digest, stable citation
  receipt, release trace, proposing principal, and client;
- `status: pending` and `noAutoPromotion: true`.

Must not:

- treat retrieved instructions, model output, or a general agent-host assertion
  as owner intent or mutation authorization;
- approve, activate, or promote trusted memory;
- operate before this provenance and mediation contract is implemented and
  separately approved for Gate B.

### `assemble_context`

Purpose:

- assemble cited context for an agent task.

Required API capability:

- `assemble_context`.

May require:

- `read_trusted_memory`,
- `read_source_evidence`,
- `read_handoff_evidence`.

Must preserve:

- evidence kind,
- citations,
- gaps,
- search radius or scope,
- denied count when safe,
- stale warning when relevant.

Must not:

- fabricate missing evidence,
- hide weak evidence,
- mutate sources or memory.

### `use_2nd_brain`

Purpose:

- expose an owner-friendly `/2nd-brain` wrapper that can answer, draw, update with explicit payload, or report status through the API policy boundary.

Required API capability:

- depends on intent.

Read-only intents may require:

- `assemble_context`,
- `read_trusted_memory`,
- `read_source_evidence`,
- `read_handoff_evidence`.

Explicit source update intents require:

- `import_or_maintain_sources`.

Must preserve:

- `second-brain.v1` style response shape when used,
- citations,
- gaps,
- maintenance status,
- `noAutoPromotion: true`,
- trusted memory delta,
- blocked-update guidance.

Must not:

- run surprise maintenance for read requests,
- crawl arbitrary local paths,
- promote trusted memory automatically.

### `maintain_source_connection`

Purpose:

- submit caller-provided source snapshots or later source deltas.

Required API capability:

- `import_or_maintain_sources`.

Optional API capability:

- `prepare_candidates`.

Must preserve:

- imported, changed, stale, skipped, and errored counts,
- source connection ID or public-safe locator,
- no-auto-promotion flag,
- candidate review requirement,
- owner attention state.

Must not:

- create trusted memory automatically,
- access local filesystem paths directly,
- hide maintenance side effects.

### `list_memory_candidates`

Purpose:

- list pending, rejected, or approved candidate review state for an owner namespace.

Required API capability:

- `prepare_candidates` for pending candidate review access,
- or a future read-only candidate-review capability if separated later.

Must preserve:

- candidate status,
- source provenance,
- namespace ID,
- citations,
- review next action.

Must not:

- approve or reject candidates.

### `approve_memory_candidate`

Purpose:

- promote a candidate only through owner or owner-approved application control.

Required API capability:

- `approve_trusted_memory`.

Required caller:

- owner,
- or owner-approved application path.

Default agent behavior:

- denied.

Must preserve:

- candidate ID,
- source provenance,
- approver identity,
- namespace ID,
- audit trace.

Must not:

- allow agent-only approval by default,
- approve without API policy,
- approve without audit metadata.

### `reject_memory_candidate`

Purpose:

- reject a pending candidate without promoting memory.

Required API capability:

- `reject_candidates`.

Must preserve:

- candidate ID,
- rejection reason when safe,
- reviewer identity,
- audit trace.

Must not:

- delete source evidence unless a separate policy allows it,
- create trusted memory.

### `read_handoff_evidence`

Purpose:

- read project, session, or operational handoff evidence.

Required API capability:

- `read_handoff_evidence`.

Must preserve:

- evidence provenance,
- freshness state,
- citations,
- gaps.

Must not:

- treat handoff evidence as trusted memory automatically.

### `write_handoff_evidence`

Purpose:

- write operational handoff or status evidence.

Required API capability:

- `write_handoff_evidence`.

Must preserve:

- caller identity,
- namespace ID,
- source or proof references,
- audit trace.

Must not:

- promote handoff text into trusted memory automatically.

## Required Output Metadata

Every MCP tool response should preserve these fields when relevant:

- `status`,
- `traceId`,
- `namespaceId`,
- `action`,
- `requiredCapability`,
- `policyResult`,
- `citations`,
- `gaps`,
- `deniedCount`,
- `omittedCount`,
- `errorCount`,
- `audit`,
- `noAutoPromotion`,
- `nextAction`.

Denied responses must preserve safe denial metadata but never hidden content.

## Forbidden Bypass Paths

The future MCP server must not expose:

```text
MCP tool -> database
MCP tool -> local filesystem crawler
MCP tool -> runtime adapter
MCP tool -> memory engine save_memory
MCP tool -> memory engine delete_memory
MCP tool -> trusted memory promotion
MCP tool -> cross-namespace search
MCP tool -> source connector secrets
```

Allowed shape:

```text
MCP tool
  -> Source-Wire owner-hosted API policy boundary
  -> approved API action
  -> shaped response
```

## Mutation Rules

Mutation-like tools include:

- source maintenance,
- candidate creation,
- candidate rejection,
- trusted-memory approval,
- handoff write.

Mutation-like tools require explicit authority. Read tools cannot silently perform mutation.

Trusted-memory approval is not a normal agent capability.

## Public-Safe Examples

Public examples may include:

- synthetic owner IDs,
- synthetic namespace IDs,
- synthetic source IDs,
- synthetic candidate IDs,
- synthetic trace IDs,
- fake harness labels,
- fake citations.

Public examples must not include:

- real user data,
- client data,
- account IDs,
- personal emails or domains,
- tokens or credentials,
- raw local file paths,
- screenshots,
- production exports.

## MCP Non-Goals

This issue does not approve:

- MCP server runtime implementation,
- API server implementation,
- tool registration,
- database migrations,
- direct database access,
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

Issue `#261` is reconciled when:

- MCP tool names and groups are defined,
- each tool group maps to API capability requirements,
- input and output boundaries are explicit,
- citations, gaps, denied counts, and audit metadata are preserved,
- mutation-like tools require explicit authority,
- API-bypass prohibition is explicit,
- no MCP runtime implementation is added.

## Next Planning Issue

After this contract is accepted, issue `#262` can define database posture and data lifecycle before any migrations exist.

