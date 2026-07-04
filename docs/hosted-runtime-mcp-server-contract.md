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
| `caller.id` | `caller.id` | Synthetic examples only in public docs. |
| `caller.kind` | `caller.kind` | Agent callers use `agent_harness`. |
| `caller.harnessLabel` | `caller.harnessLabel` | Preserve harness label such as Codex or Claude Code. |
| `ownerId` | `ownerId` | Required. Missing owner fails closed. |
| `namespaceId` | `namespaceId` | Required. Missing or denied namespace fails closed. |
| `requiredCapability` | `requiredCapability` | Tool determines minimum capability. |
| `traceId` | `traceId` | Required safe request correlation ID. |
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

