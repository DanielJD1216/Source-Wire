# Parent PRD Issue: Source-Wire Owner-Hosted Setup Package

## Summary

Define the public-safe owner-hosted setup package for Source-Wire.

The package should explain and later prove how an adopter brings their own device or server, PostgreSQL-compatible database, credentials, source packets, and MCP-capable harnesses.

## Source Docs

- `docs/internal/owner-hosted-setup-prd.md`
- `docs/internal/owner-hosted-setup-issue-slices.md`

## Acceptance Criteria

- Owner-hosted setup is the default.
- Source-Wire-hosted memory is explicitly not the default.
- BYO device or server is represented.
- BYO PostgreSQL-compatible database is represented.
- API readiness is represented.
- MCP readiness is represented.
- Source update safety is represented.
- Mission Control setup health is represented as a future owner-facing requirement.
- Synthetic fixtures are required before implementation.
- Public safety and claim-boundary scans are required.

## Boundaries

This issue does not approve implementation, GitHub issue publication, managed hosting, production runtime use, API server runtime, MCP server runtime, database migrations, Mission Control UI, memory-engine integration, real user data, deployment, npm publishing, GitHub release creation, public code contribution acceptance, AGPLv3 code copying, or private implementation code copying.
