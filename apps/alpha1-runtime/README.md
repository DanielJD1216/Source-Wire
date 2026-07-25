# @source-wire/local-runtime

Experimental Source-Wire local runtime for macOS and Linux evaluation with
synthetic or disposable data only.

Version `0.1.0-alpha.1` is the first public npm Alpha. It is not a hosted
service, production runtime, GitHub release, or stable release.

## Compatibility

- Node.js `22.23.1`
- PostgreSQL `16.x`
- stdio MCP only
- `@source-wire/contracts@0.2.0`
- `KnowledgeProvider v1`
- exact dependency pins from this package manifest

## Install

Install the exact public Alpha version:

```sh
npm install --save-exact @source-wire/local-runtime@0.1.0-alpha.1
```

This release uses the `alpha` dist-tag. Prefer the exact version above for
repeatable evaluation.

To inspect a locally packed candidate before publication, run:

From the Source-Wire repository:

```sh
npm run alpha1:build
npm pack --workspace @source-wire/local-runtime --pack-destination /tmp
```

Install the resulting tarball into an evaluation project with an explicit local
path. Do not use `npx`, a floating package version, or an unreviewed remote URL.

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

## Support boundary

Supported for this Alpha candidate:

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

Public npm availability authorizes installation of this exact experimental
Alpha only. It does not authorize a GitHub tag or release, deployment, hosting,
real data, live providers, Windows, HTTP or SSE MCP, static serving,
non-disposable databases, or production use.
