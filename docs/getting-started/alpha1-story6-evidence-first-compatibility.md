# Alpha 1 Story 6.7 Evidence-First Compatibility

Latest source proves that a separately implemented evidence-first adapter can
cross the Source-Wire local provider boundary without either repository
importing the other's private runtime authority.

This is synthetic, disposable, cross-repository Alpha proof. It is not a live
knowledge connector, a production integration, or permission to use real data.

## Prerequisites

Start with the repository [Quickstart](quickstart.md). The complete
cross-repository conformance path requires exact Node.js `22.23.1`, PostgreSQL
`16`, the pinned synthetic adapter package, and authority to create and remove
generated disposable database state.

## Repositories And Stable Contract

The proof uses:

- Source-Wire public contracts: `@source-wire/contracts@0.2.0`
- Adapter repository:
  [`DanielJD1216/evidence-first-knowledge-base`](https://github.com/DanielJD1216/evidence-first-knowledge-base)
- Pinned adapter revision:
  `a01cd307582cecbed54c4ca8e7873d7f9df1ecb8`
- Private synthetic adapter package:
  `@doomade/evidence-first-source-wire-adapter@0.1.0-alpha.1`

The adapter depends exactly on the published `0.2.0` contracts package. It does
not depend on a moving Source-Wire Git revision.

Source-Wire CI checks out the adapter at the exact revision, builds and tests
it, packs it locally, and installs that private tarball without adding it to
Source-Wire package metadata.

## Authority Boundary

The adapter receives:

- one provider-owned runtime principal,
- one provider-owned knowledge scope,
- a bounded query or exact source and segment key,
- a bounded deadline.

It does not receive Source-Wire owner credentials, actor context, audit-store
access, process release secrets, receipt authority, database authority, or
memory mutation authority.

Source-Wire receives only the public `KnowledgeProvider v1` profile and result
envelopes. It does not receive a knowledge-base database credential, endpoint,
SQL query, entitlement implementation, ranking implementation, or write
surface.

## Verified Path

The same `source-wire-local` provider configuration and stdio MCP composition
used by repository synthetic providers loads the external package export. No
provider-specific branch was added to the local CLI, API policy, provider host,
audit path, receipt path, MCP server, or official MCP client.

The complete successful tracer crosses:

```text
source-wire-local
  -> immutable provider binding
  -> loopback API policy
  -> protected provider host
  -> metadata-only durable audit
  -> single-use origin-process receipt
  -> stdio MCP
  -> official MCP client
```

Search returns provider-ordered, bounded synthetic evidence with complete
provenance. Exact fetch returns only the requested synthetic source and
segment.

## Fail-Closed Cases

The adapter's public tests cover:

- inactive evidence,
- deleted evidence,
- denied evidence,
- incomplete provenance,
- oversized evidence,
- late evidence,
- cross-scope evidence.

Each case releases zero evidence. The Source-Wire host's existing Story 5 fault
matrix independently proves that denied, malformed, late, oversized,
cross-scope, audit, receipt, crash, and outage paths release zero protected
content.

## Verification

The adapter repository validates its own public package:

```bash
npm test
npm run pack:inspect
python3 scripts/validate_repo.py
```

Source-Wire verifies the installed private tarball and complete disposable
PostgreSQL path:

```bash
npm run alpha1:evidence-first-package-smoke
npm run alpha1:conformance:evidence-first
```

The conformance report passes 29 cases. Story-specific cases are:

- `S6-EVIDENCE-FIRST-01`, ordered synthetic search and exact fetch cross the
  unchanged local CLI and protected release path while the adapter package
  remains byte-stable,
- `S6-EVIDENCE-FIRST-02`, memory state and adapter package bytes remain
  unchanged, with no credential, endpoint, SQL, entitlement, or ranking
  implementation exposed.

Hosted Source-Wire CI repeats the proof with exact Node.js `22.23.1`,
exact PostgreSQL `18.4`, the pinned adapter revision, and generated disposable state.

## Cost And Custody

The proof requires no Source-Wire account, API key, endpoint, telemetry, or
billing. Adopters bring and pay for their own knowledge system, PostgreSQL,
credentials, compute, storage, and agent harness.

Neither repository writes to the knowledge base during this proof. Evidence is
never promoted automatically into trusted memory.

## Still Blocked

- a live evidence-first connector,
- private or real evidence,
- production authentication and secret custody,
- non-disposable databases,
- hosted API or MCP,
- HTTP or SSE MCP,
- deployment,
- production runtime use,
- publication of the private Alpha runtime or adapter package.

The next dependency-ordered unit is
[#285 Story 6.8: Prepare a no-publish local-runtime package candidate](https://github.com/DanielJD1216/Source-Wire/issues/285).
