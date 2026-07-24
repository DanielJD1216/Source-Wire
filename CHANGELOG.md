# Changelog

All notable changes to Source-Wire are recorded here.

## Unreleased

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
