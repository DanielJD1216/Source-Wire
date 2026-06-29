# Source-Wire Release Decision

Date: 2026-06-29

Status: not approved for release or publishing.

## Decision

Source-Wire is not approved for npm publishing, GitHub release publishing, service deployment, open-source licensing, or runtime backend expansion yet.

The current repo is a public contract package skeleton. It can define architecture contracts, schemas, synthetic fixtures, validation tools, and package-readiness checks.

It must not be treated as a released open-source product until a later owner-approved release PRD changes that status.

## Current Status

| Area | Status | Reason |
| --- | --- | --- |
| npm publishing | Blocked | Package readiness exists, but publish approval does not. |
| GitHub release publishing | Blocked | No release approval, release notes, or release tag policy exists yet. |
| Deployment | Blocked | Source-Wire has no runtime service to deploy. |
| License | `UNLICENSED` | Public reuse is not approved yet. |
| Version | `0.0.0` | The package is not released and has no compatibility promise. |
| Runtime backend | Blocked | Runtime belongs to a later explicit unit, not this public skeleton gate. |

## What Is Allowed Now

- Public contract docs.
- Public JSON schemas.
- Synthetic fixtures.
- TypeScript contract types.
- Local validation CLI.
- CI checks.
- Package dry-run checks.
- Public-safety scanning.
- Release-gate checks.

## What Is Not Allowed Yet

- `npm publish`.
- GitHub release creation.
- Hosted service deployment.
- Runtime API server.
- MCP server runtime.
- Database migrations.
- PostgreSQL or pgvector setup.
- Memory-engine integration.
- Live connectors.
- Mission Control UI.
- Real user data.
- Private implementation code.
- Secret-dependent checks.

## Future Approval Required

A later PRD must explicitly approve any of these changes before they happen:

- changing the package license away from `UNLICENSED`,
- changing the package version away from `0.0.0` for release,
- publishing to npm,
- creating a GitHub release,
- deploying a service,
- adding runtime backend behavior.

## Why This Gate Exists

Package readiness only answers: "Can the package shape be checked?"

Release approval answers: "Should this be published and reused by other people?"

Those are different decisions. Source-Wire has the first capability, but not the second approval.
