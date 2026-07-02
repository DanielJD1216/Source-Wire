# Memory Engine Baseline Runtime Capability Audit

Status: Slice 1 local audit complete. Runtime implementation remains blocked.

Date: 2026-07-02

## Scope

This document audits the current `Source-Wire-Memory-Engine` baseline against Source-Wire's public contracts.

Evidence source:

- local repo: `Source-Wire-Memory-Engine`
- analyzed commit: `5ecfc82`
- private planning summary: `source-wire-memory-engine-understand-2026-07-02.md`

This audit copies no AGPLv3 runtime code into Apache-2.0 Source-Wire. It documents behavior from file paths, docs, and source inspection only.

## Executive Read

`Source-Wire-Memory-Engine` is useful as a runnable memory backend reference.

It already has:

- FastAPI memory API,
- MCP streamable HTTP endpoint,
- memory save/search/list/delete flows,
- PostgreSQL plus pgvector posture,
- namespace-scoped memory isolation,
- OpenAI-compatible embeddings and chat model use,
- query decomposition and re-ranking,
- PostgreSQL search-result cache,
- React/Vite memory management UI,
- Docker Compose local run path,
- backend and frontend tests.

It is not ready to become Source-Wire runtime code as-is.

Main reasons:

- AGPLv3 license boundary,
- no real auth or owner token policy,
- MCP can directly save and delete memories,
- no Source Graph or Source Connection model,
- no candidate review boundary,
- no `second-brain.v1` response shape,
- no cited source evidence contract,
- no audit log contract,
- hard delete behavior exists where Source-Wire needs safer review and lifecycle rules,
- UI is memory management, not Source-Wire Mission Control.

## Evidence Checked

Memory-engine evidence:

- `README.md`
- `docs/concepts/architectural-overview.md`
- `docs/concepts/security-model.md`
- `docs/reference/api-endpoints.md`
- `docs/reference/data-model.md`
- `docs/reference/environment-variables.md`
- `docs/reference/docker-reference.md`
- `docs/guides/mcp-inspector-testing.md`
- `docs/guides/run-tests.md`
- `backend/app/main.py`
- `backend/app/api/routers/memory.py`
- `backend/app/api/routers/mcp.py`
- `backend/app/services/memory_service.py`
- `backend/app/services/embedding_service.py`
- `backend/app/services/llm_service.py`
- `backend/app/services/rlm_service.py`
- `backend/app/services/pg_cache_service.py`
- `backend/app/services/user_service.py`
- `backend/app/core/identity.py`
- `backend/app/models/memory.py`
- `backend/app/models/user.py`
- `backend/app/models/cache.py`
- `backend/app/database/queries/memory.py`
- `docker-compose.yml`
- `Dockerfile`
- `backend/requirements.txt`
- `backend/pyproject.toml`
- `frontend/package.json`
- `frontend/src/services/api.ts`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Memory.tsx`
- backend and frontend test inventory under `backend/tests/` and `frontend/tests/`

Source-Wire target contracts:

- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [MCP Tool Behavior Contract](contracts/mcp-tool-behavior-contract.md)
- [`second-brain.v1` Contract](contracts/second-brain-v1-contract.md)
- [Source Connection Contract](contracts/source-connection-contract.md)
- [Source Graph Adapter Contract](contracts/source-graph-adapter-contract.md)

## Capability Map

| Capability area | Current baseline evidence | Source-Wire contract fit | Recommendation |
| --- | --- | --- | --- |
| FastAPI memory API | `POST /api/v1/memory/search`, `POST /api/v1/memory/save`, `GET /api/v1/memory/list`, `DELETE /api/v1/memory/{id}`, stats, namespaces, types. | Useful low-level memory API shape, but does not yet enforce Source-Wire owner auth, citations, source evidence, candidate review, or no-auto-promotion. | Wrap, do not expose directly to agents without policy. |
| MCP tools | `search_memory`, `list_memory`, `save_memory`, `delete_memory` over `/mcp`, plus basic streamable HTTP session handling. | Useful MCP transport proof. Current tool surface is too permissive for Source-Wire because save/delete can mutate memory directly and MCP does not call a Source-Wire policy boundary first. | Wrap/rewrite MCP layer around Source-Wire API policy. |
| RLM search | Query decomposition, per-sub-query embedding search, re-ranking, RLM metrics, optional raw vector search. | Useful retrieval baseline. Does not return Source-Wire-style citations, gaps, radius, trusted/source-only distinction, or `second-brain.v1`. | Keep as retrieval engine reference, wrap response assembly. |
| Embeddings | OpenAI-compatible embeddings, configurable model/dimensions, separate embedding endpoint support, zero-vector fallback option with response transparency. | Useful. Source-Wire should keep degraded-state transparency, but fallback should be explicitly reflected in answer confidence and proof gates. | Keep concept, add policy and degraded-result handling. |
| Auto-classification | LLM classifies memory type and tags when caller saves default `knowledge` with no tags. | Useful as candidate enrichment, but risky as trusted-memory write behavior. Source-Wire source imports should prepare candidates first, not trusted records. | Rewrite around candidate review and source evidence. |
| Namespaces | Namespace from `X-Memory-Namespace` or MCP argument, normalized, max length 64, maps to internal user row. | Useful primitive. Not enough for owner/client/harness access control because no token, RBAC, capability, owner ID, or caller audit model exists. | Keep primitive, add owner auth and permission layer. |
| PostgreSQL and pgvector | `pgvector/pgvector:pg15`, SQLAlchemy models, vector extension initialization, `memory`, `memory_embeddings`, `users`, `pg_cache`. | Good baseline for BYO Postgres. Source-Wire still needs explicit migrations, setup checks, and public-safe database posture. | Keep Postgres direction, audit migrations before adoption. |
| Cache behavior | PostgreSQL `pg_cache`, TTL, key includes namespace/user, query, limit, filters, RLM flag, session ID, embedding model, namespace invalidation on save/delete. | Useful optimization. Source-Wire must verify no cross-namespace leakage and preserve stale/degraded state in answers. | Keep with stronger policy tests. |
| Frontend UI | React/Vite dashboard, memory list, search, add/delete, namespace dropdown, model config cards. | Helpful reference UI, but not Source-Wire Mission Control. It manages memories directly rather than reviewing sources, candidates, policies, and harness health. | Defer or redesign as Mission Control. |
| Docker path | Compose runs `postgres` plus unified `app`; root Dockerfile builds React and serves FastAPI plus SPA on port `8000`. | Useful owner-hosted local path. Needs nontechnical setup flow, secret guidance, health checks, and provider-neutral Postgres instructions. | Keep as reference, rewrite setup docs for Source-Wire. |
| Tests | Backend unit, integration, e2e, performance, metrics tests; frontend Playwright e2e snapshots and UI verification. | Useful baseline coverage. Current test pass/fail was not executed in this audit; Source-Wire needs public-safe fixtures and policy tests before runtime implementation. | Keep inventory, define new Source-Wire gates. |
| Docs | Getting started, guides, reference docs, architecture, security model, Docker, API, data model. | Strong reference docs. Need Source-Wire-specific privacy, license, setup, source graph, and no-auto-promotion language. | Keep as input, do not copy wholesale. |

## Contract Gap Map

### Owner-Hosted API Plus MCP Boundary

Fit:

- A local owner-controlled app can exist.
- MCP and REST surfaces already exist.
- Namespace scoping exists at the memory layer.

Gaps:

- no authentication or scoped harness token validation,
- no owner identity beyond namespace,
- no caller capability model,
- no audit-friendly action record,
- no candidate creation path,
- MCP does not call a stricter Source-Wire API boundary before mutation,
- direct memory save/delete is possible through MCP.

### MCP Tool Behavior

Fit:

- `search_memory` and `list_memory` are close to low-level memory search/list primitives.
- MCP tool discovery and call paths exist.

Gaps:

- no `search_sources`,
- no `maintain_source_connection`,
- no `assemble_project_context`,
- no `/2nd-brain` wrapper,
- no handoff tools,
- no source-only evidence,
- no `noAutoPromotion`,
- no stale evidence warnings,
- no denied/omitted counts,
- no cited answer packaging.

### `second-brain.v1`

Fit:

- Search can retrieve memory content.

Gaps:

- no `contractVersion`,
- no `intent`,
- no `radius`,
- no answer synthesis contract,
- no citations,
- no gaps,
- no `nextAction`,
- no `maintenanceRan`,
- no `noAutoPromotion`.

### Source Connection

Fit:

- The engine can store arbitrary memory content and metadata.

Gaps:

- no Source Connection object,
- no source class,
- no sync mode,
- no path privacy policy,
- no imported/changed/stale/skipped/error counts,
- no source maintenance run,
- no candidate extraction policy,
- no ongoing source relationship model.

### Source Graph Adapter

Fit:

- Memory metadata can store loose extra values.

Gaps:

- no Source Collection,
- no Source Item,
- no Source Segment,
- no Source Edge,
- no import findings,
- no citeable segment model,
- no source freshness or supersession graph,
- no trust boundary between source evidence and trusted memory.

## Keep, Wrap, Rewrite, Defer

### Keep As Reference

- FastAPI backend service shape.
- Postgres plus pgvector runtime direction.
- OpenAI-compatible model provider direction.
- Embedding fallback transparency concept.
- RLM query decomposition and re-ranking concept.
- Search cache concept.
- Docker Compose local run path.
- Existing docs and test inventory as evidence.

### Wrap

- Memory search API.
- Memory list API.
- Namespace primitive.
- Search cache.
- Embedding and RLM retrieval.
- Docker runtime for local proof.

The wrapper must sit behind Source-Wire policy, not expose engine mutation directly to agent harnesses.

### Rewrite Or Replace

- Auth and harness-token permissions.
- MCP tool surface.
- Source Graph and Source Connection models.
- Candidate creation and owner review flow.
- Trusted memory write policy.
- Citation and gap packaging.
- Audit logs.
- Soft delete, supersede, and lifecycle behavior.
- Nontechnical Mission Control UI.
- Public-safe fixture strategy.

### Defer

- Managed-hosted Source-Wire service.
- Real user or client data in public repo.
- Live connectors.
- Full Mission Control implementation.
- Auto-learning and automatic trusted-memory promotion.
- Runtime implementation inside Apache-2.0 Source-Wire.
- npm patch release or new GitHub release.

## Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| AGPLv3 license boundary | Copying runtime code into Apache-2.0 Source-Wire could contaminate the public package boundary. | Keep separate until Slice 2 license decision. |
| No auth | Namespace alone is not access control for public self-hosted runtime. | Add owner-scoped auth and harness tokens before runtime exposure. |
| MCP direct mutation | Agents could save/delete memories without Source-Wire review policy. | MCP must call policy API and default to no auto-promotion. |
| No source graph | Imported notes/chats/docs cannot be cited as structured source evidence. | Add Source Graph adapter layer before broad ingestion. |
| No candidate review | LLM classification could become trusted memory too early. | Route extraction into candidates first. |
| Delete lifecycle | Current delete path removes memory rows rather than preserving Source-Wire-style audit/supersede semantics. | Replace with soft delete/supersede policy for trusted memory. |
| Setup friction | Current Docker path assumes technical comfort with `.env`, models, and Postgres. | Slice 4 must define nontechnical owner-hosted setup. |

## Unknowns

- Whether the current memory-engine test suite passes on this machine without additional setup.
- Whether Alembic migrations fully match `Base.metadata.create_all` behavior.
- Whether pgvector index performance is acceptable at large owner-data scale.
- Whether the current RLM reranking quality is enough beyond simple lexical boost plus vector search.
- Whether the frontend can be salvaged for Mission Control or should be replaced.
- Whether commercial licensing or dual licensing is available for Source-Wire's desired distribution path.

## Slice 1 Verdict

The memory-engine baseline is worth keeping as a separate runtime candidate and implementation reference.

It should not be merged into Source-Wire or exposed as the public runtime yet.

Recommended next sequence:

1. Slice 2: decide the license path.
2. Slice 3: define the Source-Wire API and MCP wrapper boundary.
3. Slice 4: define nontechnical BYO self-hosted setup.
4. Slice 5: define public-safe fixtures and verification gates.
5. Slice 6: make the implementation go/no-go decision.

Runtime implementation remains blocked.
