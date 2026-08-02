# Security boundary

`@source-wire/local-runtime@0.1.0-alpha.1` is deprecated. A security review
confirmed that a multi-namespace credential could substitute the configured
provider namespace and that a never-settling provider could outlive its
configured deadline.

`0.1.0-alpha.2` is a reviewed public security-fix Alpha limited to macOS and
Linux local evaluation with synthetic or disposable data.

This Alpha restores pre-invocation namespace binding and provider deadline enforcement
with a hard response deadline.

## Provider boundary

The Alpha:

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

A fresh review of the exact Alpha dependency tree reports two moderate
findings for nested `@hono/node-server@1.19.15` through
`@modelcontextprotocol/sdk@1.29.0`. The current advisory concerns Windows
static-file path handling and is tracked as `GHSA-frvp-7c67-39w9`.

The findings are temporarily accepted for this Alpha because:

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
for the public `0.1.0-alpha.2` Alpha after the runtime changed.
Re-review is required no later than August 24, 2026, or immediately if any
dependency, transport, platform, runtime, future publication, hosting,
deployment, or data boundary changes.

## Unsupported security scope

There is no production authentication, hosted secret custody, managed
database, managed provider credential, telemetry, billing, or
Source-Wire-operated service in this Alpha.

The Gate B `SyntheticMemoryOnlyAccessPlane` validates deterministic synthetic
proof metadata and policy intersections for tests. The additive, disconnected
`verifyOfflineMemoryOnlyRequest` verifier now validates compact Ed25519
access-token and DPoP signatures against an injected bounded issuer key set,
strict recursive JSON, exact JOSE headers and claims, RFC 7638 sender-key
thumbprints, bounded token and proof times, and exact issuer, audience,
principal, client, session, method, URI, and nonce bindings. It emits only the
existing normalized durable transport context after both signatures and all
bindings pass, with generic `credential_invalid` denial for external failures.
It does not perform OAuth/OIDC discovery, remote JWKS retrieval or refresh, TLS
or mTLS handshakes, certificate-chain validation, identity-provider discovery,
or live TLS identity. It is not exported, composed into a listener, server,
MCP runtime, CLI, or application entrypoint, and the static Gate B graph rejects
such reachability.

The additive Gate B PostgreSQL authority can coordinate synthetic session state
and sender-key-wide replay digests across runtime pools, recheck sender, nonce,
route, audience, grant, and epoch state at protected-read receipt consumption,
and stores only domain-separated digests for the synthetic sender thumbprint,
nonce, and replay ID. The offline verifier and PostgreSQL authority together are
still synthetic test infrastructure, not production authentication. They must
not be connected to an untrusted network or used with real data.
Gate B memory-only MCP startup constructs the raw MCP server inside a closure
and returns a frozen null-prototype capability facade. Its guarded registration
method rejects every name outside the exact selected-profile allowlist without
changing the existing local `memory_only` runner contract.

Do not use this Alpha with real user data, client data, production
credentials, production databases, live knowledge providers, Windows, HTTP or
SSE MCP, or static serving.

Report suspected security issues through the repository process in the root
`SECURITY.md`.
