# Wrapper Runtime Policy Contract

Status: Slice 1 policy contract. Runtime implementation remains blocked for later slices.

Date: 2026-07-02

## Purpose

This contract defines the exact policy boundary for a future Source-Wire wrapper runtime.

It exists so later implementation cannot drift into:

- direct `Source-Wire-Memory-Engine` merge,
- AGPLv3 code copy,
- MCP bypass of Source-Wire API policy,
- automatic trusted-memory promotion,
- real user data,
- deployment,
- managed hosting,
- release mutation.

## Boundary Summary

The wrapper runtime path is:

```text
Agent harness
  -> MCP adapter
  -> Source-Wire owner-hosted API policy wrapper
  -> Source-Wire policy checks
  -> optional separate runtime adapter
  -> Source-Wire-shaped response
```

The API policy wrapper is the authority.

MCP is an adapter.

The separate runtime candidate is a retrieval/storage helper behind policy, not the policy owner.

## Policy Terms

### Owner

The owner is the person or owner-controlled application that controls the memory system.

Policy requirements:

- Every request must be scoped to an owner or owner-safe synthetic alias.
- Source-Wire does not host memory for owners by default.
- Owner identity must be checked before namespace, memory, source, candidate, or audit operations.

Public examples must use synthetic owner IDs only.

### Harness

A harness is an agent-facing caller such as Codex, Claude Code, or another MCP-capable agent environment.

Policy requirements:

- Every harness call must carry caller metadata.
- Harness tokens must be scoped.
- Raw tokens must never appear in responses, logs, fixtures, docs examples, or audit output.
- Harnesses do not receive trusted-memory approval capability by default.

### Namespace

A namespace separates projects, clients, users, or work areas.

Policy requirements:

- Every request must carry an explicit namespace or a safe default chosen by policy.
- No default namespace may silently widen access.
- Cross-namespace access must fail closed.
- Denied namespace results must not leak hidden content.
- Omitted or restricted counts may be returned when safe.

### Capability

A capability is a named permission for one action family.

Minimum capability names:

- `read_trusted_memory`,
- `read_source_evidence`,
- `import_or_maintain_sources`,
- `prepare_candidates`,
- `approve_trusted_memory`,
- `read_handoff_evidence`,
- `write_handoff_evidence`,
- `assemble_context`.

Policy requirements:

- Each request must declare or resolve the required capability.
- Missing capability must deny the action.
- Mutation-like capabilities must be separate from read capabilities.
- `approve_trusted_memory` must be reserved for owner or approved application paths.

### Source Evidence

Source evidence is imported, synced, or submitted material used for citations and candidate preparation.

Policy requirements:

- Source evidence is not trusted memory.
- Source evidence reads must return citations and freshness where relevant.
- Source maintenance must preserve `noAutoPromotion`.
- Source maintenance may prepare candidates only when policy allows.
- Source maintenance must report skipped, stale, changed, imported, and error counts when relevant.

### Trusted Memory

Trusted memory is approved memory that the system may treat as stronger context.

Policy requirements:

- Trusted memory must require owner or application-controlled approval.
- MCP tools must not approve their own candidates.
- Source import must not create trusted memory automatically.
- Approval must preserve source or candidate provenance.
- Rejection must not create trusted memory.

### Candidate

A candidate is a pending suggestion that may later become trusted memory.

Policy requirements:

- Candidates must start as pending.
- Candidates must preserve source citations or evidence.
- Candidates must not become trusted memory without owner or approved application control.
- Candidate approval and rejection must be auditable.

### Citation

A citation points to the evidence used for a claim.

Minimum citation metadata:

- evidence kind,
- source ID or trusted memory ID,
- source segment ID when available,
- namespace,
- freshness state,
- sensitivity state when safe,
- public-safe locator.

Policy requirements:

- Citations must not bypass namespace or sensitivity policy.
- Citations must not expose raw local paths in public examples.
- Claims based on source evidence should stay labeled as source evidence.

### Gap

A gap tells the caller that evidence is missing, weak, stale, degraded, or permission-blocked.

Policy requirements:

- Missing evidence should produce a gap, not a fabricated answer.
- Stale evidence should produce a gap or warning.
- Permission-blocked evidence should be counted only when safe.
- Runtime degradation should be visible to the response shaper.

### Denied Result

A denied result is a safe failure response.

Minimum denied metadata:

- status: `denied`,
- denial reason code,
- required capability,
- requested namespace,
- omitted count when safe,
- trace ID.

Denied results must not include:

- restricted text,
- cross-namespace content,
- raw tokens,
- credentials,
- private local paths,
- real account values.

### Audit

An audit event records who or what attempted an action and what policy decided.

Minimum audit metadata:

- timestamp,
- owner-safe ID,
- namespace ID,
- caller kind,
- harness label or token fingerprint,
- API route or MCP tool group,
- required capability,
- policy result,
- citation count,
- omitted count,
- error count,
- trace ID.

Policy requirements:

- Allowed, denied, and partial-success decisions must be auditable.
- Raw secrets must not be audit values.
- Audit failure should fail closed when the action requires audit durability.

### Runtime Adapter

A runtime adapter is the only approved path from Source-Wire policy into a separate runtime candidate.

Allowed:

```text
Source-Wire API policy wrapper
  -> runtime adapter
  -> separate runtime candidate
  -> runtime result
  -> Source-Wire response shaping
```

The adapter may request:

- low-level search,
- low-level list,
- retrieval results,
- reranking/decomposition output,
- runtime health,
- diagnostics.

The adapter must not own:

- owner authentication,
- namespace authorization,
- harness capability checks,
- trusted-memory promotion,
- source evidence trust boundaries,
- candidate approval,
- denied-result shaping,
- citation policy,
- audit policy.

## MCP Bypass Is Forbidden

Forbidden paths:

```text
MCP adapter -> memory engine save_memory
MCP adapter -> memory engine delete_memory
MCP adapter -> database
MCP adapter -> source filesystem
MCP adapter -> trusted memory promotion
MCP adapter -> cross-namespace runtime search
MCP adapter -> runtime candidate without Source-Wire API policy
```

Allowed path:

```text
MCP adapter -> Source-Wire API policy wrapper -> approved adapter action -> shaped response
```

## Trusted-Memory Auto-Promotion Is Forbidden

The default policy is:

```text
Source evidence can support answers.
Source evidence can prepare candidates.
Candidates can wait for review.
Only owner or approved application control can create trusted memory.
```

Agents may:

- search trusted memory,
- search source evidence,
- ask for context assembly,
- ask for source maintenance if allowed,
- prepare candidates if allowed.

Agents must not:

- approve their own candidates by default,
- silently create trusted memory,
- delete trusted memory directly,
- bypass review.

## Direct Merge And Code Copy Are Blocked

`Source-Wire-Memory-Engine` stays separate.

Blocked:

- copying AGPLv3 source files,
- copying migrations,
- copying tests,
- copying Docker files,
- copying UI components,
- copying comments or implementation structure,
- bundling the runtime candidate into Source-Wire,
- implying Apache-2.0 Source-Wire includes the AGPLv3 runtime.

Allowed:

- document behavior requirements,
- write clean Source-Wire contracts,
- create synthetic fixtures,
- build clean wrapper code in later approved slices,
- call a separate runtime candidate through a policy-controlled adapter in later approved slices.

## Stop Conditions

Stop implementation if any future slice requires:

- AGPLv3 code copy,
- direct runtime merge,
- MCP direct runtime mutation,
- automatic trusted-memory promotion,
- real user data,
- real client data,
- private local paths,
- real tokens or credentials,
- live connectors,
- database migrations,
- deployment,
- production runtime use,
- Source-Wire-managed hosting,
- npm publishing,
- GitHub release creation,
- Git tags,
- public code contribution acceptance.

## Proof Requirements For Later Slices

Later implementation slices must prove:

- authorized read,
- unauthorized denied result,
- wrong-namespace denied result,
- source evidence read with citation,
- source maintenance with `noAutoPromotion`,
- pending candidate without trusted memory creation,
- owner or application-controlled approval path,
- MCP-to-API policy routing,
- runtime adapter cannot bypass policy,
- audit-safe allowed, denied, and partial results.

Proof must use synthetic fixtures only.

## Non-Goals

This contract does not add:

- API server runtime,
- MCP server runtime,
- database migrations,
- runtime adapter code,
- memory-engine integration code,
- Mission Control UI,
- deployment,
- npm publishing,
- GitHub release publishing,
- real user data,
- public code contribution acceptance.

## Related Docs

- [Owner-Hosted API Plus MCP Boundary Contract](owner-hosted-api-mcp-boundary-contract.md)
- [MCP Tool Behavior Contract](mcp-tool-behavior-contract.md)
- [Memory Engine Baseline API And MCP Wrapper Boundary](../memory-engine-baseline-api-mcp-wrapper-boundary.md)
- [Source-Wire Memory Engine Wrapper Runtime PRD](../memory-engine-wrapper-runtime-prd.md)
- [Source-Wire Memory Engine Wrapper Runtime Issue Slices](../memory-engine-wrapper-runtime-issue-slices.md)
