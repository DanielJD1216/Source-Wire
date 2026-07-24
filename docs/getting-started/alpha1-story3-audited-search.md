# Alpha 1 Story 3 Audited Search

Latest source extends the unpublished Story 2 lifecycle with one protected read:

```text
AI harness
  -> stdio MCP search_trusted_memory
  -> loopback Source-Wire API policy
  -> owner and namespace filter
  -> active trusted-memory revisions only
  -> bounded PostgreSQL full-text rank
  -> durable audit plus protected-read receipt
  -> origin-process single-use receipt consumption
  -> bounded response release attempt
```

The final Alpha 1 MCP surface contains exactly:

- `propose_memory_candidate`
- `search_trusted_memory`

No owner review or decision operation is exposed through MCP. Candidate approval remains owner-controlled.

This workspace is not part of `@source-wire/contracts@0.1.0`. It remains unpublished, loopback-only, unhosted, undeployed, unsupported for real data, and not production ready.

## What Story 3 Proves

Story 3 searches only active, owner-approved trusted-memory revisions in one explicit granted namespace. It uses PostgreSQL full-text search with a fixed query and rank expression.

It does not use:

- embeddings,
- pgvector,
- an external model or retrieval provider,
- caller-defined filters, sorting, SQL, or pagination,
- direct MCP database access,
- remote MCP transport.

The search path preserves these rules:

1. A harness must hold `trusted_memory.search`.
2. Owner and namespace predicates apply before ranking.
3. Superseded, revoked, wrong-owner, and wrong-namespace rows are ineligible.
4. The query, result count, each content body, aggregate content, full response, database execution, and receipt lifetime are bounded.
5. Audit and receipt state commit before protected content can be released.
6. Only the originating API process can consume its receipt.
7. Receipt consumption is single use across processes.
8. Durable state may say `release_authorized` or `release_attempted`. It never claims that the client received the response.

## Requirements

- Node.js `22.23.1`
- npm
- local PostgreSQL `16`
- a PostgreSQL operator account allowed to create and remove disposable roles and a disposable database
- synthetic generated data only

Read [Alpha 1 Story 1 Local Runtime](alpha1-story1-local-runtime.md) and [Alpha 1 Story 2 Candidate Approval](alpha1-story2-candidate-approval.md) first.

## Build And Focused Tests

From the repository root:

```bash
npm install
npm run alpha1:build
npm run alpha1:test
```

The focused suite covers:

- strict duplicate-field and malformed UTF-8 rejection,
- query and result bounds,
- deterministic request and result digests,
- full receipt-field origin-process binding,
- exact two-tool MCP discovery,
- the complete three-migration schema chain.

## Disposable Conformance

Run Story 3 only against a local disposable PostgreSQL target:

```bash
npm run alpha1:conformance:story3
```

The runner:

1. creates only generated disposable roles, credentials, namespaces, database state, and synthetic memory,
2. applies migrations `0001`, `0002`, and `0003`,
3. uses the official MCP TypeScript SDK to discover exactly two tools,
4. proposes a candidate through MCP and approves it through the owner-only API,
5. searches trusted memory through MCP, API policy, and PostgreSQL,
6. proves useful stable ranking and valid empty results,
7. excludes superseded, revoked, wrong-owner, and wrong-namespace revisions,
8. rejects missing, owner-class, under-scoped, expired, revoked, rotated, malformed, oversized, repeated-field, filter, sort, cursor, and SQL-shaped requests,
9. proves canonical request and result digests across fresh processes,
10. proves foreign-process, restarted-process, replay, substitution, expiry, and compare-and-set race denial,
11. injects audit, receipt-consumption, query-timeout, and cancellation failures,
12. proves whole-row, aggregate-content, and complete-response bounds,
13. attempts direct table access, broad mutation, DDL, role assumption, and migration as the runtime role and observes denial,
14. executes every protected-read crash point in a real API process,
15. scans logs, MCP diagnostics, errors, audit metadata, metrics, and the owned temporary path for protected content, and
16. fails unless the generated database, roles, sessions, child processes, and temporary directory are absent after cleanup.

The redacted machine report is written to:

```text
apps/alpha1-runtime/.artifacts/story3-conformance-report.json
```

The report is ignored by Git. It contains proof metadata and the crash matrix, not credentials or protected memory content.

## MCP Search Input

The search tool accepts exactly:

```json
{
  "namespaceId": "ns_project_alpha",
  "query": "current project decision",
  "limit": 10
}
```

Rules:

- `namespaceId` is required and cannot be a wildcard.
- `query` is required, must contain non-whitespace text, and is limited to 1,024 UTF-8 bytes.
- `limit` is optional, defaults to 10, and must be an integer from 1 through 10.
- Unknown or repeated fields are rejected.

Successful results contain immutable memory and revision identifiers, the whole bounded content body, a six-decimal rank string, and bounded provenance:

```json
{
  "results": [
    {
      "memoryId": "00000000-0000-4000-8000-000000000001",
      "revisionId": "00000000-0000-4000-8000-000000000002",
      "content": "Synthetic owner-approved project decision.",
      "rank": "0.125000",
      "provenance": {
        "kind": "owner_assertion"
      }
    }
  ],
  "audit": {
    "eventId": "00000000-0000-4000-8000-000000000003",
    "releaseStatus": "release_attempted"
  },
  "traceId": "00000000-0000-4000-8000-000000000004"
}
```

The UUIDs above demonstrate response shape only.

## Audit Before Release

Each search creates:

- a deterministic request digest,
- a deterministic digest of the ordered bounded result set,
- a fresh request ID,
- a fresh 32-byte release binding,
- a receipt with at most a five-second lifetime,
- a durable audit event containing identifiers, digests, count, and `release_authorized`,
- an HMAC-SHA-256 origin-process verifier derived from an ephemeral 32-byte process secret.

The raw process secret is never persisted, returned, logged, or exported. A sibling or restarted API process has a different secret and cannot consume the receipt through the supported path.

The receipt compare-and-set binds:

- receipt format and ID,
- trace and request IDs,
- actor reference and credential,
- owner and namespace,
- operation and policy decision,
- release binding,
- request and result digests,
- covered result count,
- issue and expiry timestamps,
- origin-process verifier,
- unconsumed and unexpired state.

Only one exact consumer can change `release_authorized` to `release_attempted`.

## Crash Contract

The real-process matrix covers:

| Crash point | Durable receipt state | Protected content released |
| --- | --- | --- |
| Before query | None | No |
| After query | None | No |
| Before receipt and audit commit | None | No |
| After durable commit | `release_authorized` | No |
| Before receipt consumption | `release_authorized` | No |
| After receipt consumption | `release_attempted` | No |
| Before response serialization | `release_attempted` | No |
| During response serialization | `release_attempted` | No |

No durable field claims confirmed client delivery.

## Security Boundary

Origin-process proof protects the supported local API path against replay and a normal sibling process. It does not protect against:

- arbitrary code execution under the same host identity,
- process-memory inspection,
- PostgreSQL superuser compromise,
- operating-system root compromise.

The MCP SDK currently has two moderate advisories in an unused HTTP-server path. Story 3 uses local stdio only. Remote or hosted transport requires a new dependency and exposure review.

## Still Outside Story 3

- correction and supersession operations,
- trusted-memory revocation operations,
- source-evidence search and context assembly,
- embeddings, pgvector, and hybrid reranking,
- external knowledge-provider transport,
- live connectors or source ingestion,
- public listeners or remote MCP,
- non-disposable database use,
- hosting, deployment, or managed service behavior,
- real user or client data,
- package publication, release, or tag mutation.

Do not point this runtime or any Alpha 1 conformance runner at persistent or production data.
