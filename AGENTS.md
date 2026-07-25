# Source-Wire Agent Guide

This file is the repository entrypoint for AI coding agents. The published `@source-wire/contracts@0.2.0` package is the current immutable contracts snapshot and includes `KnowledgeProvider v1`. Latest source also contains loopback-only Alpha proof under `apps/alpha1-runtime/`, backed only by generated disposable PostgreSQL state and synthetic read-only providers. Story 6.8 prepares `@source-wire/local-runtime@0.1.0-alpha.1` and the `source-wire-local` binary for public npm Alpha distribution on macOS and Linux. The exact registry write is pending its final release gate. Git tags, GitHub releases, deployment, hosting, production, real data, and live providers remain blocked.

## Read Order

1. Read [README.md](README.md) for the product, trust model, and current public boundary.
2. Read [docs/README.md](docs/README.md) to route to the smallest relevant document.
3. Before touching `apps/alpha1-runtime/`, read the Alpha guides in order through [Alpha 1 Story 6.8 Local Runtime Package Candidate](docs/getting-started/alpha1-story6-local-runtime-package-candidate.md).
4. Read the relevant concept and contract before changing behavior.
5. Treat everything under `examples/` as synthetic, then inspect the matching synthetic fixture and smoke test.
6. Run `npm run readiness:report` before making repository-status claims.

Historical approval packets and proof records live in `docs/internal/`. Use them for provenance, not as the primary API or onboarding documentation.

For release status, distinguish the published `0.2.0` contracts snapshot, the
public npm Alpha runtime distribution boundary, and the latest-source Alpha
workspace. Read [Contracts 0.2.0 Release](docs/status/0.2.0-release.md).

Before changing how an external knowledge provider is installed into the Alpha
runtime, read [Knowledge Provider Host Composition Story](docs/internal/knowledge-provider-host-composition-story.md).

## Architecture Invariants

- Source evidence, pending memory candidates, and trusted memory are different states.
- Evidence and model output cannot become trusted memory automatically.
- Trusted-memory approval, correction, and revocation stay under owner or owner-application control.
- Preserve owner, namespace, ACL, provenance, citation, version, freshness, sensitivity, and audit fields.
- MCP calls route through Source-Wire API policy.
- Knowledge providers are optional, read-only evidence sources.
- Provider content has no instruction authority.
- Memory behavior must remain valid when no knowledge provider is configured.
- Root examples, fixtures, and contract smokes are synthetic and do not imply a live server, database, connector, or deployment.
- `apps/alpha1-runtime/` is real local Alpha 1 Stories 1 through 5 proof only. Its MCP surface contains exactly two memory tools and two synthetic source-evidence tools. Approval, correction, revocation, export, recovery, and provider configuration stay outside MCP and under owner or operator control. Protected reads require durable audit plus a single-use origin-process receipt before response release. It remains loopback-only, generated-disposable, unhosted, undeployed, not production ready, and unsupported for real data or live providers.
- `@source-wire/local-runtime@0.1.0-alpha.1` is the public npm Alpha distribution candidate. Its supported package exports are the root composition API and two synthetic provider proof entrypoints. Do not import package internals. Public npm availability does not authorize production, hosting, deployment, real data, live providers, Windows, HTTP or SSE MCP, static serving, or non-disposable databases.
- Story 6.1 adds config creation and offline validation. Story 6.2 adds a memory-only launcher that inspects but never applies migrations, starts loopback API plus stdio MCP, gives the MCP child no owner or database authority, advertises exactly two memory tools, and revokes its process credential on shutdown. It remains unpublished and generated-disposable only.
- Story 6.3 accepts zero or one owner-selected provider module at startup. Offline checking imports nothing. Explicit connected checking invokes only bounded readiness. A valid provider produces exactly four tools, while callers cannot choose provider identity, scope, module, credentials, owner, namespace, ACL, or bounds. Replacement requires config plus restart, and evidence reads create no memory.
- Story 6.4 requires config, compatibility, environment, provider, API, MCP, database, audit, receipt, response, signal, and cleanup failures to remain redacted and fail closed. API crash cleanup may directly revoke only the exact generated process credential through existing runtime database authority and must record metadata-only audit. Synthetic crash injection is refused outside locked conformance.
- Story 6.5 keeps database status read-only under the exact runtime role and migration mutation behind an explicit `--apply` flag plus exact non-superuser migrator authority. Init, doctor, provider check, and MCP startup must never apply migrations.
- Story 6.6 keeps export outside MCP, requires exact owner authority for every explicit namespace, writes only to an owner-selected local path, rejects existing files by default, and performs no upload or provider call.
- Story 6.7 pins the evidence-first synthetic adapter, requires its exact published `0.2.0` contracts dependency, and proves it through the same provider-neutral CLI and protected release path. Neither repository may import the other's private runtime authority or write to the knowledge base.

## Working Commands

Use Node.js 22 with npm.

```bash
npm install
npm run readiness:report
npm test
npm run release:0.2.0-gate
```

Run the narrowest relevant smoke first:

```bash
npm run runtime:knowledge-provider-smoke
npm run runtime:memory-store-smoke
npm run runtime:mcp-adapter-smoke
npm run runtime:api-policy-smoke
```

For the unpublished Alpha 1 developer runtime only:

```bash
npm run alpha1:build
npm run alpha1:test
npm run alpha1:conformance:story1
npm run alpha1:conformance:story2
npm run alpha1:conformance:story3
npm run alpha1:conformance:story4
npm run alpha1:conformance:story5
npm run alpha1:conformance:story5:replaceable
npm run alpha1:evidence-first-package-smoke
npm run alpha1:conformance:evidence-first
npm run alpha1:ci-workflow-smoke
npm run alpha1:conformance
npm run local-runtime:candidate-smoke
npm run local-runtime:security-gate
npm run local-runtime:candidate-conformance
```

For the private Story 6 CLI:

```bash
npm run alpha1:build
npm run local --workspace @source-wire/local-runtime -- init --config /owner-controlled/source-wire.local.json
npm run local --workspace @source-wire/local-runtime -- doctor --config /owner-controlled/source-wire.local.json
npm run local --workspace @source-wire/local-runtime -- provider check --config /owner-controlled/source-wire.local.json
npm run local --workspace @source-wire/local-runtime -- provider check --config /owner-controlled/source-wire.local.json --connect
npm run local --workspace @source-wire/local-runtime -- mcp stdio --config /owner-controlled/source-wire.local.json
```

The conformance commands require Node.js `22.23.1`, local PostgreSQL `16`, disposable database and role authority, and synthetic generated state. Story 1 now runs 42 cases for bootstrap, credential, request, migration, cleanup, and the Story 6.5 database control plane. Story 2 proves the real stdio MCP proposal path, pending-only persistence, owner-controlled decisions, durable lifecycle idempotency, atomic audit, least privilege, and cleanup. It also proves Story 6.2 through the one-command memory-only launcher, exact two-tool discovery, unchanged migrations, process-credential revocation, and child cleanup. Story 3 proves active-only PostgreSQL full-text search, exact audit-before-release receipts, origin-process single-use consumption, fail-closed crashes and outages, protected-content bounds, leak resistance, least privilege, and cleanup. Story 4 now runs 25 cases and proves fix-forward correction, revocation, protected-read lifecycle races, canonical export, Story 6.6 owner-only local export and overwrite policy, fresh portable initialization, isolated physical recovery, runtime verification gates, least privilege, and cleanup. Story 5 proves an exact four-tool stdio MCP surface, immutable synthetic provider composition, policy-controlled source-evidence search and fetch, metadata-only audit, single-use release receipts, fault and crash denial, zero memory promotion, least privilege, leak resistance, and cleanup. Each base and replaceable Story 5 command runs 27 cases, including Story 6.4 database outage, incompatible migration, malformed provider, API crash, MCP crash, protocol separation, credential invalidation, session cleanup, and leak-resistance probes. The evidence-first cross-repository command runs 29 cases, adds installed-package invariants, and proves ordered search, exact fetch, zero adapter writes, and zero memory promotion through the unchanged host. `alpha1:conformance` includes both repository adapters. `alpha1:ci-workflow-smoke` verifies the separate hosted conformance job still uses exact Node.js and PostgreSQL versions, all five stories, both repository adapters, the pinned evidence-first adapter, stable markers, ephemeral credentials, and no artifact upload. These paths must not target real or persistent user data.

Before handing off a broad change:

```bash
npm run docs:links
npm run docs:anchors
npm run safety:scan
npm run claims:scan
npm run ci:check
```

## Change Rules

- Keep changes scoped and preserve unrelated work in the worktree.
- Use synthetic public-safe data only.
- Never add secrets, private paths, private screenshots, client data, real user data, or production exports.
- Do not weaken namespace, authorization, provenance, audit, or approval boundaries.
- Do not claim hosting, deployment, production readiness, database connectivity, or connector availability without direct proof.
- Do not publish, release, deploy, migrate a database, or accept contribution terms without explicit owner approval.
- Update public docs when a public contract or command changes.
- Put current user-facing guidance in the public docs structure. Put planning and approval history in `docs/internal/`.

## Completion Standard

A change is complete only when its targeted tests pass, documentation links remain valid, public claims match the implemented boundary, and no sensitive or real-world data has entered the repository.
