# Runtime Baseline Capability Audit

## Parent

Source-Wire Memory Engine Baseline Audit PRD.

## What to build

Audit the current `Source-Wire-Memory-Engine` baseline and map its runtime capabilities against Source-Wire contracts.

This is an evidence and documentation slice. It must not copy AGPLv3 runtime code into Apache-2.0 Source-Wire.

Use the deterministic Understand pass at `Source-Wire-Memory-Engine` commit `5ecfc82` as baseline evidence.

## Acceptance criteria

- [ ] Existing engine capabilities are documented from current evidence.
- [ ] Capability areas include FastAPI memory API, MCP tools, RLM search, embeddings, reranking, namespace behavior, Postgres/pgvector posture, cache behavior, frontend UI, Docker path, tests, and docs.
- [ ] Each capability is mapped to Source-Wire contracts where possible.
- [ ] Gaps and unknowns are listed.
- [ ] Keep, wrap, rewrite, and defer recommendations are separated.
- [ ] AGPLv3 source code is not copied into Apache-2.0 Source-Wire.
- [ ] Runtime implementation remains blocked.

## Blocked by

None, can start immediately.
