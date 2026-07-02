# Source-Wire Release Decision

Date: 2026-06-30

Status: first public release executed from the path approved in [#255](https://github.com/DanielJD1216/Source-Wire/issues/255). Source-Wire is published as `@source-wire/contracts@0.1.0` and released on GitHub as `v0.1.0`.

For the public-facing summary of this status, read [Public Status](public-status.md).

## Decision

Source-Wire is Apache-2.0 licensed as a source package.

Source-Wire has an owner-approved public release path, and the first release has been executed.

Source-Wire is not approved for service deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

The current repo is a public contract package skeleton. It can define architecture contracts, schemas, synthetic fixtures, validation tools, and package-readiness checks.

It must not be treated as a hosted runtime, deployed service, production backend, or code-contribution-accepting project.

## Current Status

| Area | Status | Reason |
| --- | --- | --- |
| License | `Apache-2.0` | Source package reuse is approved. |
| Version | `0.1.0` | First public package release is complete. |
| npm package | Published as `@source-wire/contracts@0.1.0` | First public package release is complete. |
| GitHub release | Published as `v0.1.0` | Matching GitHub release is complete. |
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

- deploying a service,
- adding runtime backend behavior,
- accepting code contributions.

Before npm publishing, GitHub release creation, or changing the package version away from `0.0.0`, the owner must complete the current release execution path:

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

```bash
npm run release:auth-handoff
npm login --registry=https://registry.npmjs.org/
npm whoami
npm run release:auth-preflight
npm run release:execution-preflight
```

For the current license decision, read [License Decision Gate](license-decision-gate.md).

Before any future publish or release implementation, run [Launch Decision Status](launch-decision-status.md) to confirm the blocked channels are still explicit.

## Why This Gate Exists

Package readiness only answers: "Can the package shape be checked?"

Release approval answers: "Should this be published and supported as a release?"

Those are different decisions. Source-Wire has the first capability and Apache-2.0 source reuse, but not npm publishing, GitHub release, hosted runtime, or production approval.
