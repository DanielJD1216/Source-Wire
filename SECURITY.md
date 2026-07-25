# Source-Wire Security Policy

Source-Wire is currently public for technical review.

It is Apache-2.0 licensed as a source package, published to npm, released on GitHub, and not a hosted runtime.

## Current Local-Runtime Warning

`@source-wire/local-runtime@0.1.0-alpha.1` is deprecated because provider owner
and namespace binding and hard provider deadline enforcement were incomplete.
Do not install or use that version.

Latest source prepares the publication-approved `0.1.0-alpha.2` with
pre-invocation binding checks, deadline racing, cooperative abort, and unified
protected response handoff. That Alpha is not approved for production, hosting,
deployment, real data, live or untrusted providers, Windows, HTTP or SSE MCP,
static serving, or non-disposable databases.

## Supported Scope

Security review is currently limited to the public Source-Wire repository:

- public docs,
- TypeScript contract types,
- JSON schemas,
- synthetic fixtures,
- validation CLI,
- package-readiness scripts,
- GitHub Actions workflow,
- issue templates,
- the loopback-only local Alpha workspace and its synthetic or disposable
  conformance paths.

Source-Wire does not currently include:

- hosted runtime backend,
- hosted or production API server runtime,
- hosted or production MCP server runtime,
- production database migrations,
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

- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- real data examples,
- code contribution acceptance,
- contribution enforcement or maintainer workflow changes.

Read [Public Status](docs/status/public-status.md) for the current repo state.
