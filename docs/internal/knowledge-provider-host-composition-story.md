# Knowledge Provider Host Composition Story

Status: Owner-accepted design. Implementation issues #273 through #277 published.

Date: 2026-07-24

## Direct Answer

Source-Wire has a working protected provider-read host inside the unpublished
Alpha runtime, and it has a public `KnowledgeProvider v1` contract in the
unpublished `0.2.0` contracts candidate. The missing integration boundary is a
supported composition seam that lets an owner inject a conforming provider
without importing Alpha internals or bypassing Source-Wire policy.

The recommended next implementation story is:

1. make the Alpha host consume the public provider contract directly,
2. expose one narrow, immutable, owner-controlled startup composition input
   inside the Alpha workspace,
3. prove a separately implemented adapter can occupy that seam,
4. keep authentication, authorization, audit, receipt issuance, response
   release, and process secrets owned by Source-Wire,
5. defer any public runtime-host package until this seam passes conformance.

This design does not approve a live adapter, network connector, public runtime
package, package publication, release, deployment, real data, or production
use.

## Why This Story Exists

Story 5 proved one synthetic provider through the real local Alpha path:

```text
stdio MCP
  -> loopback API policy
  -> KnowledgeProviderHost
  -> synthetic read-only provider
  -> metadata-only audit
  -> single-use release receipt
  -> bounded evidence response
```

That proof is not yet a supported external composition surface.

Current implementation evidence:

- `SourceWireKnowledgeProviderV1` is exported by latest-source contracts.
- The Alpha host defines duplicate runtime provider types instead of importing
  the public contract.
- The Alpha runtime binds only its synthetic provider, and only in Story 5
  conformance mode.
- The host executes `search_evidence` and `get_evidence`.
- The public operation union also contains `describe` and `health`.
- The public profile requires `providerFamily`; the duplicate Alpha profile
  omits it.
- Alpha applies one general 64-character Source-Wire identifier grammar to
  provider-owned source and segment identifiers.
- `apps/alpha1-runtime/` is private and excluded from the `0.2.0` contracts
  release candidate.

An external knowledge-base adapter can implement the public interface, but
there is no stable supported place to install that implementation into a
Source-Wire runtime.

## Deletion Test

`KnowledgeProviderHost` earns its own seam.

If the host is deleted, the following responsibilities spill into API routes,
MCP handling, or individual adapters:

- caller capability and namespace enforcement,
- binding authority,
- provider request construction,
- deadlines and bounds,
- result and provenance validation,
- safe error translation,
- deterministic serialization,
- durable audit issuance,
- single-use origin-process receipt consumption,
- response release,
- protected-buffer clearing.

A public provider registry does not yet earn a seam. Deleting a registry would
remove only indirection because the runtime supports zero or one provider
binding and callers must not select providers.

## Constraints

The composition design must preserve these invariants:

- Source evidence is not trusted memory.
- Provider output cannot create a candidate or trusted memory automatically.
- MCP and API callers cannot select a provider, scope, endpoint, credential, or
  authority decision.
- Provider content has no instruction authority.
- Memory-only operation remains valid with no provider.
- The adapter cannot mint Source-Wire actor context, audit receipts, release
  receipts, or process secrets.
- Provider credentials remain out of band and adapter-owned.
- Source-Wire owns policy, audit, and release.
- Provider-owned record identifiers remain opaque data, never SQL identifiers,
  file paths, module names, or authorization inputs.
- All proof data remains synthetic.

## Alternatives

### Option A: Export the Alpha runtime from `@source-wire/contracts`

Advantages:

- An adopter could import the existing host immediately.
- No new package boundary would be required.

Costs and risks:

- A contracts package would begin exporting Hono, PostgreSQL, process-secret,
  audit-store, credential, and conformance internals.
- Consumers could couple to an unpublished Alpha implementation.
- The package name and release claims would no longer match its responsibility.
- Internal policy and release primitives could become accidental public API.

Decision: reject.

### Option B: Publish a new runtime-host package now

Advantages:

- Contracts and runtime composition would have separate package boundaries.
- Adapters could target a named installation surface.

Costs and risks:

- The host still duplicates the public provider contract.
- Its current input includes Alpha-specific credential and audit types.
- Package semantics would be frozen before one independently implemented
  adapter proves the seam.
- Publishing would create a consequential release decision beyond this design
  gate.

Decision: defer.

### Option C: Stabilize the private Alpha composition seam first

Advantages:

- Contract drift can be removed before publication.
- One external synthetic adapter can prove the seam without a live connector.
- Source-Wire retains policy, audit, and release authority.
- Public package design can be based on observed pressure rather than Alpha
  internals.
- Failure remains local and reversible.

Cost:

- External adopters still cannot install a supported host package after this
  first implementation step.

Decision: recommend.

## Selected Boundary

The adapter-facing input should be small and data-only:

```ts
type SourceWireKnowledgeProviderCompositionV1 = Readonly<{
  provider: SourceWireKnowledgeProviderV1;
  binding: Readonly<{
    ownerId: string;
    namespaceId: string;
    providerScopeId: string;
    timeoutMs: number;
  }>;
}>;
```

This is a design sketch, not a public export.

The Source-Wire composition root may accept zero or one value of this shape at
startup. It constructs `KnowledgeProviderHost` with runtime-owned dependencies:

```ts
createKnowledgeProviderHost({
  composition,
  auditStore,
  processReleaseSecret
});
```

The adapter receives only public provider requests and returns only public
provider results. It does not receive:

- `AuthenticatedCredential`,
- a Source-Wire database pool,
- an audit store,
- a release receipt store,
- a process release secret,
- route or MCP request objects,
- owner approval authority,
- memory mutation authority.

The API receives only the completed host. MCP continues to call the loopback
API and never receives the provider object.

## Contract Convergence

Before an external adapter is composed, the Alpha host must stop declaring its
own provider protocol.

Required convergence:

1. Import `SourceWireKnowledgeProviderV1`, profile, request, result, evidence,
   cursor, freshness, sensitivity, gap, and safe-error types from the root
   package source.
2. Remove the duplicate `RuntimeKnowledgeProvider*` protocol types.
3. Validate the required public `providerFamily` field.
4. Keep the protected evidence-release host limited to `search_evidence` and
   `get_evidence`.
5. Treat `describe` and `health` as advertised provider capabilities, not as
   agent evidence-release operations in this story.
6. Thread optional freshness and sensitivity filters through the host when the
   public request supplies them, or return a documented safe unsupported
   result. Do not silently discard them.
7. Add compile-time and runtime drift tests that fail when the public contract
   and host expectations diverge.

The host may inspect the immutable public profile at startup. It must not
silently call provider `describe` or `health`, and it must not claim live
readiness from a static profile.

## Identifier Boundary

Authority identifiers and provider-owned identifiers serve different jobs.
They must not share one accidental grammar.

Keep the current Source-Wire authority grammar for:

- owner ID,
- namespace ID,
- provider ID,
- provider scope ID.

Define a separate bounded opaque-provider-key validator for:

- provider record ID,
- source ID,
- segment ID.

The implementation gate should start with these limits:

- non-empty UTF-8 string,
- at most 512 UTF-8 bytes,
- no NUL or ASCII control characters,
- never parsed as a path, URL, SQL identifier, or authorization expression,
- preserved exactly in requests, results, digests, and citations,
- never truncated or silently hashed by Source-Wire.

If the target knowledge base cannot represent its identifiers within this
boundary, implementation must stop and revise the contract explicitly.

## Authority And Failure Model

Startup:

1. Accept zero or one immutable composition.
2. Validate contract ID, version, profile, provider family, read-only posture,
   required provenance, no-auto-promotion posture, capabilities, scope, and
   bounds.
3. Confirm binding scope equals the provider profile scope.
4. Fail startup on a malformed configured composition.
5. Continue in memory-only mode when no composition is configured.

Per evidence read:

1. API policy authenticates the caller.
2. API policy authorizes `source_evidence.read` and the namespace.
3. The host derives provider identity and scope from startup composition.
4. The host constructs the authoritative provider request.
5. The adapter performs read-only retrieval.
6. The host validates every result and removes invalid evidence before counts,
   digests, audit, or release.
7. The host commits metadata-only audit evidence and consumes the matching
   release receipt.
8. Only the exact receipt-covered bytes may leave the host.

Any mismatch, timeout, provider exception, malformed result, audit failure,
receipt failure, or response-bound failure releases zero protected evidence
and returns a constant safe result.

## Packaging Boundary

This story does not publish the host.

The `0.2.0` candidate remains a contracts-only package candidate. The private
Alpha workspace remains excluded.

A future runtime-host package decision requires all of:

1. public-contract convergence is complete,
2. an independently implemented synthetic adapter passes composition tests,
3. the knowledge-base adapter fixture passes without importing Alpha internals,
4. exported authority is reviewed for policy bypass,
5. package contents and transitive dependencies are reviewed,
6. the MCP advisory is resolved or remains valid under an updated dated
   disposition,
7. package naming, support level, versioning, and compatibility policy are
   approved,
8. publication, tag, and GitHub release are separately approved.

## Risk-Ordered Implementation Slices

These are accepted design slices. Their implementation issues are published,
and runtime implementation has not started.

### Slice 1: Contract drift guard

- Add compile-time tests proving the Alpha host accepts the public provider
  interface.
- Add runtime profile validation for `providerFamily`.
- Prove no public provider field is silently dropped.

Exit gate: the duplicate Alpha provider protocol can no longer drift from the
public contract.

### Slice 2: Provider-owned identifier boundary

- Add the separate opaque-provider-key validator.
- Add boundary fixtures using long, punctuation-bearing synthetic IDs.
- Prove identifiers are preserved exactly and never used as authority.

Exit gate: a valid external provider identifier is not rejected by the
Source-Wire authority-ID grammar.

### Slice 3: Immutable composition input

- Introduce the private composition type.
- Refactor Story 5 synthetic binding to use it.
- Keep zero-or-one startup binding and fail-closed absence.

Exit gate: API and MCP inputs still have no provider selection authority.

### Slice 4: Independently implemented adapter fixture

- Implement a second synthetic adapter in a separate test module using only the
  public provider contract.
- Do not import Alpha host types into the adapter.
- Compose it through the startup seam and exercise search and exact fetch.

Exit gate: the adapter can be deleted or replaced without changing policy,
audit, API, or MCP code.

### Slice 5: Security and regression proof

- Re-run Story 5 protected-read, fault, crash, scope, leak, least-privilege,
  and zero-promotion checks.
- Re-run Stories 1 through 4.
- Add a negative test proving an adapter cannot receive or construct runtime
  authority.

Exit gate: composition changes do not weaken existing Alpha guarantees.

### Slice 6: Public package decision packet

- Inventory the minimum possible host-package exports.
- Compare a dedicated package with an owner-hosted application template.
- Document dependency and support obligations.
- Stop before package creation, version mutation, publication, tagging, or
  release.

Exit gate: the owner can decide whether a public host package is warranted.

## Acceptance Criteria

The implementation story is complete only when:

1. Alpha imports the authoritative public provider contract directly.
2. Duplicate runtime provider protocol types are removed.
3. One immutable startup composition is the only provider installation path.
4. Memory-only mode remains valid with no provider.
5. API and MCP callers cannot select or construct provider authority.
6. Provider credentials remain out of band.
7. Search and exact fetch preserve public request and result semantics.
8. Provider-owned identifiers use the explicit opaque-key boundary.
9. An independently implemented synthetic adapter passes without Alpha host
   imports.
10. Protected release, audit, receipt, bounds, and zero-promotion guarantees
    remain green.
11. No runtime-host package is created or published.
12. No live provider, network connector, real data, deployment, or production
    claim is introduced.

## Explicit Exclusions

- dynamic provider registry,
- caller-selected provider,
- provider hot reload,
- provider configuration file language,
- credential manager,
- live evidence-first knowledge-base adapter,
- HTTP or SSE MCP,
- Windows runtime support,
- hosted runtime,
- production authentication,
- production database,
- deployment,
- real user or client data,
- package publication,
- GitHub tag or release,
- automatic memory candidate creation,
- automatic trusted-memory promotion.

## Next Physical Action

Use the
[Knowledge Provider Host Composition Published Issues](knowledge-provider-host-composition-issue-drafts.md)
for Issues #273 through #277.

Keep Slice 6 as a separate packaging decision packet. Publishing these issues
must not add a live adapter or change any release boundary.
