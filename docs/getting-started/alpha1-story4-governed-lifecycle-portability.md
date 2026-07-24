# Alpha 1 Story 4 Governed Lifecycle And Portability

Latest source closes the local Alpha 1 memory lifecycle:

```text
pending candidate
  -> owner approval
  -> active trusted memory
  -> owner correction creates a new immutable revision
  -> owner revocation excludes the memory from active search
  -> owner export creates a canonical governed-state bundle
  -> operator initializes a fresh empty database or recovers an isolated physical backup
  -> independent verification enables runtime startup
```

This workspace remains an unpublished, loopback-only developer alpha. It uses synthetic generated data and disposable PostgreSQL 16 databases for conformance. It is not part of `@source-wire/contracts@0.1.0`, is not hosted, and is not approved for production or real data.

## What Story 4 Proves

- Owner-admin correction is fix-forward. It creates one new active revision, supersedes the expected revision, carries existing provenance, adds correction lineage, and records the owner reason as immutable evidence.
- Owner-admin revocation preserves history, leaves zero active revisions for that memory, and excludes it from current search.
- Expected revision and durable idempotency prevent stale, changed-replay, and last-write-wins mutation.
- Protected-read receipt consumption and lifecycle mutation use the same lock domain. A lifecycle change that commits first releases no stale content.
- Portable export is canonical, bounded, deterministically ordered, and structurally excludes authentication, receipt, idempotency, environment, database, log, cache, and private-path material.
- Portable initialization accepts only one verified bundle into an exact empty compatible target, creates one fresh owner-admin, imports no credentials or grants, and rolls back completely on failure.
- Physical recovery changes the installation authentication epoch, revokes restored credentials, invalidates unconsumed receipts, and cannot overlap a live or concurrently starting runtime.
- Runtime startup remains disabled until a separate operator process authenticates the new owner credential and verifies recovered invariants.

Story 4 does not add an MCP owner tool. The final Alpha 1 MCP surface remains exactly:

- `propose_memory_candidate`
- `search_trusted_memory`

## Requirements

- Node.js `22.23.1`
- npm
- local PostgreSQL `16`
- a PostgreSQL operator account allowed to create and remove generated disposable roles and databases
- synthetic generated data only

Read the earlier stories first:

1. [Story 1 Local Runtime](alpha1-story1-local-runtime.md)
2. [Story 2 Candidate Approval](alpha1-story2-candidate-approval.md)
3. [Story 3 Audited Search](alpha1-story3-audited-search.md)

## Fastest Complete Proof

From the repository root:

```bash
npm install
npm run alpha1:test
npm run alpha1:conformance:story4
```

To run the full Alpha 1 chain:

```bash
npm run alpha1:conformance
```

The Story 4 runner creates generated disposable roles and three disposable databases, exercises real API and CLI processes, uses only synthetic data, and removes the processes, sessions, roles, databases, and temporary directory at the end.

The redacted machine report is written to:

```text
apps/alpha1-runtime/.artifacts/story4-conformance-report.json
```

The report is ignored by Git and contains proof metadata, not credentials or memory bodies.

## Correct An Active Memory

Create an owner-only input file in a private directory. Use an absolute path:

```json
{
  "content": "The corrected trusted-memory content.",
  "reason": "Owner-reviewed correction reason."
}
```

With the loopback runtime active and `SOURCE_WIRE_OWNER_TOKEN` supplied through your local secret facility:

```bash
npm run owner --workspace @source-wire/alpha1-runtime -- \
  correct-memory \
  --base-url http://127.0.0.1:4318 \
  --namespace-id ns_project_alpha \
  --memory-id 00000000-0000-4000-8000-000000000001 \
  --expected-revision-id 00000000-0000-4000-8000-000000000002 \
  --input-file /absolute/private/path/correction.json \
  --idempotency-key correction_request_001
```

The identifiers above show the command shape only. Use identifiers returned by your local synthetic workflow.

The same actor, operation, key, and exact request replay the original safe result. Reusing the key with changed content, reason, namespace, memory, or expected revision returns `idempotency_conflict`.

## Revoke An Active Memory

The owner-only input file contains only the reason:

```json
{
  "reason": "Owner-reviewed revocation reason."
}
```

Run:

```bash
npm run owner --workspace @source-wire/alpha1-runtime -- \
  revoke-memory \
  --base-url http://127.0.0.1:4318 \
  --namespace-id ns_project_alpha \
  --memory-id 00000000-0000-4000-8000-000000000001 \
  --expected-revision-id 00000000-0000-4000-8000-000000000002 \
  --input-file /absolute/private/path/revocation.json \
  --idempotency-key revocation_request_001
```

Revocation is permanent in Alpha 1. It does not delete or rewrite history, and there is no unrevocation command.

## Export Governed State

The owner export command writes the bundle directly to an owner-selected regular file. It never writes the bundle body or owner token to stdout:

```bash
npm run owner --workspace @source-wire/alpha1-runtime -- \
  export \
  --base-url http://127.0.0.1:4318 \
  --namespace-id ns_project_alpha \
  --destination /absolute/private/path/source-wire-portable.ndjson
```

The safe stdout result contains the logical-state SHA-256 digest, file digest, record count, byte count, and audit event ID. Record the logical-state digest through a channel independent from the bundle.

The file is sensitive plaintext even though application secrets are excluded. Encrypt it before it leaves the owner-controlled machine. Encryption, key custody, destination access, retention, transfer, and deletion remain operator responsibilities.

Alpha 1 limits the bundle to:

- one canonical UTF-8 JSON Lines file,
- 64 MiB total,
- 64 KiB per physical line,
- 100,000 governed records,
- 64 explicitly selected namespaces.

## Initialize A Fresh Database From Export

Portable initialization is not an API route or MCP tool. Keep API and MCP processes stopped.

Use a separate compatible target and a migrator connection through `SOURCE_WIRE_MIGRATOR_DATABASE_URL`. Supply `SOURCE_WIRE_TOKEN_VERIFIER_KEY` and `SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID` through your local secret facility.

```bash
npm run operator --workspace @source-wire/alpha1-runtime -- \
  initialize \
  --from-export /absolute/private/path/source-wire-portable.ndjson \
  --expected-logical-state-sha256 <digest-from-an-independent-channel> \
  --operation-key portable_restore_001 \
  --secret-output /absolute/private/path/restored-owner.secret
```

The operator:

1. applies the exact migration chain,
2. requires an empty governed target,
3. validates the canonical format, counts, digests, graph closure, lifecycle, provenance, actors, audit references, and snapshot cutoff,
4. imports governed history in one transaction,
5. creates a fresh authentication epoch,
6. creates exactly one fresh owner-admin and no harness,
7. writes the raw owner token once to the owner-only secret file, and
8. leaves runtime startup blocked.

Verify with a separate process:

```bash
npm run operator --workspace @source-wire/alpha1-runtime -- \
  verify-recovery \
  --credential-file /absolute/private/path/restored-owner.secret \
  --expected-logical-state-sha256 <digest-from-an-independent-channel>
```

Only a successful verification changes the installation state to `ready`.

## Recover An Isolated Physical Backup

Source-Wire does not create or transport physical PostgreSQL backups. Restore your physical backup into a separate isolated database using owner-controlled infrastructure tooling, with API and MCP stopped.

Then run:

```bash
npm run operator --workspace @source-wire/alpha1-runtime -- \
  recover \
  --operation-key physical_recovery_001 \
  --secret-output /absolute/private/path/recovered-owner.secret
```

Verify it separately:

```bash
npm run operator --workspace @source-wire/alpha1-runtime -- \
  verify-recovery \
  --credential-file /absolute/private/path/recovered-owner.secret
```

Physical backups are not secret-free. They may contain governed content, credential verifiers, grants, receipt state, and encrypted replay material. Backup encryption, storage, access, retention, restore tooling, and deletion remain infrastructure responsibilities.

## Portable Initialization Versus Physical Recovery

| Operation | Input | Authentication posture |
| --- | --- | --- |
| Portable initialization | Canonical secret-free governed-state JSONL plus independently trusted digest | Imports no credentials or grants, creates one fresh owner-admin |
| Physical recovery | Owner-restored PostgreSQL database backup | Revokes all restored credentials, changes the authentication epoch, invalidates unconsumed receipts, creates one fresh owner-admin |

Neither operation is provider import, merge restore, source synchronization, or a production backup guarantee.

## Protected-Read Revocation Guarantee

Revocation is linearized at receipt consumption:

- If correction or revocation commits before receipt consumption, the protected response releases zero stale content.
- If receipt consumption commits first, durable state records `release_attempted`, then the already bound process performs one response write attempt.
- A later correction or revocation cannot retract bytes after that linearization point.

Source-Wire does not claim confirmed client delivery.

## Security Boundary

Story 4 does not protect against:

- PostgreSQL administrator access to governed data,
- anyone holding a decrypted export or physical backup,
- arbitrary code execution in the API process,
- operating-system root compromise,
- compromise of owner-controlled encryption keys.

Do not point this runtime, an operator command, or any Alpha 1 conformance runner at persistent, production, user, or client data.

## Still Outside Alpha 1

- external knowledge providers or provider import,
- source synchronization and live connectors,
- embeddings or pgvector,
- Mission Control or another UI,
- remote MCP or public listeners,
- deployment or managed hosting,
- production backup guarantees,
- merge restore or broad migration tooling,
- real user or client data,
- package publication, release, or tag mutation.
