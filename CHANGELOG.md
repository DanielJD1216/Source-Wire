# Changelog

All notable changes to Source-Wire are recorded here.

## Unreleased

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
