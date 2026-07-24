# Changelog

All notable changes to Source-Wire are recorded here.

## Unreleased

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
