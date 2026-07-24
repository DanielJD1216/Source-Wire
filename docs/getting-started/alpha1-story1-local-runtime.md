# Alpha 1 Story 1 Local Runtime

Source-Wire latest source includes an unpublished local developer alpha. This page covers the Story 1 foundation:

```text
operator migration and fresh initialization
  -> one explicit owner
  -> two or more explicit namespaces
  -> one owner-admin credential
  -> owner-issued harness credential
  -> loopback API policy
  -> content-free authenticated health
  -> adopter-controlled PostgreSQL 16
```

This is not part of `@source-wire/contracts@0.1.0`. It is not hosted, deployed, production ready, or approved for real data. Story 1 does not implement memory behavior by itself. Latest source extends this foundation with the bounded Story 2 candidate and owner-approval path described in [Alpha 1 Story 2 Candidate Approval](alpha1-story2-candidate-approval.md), the protected Story 3 read described in [Alpha 1 Story 3 Audited Search](alpha1-story3-audited-search.md), and the owner-controlled Story 4 lifecycle and portability path described in [Alpha 1 Story 4 Governed Lifecycle And Portability](alpha1-story4-governed-lifecycle-portability.md). External knowledge providers and a UI remain unimplemented.

## Requirements

- Node.js `22.23.1`
- npm
- local PostgreSQL `16`
- a PostgreSQL operator account allowed to create and remove a disposable test database and roles
- synthetic disposable data only

The runtime pins:

- `hono@4.12.31`
- `@hono/node-server@2.0.11`
- `pg@8.22.0`
- `drizzle-orm@0.45.2`
- `@modelcontextprotocol/sdk@1.29.0`
- `zod@4.4.3`

## Build

From the repository root:

```bash
npm install
npm run alpha1:build
npm run alpha1:test
```

The root `@source-wire/contracts` package and its exports remain separate. The runtime is an unpublished npm workspace with `"private": true`; it remains excluded from the contracts package.

## Disposable conformance

Run the proof only on a local PostgreSQL cluster where the current PostgreSQL user can create disposable roles and databases:

```bash
npm run alpha1:conformance:story1
```

The runner:

1. refuses to run if the three fixed conformance role names already exist,
2. creates one generated disposable database and three generated test roles,
3. applies the exact forward-only Alpha 1 migration chain separately from runtime startup,
4. initializes one synthetic owner and two synthetic namespaces,
5. starts fresh operator CLI, owner CLI, and loopback API processes,
6. exercises valid and denied credential paths,
7. proves schema incompatibility and non-loopback binding refuse startup,
8. scans database rows, logs, errors, and every output outside initial issuance and authorized exact replay responses for secret leakage,
9. emits a redacted machine report, and
10. removes only the database and roles it created.

The report is written to `apps/alpha1-runtime/.artifacts/story1-conformance-report.json` and is intentionally excluded from Git.

## Runtime boundary

The API accepts only literal `127.0.0.1` or `::1` binding. Protected request limits use the literal address reported by the Node socket and do not trust proxy headers. Runtime startup never applies a migration. Public liveness returns only:

```json
{"status":"live"}
```

Authenticated health requires:

- a bearer credential in the `Authorization` header,
- one explicit namespace granted by the server,
- the `runtime.health` capability,
- a compatible schema.

Owner-only credential routes require an owner-admin credential plus `credential.manage`. Harness credentials cannot gain owner authority by presenting a capability string.

Story 1 routes define no protected query parameters. Story 2 adds only the bounded candidate-list query described in its guide. Story 3 search uses a strict JSON body and still accepts no URL query parameters. Other non-empty query strings on `/v1alpha1/*` are rejected before authentication or operation execution. The protected-request concurrency gate wraps streaming body consumption, then JSON request bodies are limited to 16 KiB before route code buffers or parses them. Held partial protected bodies therefore consume active request slots and cannot bypass the loopback request gate.

The Node server applies an explicit five-second request and header deadline, checked every 250 milliseconds. A client cannot retain a protected slot indefinitely with a small stalled body. Deadline expiry returns a content-free HTTP `408`, closes the stalled request, releases the slot, and leaves liveness and authenticated health available for subsequent requests. The conformance suite also rejects any API process output that is not a six-field structured safe-log record, so timeout handling cannot silently introduce free-form stack traces or request content.

### Credential mutation retries

Harness issue, credential rotation, and credential revocation require an idempotency key. One actor, operation, and key identify one canonical request:

- an exact retry within five minutes returns the same logical outcome without a second mutation or success audit,
- one-time issue and rotation secrets are replayed only for that exact retry,
- replay secrets are stored only as AES-256-GCM ciphertext under a domain-separated HKDF-SHA-256 key derived from the external verifier key,
- a changed target or body with the same actor, operation, and key returns `409 idempotency_conflict`,
- an exact retry after five minutes returns a safe conflict and never mutates, and
- a just-rotated owner token may retrieve only its exact self-rotation result during that window. It remains invalid for health, changed requests, new keys, and new operations.

Persisted credential expiry is enforced for both active and rotated credentials. An expired rotated token cannot use the narrow self-rotation replay exception.

This retry policy does not provide credential recovery or general secret retrieval.

An active owner-admin cannot revoke its own credential. It must use zero-overlap rotation so the replacement owner-admin credential is issued in the same transaction that invalidates the old credential.

## Operator and owner commands

The operator CLI uses `SOURCE_WIRE_MIGRATOR_DATABASE_URL`. The owner CLI calls the loopback API and never connects directly to PostgreSQL.

```bash
npm run operator --workspace @source-wire/alpha1-runtime -- migrate
npm run operator --workspace @source-wire/alpha1-runtime -- migration-status
npm run operator --workspace @source-wire/alpha1-runtime -- initialize \
  --owner-id owner_alpha \
  --namespace-id ns_project_alpha \
  --namespace-id ns_project_beta
```

Initialization also requires `SOURCE_WIRE_TOKEN_VERIFIER_KEY` and may use `SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID`. The verifier key must be external to PostgreSQL, decode to at least 32 random bytes, and pass the obvious weak-key check. The owner-admin secret is displayed exactly once.

The owner CLI reads bearer credentials from `SOURCE_WIRE_OWNER_TOKEN` or `SOURCE_WIRE_TOKEN`. It does not accept bearer tokens in URLs.

```bash
npm run owner --workspace @source-wire/alpha1-runtime -- health \
  --namespace-id ns_project_alpha

npm run owner --workspace @source-wire/alpha1-runtime -- issue-harness \
  --namespace-id ns_project_alpha \
  --capability runtime.health \
  --expires-at 2030-01-01T00:00:00.000Z
```

The future date above demonstrates command shape only. Real local use must choose a valid expiry within the enforced developer-alpha maximum.

`rotate-harness`, `rotate-credential`, and `revoke-credential` require an explicit credential identifier. Rotation has zero overlap: the old credential stops working in the same transaction that creates the one-time replacement secret. Owner-admin self-revocation returns a safe state conflict; rotate the active owner-admin instead.

The conformance secret scan permits a one-time secret only in its initial issuance response and the explicitly authorized exact idempotent replay response. It still scans database rows, API logs, errors, and every other captured output for issued secrets, verifier keys, and database locators.

## PostgreSQL role posture

The adopter provisions three separate roles:

| Role | Required posture |
| --- | --- |
| `source_wire_schema_owner` | Non-login owner of only the `source_wire_memory` schema. |
| `source_wire_migrator` | Login operator role allowed to assume the schema owner only for explicit migration and initialization. |
| `source_wire_runtime` | `NOINHERIT`, no database or role creation, no schema ownership, and only the exact Alpha 1 table privileges. |

The runtime role cannot apply migrations, assume the schema owner, create roles or databases, truncate governed tables, or update or delete audit or idempotency history.

## Rollback and cleanup

The Alpha 1 migration chain has no down migration. For this developer alpha, rollback means:

1. stop the loopback API,
2. revoke generated test credentials,
3. remove only the disposable database and roles created for the proof.

Do not point the conformance runner at a production database or real user data.
