# Alpha 1 Story 6.4 Fail-Closed Orchestration And Cleanup

Latest source and published local-runtime `0.1.0-alpha.2` harden the
`source-wire-local` runner so startup,
protected response release, child-process failure, and shutdown remain one
coordinated local boundary.

This is experimental Alpha proof with generated disposable PostgreSQL state. It
does not approve hosting, deployment, production use, external providers,
non-disposable databases, or real data.

## Prerequisites

Start with the repository [Quickstart](quickstart.md), then complete:

1. [Story 6.1 Local CLI Init And Offline Doctor](alpha1-story6-local-cli-init-doctor.md)
2. [Story 6.2 Memory-Only Local Runtime](alpha1-story6-memory-only-local-runtime.md)
3. [Story 6.3 Synthetic Provider Local Runtime](alpha1-story6-synthetic-provider-local-runtime.md)

Use exact Node.js `22.23.1` and exact PostgreSQL `18.4` for disposable Alpha
conformance.

## Failure Boundary

The runner now enforces this order:

```text
validate config and compatibility
  -> resolve required environment references
  -> inspect migrations without mutation
  -> start loopback API
  -> issue one process-scoped MCP credential
  -> start stdio MCP
  -> stop all children on failure or signal
  -> revoke the process credential
  -> close runtime database sessions
```

If the API remains available, shutdown revokes the process credential through
the owner-admin API. If the API crashes after credential issuance, the runner
uses its existing runtime database authority to revoke only that exact
generated harness credential and records a metadata-only cleanup audit event.
It does not gain owner, migrator, provider, or broad credential authority.

A signal received during startup now stops both children and prevents later
startup steps from continuing.

## Stable Safe Failures

The local command fails with stable redacted error classes such as:

- `config_invalid`
- `config_incompatible`
- `environment_missing`
- `environment_invalid`
- `database_unavailable`
- `database_incompatible`
- `api_start_failed`
- `mcp_start_failed`
- `composition_failed`
- `credential_revoke_failed`

Failure output does not include credentials, database locators, provider
module details, local config paths, private queries, evidence bodies, hidden
result counts, or protected excerpts.

MCP protocol remains on stdout. Lifecycle diagnostics and final CLI failures
remain on stderr. Pre-start failures emit no stdout.

## Protected Content

Story 6.4 preserves the existing protected-read release gate:

```text
provider or memory read
  -> bounded response
  -> durable metadata-only audit
  -> origin-process receipt
  -> single-use receipt consumption
  -> response handoff
```

Audit failure, receipt mismatch, replay, foreign-process consumption,
provider or database outage, and response-write interruption release zero
protected content. Provider reads still create zero candidates and zero
trusted memories.

## Verification

Focused tests:

```bash
npm run alpha1:test
```

Generated disposable PostgreSQL proof with the baseline synthetic provider:

```bash
npm run alpha1:conformance:story5
```

The same proof through the separate public-contract-only adapter:

```bash
npm run alpha1:conformance:story5:replaceable
```

Each Story 5 adapter path now passes 27 cases. The Story 6.4 cases are:

- `S6-FAIL-01`, database outage and incompatible migrations fail before
  startup, emit no protocol stdout, and apply no migration,
- `S6-FAIL-02`, malformed provider composition invokes no provider and API or
  MCP crashes stop the complete composition,
- `S6-FAIL-03`, crash cleanup revokes process credentials, closes runtime
  sessions, removes temporary config files, and leaks no protected content.

The focused Alpha suite also rejects Story 6 crash injection unless it is
explicitly locked to the synthetic conformance environment.

## Still Blocked

- external or live knowledge providers,
- non-disposable or production PostgreSQL,
- hosted API or hosted MCP,
- HTTP or SSE MCP,
- deployment,
- real user or client data,
- production authentication, secret custody, availability, and support,
- publication of the Alpha runtime.

Continue with
[Story 6.5 Explicit Database Control Plane](alpha1-story6-database-control-plane.md).
