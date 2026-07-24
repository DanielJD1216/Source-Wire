# Source-Wire Agent Guide

This file is the repository entrypoint for AI coding agents. Source-Wire is a contracts-first TypeScript package for governed agent memory. It is not a hosted memory service or a production runtime.

## Read Order

1. Read [README.md](README.md) for the product, trust model, and current public boundary.
2. Read [docs/README.md](docs/README.md) to route to the smallest relevant document.
3. Read the relevant concept and contract before changing behavior.
4. Inspect the matching synthetic fixtures and smoke test.
5. Run `npm run readiness:report` before making repository-status claims.

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
- Synthetic runtime proofs do not imply a live server, database, connector, or deployment.

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
