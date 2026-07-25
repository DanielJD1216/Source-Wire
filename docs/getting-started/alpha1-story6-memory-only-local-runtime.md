# Alpha 1 Story 6.2 Memory-Only Local Runtime

Latest source includes the first complete private `source-wire-local` runtime
composition for memory-only use:

```text
owner-controlled config
  -> migration compatibility inspection
  -> loopback API policy
  -> process-scoped harness credential
  -> stdio MCP
  -> exactly two memory tools
```

This is unpublished local Alpha proof. It is not a hosted service, production
runtime, live connector, managed database, or real-data path.

## What The Command Does

```bash
npm run local --workspace @source-wire/alpha1-runtime -- \
  mcp stdio \
  --config /owner-controlled/source-wire.local.json
```

The command:

1. validates `source-wire.local.v1`,
2. resolves adopter-owned environment values,
3. inspects PostgreSQL migration compatibility without applying migrations,
4. starts the internal API on literal loopback,
5. uses owner authority to issue one short-lived harness credential,
6. starts the MCP child with only the loopback API origin, harness token, and
   memory-only tool profile,
7. keeps MCP protocol frames on stdout,
8. writes only fixed redacted diagnostic codes to stderr,
9. revokes the process credential and stops both children on shutdown.

The MCP child receives no owner token, database URL, migrator URL, provider
configuration, provider credential, or direct database authority.

## Prerequisites

Use Node.js `22.23.1` and PostgreSQL `16`.

Complete the generated disposable setup from:

1. [Alpha 1 Story 1 Local Runtime](alpha1-story1-local-runtime.md)
2. [Alpha 1 Story 2 Candidate Approval](alpha1-story2-candidate-approval.md)
3. [Alpha 1 Story 3 Audited Search](alpha1-story3-audited-search.md)
4. [Alpha 1 Story 6.1 Local CLI Init And Offline Doctor](alpha1-story6-local-cli-init-doctor.md)

The owner-controlled launcher environment must provide the values named by
the local configuration, plus the existing owner token:

```bash
export SOURCE_WIRE_DATABASE_URL='<generated disposable runtime URL>'
export SOURCE_WIRE_TOKEN_VERIFIER_KEY='<generated verifier key>'
export SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID='local_alpha1'
export SOURCE_WIRE_OWNER_TOKEN='<generated disposable owner token>'
```

Do not put these values in `source-wire.local.json`, shell history,
documentation, fixtures, issue comments, or commits.

The command does not read or pass `SOURCE_WIRE_MIGRATOR_DATABASE_URL`. It never
applies migrations.

## MCP Surface

With no provider configured, the official MCP client discovers exactly:

- `propose_memory_candidate`
- `search_trusted_memory`

Candidate proposal and trusted-memory search cross the stdio MCP child and
loopback API policy. The MCP child never reads PostgreSQL directly.

Provider-backed tools remain absent. Story 6.3 owns the separate zero-or-one
provider composition.

## Verification

Focused tests:

```bash
npm run alpha1:test
```

Generated disposable PostgreSQL proof:

```bash
npm run alpha1:conformance:story2
```

The Story 2 conformance report now includes:

- `S6-MEMORY-01`, exact two-tool discovery through `source-wire-local`,
- `S6-MEMORY-02`, proposal and search through MCP plus API policy,
- `S6-MEMORY-03`, unchanged migrations, revoked process credential, stopped
  processes, and removed temporary configuration.

The conformance teardown also proves the generated database, roles, sessions,
and tracked child processes are absent. The normal runtime command never drops
an adopter-owned database or role.

## Failure And Shutdown Behavior

- API startup failure stops the composition.
- MCP startup or runtime failure stops the composition.
- Signals are coordinated through the launcher.
- The launcher attempts process-credential revocation before stopping the API.
- A child that does not stop within the bounded shutdown window is terminated.
- Diagnostics never include endpoints, credentials, database URLs, config
  paths, queries, evidence, or memory content.

## Still Blocked

- provider loading through the local CLI,
- live knowledge connectors,
- non-disposable or production database use,
- hosted API or hosted MCP,
- HTTP or SSE MCP,
- deployment,
- real user or client data,
- production authentication and secret custody,
- package publication of the Alpha runtime.

The next dependency-ordered unit is
[#280 Story 6.3: Compose one synthetic provider through the local CLI](https://github.com/DanielJD1216/Source-Wire/issues/280).
