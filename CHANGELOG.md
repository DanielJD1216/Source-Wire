# Changelog

All notable changes to Source-Wire are recorded here.

## Unreleased

### 2026-07-24 - Immutable Alpha provider composition

Summary:

- Added one private Alpha startup composition seam containing zero or one public-contract knowledge provider plus its owner-controlled binding.
- Froze the composition and binding at startup, limited the binding to provider, owner, namespace, provider scope, and bounded timeout, and rejected malformed scope before provider invocation.
- Routed the existing Story 5 synthetic provider through the new composition root without changing the loopback API or stdio MCP surface.
- Preserved normal memory-only startup when no provider is composed and safe unavailability for source-evidence reads.
- Kept authenticated actor context, audit storage, receipt issuance and consumption, process release secrets, database access, and memory mutation authority inside the Source-Wire host.
- Added negative authority tests proving the adapter receives only the public provider request envelope.
- Added no registry, hot reload, public host export, deployment, live provider, or real-data path.

Validation:

- `npm run typecheck --workspace @source-wire/alpha1-runtime`
- `npm run test --workspace @source-wire/alpha1-runtime`
- `npm test`
- `npm run docs:links`
- `npm run docs:anchors`
- `npm run safety:scan`
- `npm run claims:scan`
- `git diff --check`

### 2026-07-24 - Opaque provider-owned identifiers

Summary:

- Separated Source-Wire authority identifiers from provider-owned record, source, and segment keys in the unpublished Alpha provider-read path.
- Added an exact opaque-key boundary: non-empty, at most 512 UTF-8 bytes, no NUL or ASCII control characters, and no normalization, truncation, hashing, or interpretation.
- Preserved punctuation-bearing provider keys unchanged through MCP, API parsing, provider execution, evidence validation, exact fetch, receipt binding, response serialization, and deterministic digests.
- Kept owner, namespace, provider, and provider-scope identifiers on the existing Source-Wire authority grammar.
- Added boundary tests for exact limits, invalid controls, oversized provider output, protected-release denial, and official MCP round trips.
- Preserved caller-safe provider selection, synthetic-only data, zero memory promotion, and all existing production and release blocks.

Validation:

- `npm run test --workspace @source-wire/alpha1-runtime`
- `npm test`
- `npm run docs:links`
- `npm run docs:anchors`
- `npm run safety:scan`
- `npm run claims:scan`
- `git diff --check`

### 2026-07-24 - Alpha host contract convergence

Summary:

- Replaced the unpublished Alpha runtime's duplicate provider protocol with the authoritative public `SourceWireKnowledgeProviderV1` contract.
- Made the synthetic provider implement the public profile, request, result, capability, evidence, cursor, gap, and safe-error shapes directly.
- Added startup checks for every required provider profile capability and field while preserving valid memory-only startup when no provider is composed.
- Preserved optional freshness and sensitivity filters through MCP, API validation, request digests, and provider execution without silent loss.
- Added compile-time and runtime drift tests, including clean build ordering for the local contracts dependency.
- Preserved audited release, bounded responses, zero automatic memory promotion, synthetic-only data, and all existing hosting, deployment, publication, live-provider, production, and real-data blocks.

Validation:

- `npm run typecheck --workspace @source-wire/alpha1-runtime`
- `npm run test --workspace @source-wire/alpha1-runtime`
- `npm test`
- `npm run docs:links`
- `npm run docs:anchors`
- `npm run safety:scan`
- `npm run claims:scan`
- `git diff --check`

### 2026-07-24 - Contracts 0.2.0 release candidate

Summary:

- Prepared the additive `@source-wire/contracts@0.2.0` release candidate without publishing, tagging, releasing, deploying, or mutating a hosted service.
- Added `KnowledgeProvider v1` to the complete public package type surface, including request, profile, search, fetch, result, evidence, cursor, gap, freshness, sensitivity, capability, and safe-error types.
- Added packed-artifact and clean-installed-consumer proof for the provider declarations, runtime constants, package version, and existing contract imports.
- Kept the unpublished Alpha runtime, migrations, credentials, generated PostgreSQL state, conformance state, and private paths outside the package artifact.
- Documented the change from `0.1.0` as additive. Existing public contracts remain exported.
- Preserved the owner-accepted moderate MCP dependency advisory as a production stop gate through 2026-08-24, or earlier if its dependency, transport, platform, or runtime scope changes.
- Live connectors remain blocked.
- Production runtime remains blocked.
- Deployment remains blocked.
- Real data remains blocked.
- Automatic trusted-memory promotion remains forbidden.
- No npm package was published.
- No GitHub release or Git tag was created.

Validation:

- `npm run story5:release-candidate-smoke`
- `npm run consumer:smoke`
- `npm run package:dry-run`
- `npm run package:content-smoke`
- `npm run release-command-guard:smoke`
- `npm run safety:scan`
- `npm run claims:scan`

### 2026-07-24 - Alpha 1 Story 5 audited source-evidence read slices

Summary:

- Added one optional immutable `KnowledgeProvider v1` binding to the unpublished local Alpha runtime, with no dynamic provider registry or caller-selected provider authority.
- Added `search_source_evidence` to the local stdio MCP surface and routed it through the loopback API, exact harness capability and namespace policy, a deterministic synthetic read-only provider, and an internal unreleased buffer.
- Added `get_source_evidence` through the same immutable provider binding and protected-release protocol. Callers supply only namespace, source, and segment identifiers, while the runtime derives provider authority and returns at most one bounded synthetic evidence item.
- Added provider-bound search cursors, bounded next-cursor release, late-result discard, and exact request-lifetime enforcement without claiming forced transport cancellation.
- Added fail-closed result validation for owner, namespace, provider scope, ACL, provenance, digests, public-safe locators, provider authority, result counts, excerpt sizes, and aggregate response size.
- Added constant safe gap and error normalization for empty, partial, unavailable, rate-limited, denied, and not-found outcomes. Raw provider messages, exceptions, endpoints, credentials, and evidence details are excluded before audit or release.
- Added independent stdio MCP validation for safe denied responses, gaps, errors, and cursors.
- Added deterministic provider-read fault stages from provider return through response handoff, including audit issue, receipt consumption, serialization, and response-write interruption checkpoints.
- Added fail-closed audit-store error translation, receipt-denial handling, idempotent protected-buffer clearing, and zeroing of failed response-handoff copies.
- Added focused tests proving zero protected release across audit failure, receipt mismatch or replay, database-store outage, every provider fault stage, response-write interruption, and metadata leak checks.
- Added forward-only migration `0005` for durable provider-read audit receipts, exact serialized-result binding, origin-process verification, and single-use receipt consumption.
- Added a dedicated Story 5 disposable PostgreSQL conformance runner covering the exact four-tool MCP surface, API and provider routing, durable read audit, release receipts, authorization, provider faults, replay denial, crash stages, least privilege, leak resistance, zero memory promotion, and deterministic cleanup.
- Fixed provider-receipt consumption in migration `0005` by using PostgreSQL's `COALESCE` expression without an invalid `pg_catalog` function qualification.
- Added a separate GitHub Actions job pinned to Node.js `22.23.1` with an ephemeral PostgreSQL `16` service. It runs the Story 5 security gate and Stories 1 through 5 in order, emits stable begin, success, and failure markers, and uploads no conformance artifacts.
- Added a workflow smoke that prevents the hosted PostgreSQL gate from being replaced by Alpha unit tests or broadened with production secrets or artifact uploads.
- Kept provider identity, owner, namespace, scope, timeout, endpoint, and credentials outside MCP and API input.
- Preserved zero-provider operation as a safe unavailable result and kept provider reads separate from candidates and trusted memory.
- Preserved the immutable published `@source-wire/contracts@0.1.0` package boundary while adding continuous PostgreSQL CI and preparing the unpublished `0.2.0` provider-contract candidate in later Story 5 issues.
- Preserved deadline-only provider semantics. The host discards late results, while provider adapters remain responsible for cancelling their own transports.

Validation:

- `npm run alpha1:test`
- `npm run alpha1:conformance:story1`
- `npm run alpha1:conformance:story2`
- `npm run alpha1:conformance:story3`
- `npm run alpha1:conformance:story4`
- `npm run alpha1:conformance:story5`
- `npm run alpha1:story5:security-gate`
- `npm run alpha1:ci-workflow-smoke`
- `npm test`
- `npm run docs:links`
- `npm run docs:anchors`
- `npm run docs:command-setup`
- `npm run safety:scan`
- `npm run claims:scan`
- `git diff --check`

Primary files:

- `apps/alpha1-runtime/src/knowledge-provider-host.ts`
- `apps/alpha1-runtime/src/provider-read-audit-store.ts`
- `apps/alpha1-runtime/src/knowledge-provider/synthetic-provider.ts`
- `apps/alpha1-runtime/src/mcp/server.ts`
- `apps/alpha1-runtime/migrations/0005_story5_knowledge_provider_host.sql`
- `apps/alpha1-runtime/migrations/0006_story5_exact_evidence_fetch.sql`
- `apps/alpha1-runtime/tests/knowledge-provider-host.test.ts`
- `apps/alpha1-runtime/tests/mcp-source-evidence-search.test.ts`
- `apps/alpha1-runtime/tests/mcp-source-evidence-get.test.ts`
- `apps/alpha1-runtime/conformance/story5.ts`
- `.github/workflows/package-checks.yml`
- `scripts/alpha1-postgres-workflow-smoke.mjs`

Risks and follow-ups:

- The known moderate MCP dependency advisory is temporarily accepted only for the local, stdio-only synthetic Alpha runtime. It must be reviewed again no later than 2026-08-24, or immediately if the dependency, transport, platform, or runtime scope changes.
- Production, hosting, Windows runtime, HTTP/SSE MCP, static serving, deployment, live connectors, real data, package publication, and automatic trusted-memory promotion remain blocked.
- These slices do not publish the provider contract. Release-candidate preparation remains a separate Story 5 issue.

### 2026-07-24 - Public documentation and visual-system redesign

Summary:

- Reworked the root README into a public product entrypoint for first-time visitors, adopters, AI agents, and technical reviewers.
- Added a branded Higgsfield-generated hero and three text-readable SVG explainers for the system boundary, knowledge-versus-memory distinction, and trusted-memory lifecycle.
- Added a documented semantic color system so future human and agent-authored diagrams preserve the same trust-state meanings.
- Reorganized the documentation home around audience and task routes while keeping historical proof records outside the primary onboarding path.
- Updated the public architecture and product-direction explanations to distinguish the published contracts package from the unpublished local Alpha 1 Stories 1 through 4 proof.
- Updated the public external-link checker to ignore localhost and IP loopback examples while continuing to verify public URLs.
- Preserved all release, hosting, deployment, production, provider, real-data, contribution, and automatic-promotion blocks.

Primary files:

- `README.md`
- `docs/README.md`
- `docs/assets/README.md`
- `docs/assets/source-wire-higgsfield-hero.jpg`
- `docs/assets/source-wire-overview.svg`
- `docs/assets/knowledge-vs-memory.svg`
- `docs/assets/trusted-memory-lifecycle.svg`
- `docs/concepts/architecture-map.md`
- `docs/concepts/product-direction.md`
- `scripts/check-external-links.mjs`

### 2026-07-24 - Alpha 1 Story 4 governed lifecycle and portability proof

Summary:

- Added owner-admin fix-forward correction and revocation through bounded loopback API policy and owner CLI paths, with no new MCP tool.
- Added forward-only migration `0004` for inert historical actors, immutable lifecycle evidence, exact protected-read targets, authentication epochs, recovery state, and narrow security-definer functions.
- Added expected-revision one-winner lifecycle transactions, durable exact replay, provenance carry-forward, correction lineage, and atomic audit.
- Closed the protected-read lifecycle race by revalidating exact memory and revision targets at receipt consumption.
- Added canonical bounded governed-state export, atomic owner-only local file handling, fresh empty-target portable initialization, isolated physical recovery, and independent runtime verification.
- Preserved the published `@source-wire/contracts@0.1.0` package boundary and every provider, remote MCP, deployment, hosting, production, real-data, backup-guarantee, and release block.

Validation:

- `npm run alpha1:test`
- `npm run alpha1:conformance`
- `npm run ci:check`
- `npm run reviewer:smoke`
- `npm run package:dry-run`
- `npm run package:content-smoke`
- `npm run docs:links`
- `npm run docs:anchors`
- `npm run docs:command-setup`
- `npm run safety:scan`
- `npm run claims:scan`
- `npm audit --omit=dev`
- `git diff --check`

Primary files:

- `apps/alpha1-runtime/src/trusted-memory-lifecycle.ts`
- `apps/alpha1-runtime/src/portable-format.ts`
- `apps/alpha1-runtime/src/portable-recovery.ts`
- `apps/alpha1-runtime/src/safe-local-file.ts`
- `apps/alpha1-runtime/migrations/0004_story4_lifecycle_portability.sql`
- `apps/alpha1-runtime/conformance/story4.ts`
- `docs/getting-started/alpha1-story4-governed-lifecycle-portability.md`

Risks and follow-ups:

- Portable exports and physical backups remain sensitive owner-controlled artifacts. Source-Wire does not provide encryption, key custody, storage, retention, transfer, or production backup guarantees.
- The MCP SDK still carries two moderate advisories in an unused HTTP-server path. Alpha 1 remains local stdio only, with zero high or critical production advisories.
- Same-user process compromise, PostgreSQL superuser access, operating-system root, and compromise of owner-controlled encryption keys remain outside the Alpha 1 application boundary.
- This remains generated-disposable, loopback-only developer proof. Providers, remote MCP, deployment, hosting, public exposure, real data, and release mutation remain excluded.

### 2026-07-24 - Alpha 1 Story 3 audited trusted-memory search proof

Summary:

- Added `search_trusted_memory` to the final two-tool local stdio MCP surface while keeping owner review and approval out of MCP.
- Added forward-only migration `0003` for active-only PostgreSQL full-text indexing and append-only protected-read receipts.
- Added explicit owner, namespace, credential-class, capability, query, result, aggregate-content, response, database-timeout, and receipt-lifetime bounds.
- Added deterministic request and ordered-result digests, a fresh release binding, an ephemeral process secret, persisted HMAC origin-process verification, and exact single-use PostgreSQL receipt consumption.
- Added fail-closed audit, receipt-consumption, query-timeout, cancellation, serialization, and eight-point real-process crash behavior.
- Preserved the published `@source-wire/contracts@0.1.0` package boundary and every correction, revocation, provider, remote MCP, deployment, hosting, production, real-data, and release block.

Validation:

- `npm run alpha1:test`
- `npm run alpha1:conformance:story1`
- `npm run alpha1:conformance:story2`
- `npm run alpha1:conformance:story3`
- `npm run ci:check`
- `npm run docs:links`
- `npm run docs:anchors`
- `npm run safety:scan`
- `npm run claims:scan`
- `npm audit --omit=dev`
- `git diff --check`

Primary files:

- `apps/alpha1-runtime/src/trusted-memory-search.ts`
- `apps/alpha1-runtime/src/strict-json.ts`
- `apps/alpha1-runtime/migrations/0003_story3_audited_search.sql`
- `apps/alpha1-runtime/conformance/story3.ts`
- `docs/getting-started/alpha1-story3-audited-search.md`

Risks and follow-ups:

- The MCP SDK still carries two moderate advisories in an unused HTTP-server path. Story 3 is local stdio only, with zero high or critical production advisories.
- Origin-process proof does not defend against same-user host compromise, process-memory inspection, PostgreSQL superuser compromise, or operating-system root.
- This remains generated-disposable, loopback-only developer proof. Correction, revocation, providers, remote MCP, deployment, hosting, public exposure, real data, and release mutation remain excluded.

### 2026-07-24 - Alpha 1 Story 2 candidate approval proof

Summary:

- Added one unpublished stdio MCP server using the official TypeScript SDK, with live discovery of exactly `propose_memory_candidate`.
- Added forward-only migration `0002` for pending candidates, provenance, owner decisions, trusted-memory identities, immutable first revisions, and provenance linkage.
- Added loopback API and owner CLI paths for metadata-first review plus owner-controlled approval or rejection.
- Added durable lifecycle idempotency, deterministic UTF-8 key ordering, atomic audit behavior, one-winner decision concurrency, bounded stdio input, and least-privilege runtime grants.
- Preserved the published `@source-wire/contracts@0.1.0` package boundary and all release, deployment, hosting, production, real-data, and Story 3 blocks.

Validation:

- `npm run alpha1:test`
- `npm run alpha1:conformance:story1`
- `npm run alpha1:conformance:story2`
- `npm run ci:check`
- `npm run docs:links`
- `npm run docs:anchors`
- `npm run safety:scan`
- `npm run claims:scan`
- `git diff --check`

Primary files:

- `apps/alpha1-runtime/src/candidate-lifecycle.ts`
- `apps/alpha1-runtime/src/mcp/`
- `apps/alpha1-runtime/migrations/0002_story2_candidate_lifecycle.sql`
- `apps/alpha1-runtime/conformance/story2.ts`
- `docs/getting-started/alpha1-story2-candidate-approval.md`

Risks and follow-ups:

- The MCP SDK currently carries two moderate advisories in an unused HTTP-server transitive path. There are zero high or critical production advisories.
- This remains generated-disposable, loopback-only developer proof. Story 3 search, correction, revocation, providers, deployment, hosting, public exposure, real data, and release mutation remain excluded.

### 2026-07-24 - Alpha 1 Story 1 local runtime proof

Summary:

- Added an unpublished, loopback-only Story 1 developer alpha for local owner bootstrap and authenticated health.
- Added a forward-only PostgreSQL 16 migration boundary, generated-disposable initialization, and owner-admin plus scoped harness credential lifecycle.
- Added durable retry-safe credential mutations, bounded protected requests, explicit five-second request deadlines, structured safe logs, and complete cleanup proof.
- Preserved the published `@source-wire/contracts@0.1.0` package boundary. The Alpha workspace is excluded from the installed package.
- Aligned the README entrypoint smoke with the split status of the published contracts package and the unpublished local alpha.

Validation:

- `npm run alpha1:test`
- `npm run alpha1:conformance:story1`
- `npm run ci:check`
- `npm run package:content-smoke`
- `npm run consumer:smoke`
- `npm run docs:links`
- `npm run safety:scan`
- `npm run claims:scan`
- `git diff --check`

Primary files:

- `apps/alpha1-runtime/`
- `docs/getting-started/alpha1-story1-local-runtime.md`
- `README.md`
- `AGENTS.md`
- `scripts/readiness-report.mjs`

Risks and follow-ups:

- This is generated-disposable, loopback-only developer-alpha proof, not production runtime support.
- Stories 3 and 4, trusted-memory search, correction, revocation, deployment, hosting, public exposure, real data, and release mutation remain excluded.

### 2026-07-23 - Public memory boundaries and repository experience

Summary:

- Added `KnowledgeProvider v1` and `MemoryStore v1` contracts, fixtures, examples, and synthetic conformance smokes.
- Reorganized documentation into a focused public surface with a clearly labeled historical archive.
- Added a visual project overview, architecture diagrams, and a dedicated AI-agent repository guide.
- Clarified that knowledge providers are optional read-only evidence sources and cannot promote trusted memory.

Validation:

- `npm run publish:readiness`
- `npm run docs:external-links`
- `git diff --check`

Primary files:

- `README.md`
- `AGENTS.md`
- `docs/`
- `examples/knowledge-provider/`
- `examples/memory-store/`
- `src/contracts/knowledge-provider.ts`
- `src/contracts/memory-store.ts`

Risks and follow-ups:

- Hosted runtime, live PostgreSQL connections, live connectors, deployment, and automatic trusted-memory promotion remain excluded.
- The published `@source-wire/contracts@0.1.0` artifact remains immutable. These changes apply to latest `main` until a separately approved future release.

## 0.1.0

- Published the initial Apache-2.0 contracts package as `@source-wire/contracts@0.1.0`.
- Added public schemas, TypeScript contracts, synthetic fixtures, validation tooling, and package-readiness checks.
- Released the first GitHub source snapshot as `v0.1.0`.
