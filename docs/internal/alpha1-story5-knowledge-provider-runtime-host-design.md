# Alpha 1 Story 5 Knowledge Provider Runtime Host Design

Status: Accepted design, implementation in progress

Date: 2026-07-24

## Implementation Status

The accepted Story 5 design is implemented through the provider-read fault
atomicity slice:

- one optional immutable provider binding,
- loopback API and stdio MCP search and exact fetch,
- durable receipt-covered release,
- provider-bound cursors,
- fail-closed scope, provenance, authority, and bounds validation,
- constant safe gaps and errors,
- late-result discard without a forced transport-cancellation claim,
- deterministic fault checkpoints from provider return through response
  handoff,
- fail-closed audit and receipt-store errors,
- idempotent clearing of internal protected buffers and failed handoff copies.

The disposable PostgreSQL Story 5 conformance runner, continuous PostgreSQL CI,
and the unpublished `0.2.0` contracts release candidate remain separate issues.

## Provider Read Fault Boundary

The unpublished Alpha runtime exposes deterministic conformance-only provider
read stages for:

- provider return,
- response serialization before, during, and after construction,
- audit commit before and after the durable call,
- receipt consumption before and after the single-use call,
- response write before handoff and after response construction.

The runtime process accepts crash-stage injection only when it is already in
Story 5 conformance mode. Direct hook injection remains an internal unit-test
seam in the unpublished workspace. Neither path can select provider identity,
scope, endpoint, credentials, or authority.

Provider results remain internal until the audit store issues a matching
receipt and the same store consumes it once. Audit-store exceptions become
constant safe failures. False receipt consumption covers mismatch, expiry,
replay, and foreign-process denial without releasing evidence.

Every failure after serialization clears the internal evidence and gap arrays
and zeroes the serialized protected buffer. A response-construction
interruption also zeroes the failed handoff copy. A successful response
transfers one copied byte sequence to the response object and clears the
internal protected buffer exactly once.

Receipt and audit arguments contain stable identifiers, policy fields, counts,
times, and digests. They do not contain the raw query, evidence excerpt or body,
citation locator, provider endpoint or credential, raw provider error, source
ID, segment ID, or provider record ID.

## Direct Answer

Story 5 should add one deep internal module, `KnowledgeProviderHost`, to the unpublished Alpha runtime.

The host should accept one optional, immutable `SourceWireKnowledgeProviderV1` binding at process startup. It should provide policy-controlled source-evidence search and fetch through the existing loopback API and stdio MCP path. It must keep provider results in an internal unreleased buffer until a matching durable read-audit receipt is committed and consumed.

Story 5 should not add:

- a general provider registry,
- dynamic provider loading,
- provider discovery,
- a provider configuration file format,
- provider credentials in API or MCP input,
- a live knowledge connector,
- a real knowledge-base connection,
- production or non-disposable database use,
- deployment,
- real user data,
- automatic trusted-memory promotion.

The deletion test supports the host seam. Removing the host would spread provider selection, request construction, deadlines, validation, safe error translation, audit binding, receipt consumption, serialization bounds, and protected-buffer clearing across API and MCP callers. Removing a general registry would currently remove only indirection because there is one planned real adapter and one synthetic test substitute.

## Design Target

### Module

`KnowledgeProviderHost` inside `apps/alpha1-runtime/`.

### Callers

- Hono route handlers in `apps/alpha1-runtime/src/app.ts`
- The stdio MCP adapter in `apps/alpha1-runtime/src/mcp/server.ts`, through the loopback API only
- Story 5 unit tests and disposable PostgreSQL conformance

### Motivating Pressure

At design acceptance, `main` contained the `KnowledgeProvider v1` interface
and synthetic conformance evaluator, but the Alpha runtime did not construct,
register, invoke, audit, or release results from a provider. The accepted
implementation now places those responsibilities behind
`KnowledgeProviderHost`.

Before Story 5 implementation, the Alpha MCP runtime exposed exactly:

- `propose_memory_candidate`
- `search_trusted_memory`

The accepted local implementation adds:

- `search_source_evidence`
- `get_source_evidence`

The current public npm artifact, `@source-wire/contracts@0.1.0`, does not contain the later `KnowledgeProvider v1` exports found on `main`.

## Current Interface Burden

The relevant behavior is split across several surfaces:

- `src/contracts/knowledge-provider.ts` defines provider requests, profiles, evidence, safe errors, and unreleased results.
- `src/contracts/memory-store.ts` defines provider read-audit requests and receipts.
- `apps/alpha1-runtime/src/app.ts` owns authentication, capability checks, namespace checks, safe route errors, and response release.
- `apps/alpha1-runtime/src/mcp/server.ts` hard-codes the two current tools and parses loopback API responses.
- `apps/alpha1-runtime/src/trusted-memory-search.ts` owns the current protected-read sequence, but it is specialized for trusted-memory rows and UUID targets.
- `apps/alpha1-runtime/migrations/0003_story3_audited_search.sql` binds receipts to trusted-memory operations, memory IDs, and revision IDs.

Adding provider behavior directly to the route and MCP handlers would duplicate security-sensitive orchestration and make future provider changes non-local.

## Alternatives Considered

### Option A: Direct provider calls in each route

`createStory1App()` would receive a provider and each route would construct provider requests, validate results, commit audit, and release responses.

Advantages:

- Small initial patch.
- No new host type.

Weaknesses:

- Provider policy and protected-release logic would spread across routes.
- MCP and API behavior would be easier to drift.
- Unit tests would couple to route internals.
- The provider seam would remain shallow.

Decision: reject.

### Option B: One immutable provider binding behind `KnowledgeProviderHost`

The runtime receives zero or one provider binding at startup. The host owns the complete provider-read and protected-release sequence. API and MCP callers know only the source-evidence command and safe response.

Advantages:

- One coherent interface.
- Provider-specific behavior stays behind the existing contract.
- Memory-only operation remains valid.
- The synthetic provider and later real adapter occupy the same seam.
- Observable behavior can be tested through API and MCP.
- No speculative plugin system.

Weaknesses:

- One binding supports one provider scope per runtime instance.
- Multiple providers would require a later design decision.

Decision: recommend.

### Option C: General provider registry and dynamic configuration

The runtime would load multiple provider modules from configuration, select by caller-supplied provider ID, and support dynamic registration.

Advantages:

- Future multi-provider flexibility.

Weaknesses:

- Adds credential, module-loading, configuration, provider-selection, and lifecycle surfaces before a second real provider exists.
- Increases startup and security failure modes.
- Encourages MCP callers to influence provider selection.
- Makes a synthetic Story 5 proof look more production-capable than it is.

Decision: defer until at least two real providers or multiple independently configured scopes must coexist in one runtime.

## Recommended Interface

The following is a design sketch, not verified implementation.

```ts
type EvidenceReadCommand =
  | {
      operation: "search_evidence";
      namespaceId: string;
      query: string;
      maximumResults: number;
      cursor?: SourceWireKnowledgeProviderCursorV1;
      freshness?: SourceWireKnowledgeFreshnessV1;
      sensitivity?: SourceWireKnowledgeSensitivityV1;
    }
  | {
      operation: "get_evidence";
      namespaceId: string;
      sourceId: string;
      segmentId: string;
    };

type AuthorizedEvidenceReadContext = {
  actor: AuthenticatedCredential;
  traceId: string;
  startedAtMs: number;
  signal?: AbortSignal;
};

type AuditedEvidenceRelease = {
  serializedResponse: Buffer;
  auditEventId: string;
  releaseStatus: "release_attempted";
  clear(): void;
};

type KnowledgeProviderBinding = Readonly<{
  provider: SourceWireKnowledgeProviderV1;
  ownerId: string;
  namespaceId: string;
  providerScopeId: string;
  timeoutMs: number;
}>;

interface KnowledgeProviderHost {
  execute(
    context: AuthorizedEvidenceReadContext,
    command: EvidenceReadCommand
  ): Promise<AuditedEvidenceRelease>;
}
```

`createStory1App()` receives an optional `knowledgeProviderHost`.

When no host is present:

- memory operations continue to work,
- source-evidence operations fail closed with a safe unavailable result,
- no fallback provider is selected,
- no direct provider or database access occurs.

## Provider Selection And Configuration

Story 5 configuration is process composition, not a public configuration language.

The process supplies one immutable binding containing:

- one `SourceWireKnowledgeProviderV1` implementation,
- one owner,
- one Source-Wire namespace,
- the exact provider scope declared by the provider profile,
- a bounded timeout.

The API and MCP caller must not supply:

- owner ID,
- provider ID,
- provider scope ID,
- provider endpoint,
- provider credentials,
- an arbitrary table or query,
- an authority or ACL decision.

The host derives provider identity and scope from the injected binding. Duplicate, mismatched, mutable, or incompatible bindings fail startup or fail closed before provider invocation.

## API And MCP Surface

Use Source-Wire source-evidence language at the agent boundary and map it to provider operations internally.

### API

- `POST /v1alpha1/source-evidence/search`
- `POST /v1alpha1/source-evidence/get`

### MCP

- `search_source_evidence`
- `get_source_evidence`

The internal provider operations remain:

- `search_evidence`
- `get_evidence`

This avoids adding `search_evidence` as a second MCP name beside the existing synthetic `search_source_evidence` contract.

The harness receives one new read capability:

- `source_evidence.read`

MCP continues to route through the loopback API. It receives no database, provider credential, provider endpoint, owner token, or provider module authority.

After Story 5, the MCP tool surface should be stable and explicit. A missing provider produces a safe unavailable result rather than dynamic tool discovery or a silent fallback.

## Hidden Implementation

`KnowledgeProviderHost.execute()` should hide this sequence:

1. Confirm the authenticated actor has `source_evidence.read`.
2. Confirm the actor has the exact requested namespace.
3. Resolve the one immutable provider binding.
4. Validate contract ID, contract version, profile authority, provider scope, required capabilities, bounds, and `noAutoPromotion`.
5. Construct the authoritative provider request with request ID, trace ID, owner, namespace, provider identity, provider scope, required capability, and deadline.
6. Invoke `provider.execute()` into an internal unreleased buffer.
7. Translate exceptions and provider failures into constant safe errors and gaps.
8. Validate every result field, cursor, owner, namespace, scope, ACL decision, provenance value, digest, locator, freshness, sensitivity, mutation flag, and result bound.
9. Exclude invalid or cross-scope evidence before counts, digests, citations, or release.
10. Serialize the final bounded response before release.
11. Commit a durable provider-read audit event and single-use receipt bound to the exact request and serialized result.
12. Consume the receipt with the origin-process verifier.
13. Return only the exact bytes covered by the consumed receipt.
14. Clear protected buffers in every success and failure path.

Audit metadata must not contain:

- raw query text,
- evidence excerpts or bodies,
- citation locators,
- provider credentials,
- provider endpoints,
- raw provider errors,
- restricted result identifiers.

## Protected Read Audit Seam

Provider evidence and trusted-memory reads share the same security protocol, but they do not share the same target model.

Story 5 should extract common digest, serialization, receipt, single-use consumption, origin-process binding, and buffer-clearing behavior into an internal `protected-read-release.ts` module.

Do not rewrite old migrations.

Add:

```text
apps/alpha1-runtime/migrations/0005_story5_knowledge_provider_host.sql
```

The additive migration should introduce provider-evidence read receipts or provider-specific receipt targets that bind:

- actor credential and actor reference,
- owner and namespace,
- provider ID and provider scope ID,
- provider operation,
- request digest,
- result digest,
- target-order digest,
- covered result count,
- serialized response byte count,
- issue and expiry time,
- release binding,
- origin-process verifier,
- audit event ID,
- single-use release status.

No evidence body, excerpt, raw query, credential, endpoint, or restricted locator belongs in the receipt tables.

The current trusted-memory receipt behavior must continue to pass Stories 3 and 4 without weakened lifecycle or race guarantees.

## Deadlines, Bounds, And Errors

Story 5 should preserve these initial Alpha limits:

- query: at most 1,024 UTF-8 bytes,
- search results: at most `min(10, provider.profile.maximumResultCount)`,
- one `get_evidence` result,
- one evidence excerpt: at most the provider profile limit, capped locally at 65,536 bytes,
- aggregate serialized response: at most 98,304 bytes,
- cursor: at most 256 bytes and bound to the configured provider and provider scope,
- total request lifetime: at most 5 seconds,
- provider deadline: short enough to reserve time for validation, audit, receipt consumption, and serialization.

Late results are discarded and never released.

`SourceWireKnowledgeProviderV1.execute()` receives `deadlineAt` but no `AbortSignal`. The host can prevent late release, but the adapter remains responsible for cancelling its own transport. Story 5 must not claim forced transport cancellation.

Provider errors must use the existing safe error vocabulary. Raw provider exceptions, queries, endpoints, credentials, counts, and existence details remain hidden.

## Adapters

### Required Story 5 Adapter

Add one deterministic, read-only synthetic provider inside the unpublished Alpha workspace.

It must:

- use synthetic generated evidence only,
- implement the authoritative `SourceWireKnowledgeProviderV1` contract,
- support search and get,
- support controlled empty, partial, unavailable, rate-limited, late, malformed, cross-scope, and oversized cases,
- attempt no provider or memory mutation,
- require no network, provider SDK, endpoint, or credential.

### Future Evidence-First Knowledge Base Adapter

The real adapter belongs beside the runnable knowledge-base retrieval boundary, not inside Source-Wire and not inside the public documentation-only knowledge-base repository.

The current `evidence-first-knowledge-base` repository contains architecture, schemas, synthetic examples, and validation. It does not contain a callable retrieval runtime, authentication surface, or package boundary.

Its current public retrieval response also cannot map directly to `SourceWireKnowledgeEvidenceV1`.

| Required Source-Wire field | Current knowledge-base source | Current gap |
| --- | --- | --- |
| `providerId` | Adapter configuration | None |
| `providerRecordId` | `evidence_id` | None |
| `sourceId` | Full evidence record `source_id` | Missing from search response |
| `segmentId` | No explicit field | Missing |
| `ownerId`, `namespaceId` | Source-Wire binding | Must not be inferred from a project slug |
| `aclDecision` | Authorized retrieval decision | Must be explicit at runtime |
| `sourceVersion` | No explicit field | Missing |
| `contentDigest` | Full evidence record `content_hash` | Missing from search response |
| `citationLocator` | Citation or full provenance locator | Present |
| `mediaType` | Full evidence record `content_type` | Missing from search response |
| `truncated` | No explicit field | Missing |
| `sensitivity` | No explicit field | Missing |
| `freshness` | No explicit field | Missing |
| `retrievedAt` | Adapter clock | None |
| `instructionAuthority` | Adapter constant `none` | None |

The future adapter must either:

1. call a knowledge-base retrieval surface that returns one provider-ready evidence snapshot, or
2. safely join each search result to an exact current evidence record before mapping.

Missing sensitivity, freshness, source version, digest, ACL decision, or segment identity must fail closed. The adapter must not invent broad defaults.

## Test Surface

### Unit And Interface Tests

Test through `KnowledgeProviderHost.execute()` and observable API behavior:

- valid search and get,
- missing provider,
- wrong capability,
- wrong namespace,
- incompatible contract version,
- profile authority mismatch,
- provider scope mismatch,
- cursor provider or scope mismatch,
- cross-owner or cross-namespace evidence,
- denied ACL,
- incomplete provenance,
- invalid digest or locator,
- result-count, excerpt, cursor, and response-size bounds,
- empty and partial results,
- provider unavailable, rate-limited, not found, exception, and late result,
- provider mutation or trusted-memory flags,
- audit failure,
- receipt mismatch,
- receipt replay,
- foreign-process consumption,
- protected-buffer clearing,
- no provider evidence in logs or audit metadata,
- zero candidates and zero trusted-memory creation.

### Story 5 Disposable PostgreSQL Conformance

This is a proposed future command, not a command available on current `main`. For the
current local prerequisites and verified commands, read the
[Quickstart](../getting-started/quickstart.md).

After Story 5 implementation, add:

```text
npm run alpha1:conformance:story5
```

The runner should use:

- Node.js `22.23.1`,
- PostgreSQL `16`,
- generated disposable roles and database state,
- the deterministic synthetic provider,
- a real loopback API process,
- the official MCP TypeScript client over stdio.

It should prove:

- the final four-tool MCP surface,
- source-evidence search and get through MCP, API policy, host, provider, audit, and receipt consumption,
- exact namespace and capability denial,
- valid empty and partial results,
- deadline and provider-failure behavior,
- audit-before-release,
- exact response and receipt binding,
- audit and database outage behavior,
- crash points around provider return, audit commit, receipt consumption, serialization, and response write,
- least-privilege database grants,
- no direct MCP database or provider authority,
- no protected content or secrets in logs, diagnostics, errors, reports, or temporary paths,
- deterministic cleanup.

Stories 1 through 4 must remain green.

## Continuous PostgreSQL Verification

The current GitHub workflow runs `publish:readiness`, which includes Alpha unit tests but not the disposable PostgreSQL conformance stories.

Add a separate PostgreSQL conformance job using:

- exact Node.js `22.23.1`,
- a PostgreSQL `16` service,
- generated disposable credentials and state,
- `npm run alpha1:conformance`.

The job must not use real data, persistent infrastructure, deployment credentials, or production secrets.

## Package And Release Boundary

Current `main` exports `KnowledgeProvider v1`. The immutable npm package `@source-wire/contracts@0.1.0` does not.

An additive public contract normally requires a minor release, so the expected candidate is:

```text
@source-wire/contracts@0.2.0
```

Before any release decision, a release candidate must prove:

- installed consumers can import `SourceWireKnowledgeProviderV1` and all required types,
- `npm pack` contains the provider declaration and implementation outputs,
- package metadata and `SOURCE_WIRE_PACKAGE_VERSION` match,
- existing contracts remain compatible,
- Story 5 does not publish the Alpha runtime,
- release notes preserve production and deployment blocks.

Package publication, GitHub release creation, and tagging remain separate consequential actions requiring explicit owner approval.

## Dependency Advisory Gate

The current production dependency audit reports two moderate findings caused by the MCP SDK's nested `@hono/node-server` version. The advisory concerns Windows `serve-static` path traversal. The current Source-Wire MCP runtime uses stdio and does not call that static-file surface.

Story 5 acceptance requires one of:

1. a tested dependency update or compatible MCP SDK version that removes the vulnerable nested package, or
2. a dated security disposition that records the unreachable code path, stdio-only exposure, affected platforms, verification evidence, owner, review trigger, and the continued production block.

Do not force a nested dependency override without proving MCP SDK compatibility.

The advisory must be resolved, or explicitly dispositioned and kept as a production stop gate, before any production or hosted-runtime decision.

## Acceptance Gates

Story 5 implementation is acceptable only when:

1. One optional immutable provider binding is the only provider configuration surface.
2. API and MCP cannot select provider identity, scope, endpoint, credentials, or authority.
3. `search_source_evidence` and `get_source_evidence` route through API policy.
4. Provider results remain internal and unreleased until a matching durable receipt is committed and consumed.
5. Invalid scope, ACL, provenance, deadline, bounds, mutation flags, audit, or receipt state releases zero protected content.
6. Memory-only operation remains valid without a provider.
7. The synthetic provider and disposable Story 5 conformance pass.
8. Stories 1 through 4 remain green.
9. PostgreSQL conformance runs continuously in GitHub Actions.
10. Provider evidence creates zero candidates and zero trusted memory.
11. Public fixtures remain synthetic.
12. Dependency advisories are resolved or formally dispositioned.
13. No package is published and no release or tag is created without separate owner approval.

## Downstream Effects

Expected Source-Wire implementation surfaces:

- `apps/alpha1-runtime/src/knowledge-provider-host.ts`
- `apps/alpha1-runtime/src/protected-read-release.ts`
- `apps/alpha1-runtime/src/knowledge-provider/synthetic-provider.ts`
- `apps/alpha1-runtime/src/app.ts`
- `apps/alpha1-runtime/src/server.ts`
- `apps/alpha1-runtime/src/mcp/server.ts`
- `apps/alpha1-runtime/src/config.ts`
- `apps/alpha1-runtime/src/errors.ts`
- `apps/alpha1-runtime/migrations/0005_story5_knowledge_provider_host.sql`
- `apps/alpha1-runtime/tests/`
- `apps/alpha1-runtime/conformance/story5.ts`
- `.github/workflows/package-checks.yml`
- package scripts and current public documentation

Expected knowledge-base follow-up surfaces:

- a provider-ready evidence response contract,
- a synthetic mapping fixture,
- a read-only adapter beside a runnable knowledge-base retrieval surface,
- adapter conformance against a stable Source-Wire package release.

## Tradeoffs And Remaining Uncertainty

Leverage gained:

- API and MCP callers learn one source-evidence interface.
- Provider validation and protected release remain local.
- Synthetic and real adapters share one authoritative contract.

Flexibility declined:

- One provider binding per runtime instance.
- No dynamic registry or hot reload.
- No caller-selected provider.

Migration cost:

- Medium to high because protected-read behavior, SQL receipts, MCP discovery, conformance, CI, package evidence, and documentation all change.

Remaining uncertainty:

- The provider contract has no cancellation signal.
- The knowledge-base public schemas need a provider-ready mapping shape.
- The knowledge-base public repository has no runnable retrieval endpoint.
- The moderate MCP dependency advisory is temporarily dispositioned for the
  local stdio-only synthetic Alpha runtime through 2026-08-24. It remains a
  production stop gate and must be reviewed sooner if the dependency,
  transport, platform, or runtime scope changes.
- Production authentication, endpoint custody, secret custody, deployment, and real-data operation remain separate future decisions.

## Recommended Implementation Order

1. Align public MCP naming and add the Story 5 security and dependency pre-build gate.
2. Add the internal protected-read release seam and additive PostgreSQL receipt migration.
3. Add the immutable provider host and deterministic synthetic provider.
4. Add API and MCP source-evidence reads.
5. Add unit, crash, least-privilege, and Story 5 disposable conformance.
6. Add exact Node and PostgreSQL conformance to GitHub Actions.
7. Prepare, but do not publish, the stable contract package release candidate.
8. Define the knowledge-base provider-ready response and mapping fixture.
9. Implement the real adapter only beside a runnable authorized knowledge-base retrieval surface.

## Next Owner

After owner acceptance of this design, route the implementation preparation to `to-issues` for risk-ordered slices.

Package publication, GitHub release mutation, production use, deployment, real-data integration, and security acceptance remain separate owner-gated decisions.
