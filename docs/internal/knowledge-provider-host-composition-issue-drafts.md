# Knowledge Provider Host Composition Issue Drafts

Status: Owner-approved and published in dependency order.

Date: 2026-07-24

Remote issue status: Published as GitHub issues #273 through #277.

## Parent

Accepted design:

- [Knowledge Provider Host Composition Story](knowledge-provider-host-composition-story.md)

Parent unit:

```text
Knowledge Provider Host Composition
```

## Scope Boundary

These five issues stabilize the private Alpha provider composition seam before
any public runtime-host package is considered.

They do not authorize:

- a live evidence-first knowledge-base adapter,
- a network connector,
- a dynamic provider registry,
- caller-selected providers,
- provider hot reload,
- a public runtime-host package,
- npm publication,
- a GitHub tag or release,
- hosted or production API or MCP use,
- HTTP or SSE MCP,
- Windows runtime support,
- deployment,
- real user or client data,
- non-disposable or production databases,
- automatic candidate creation,
- automatic trusted-memory promotion.

## User Stories

### HC1: Implement one authoritative provider contract

As an adapter author, I can implement the public
`SourceWireKnowledgeProviderV1` interface without also implementing a private
duplicate Alpha protocol.

### HC2: Preserve provider-owned identifiers

As a knowledge-base owner, I can use bounded opaque source, segment, and record
identifiers without those identifiers being mistaken for Source-Wire authority
or truncated silently.

### HC3: Install one provider without granting caller authority

As a Source-Wire owner, I can inject zero or one provider at process startup
while API and MCP callers remain unable to select its identity, scope,
credentials, endpoint, or authority.

### HC4: Replace the provider without changing Source-Wire policy

As an adapter maintainer, I can replace a conforming read-only adapter without
changing Source-Wire authorization, audit, receipt, API, or MCP code.

### HC5: Preserve the protected-read guarantees

As a security reviewer, I can verify that composition changes preserve
audit-before-release, fail-closed behavior, least privilege, leak resistance,
and zero automatic memory promotion.

## Proposed Dependency Order

```text
Issue 1: converge Alpha on the public provider contract
  -> Issue 2: preserve opaque provider-owned identifiers
    -> Issue 3: add the immutable startup composition seam
      -> Issue 4: prove a separately implemented adapter end to end
        -> Issue 5: close security and regression conformance
```

All five issues are AFK after their blockers are complete. The public package
decision remains a separate HITL gate and is not part of this packet.

## Published Issues

1. [#273 Host Composition 1: Converge Alpha on KnowledgeProvider v1](https://github.com/DanielJD1216/Source-Wire/issues/273)
2. [#274 Host Composition 2: Preserve opaque provider-owned identifiers](https://github.com/DanielJD1216/Source-Wire/issues/274)
3. [#275 Host Composition 3: Add immutable owner-controlled provider composition](https://github.com/DanielJD1216/Source-Wire/issues/275)
4. [#276 Host Composition 4: Prove a replaceable adapter through the real read path](https://github.com/DanielJD1216/Source-Wire/issues/276)
5. [#277 Host Composition 5: Close composition security and regression conformance](https://github.com/DanielJD1216/Source-Wire/issues/277)

## Issue 1: Converge Alpha On KnowledgeProvider v1

**Type:** AFK

**Blocked by:** None, can start immediately

**User stories covered:** HC1

### What to build

Make the unpublished Alpha provider-read host consume the authoritative public
`SourceWireKnowledgeProviderV1` contract directly through one complete
synthetic search and exact-fetch path.

Remove the duplicate Alpha provider protocol. Preserve the host's existing
protected-release behavior while validating every required public profile,
request, result, evidence, cursor, gap, and safe-error field. Keep
`search_evidence` and `get_evidence` as the only protected evidence-release
operations in this issue. Treat `describe` and `health` as declared provider
capabilities without adding an agent-facing readiness claim.

Optional freshness and sensitivity inputs must be preserved through the host
or rejected with an explicit contract-safe result. They must not be discarded
silently.

### Acceptance criteria

- [ ] The Alpha host imports the public provider types instead of declaring a duplicate `RuntimeKnowledgeProvider*` protocol.
- [ ] The current synthetic provider implements `SourceWireKnowledgeProviderV1` directly.
- [ ] Runtime startup validation requires `providerFamily` and every other mandatory public profile field.
- [ ] Synthetic search and exact fetch pass through API policy, the host, provider execution, audit, receipt consumption, and bounded release.
- [ ] Freshness and sensitivity inputs are preserved or rejected explicitly, never silently dropped.
- [ ] `describe` and `health` remain non-agent evidence-release capabilities in this issue.
- [ ] Compile-time and runtime drift checks fail when the host expectation and public provider contract diverge.
- [ ] A missing provider still leaves memory-only operation valid.
- [ ] Search and fetch create zero candidates and zero trusted memories.
- [ ] No public runtime-host package, release, deployment, live provider, or real-data path is introduced.

## Issue 2: Preserve Opaque Provider-Owned Identifiers

**Type:** AFK

**Blocked by:** #273

**User stories covered:** HC2, HC5

### What to build

Carry bounded opaque provider record, source, and segment identifiers through
one complete synthetic evidence search and exact-fetch path without applying
the Source-Wire authority-ID grammar.

Owner, namespace, provider, and provider-scope identifiers retain the existing
authority grammar. Provider-owned identifiers receive a separate validator and
remain unparsed data across provider requests, evidence validation, audit
digests, receipt binding, exact fetch, citations, and response release.

### Acceptance criteria

- [ ] Provider record, source, and segment identifiers use a separate opaque-key validator.
- [ ] Opaque provider keys are non-empty, at most 512 UTF-8 bytes, and reject NUL and ASCII control characters.
- [ ] Authority identifiers continue to use the existing Source-Wire authority grammar.
- [ ] Long and punctuation-bearing synthetic provider keys pass through search and exact fetch unchanged.
- [ ] Boundary failures return a constant safe result and release zero protected evidence.
- [ ] Provider-owned identifiers are never parsed as paths, URLs, SQL identifiers, module names, or authorization expressions.
- [ ] Source-Wire does not truncate, normalize, or silently hash provider-owned identifiers.
- [ ] API and MCP callers gain no provider-selection or authorization power from an identifier.
- [ ] Receipt and response digests remain deterministic for the exact preserved values.
- [ ] Existing Story 5 scope, bounds, leak, and zero-promotion checks remain green.

## Issue 3: Add Immutable Owner-Controlled Provider Composition

**Type:** AFK

**Blocked by:** #273 and #274

**User stories covered:** HC3, HC5

### What to build

Introduce one private Alpha startup composition input containing zero or one
public-contract provider plus its owner-controlled binding. Refactor the
existing Story 5 synthetic binding to occupy this seam and exercise search and
exact fetch through the existing API and MCP policy route.

Source-Wire continues to construct and own the provider host, authenticated
actor context, audit store, process release secret, receipt behavior, and
response release. The adapter receives none of those runtime authority
objects.

Malformed configured composition fails startup. An absent composition starts
normally in memory-only mode and returns a safe unavailable result for
source-evidence reads.

### Acceptance criteria

- [ ] The composition root accepts zero or one immutable provider composition at startup.
- [ ] The binding contains only the provider, owner, namespace, provider scope, and bounded timeout.
- [ ] Binding scope must match the provider profile scope before provider invocation.
- [ ] Malformed configured composition fails startup with no provider invocation.
- [ ] A runtime with no provider composition starts successfully in memory-only mode.
- [ ] The Story 5 synthetic provider uses the new composition seam without changing observable MCP or API behavior.
- [ ] API and MCP inputs cannot select provider identity, scope, endpoint, credentials, owner authority, or ACL decisions.
- [ ] The adapter cannot receive or construct authenticated actor context, audit stores, release receipts, process secrets, or memory mutation authority.
- [ ] MCP continues to route through the loopback API and never receives the provider object.
- [ ] No dynamic registry, configuration language, hot reload, public host export, deployment, or real-data path is added.

## Issue 4: Prove A Replaceable Adapter Through The Real Read Path

**Type:** AFK

**Blocked by:** #275

**User stories covered:** HC1, HC2, HC3, HC4

### What to build

Add a second deterministic synthetic adapter in a separate module that imports
only the public provider contract. Compose it through the owner-controlled
startup seam and prove complete search and exact-fetch behavior through the
real stdio MCP client, loopback API policy, provider host, durable audit, and
single-use receipt release path.

The adapter must not import Alpha host, database, route, MCP, credential,
audit, or receipt types. Replacing the Story 5 synthetic provider with this
adapter must require only composition-root wiring.

### Acceptance criteria

- [ ] The adapter imports only public `KnowledgeProvider v1` types and ordinary platform dependencies.
- [ ] The adapter module imports no Alpha host, database, authentication, API, MCP, audit, receipt, or memory-store implementation.
- [ ] Search succeeds end to end through the official MCP client and Source-Wire policy path.
- [ ] Exact fetch succeeds end to end through the same policy and protected-release path.
- [ ] Provider profile, scope, provenance, freshness, sensitivity, digest, locator, and opaque identifiers survive the round trip.
- [ ] Replacing the configured adapter changes no Source-Wire API, MCP, policy, audit, or receipt code.
- [ ] Adapter exceptions, malformed results, late results, and cross-scope results release zero protected evidence.
- [ ] The adapter receives no Source-Wire credential, process secret, database pool, or memory mutation authority.
- [ ] The adapter uses synthetic in-memory evidence only and requires no endpoint, credential, SDK, or network.
- [ ] Zero candidates and zero trusted memories are created.

## Issue 5: Close Composition Security And Regression Conformance

**Type:** AFK

**Blocked by:** #276

**User stories covered:** HC3, HC4, HC5

### What to build

Close the host-composition story with one deterministic conformance path that
proves both synthetic providers preserve the existing protected-read security
boundary and that no runtime authority crossed into the adapter seam.

Exercise provider absence, malformed startup composition, capability and
namespace denial, provider-scope mismatch, identifier bounds, invalid
provenance, audit failure, receipt mismatch and replay, origin-process
mismatch, database outage, crash and response-write checkpoints, late results,
buffer clearing, least privilege, cleanup, and zero automatic memory
promotion.

Re-run Alpha Stories 1 through 5 and the package, documentation, safety, claim,
and continuous PostgreSQL workflow guards.

### Acceptance criteria

- [ ] Both synthetic providers pass search and exact-fetch protected-release conformance.
- [ ] Provider absence and malformed composition fail closed without disrupting memory-only behavior.
- [ ] Capability, namespace, scope, provenance, identifier, deadline, and response-bound failures release zero protected evidence.
- [ ] Audit failure, receipt mismatch, expiry, replay, foreign-process consumption, and database outage release zero protected evidence.
- [ ] Crash and response-write checkpoints preserve audit-before-release and clear protected buffers.
- [ ] A negative authority test proves the adapter receives no caller credential, audit store, receipt authority, process secret, database pool, or memory mutation authority.
- [ ] Stories 1 through 5 remain green using generated disposable PostgreSQL state.
- [ ] Hosted PostgreSQL conformance retains exact Node.js and PostgreSQL versions, ephemeral credentials, cleanup, and no artifact upload.
- [ ] Package, documentation, safety, and public-claim checks remain green.
- [ ] The dated MCP advisory disposition remains valid for the unchanged local stdio-only synthetic Alpha scope, or the issue stops for renewed review.
- [ ] No runtime-host package is created and no package, tag, release, deployment, live provider, real data, or production claim is introduced.

## Publication Result

The owner approved:

1. the five-issue granularity,
2. the dependency order,
3. AFK classification for all five issues,
4. keeping the public package decision outside this packet.

The issues were published in dependency order. Each later issue references the
real blocking issue number. Existing Story 5 issues were not closed or
modified.
