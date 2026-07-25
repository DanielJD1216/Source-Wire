# Alpha 1 Story 5 Knowledge Provider Runtime Host

Latest source and published local-runtime `0.1.0-alpha.2` include one
injected, immutable `KnowledgeProvider v1` binding.

```text
stdio MCP
  -> loopback API policy
  -> immutable provider binding
  -> synthetic read-only provider
  -> durable metadata-only audit
  -> single-use release receipt
  -> bounded source evidence response
```

The provider is synthetic and deterministic. Story 5 does not connect
Source-Wire to a live knowledge base, register arbitrary providers, accept
provider credentials from callers, or promote evidence into memory.

This remains a loopback-only developer Alpha. It uses generated synthetic data
and disposable PostgreSQL 16 databases for conformance. It is distributed
separately from the contracts package, is not hosted, and is not approved for
production or real data.

## What Story 5 Proves

- One provider can be injected at runtime startup through an immutable
  owner-and-namespace binding.
- MCP exposes exactly four tools:
  - `propose_memory_candidate`
  - `search_trusted_memory`
  - `search_source_evidence`
  - `get_source_evidence`
- Source-evidence tools route through the loopback API. The MCP process receives
  no provider endpoint, provider credential, database connection, or direct
  provider authority.
- Search and exact fetch validate capability, namespace, provider scope, ACL,
  provenance, digest, safe locator, freshness, sensitivity, result count,
  excerpt size, response size, and deadline before release.
- Successful reads commit a metadata-only audit and consume one
  origin-process-bound receipt before the response write attempt.
- Provider scope mismatch, denied ACL, missing provenance, excessive results,
  deadline expiry, outage, audit failure, receipt replay, and crash stages fail
  closed without releasing evidence.
- Provider reads create zero candidates, trusted memories, or trusted-memory
  revisions.
- Runtime and migrator database roles remain non-superuser and narrowly
  privileged.
- The runner removes every generated process, session, role, database, and
  temporary directory.

## Requirements

- Node.js `22.23.1`
- npm
- local PostgreSQL `16`
- a PostgreSQL operator account allowed to create and remove generated
  disposable roles and databases
- generated synthetic data only

Read the earlier stories first:

1. [Story 1 Local Runtime](alpha1-story1-local-runtime.md)
2. [Story 2 Candidate Approval](alpha1-story2-candidate-approval.md)
3. [Story 3 Audited Search](alpha1-story3-audited-search.md)
4. [Story 4 Governed Lifecycle And Portability](alpha1-story4-governed-lifecycle-portability.md)

## Fastest Complete Proof

From the repository root:

```bash
npm install
npm run alpha1:test
npm run alpha1:story5:security-gate
npm run alpha1:conformance:story5
npm run alpha1:conformance:story5:replaceable
```

To run the complete Alpha 1 chain:

```bash
npm run alpha1:conformance
```

GitHub Actions runs the same chain in a separate
`Source-Wire Alpha PostgreSQL conformance` job with exact Node.js `22.23.1`
and an ephemeral PostgreSQL `16` service. The full chain runs Story 5 once
with the original adapter and once with the separate replaceable adapter.
Validate the workflow contract
locally with:

```bash
npm run alpha1:ci-workflow-smoke
```

That smoke checks the job definition. It does not replace the hosted
PostgreSQL run.

The redacted machine report is written to:

```text
apps/alpha1-runtime/.artifacts/story5-conformance-report.json
```

The report is ignored by Git. It records environment, case, crash, and cleanup
proof without provider evidence bodies, credentials, or database locators.

## Security And Advisory Boundary

The known moderate MCP dependency advisory is temporarily accepted only for
this local, stdio-only synthetic Alpha runtime. Review it again no later than
2026-08-24, or immediately if the dependency, transport, platform, or runtime
scope changes.

Read the
[MCP Dependency Advisory Disposition](../internal/alpha1-story5-mcp-advisory-disposition.md)
for the affected surface, rejected remediations, executable gate, and owner
acceptance.

Production, hosting, Windows runtime, HTTP or SSE MCP, static serving,
deployment, and real-data use remain blocked.

## Still Outside Story 5

- a dynamic provider registry or hot reload,
- a live knowledge-base adapter,
- provider configuration through MCP or API callers,
- provider write, import, or synchronization behavior,
- automatic candidate or trusted-memory creation from provider results,
- remote MCP or public listeners,
- non-disposable or production databases,
- production authentication or secret custody,
- deployment or managed hosting,
- a published package containing `KnowledgeProvider v1`.
