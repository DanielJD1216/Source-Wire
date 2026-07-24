# Source-Wire Agent Guide

This file is the repository entrypoint for AI coding agents. The published `@source-wire/contracts@0.1.0` package remains contracts-first. Latest source also contains unpublished, loopback-only Alpha 1 Stories 1 through 3 under `apps/alpha1-runtime/`, backed only by generated disposable PostgreSQL state for local proof. Neither boundary is a hosted memory service or a production runtime.

## Read Order

1. Read [README.md](README.md) for the product, trust model, and current public boundary.
2. Read [docs/README.md](docs/README.md) to route to the smallest relevant document.
3. Before touching `apps/alpha1-runtime/`, read [Alpha 1 Story 1 Local Runtime](docs/getting-started/alpha1-story1-local-runtime.md), [Alpha 1 Story 2 Candidate Approval](docs/getting-started/alpha1-story2-candidate-approval.md), and [Alpha 1 Story 3 Audited Search](docs/getting-started/alpha1-story3-audited-search.md).
4. Read the relevant concept and contract before changing behavior.
5. Treat everything under `examples/` as synthetic, then inspect the matching synthetic fixture and smoke test.
6. Run `npm run readiness:report` before making repository-status claims.

Historical approval packets and proof records live in `docs/internal/`. Use them for provenance, not as the primary API or onboarding documentation.

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
- `apps/alpha1-runtime/` is real local Alpha 1 Stories 1 through 3 proof only. Its final MCP surface contains exactly proposal and trusted-memory search. Approval remains owner-controlled, and protected reads require durable audit plus a single-use origin-process receipt before response release. It remains unpublished, loopback-only, generated-disposable, unhosted, undeployed, not production ready, and unsupported for real data.

## Working Commands

Use Node.js 22 with npm.

```bash
npm install
npm run readiness:report
npm test
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
```

The conformance commands require Node.js `22.23.1`, local PostgreSQL `16`, disposable database and role authority, and synthetic generated state. Story 1 proves bootstrap, credential, request, migration, and cleanup controls. Story 2 proves the real stdio MCP proposal path, pending-only persistence, owner-controlled decisions, durable lifecycle idempotency, atomic audit, least privilege, and cleanup. Story 3 proves active-only PostgreSQL full-text search, exact audit-before-release receipts, origin-process single-use consumption, fail-closed crashes and outages, protected-content bounds, leak resistance, least privilege, and cleanup. They must not target real or persistent user data.

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
