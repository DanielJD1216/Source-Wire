# Security boundary

`@source-wire/local-runtime@0.1.0-alpha.1` is deprecated. A security review
confirmed that a multi-namespace credential could substitute the configured
provider namespace and that a never-settling provider could outlive its
configured deadline.

`0.1.0-alpha.2` is an unpublished security-fix candidate limited to macOS and
Linux local evaluation with synthetic or disposable data.

This candidate restores pre-invocation namespace binding and provider deadline enforcement
with a hard response deadline.

## Provider boundary

The candidate:

- binds actor owner, requested namespace, and provider owner and namespace
  before provider invocation,
- rejects mismatches before provider execution or audit issuance,
- races provider execution against the configured deadline,
- supplies an optional cooperative `AbortSignal`,
- releases search and exact-fetch responses through one protected handoff.

Provider adapters are trusted application code. They execute in the Source-Wire
API process and can technically inspect process environment and local
process resources. Live or untrusted adapters remain unsupported. Adapters
must enforce downstream query deadlines, including PostgreSQL
`statement_timeout` for PostgreSQL readers. The host deadline prevents response
and audit release after expiry, but it cannot forcibly stop non-cooperative
in-process code.

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
for other uses. The dependency disposition was re-reviewed on July 25, 2026
for the unpublished `0.1.0-alpha.2` candidate after the runtime changed.
Re-review is required no later than August 24, 2026, or immediately if any
dependency, transport, platform, runtime, future publication, hosting,
deployment, or data boundary changes.

## Unsupported security scope

There is no production authentication, hosted secret custody, managed
database, managed provider credential, telemetry, billing, or
Source-Wire-operated service in this candidate.

Do not use this candidate with real user data, client data, production
credentials, production databases, live knowledge providers, Windows, HTTP or
SSE MCP, or static serving.

Report suspected security issues through the repository process in the root
`SECURITY.md`.
