# Local Runtime 0.1.0-alpha.2 npm Release

`@source-wire/local-runtime@0.1.0-alpha.2` is the reviewed public
security-fix Alpha published to npm under the `alpha` tag on July 25, 2026.
It is limited to macOS and Linux local evaluation with synthetic or disposable
data.

## Why This Release Exists

Review of `0.1.0-alpha.1` confirmed two defects:

1. A credential authorized for multiple namespaces could request one namespace
   while the host invoked the provider with its configured namespace.
2. The host checked provider timeout only after `provider.execute()` returned,
   so a never-settling provider could keep the request pending indefinitely.

The published `0.1.0-alpha.1` version is deprecated with a security warning.

## Release Controls

The release:

- requires the authenticated actor owner to equal the provider binding owner,
- requires the requested namespace to equal the provider binding namespace,
- performs those checks before provider invocation,
- returns safe `namespace_not_allowed` denials with zero provider invocation,
  audit receipt, or evidence release,
- races provider execution against the configured deadline,
- supplies an optional cooperative `AbortSignal` to runtime adapters,
- issues no audit receipt and releases no evidence after deadline expiry,
- routes search and exact fetch through the same protected response handoff,
- adds exact-fetch response-handoff crash conformance.

Provider adapters remain trusted in-process application code. The host can
abort cooperative adapters and can stop waiting on non-cooperative adapters,
but it cannot forcibly terminate arbitrary code running in the same process.
Database-backed adapters must enforce their own downstream query deadlines,
including PostgreSQL `statement_timeout`.

## Verification Scope

Use Node.js `22.23.1` and PostgreSQL `16.x`. Follow the
[Quickstart](../getting-started/quickstart.md) for repository setup before
running these commands.

Completed before publication:

```text
npm run alpha1:test
npm run alpha1:story5:security-gate
npm run alpha1:conformance:story5
npm run alpha1:conformance:story5:replaceable
npm run alpha1:conformance:evidence-first
npm run local-runtime:candidate-smoke
npm run local-runtime:security-gate
npm run local-runtime:candidate-conformance
npm run publish:readiness
```

Full conformance requires exact Node.js `22.23.1`, PostgreSQL `16`, generated
disposable state, and cleanup proof.

## Registry Evidence

- Package: `@source-wire/local-runtime@0.1.0-alpha.2`
- npm tag: `alpha`
- Tarball shasum: `d18316bfc79d9766c439d4dad3fbb7afcd38e2b9`
- Published from reviewed source commit:
  `2057ddb870bb07f1cdabb37272155f33df80b89f`
- Clean-install `source-wire-local init` and offline `doctor` passed under
  Node.js `22.23.1`.
- npm's `latest` tag remains on deprecated `0.1.0-alpha.1`. Consumers must
  install the exact reviewed version or use the `alpha` tag deliberately.

## Release Boundary

The npm package was published only after exact owner approval, green hosted
package checks, green PostgreSQL conformance, and exact-source verification.
Publication did not create or approve a Git tag or GitHub release.

Still blocked:

- production,
- hosting and deployment,
- Windows,
- HTTP or SSE MCP,
- static serving,
- real user or client data,
- live or untrusted providers,
- non-disposable databases,
- Git tags and GitHub releases.
