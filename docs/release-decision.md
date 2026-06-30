# Source-Wire Release Decision

Date: 2026-06-30

Status: not approved for npm publishing, GitHub release publishing, deployment, hosted runtime, or production runtime use.

For the public-facing summary of this status, read [Public Status](public-status.md).

## Decision

Source-Wire is Apache-2.0 licensed as a source package.

Source-Wire is not approved for npm publishing, GitHub release publishing, service deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

The current repo is a public contract package skeleton. It can define architecture contracts, schemas, synthetic fixtures, validation tools, and package-readiness checks.

It must not be treated as a released product until a later owner-approved release PRD changes that status.

## Current Status

| Area | Status | Reason |
| --- | --- | --- |
| License | `Apache-2.0` | Source package reuse is approved. |
| Version | `0.0.0` | The package is not released and has no compatibility promise. |
| npm publishing | Blocked | Package readiness exists, but publish approval does not. |
| GitHub release publishing | Blocked | No release approval, release notes, or release tag policy exists yet. |
| Deployment | Blocked | Source-Wire has no runtime service to deploy. |
| Runtime backend | Blocked | Runtime belongs to a later explicit unit, not this public skeleton gate. |
| Code contributions | Blocked | Contribution terms are not approved. |

## What Is Allowed Now

- Apache-2.0 source package reuse.
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
- Production runtime use.
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
- Code contribution acceptance.

## Future Approval Required

A later PRD must explicitly approve any of these changes before they happen:

- changing the package version away from `0.0.0` for release,
- publishing to npm,
- creating a GitHub release,
- deploying a service,
- adding runtime backend behavior,
- accepting code contributions.

For the current license decision, read [License Decision Gate](license-decision-gate.md).

Before any future publish or release implementation, run [Launch Decision Status](launch-decision-status.md) to confirm the blocked channels are still explicit.

## Why This Gate Exists

Package readiness only answers: "Can the package shape be checked?"

Release approval answers: "Should this be published and supported as a release?"

Those are different decisions. Source-Wire has the first capability and Apache-2.0 source reuse, but not npm publishing, GitHub release, hosted runtime, or production approval.
