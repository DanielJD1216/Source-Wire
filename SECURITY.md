# Source-Wire Security Policy

Source-Wire is currently public for technical review.

It is `UNLICENSED`, unreleased, unpublished, and not a hosted runtime.

## Supported Scope

Security review is currently limited to the public Source-Wire repository:

- public docs,
- TypeScript contract types,
- JSON schemas,
- synthetic fixtures,
- validation CLI,
- package-readiness scripts,
- GitHub Actions workflow,
- issue templates.

Source-Wire does not currently include:

- hosted runtime backend,
- API server runtime,
- MCP server runtime,
- database migrations,
- live connectors,
- real user data,
- deployed services.

## Reporting A Concern

Use the Boundary or safety concern issue template for public boundary, privacy, real-data, or safety concerns.

Do not include:

- secrets,
- tokens,
- private keys,
- private data,
- local private paths,
- private screenshots,
- production exports,
- account IDs,
- client names,
- real source payloads,
- real chat logs,
- real memory records.

Use synthetic examples or public repo references only.

## What To Include

Include:

- affected file, command, or workflow,
- the boundary or safety concern,
- why the current behavior or wording is risky,
- safer wording or expected behavior if known.

## Current Boundary

Security reporting does not approve:

- Apache-2.0 license implementation,
- reuse or redistribution,
- npm publishing,
- GitHub release publishing,
- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- real data examples,
- contribution license terms.

Read [Public Status](docs/public-status.md) for the current repo state.
