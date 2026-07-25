# Changelog

## 0.1.0-alpha.2

Reviewed public security-fix Alpha. No Git tag, GitHub release, deployment, or
hosted service is included.

- Rejects actor-owner and requested-namespace mismatches before provider
  invocation.
- Enforces a hard provider response deadline and supplies cooperative
  cancellation where supported.
- Routes search and exact fetch through the same protected response handoff.
- Adds multi-namespace, wrong-owner, never-settling provider, and exact-fetch
  crash conformance.
- Documents in-process provider adapters as trusted application code and keeps
  live providers blocked.
- Supersedes deprecated `0.1.0-alpha.1` under the npm `alpha` tag.

## 0.1.0-alpha.1

Deprecated first public npm Alpha. No Git tag, GitHub release, deployment, or
hosted service is included.

- Adds the `source-wire-local` binary.
- Adds a supported programmatic composition entrypoint.
- Supports local macOS and Linux evaluation with Node.js `22.23.1`,
  PostgreSQL `16.x`, stdio MCP, `@source-wire/contracts@0.2.0`, and
  `KnowledgeProvider v1`.
- Includes synthetic provider proof only.
- Requires no Source-Wire account, API key, telemetry, billing, or
  Source-Wire-operated endpoint.
- Publishes only the npm package under the `alpha` dist-tag.
- Keeps production, hosting, deployment, Windows, real data, live providers,
  HTTP or SSE MCP, static serving, Git tags, and GitHub releases blocked.
