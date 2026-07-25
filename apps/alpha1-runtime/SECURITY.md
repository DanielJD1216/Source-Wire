# Security boundary

`@source-wire/local-runtime@0.1.0-alpha.1` is an unpublished experimental Alpha
candidate. It is limited to macOS and Linux local evaluation with synthetic or
disposable data.

## Dependency advisory disposition

A fresh review of the exact candidate dependency tree reports two moderate
findings for nested `@hono/node-server@1.19.15` through
`@modelcontextprotocol/sdk@1.29.0`. The current advisory concerns Windows
static-file path handling and is tracked as `GHSA-frvp-7c67-39w9`.

The findings are temporarily accepted for this candidate because:

- Windows is unsupported and blocked by package metadata.
- MCP transport is stdio only.
- HTTP and SSE MCP are unsupported.
- static serving is not used or supported.
- hosting, deployment, production use, real data, and live providers remain
  blocked.
- the direct `@hono/node-server` dependency is pinned to `2.0.11`.
- forcing the current audit recommendation would downgrade the MCP SDK and
  change the reviewed dependency scope.

This is a scope-limited disposition, not a claim that the dependency is safe
for other uses. Re-review is required no later than August 24, 2026, or
immediately if any dependency, transport, platform, runtime, publication,
hosting, deployment, or data boundary changes.

## Unsupported security scope

There is no production authentication, hosted secret custody, managed
database, managed provider credential, telemetry, billing, or
Source-Wire-operated service in this candidate.

Do not use this candidate with real user data, client data, production
credentials, production databases, live knowledge providers, Windows, HTTP or
SSE MCP, or static serving.

Report suspected security issues through the repository process in the root
`SECURITY.md`.
