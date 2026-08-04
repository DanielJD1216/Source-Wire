# Alpha 1 Story 6.5 Explicit Database Control Plane

The `source-wire-local` CLI already includes explicit database status and
migration commands in its `0.1.0-alpha.2` command surface. Latest source
extends the bounded status result described below.

This is experimental Alpha proof with generated disposable exact PostgreSQL 18.4 state.
It does not provision PostgreSQL, support persistent databases, authorize
production migration, or change the hosted and deployment blocks.

## Prerequisites

Start with the repository [Quickstart](quickstart.md), then complete:

1. [Story 6.1 Local CLI Init And Offline Doctor](alpha1-story6-local-cli-init-doctor.md)
2. [Story 6.2 Memory-Only Local Runtime](alpha1-story6-memory-only-local-runtime.md)
3. [Story 6.3 Synthetic Provider Local Runtime](alpha1-story6-synthetic-provider-local-runtime.md)
4. [Story 6.4 Fail-Closed Orchestration And Cleanup](alpha1-story6-fail-closed-orchestration.md)

Use exact Node.js `22.23.1` and exact PostgreSQL `18.4` for disposable Alpha
conformance.

The local config stores environment variable names, not database URLs:

```json
{
  "memory": {
    "kind": "postgres",
    "runtimeDatabaseUrlEnv": "SOURCE_WIRE_DATABASE_URL",
    "migratorDatabaseUrlEnv": "SOURCE_WIRE_MIGRATOR_DATABASE_URL",
    "verifierKeyEnv": "SOURCE_WIRE_TOKEN_VERIFIER_KEY"
  }
}
```

Keep the runtime and migrator values separate.

## Read-Only Status

The command predates this change in the `0.1.0-alpha.2` command surface. The
bounded PostgreSQL posture fields below are latest-source additions.

Set only the runtime-role database reference:

```bash
export SOURCE_WIRE_DATABASE_URL='<generated disposable runtime URL>'
```

Inspect status:

```bash
npm run local --workspace @source-wire/local-runtime -- \
  database status \
  --config /owner-controlled/source-wire.local.json
```

For a stable machine-readable envelope:

```bash
npm run local --workspace @source-wire/local-runtime -- \
  database status \
  --config /owner-controlled/source-wire.local.json \
  --json
```

Status:

- accepts only the exact `source_wire_runtime` role posture,
- runs inside a read-only transaction,
- uses no owner, harness, or provider credential,
- reports the exact PostgreSQL version number and classifies exact PostgreSQL
  `18.4` as `authoritative_18_4`,
- accepts PostgreSQL `16.x` only as `compatibility_16` when
  `SOURCE_WIRE_POSTGRES_COMPATIBILITY_MAJOR=16` is selected explicitly,
- reports `primary` or `standby` recovery state and refuses standby as
  `incompatible`,
- reports `read_only` inspection mode and refuses a violated read-only
  invariant as `incompatible`,
- preserves the separate schema state as `compatible`, `pending`, or
  `incompatible`,
- returns `database_unavailable` when PostgreSQL cannot be reached,
- applies zero migrations.

The JSON result uses the bounded
`source-wire.local-database-status.v1` schema. It does not claim readiness,
backup health, restore health, RPO, RTO, or production support.

The output contains safe migration versions and repository migration names. It
does not contain database URLs, passwords, verifier material, schema
checksums, private queries, evidence, memory, or hidden row counts.

## Migration Plan

Set the separate migrator-role database reference:

```bash
export SOURCE_WIRE_MIGRATOR_DATABASE_URL='<generated disposable migrator URL>'
```

Print the current set, target set, and pending set without mutation:

```bash
npm run local --workspace @source-wire/local-runtime -- \
  database migrate \
  --config /owner-controlled/source-wire.local.json
```

This plan is the required pre-apply view. Without `--apply`, the command
returns `migration-result not_applied` and `mutation-applied false`.

## Explicit Apply

Apply the displayed forward-only migration set:

```bash
npm run local --workspace @source-wire/local-runtime -- \
  database migrate \
  --config /owner-controlled/source-wire.local.json \
  --apply
```

Migration:

- accepts only the exact `source_wire_migrator` login role,
- rejects runtime-role, missing, superuser, inherited, create-database,
  create-role, replication, and bypass-RLS authority,
- assumes the non-login schema owner only inside the bounded migration
  transaction,
- uses the existing advisory lock and forward-only checksum chain,
- rolls back the complete transaction on failure,
- reports `applied` or `already_applied`,
- never runs from init, doctor, provider check, or MCP startup.

## Verification

Focused tests:

```bash
npm run alpha1:test
```

Generated disposable PostgreSQL proof:

```bash
npm run alpha1:conformance:story1
```

Story 1 now passes 43 cases on both explicit PostgreSQL `16.x` compatibility
and exact PostgreSQL `18.4` authority. The Story 6.5 cases are:

- `S6-DB-01`, init, doctor, provider check, and MCP startup apply no
  migrations,
- `S6-DB-02`, runtime-role status reports pending, compatible, incompatible,
  and unavailable safely,
- `S6-DB-03`, migration requires `--apply` plus exact migrator authority and
  rejects missing, wrong-class, and over-privileged authority,
- `S6-DB-04`, the safe plan is visible, an injected failure rolls back,
  first apply succeeds, and replay is idempotent,
- `S6-DB-05`, runtime-role status reports PostgreSQL support classification,
  primary recovery state, read-only inspection, zero mutation, and no locator
  disclosure.

The temporary config files, database, roles, sessions, and generated
credentials are removed by conformance cleanup.

## Still Blocked

- managed PostgreSQL provisioning,
- non-disposable or production databases,
- physical backup, point-in-time recovery, and restore-drill policy,
- production capacity, alert, RPO, and RTO thresholds,
- production migrations,
- external or live knowledge providers,
- hosted API or hosted MCP,
- HTTP or SSE MCP,
- deployment,
- real user or client data,
- publication of the Alpha runtime.

Continue with
[Story 6.6 Owner-Controlled Local Export](alpha1-story6-owner-controlled-local-export.md).
