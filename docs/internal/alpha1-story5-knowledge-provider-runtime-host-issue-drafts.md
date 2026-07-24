# Alpha 1 Story 5 Knowledge Provider Runtime Host Issue Drafts

Status: Owner-approved and published in dependency order

Date: 2026-07-24

Remote issue status: Published as GitHub issues #265 through #272

Use Node.js 22 with npm from the repository root. For the current local setup
path, read the [Quickstart](../getting-started/quickstart.md).

## Parent

Accepted design:

- [Alpha 1 Story 5 Knowledge Provider Runtime Host Design](alpha1-story5-knowledge-provider-runtime-host-design.md)

Parent unit:

```text
Alpha 1 Story 5 Knowledge Provider Runtime Host
```

## Scope Boundary

These issues prepare the unpublished, loopback-only Alpha runtime to host one
optional read-only knowledge provider using synthetic data and disposable
PostgreSQL.

They do not authorize:

- a general provider registry,
- dynamic provider loading,
- a live knowledge connector,
- a real evidence-first knowledge-base adapter,
- non-disposable or production database use,
- hosted or production API or MCP use,
- deployment,
- real user or client data,
- package publication,
- GitHub release or tag creation,
- automatic trusted-memory promotion.

## User Stories

### US5.1: Search governed source evidence

As an authorized agent, I can search source evidence through MCP and Source-Wire
API policy so that I receive bounded, cited evidence only after a matching
durable read audit is committed.

### US5.2: Fetch exact governed source evidence

As an authorized agent, I can fetch one exact evidence segment through the same
policy and audit boundary without selecting provider identity, scope, endpoint,
credentials, or authority.

### US5.3: Fail closed without weakening memory

As an owner, I can run Source-Wire without a knowledge provider, and provider
failure or invalid evidence releases no protected content and does not interrupt
trusted-memory behavior.

### US5.4: Verify the provider boundary continuously

As a maintainer, I can run deterministic disposable PostgreSQL conformance in
CI so that API, MCP, audit, process, privilege, and cleanup guarantees do not
depend on a developer workstation.

### US5.5: Consume a stable provider contract

As an adapter author, I can install a stable Source-Wire contracts package that
contains KnowledgeProvider v1 without receiving the unpublished Alpha runtime.

## Proposed Dependency Order

```text
Issue 1: security and dependency gate
  -> Issue 2: audited search tracer
    -> Issue 3: audited exact-fetch tracer
      -> Issue 4: fail-closed provider boundary
        -> Issue 5: fault atomicity and leak resistance
          -> Issue 6: disposable PostgreSQL Story 5 conformance
            -> Issue 7: continuous PostgreSQL CI
              -> Issue 8: contracts 0.2.0 release candidate
```

Issue 1 is HITL because a remaining advisory may require an owner-accepted
security disposition. Issues 2 through 8 are AFK after their blockers are
complete. Publishing a package or release is not one of these issues.

## Published Issues

1. [#265 Story 5.1: Establish the knowledge-provider security and dependency gate](https://github.com/DanielJD1216/Source-Wire/issues/265)
2. [#266 Story 5.2: Deliver audited source-evidence search end to end](https://github.com/DanielJD1216/Source-Wire/issues/266)
3. [#267 Story 5.3: Deliver audited exact-evidence fetch end to end](https://github.com/DanielJD1216/Source-Wire/issues/267)
4. [#268 Story 5.4: Enforce fail-closed provider scope, bounds, and safe errors](https://github.com/DanielJD1216/Source-Wire/issues/268)
5. [#269 Story 5.5: Prove provider-read fault atomicity and leak resistance](https://github.com/DanielJD1216/Source-Wire/issues/269)
6. [#270 Story 5.6: Add disposable PostgreSQL knowledge-provider conformance](https://github.com/DanielJD1216/Source-Wire/issues/270)
7. [#271 Story 5.7: Run Alpha PostgreSQL conformance continuously](https://github.com/DanielJD1216/Source-Wire/issues/271)
8. [#272 Story 5.8: Prepare the contracts 0.2.0 release candidate without publishing](https://github.com/DanielJD1216/Source-Wire/issues/272)

## Issue 1: Establish The Story 5 Security And Dependency Gate

**Type:** HITL

**Blocked by:** None, can start immediately

**User stories covered:** US5.3, US5.4

### What to build

Create one executable pre-build gate that freezes the accepted Story 5 trust
boundary and produces a clear security decision for the MCP dependency
advisories.

The gate must verify that Story 5 uses one immutable provider binding, preserves
the source-evidence naming and capability decisions, keeps provider choice and
credentials out of caller input, and retains all production and deployment
blocks.

Attempt a compatible dependency update first. If the nested advisory cannot be
removed without breaking the supported MCP SDK path, prepare a dated disposition
for explicit owner acceptance. The disposition must identify the affected code
path and platform, prove whether the stdio-only runtime reaches that path, name
the review trigger, and keep production blocked.

### Acceptance criteria

- [ ] The gate fails if a caller can select provider identity, scope, endpoint, credentials, or authority.
- [ ] The gate fails if a registry, dynamic loader, live connector, deployment surface, real-data path, or automatic trusted-memory promotion is introduced.
- [ ] The final MCP names are `search_source_evidence` and `get_source_evidence`, mapped internally to provider search and get operations.
- [ ] The source-evidence read capability and namespace requirements are explicit and fail closed.
- [ ] A tested compatible dependency update removes the advisories, or a dated disposition is ready for explicit owner acceptance.
- [ ] No forced nested dependency override is accepted without MCP compatibility evidence.
- [ ] Existing Alpha unit tests, package checks, safety checks, and claim checks remain green.
- [ ] No runtime provider behavior is implemented in this issue beyond what is necessary to verify the gate.

## Issue 2: Deliver Audited Source-Evidence Search End To End

**Type:** AFK

**Blocked by:** Issue 1

**User stories covered:** US5.1, US5.3

### What to build

Deliver the smallest complete search path from an official MCP client through
the loopback API, Source-Wire authorization, one immutable provider host, a
deterministic synthetic provider, durable provider-read audit, and single-use
receipt consumption.

The path returns only the exact bounded serialized response covered by the
consumed receipt. A runtime with no provider remains valid and returns a safe
unavailable result for source-evidence search.

This issue may extract the common protected-read release behavior used by
trusted-memory search, but existing trusted-memory behavior must remain
observably unchanged.

### Acceptance criteria

- [ ] An authenticated caller with the exact capability and namespace can search synthetic source evidence through MCP and API policy.
- [ ] The runtime accepts zero or one immutable provider binding at process startup.
- [ ] Provider identity, owner, namespace, scope, timeout, endpoint, and credentials cannot be supplied by MCP or API input.
- [ ] Provider results remain in an internal unreleased buffer until a matching durable read-audit receipt is committed and consumed.
- [ ] The receipt binds the actor, owner, namespace, provider, scope, operation, request digest, result digest, result order, result count, serialized byte count, issue time, expiry, origin process, and audit event.
- [ ] Only the exact bytes covered by the consumed receipt can be released.
- [ ] A missing provider produces a safe unavailable result without fallback or trusted-memory disruption.
- [ ] Search creates zero memory candidates and zero trusted memories.
- [ ] Public fixtures and responses use synthetic evidence only.
- [ ] Existing trusted-memory search, correction, revocation, export, and recovery proofs remain green.

## Issue 3: Deliver Audited Exact-Evidence Fetch End To End

**Type:** AFK

**Blocked by:** Issue 2

**User stories covered:** US5.2, US5.3

### What to build

Extend the accepted provider host with one exact evidence fetch path from MCP
through API policy to the configured synthetic provider and back through the
same durable audit-before-release protocol.

The caller identifies only the Source-Wire source and segment. The runtime
derives provider identity, provider scope, owner, namespace, capability, and
deadline from authenticated policy context and immutable process composition.

### Acceptance criteria

- [ ] An authorized caller can fetch one synthetic source-evidence segment through MCP and API policy.
- [ ] The exact-fetch path uses the same immutable provider binding and protected-release protocol as search.
- [ ] API and MCP callers cannot select or override provider identity, scope, endpoint, credentials, owner, namespace authority, or ACL decisions.
- [ ] A missing, denied, stale, or unavailable segment returns only the contract-safe result.
- [ ] A successful response is released only after its exact durable receipt is committed and consumed.
- [ ] Search and exact fetch use distinct operation bindings in audit and receipt records.
- [ ] Exact fetch returns at most one bounded evidence item.
- [ ] Exact fetch creates zero memory candidates and zero trusted memories.
- [ ] Existing search and trusted-memory behavior remain green.

## Issue 4: Enforce Fail-Closed Provider Scope, Bounds, And Safe Errors

**Type:** AFK

**Blocked by:** Issues 2 and 3

**User stories covered:** US5.1, US5.2, US5.3

### What to build

Complete the observable search and fetch paths for denied, malformed, late,
cross-scope, and oversized provider behavior.

Every invalid result must be excluded before counts, digests, citations, or
release. Provider exceptions and contract failures must map to the existing safe
error vocabulary without revealing raw queries, endpoints, credentials,
restricted identifiers, evidence bodies, existence details, or provider
internals.

### Acceptance criteria

- [ ] Missing capability, wrong namespace, provider-scope mismatch, cross-owner evidence, and cross-namespace evidence release zero protected content.
- [ ] Denied ACL, incomplete provenance, invalid digest, unsafe locator, incompatible contract version, and invalid provider authority release zero protected content.
- [ ] Search query, result count, excerpt, cursor, aggregate response, and request lifetime limits are enforced before release.
- [ ] Cursors are bounded to the configured provider and provider scope.
- [ ] Late provider results are discarded and never released.
- [ ] The runtime does not claim forced transport cancellation when the provider contract supplies only a deadline.
- [ ] Empty, partial, unavailable, rate-limited, and not-found results preserve contract-safe gaps and errors.
- [ ] Raw provider exceptions and sensitive request or response material do not enter logs, audit metadata, diagnostics, or client errors.
- [ ] Memory-only operation and Stories 1 through 4 remain green.

## Issue 5: Prove Provider Read Fault Atomicity And Leak Resistance

**Type:** AFK

**Blocked by:** Issue 4

**User stories covered:** US5.1, US5.2, US5.3

### What to build

Make both provider reads fail closed across audit failure, receipt mismatch,
receipt replay, origin-process mismatch, database outage, process crash, and
response-write interruption.

The implementation must clear protected buffers in every success and failure
path and preserve the existing trusted-memory receipt guarantees.

### Acceptance criteria

- [ ] Audit commit failure releases zero protected content.
- [ ] Receipt mismatch, expiry, replay, and foreign-process consumption release zero protected content.
- [ ] Database outage before release returns a safe failure and no evidence.
- [ ] Crash points after provider return, audit commit, receipt consumption, serialization, and response write have explicit deterministic tests.
- [ ] Protected buffers are cleared after every success and failure path.
- [ ] Audit and receipt records contain no raw query, evidence excerpt, evidence body, locator, endpoint, credential, raw provider error, or restricted identifier.
- [ ] Successful release remains bound to one serialized response and one consumed receipt.
- [ ] Existing trusted-memory replay, race, correction, revocation, export, and recovery guarantees remain green.

## Issue 6: Add Disposable PostgreSQL Story 5 Conformance

**Type:** AFK

**Blocked by:** Issue 5

**User stories covered:** US5.1, US5.2, US5.3, US5.4

### What to build

Add one deterministic Story 5 conformance runner using generated disposable
PostgreSQL state, a real loopback API process, the official MCP TypeScript
client over stdio, and the synthetic read-only provider.

The runner must prove the complete four-tool MCP surface, both provider
operations, authorization, audit-before-release, fault handling, least
privilege, no automatic memory promotion, and cleanup. It must then run with
Stories 1 through 4 as one local Alpha conformance sequence.

### Acceptance criteria

- [ ] The MCP discovery surface contains exactly the two existing memory tools plus `search_source_evidence` and `get_source_evidence`.
- [ ] Search and exact fetch pass through MCP, API policy, provider host, synthetic provider, durable audit, and receipt consumption.
- [ ] Capability, namespace, provider-scope, ACL, provenance, bound, deadline, outage, crash, replay, and receipt-denial cases fail closed.
- [ ] The runner proves zero provider or database authority in the MCP process beyond the loopback API call.
- [ ] Database grants are least privilege for the API runtime and migration roles.
- [ ] Logs, temporary paths, reports, diagnostics, errors, and artifacts contain no protected content or secrets.
- [ ] Generated credentials, roles, databases, processes, sockets, and temporary files are removed deterministically.
- [ ] Provider reads create zero candidates and zero trusted memories.
- [ ] Stories 1 through 4 pass unchanged before the combined conformance command is considered green.

## Issue 7: Run Alpha PostgreSQL Conformance Continuously

**Type:** AFK

**Blocked by:** Issue 6

**User stories covered:** US5.4

### What to build

Add a separate hosted workflow job that runs the complete Alpha PostgreSQL
conformance sequence with the exact supported Node.js and PostgreSQL versions.

The job must use generated disposable credentials and data, expose stable
success and failure markers, and preserve the existing package, safety, claim,
and release boundaries.

### Acceptance criteria

- [ ] The job uses exact Node.js `22.23.1`.
- [ ] The job uses a PostgreSQL `16` service.
- [ ] The job runs Stories 1 through 5 in dependency order.
- [ ] The job requires no real data, persistent infrastructure, deployment credential, package-publishing credential, or production secret.
- [ ] Cleanup and least-privilege failures make the job fail visibly.
- [ ] The workflow uploads no protected database dumps, evidence bodies, credentials, or private paths.
- [ ] Existing package checks remain independently readable.
- [ ] A pull request cannot report the Story 5 PostgreSQL gate green from unit tests alone.

## Issue 8: Prepare The Contracts 0.2.0 Release Candidate Without Publishing

**Type:** AFK

**Blocked by:** Issue 7

**User stories covered:** US5.5

### What to build

Prepare an installable contracts package candidate that contains
KnowledgeProvider v1 and its complete public type surface while continuing to
exclude the unpublished Alpha runtime.

The candidate is expected to use the next additive minor version. It must be
verified through packed-artifact and clean-consumer tests, but it must not be
published, tagged, released, or described as production-ready.

### Acceptance criteria

- [ ] The candidate version is `0.2.0` across package metadata and exported version constants.
- [ ] A clean installed consumer can import the KnowledgeProvider v1 contract and all required request, profile, evidence, cursor, gap, and safe-error types.
- [ ] Packed-artifact inspection proves the provider declarations and outputs are present.
- [ ] The unpublished Alpha runtime, migrations, credentials, generated PostgreSQL state, conformance state, and private paths are absent from the package.
- [ ] Existing public contracts remain compatible or any additive change is documented explicitly.
- [ ] Release notes state that live connectors, production runtime, deployment, real data, and automatic trusted-memory promotion remain blocked.
- [ ] Dependency advisories are removed or the owner-accepted disposition remains an explicit production stop gate.
- [ ] No npm publish, GitHub release, Git tag, deployment, or hosted-service mutation occurs.

## Deferred Integration Work, Not Ready For Issue Publication

Story 5 makes Source-Wire capable of hosting a conforming provider. It does not
make the current `evidence-first-knowledge-base` repository a live provider.

A real adapter issue is intentionally not included in this ready-to-build set.
Before that issue can be prepared, the knowledge-base project needs:

- an accepted provider-ready evidence response contract,
- explicit source and segment identity,
- source version, digest, media type, sensitivity, freshness, and truncation,
- an explicit authorized ACL decision,
- a runnable read-only retrieval surface,
- authentication and secret-custody boundaries,
- deterministic adapter conformance against a stable Source-Wire package.

Once those prerequisites have an accepted design, prepare a separate cross-repo
adapter issue set. Do not infer defaults for missing evidence fields and do not
place the real adapter inside the Source-Wire contracts package.

## Publication Decision

The owner approved:

- eight issues in dependency order,
- separate fail-closed and fault-atomicity issues,
- the contracts `0.2.0` release-candidate issue inside Story 5,
- Issue 1 as HITL,
- Issues 2 through 8 as AFK.

The issues were published on 2026-07-24. No parent issue was created or modified.
No implementation, package publication, GitHub release, tag, deployment, or
hosted-service mutation was performed.
