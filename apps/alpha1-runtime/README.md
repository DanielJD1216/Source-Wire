# @source-wire/local-runtime

Experimental Source-Wire local runtime for macOS and Linux evaluation with
synthetic or disposable data only.

Version `0.1.0-alpha.2` is the reviewed public security-fix Alpha. The first
public npm Alpha, `0.1.0-alpha.1`, is deprecated because namespace binding and
provider deadline enforcement were incomplete. This package is not a hosted
service, production runtime, GitHub release, or stable release.

## Compatibility

- Node.js `22.23.1`
- PostgreSQL `16.x`
- stdio MCP only
- `@source-wire/contracts@0.2.0`
- `KnowledgeProvider v1`
- exact dependency pins from this package manifest

## Install

Install the exact reviewed Alpha:

```sh
npm install --save-exact @source-wire/local-runtime@0.1.0-alpha.2
```

Do not install deprecated `0.1.0-alpha.1`, use `npx`, use a floating package
version, or use an unreviewed remote URL.

The installed binary is:

```text
source-wire-local
```

The supported programmatic entrypoint exports:

- `createSourceWireLocalRuntime`
- local configuration creation and validation helpers
- redacted local result and error types

The supported synthetic provider entrypoint is
`@source-wire/local-runtime/synthetic-provider`. Live providers remain blocked.

Provider adapters execute as trusted in-process application code. The runtime
enforces a hard response deadline and supplies an optional cooperative
`AbortSignal`; adapters remain responsible for enforcing their own downstream
query deadlines, including PostgreSQL `statement_timeout`.

## Support boundary

Supported for this public Alpha:

- local macOS or Linux evaluation
- synthetic or disposable data
- disposable PostgreSQL 16.x
- stdio MCP
- loopback-only API composition started by the local CLI
- synthetic `KnowledgeProvider v1` conformance

Not supported:

- production use
- hosted or deployed services
- Windows
- HTTP or SSE MCP
- static serving
- real user or client data
- live knowledge providers
- non-disposable databases
- Source-Wire-operated accounts, endpoints, billing, or telemetry

Source evidence is not trusted memory. Provider output cannot approve or
promote memory.

## Security

Read [SECURITY.md](SECURITY.md) before evaluation. Two moderate nested MCP
dependency advisories are temporarily accepted only for the exact local,
stdio-only, non-Windows scope above. The npm publication review was completed
on July 25, 2026. Re-review is required no later than August 24, 2026, and
immediately after any dependency, transport, platform, runtime, future
publication, hosting, deployment, or data-scope change.

## Public Alpha boundary

npm publication of `0.1.0-alpha.2` does not authorize a Git tag or release,
deployment, hosting, real data, live providers, Windows, HTTP or SSE MCP,
static serving, non-disposable databases, or production use.
