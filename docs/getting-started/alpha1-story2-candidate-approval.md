# Alpha 1 Story 2 Candidate Approval

Latest source extends the unpublished Story 1 foundation with one real local memory lifecycle:

```text
AI harness
  -> stdio MCP server
  -> propose_memory_candidate
  -> loopback Source-Wire API
  -> pending candidate in disposable PostgreSQL
  -> owner review through API and CLI
  -> approve into one trusted-memory identity and revision 1, or reject
```

The Story 2 agent path can propose but cannot approve, reject, connect to PostgreSQL, or choose owner authority. Latest source adds a separately bounded search tool through [Alpha 1 Story 3 Audited Search](alpha1-story3-audited-search.md), then keeps correction, revocation, export, and recovery outside MCP through [Alpha 1 Story 4 Governed Lifecycle And Portability](alpha1-story4-governed-lifecycle-portability.md).

This workspace is not part of `@source-wire/contracts@0.1.0`. It remains unpublished, loopback-only, unhosted, undeployed, unsupported for real data, and not production ready. Story 3 search and Story 4 governed lifecycle and portability are implemented as separate local proofs. Correction, revocation, provider transport, export, restore, and UI behavior remain outside this Story 2 unit.

## Requirements

- Node.js `22.23.1`
- npm
- local PostgreSQL `16`
- a PostgreSQL operator account allowed to create and remove disposable roles and a disposable database
- synthetic generated data only

Read [Alpha 1 Story 1 Local Runtime](alpha1-story1-local-runtime.md) for the migration, initialization, credential, API, role, and cleanup foundation.

## Build And Focused Tests

From the repository root:

```bash
npm install
npm run alpha1:build
npm run alpha1:test
```

The focused suite covers strict candidate-list defaults and cursor validation, deterministic idempotency digests, bounded stdio input, schema compatibility, and real MCP tool discovery.

## Disposable Conformance

Run Story 2 only against a local disposable PostgreSQL target:

```bash
npm run alpha1:conformance:story2
```

The runner uses the official MCP TypeScript SDK and:

1. creates only generated disposable roles, credentials, namespaces, database state, and synthetic content,
2. applies the exact migrations `0001` and `0002`,
3. discovers the final Alpha 1 surface of exactly `propose_memory_candidate` and `search_trusted_memory`, while exercising only proposal in the Story 2 lifecycle,
4. proves owner-assertion and prior-memory proposal paths,
5. proves malformed, oversized, unsupported, inaccessible, and cross-boundary provenance is denied before mutation,
6. proves proposal and decision idempotency, including proposal replay after an API restart,
7. proves metadata-only review by default and explicit audited content access,
8. proves owner approval, rejection, one-winner concurrency, and audit-failure rollback,
9. proves runtime least privilege, dependency posture, safe logs, redaction, and schema refusal, and
10. fails unless generated database, roles, sessions, connections, and child processes are absent after cleanup.

The machine report is written to `apps/alpha1-runtime/.artifacts/story2-conformance-report.json`. It is ignored by Git and contains only redacted synthetic proof metadata.

## MCP Boundary

The MCP process receives only:

- `SOURCE_WIRE_API_URL`, which must be a literal loopback HTTP origin, and
- `SOURCE_WIRE_MCP_TOKEN`, which must be a scoped harness credential.

It refuses owner tokens, database URLs, non-loopback API addresses, unknown tool fields, invalid Unicode, and stdio frames over the configured bound. It imports no PostgreSQL module. Its stdout is reserved for MCP protocol traffic.

The Story 2 proposal tool accepts:

```json
{
  "namespaceId": "ns_project_alpha",
  "content": "Synthetic owner-reviewed project fact.",
  "provenance": {
    "kind": "owner_assertion",
    "assertion": "Synthetic assertion supplied for local proof."
  },
  "idempotencyKey": "proposal_example_1"
}
```

Supported provenance is exactly one of:

- `owner_assertion`, with a bounded assertion, or
- `prior_memory`, with an active memory ID and immutable active revision ID from the same owner and namespace.

Successful MCP output contains only the candidate ID, `pending` state, creation timestamp, request trace ID, and durable audit event ID.

## Owner Review And Decision

The owner CLI calls the loopback API and never connects to PostgreSQL. Set `SOURCE_WIRE_OWNER_TOKEN` only in the local process environment.

List pending metadata without candidate content:

```bash
npm run owner --workspace @source-wire/alpha1-runtime -- list-candidates \
  --namespace-id ns_project_alpha
```

Request content explicitly:

```bash
npm run owner --workspace @source-wire/alpha1-runtime -- list-candidates \
  --namespace-id ns_project_alpha \
  --include-content
```

Approve one pending candidate:

```bash
npm run owner --workspace @source-wire/alpha1-runtime -- approve-candidate \
  --namespace-id ns_project_alpha \
  --candidate-id 00000000-0000-4000-8000-000000000001 \
  --reason "Synthetic owner approval." \
  --idempotency-key decision_example_1
```

Use `reject-candidate` with the same required fields to reject. The UUID above demonstrates command shape only.

Approval atomically creates one trusted-memory identity and immutable active revision 1. Rejection creates no trusted memory. Both require an active owner-admin credential, explicit namespace, `memory_candidate.decide`, expected `pending` state, a reason, and a durable idempotency key.

## Durable Idempotency

Lifecycle idempotency is stored in PostgreSQL without the five-minute credential-secret replay limit:

- the same actor, operation, key, and canonical request return the original candidate or decision outcome and audit event,
- replay creates no duplicate state or success audit,
- proposal replay remains valid after the API process restarts, and
- changing any canonical field under the same key returns `idempotency_conflict`.

Trace IDs remain request-specific and are not part of the canonical digest.

## Still Outside Story 2

- trusted-memory search is outside Story 2 and is documented separately as Story 3,
- context assembly,
- correction, supersession, or revocation operations,
- external knowledge-provider transport,
- live connectors or source ingestion,
- non-disposable database use,
- public listeners, hosting, deployment, or managed service behavior,
- real user or client data,
- package publication, release, or tag mutation.

Do not point this runtime or either conformance runner at persistent or production data.
