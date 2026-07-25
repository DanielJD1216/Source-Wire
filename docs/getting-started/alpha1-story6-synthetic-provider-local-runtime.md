# Alpha 1 Story 6.3 Synthetic Provider Local Runtime

Latest source can compose one owner-selected synthetic `KnowledgeProvider v1`
through the private `source-wire-local` command:

```text
owner-controlled config
  -> offline provider metadata check
  -> explicit connected readiness check
  -> immutable provider composition at process startup
  -> loopback API policy
  -> durable read audit and single-use release receipt
  -> exactly four stdio MCP tools
```

This is unpublished local Alpha proof using generated disposable PostgreSQL
state and repository-owned synthetic providers. It is not a live connector,
provider registry, hosted service, production runtime, or real-data path.

## Prerequisites

Start with the repository [Quickstart](quickstart.md), then complete:

1. [Story 6.1 Local CLI Init And Offline Doctor](alpha1-story6-local-cli-init-doctor.md)
2. [Story 6.2 Memory-Only Local Runtime](alpha1-story6-memory-only-local-runtime.md)

Use exact Node.js `22.23.1` and PostgreSQL `16` for disposable Alpha
conformance.

## Configure One Synthetic Provider

The generated owner-controlled configuration may contain zero or one
`knowledgeProvider` object. For the repository synthetic provider, add:

```json
{
  "knowledgeProvider": {
    "module": "@source-wire/alpha1-runtime/synthetic-provider",
    "exportName": "createSyntheticKnowledgeProvider",
    "providerScopeId": "synthetic_owner_sources",
    "timeoutMs": 1000
  }
}
```

The surrounding local configuration must contain exactly one namespace for
this Alpha slice. Keep the file owner-only with mode `0600`.

Provider credentials and retrieval clients are not Source-Wire configuration
fields. A future adopter provider must own those values out of band. Do not put
credentials, endpoints, or real evidence in the local config, MCP input,
diagnostics, documentation, fixtures, or commits.

Changing the provider requires an owner-controlled configuration change and a
full process restart. There is no registry, discovery service, or hot reload.

## Check Before Startup

Offline checking validates the non-secret configuration only. It does not
import or execute the provider package:

```bash
npm run local --workspace @source-wire/alpha1-runtime -- \
  provider check \
  --config /owner-controlled/source-wire.local.json \
  --json
```

Expected result fields include:

```json
{
  "contractVersion": "knowledge-provider.v1",
  "executableLoaded": false,
  "profileValidation": "deferred",
  "readiness": "skipped",
  "evidenceReleased": false
}
```

Connected checking is explicit. It imports the owner-selected export, validates
the exact profile and immutable binding, and invokes only the bounded `health`
operation:

```bash
npm run local --workspace @source-wire/alpha1-runtime -- \
  provider check \
  --config /owner-controlled/source-wire.local.json \
  --connect \
  --json
```

It releases no evidence, creates no candidate, and creates no trusted memory.

## Start The Four-Tool Stdio Surface

Provide the same generated disposable authority required by Story 6.2, then
start:

```bash
npm run local --workspace @source-wire/alpha1-runtime -- \
  mcp stdio \
  --config /owner-controlled/source-wire.local.json
```

The official MCP client discovers exactly:

- `propose_memory_candidate`
- `search_trusted_memory`
- `search_source_evidence`
- `get_source_evidence`

The MCP child receives no owner token, database URL, provider module, provider
export, provider scope, provider credential, endpoint, retrieval client, or
direct database authority. It can supply only caller-safe query and evidence
key input. Provider identity, owner, namespace, ACL, capability, scope, bounds,
and timeout remain fixed by startup composition and Source-Wire policy.

Source-evidence search and exact fetch pass through the loopback API, immutable
provider host, durable metadata-only audit, origin-process receipt, and
single-use response release. Evidence reads create zero candidates and zero
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

The same local CLI composition with the separate public-contract-only
replaceable adapter:

```bash
npm run alpha1:conformance:story5:replaceable
```

The Story 5 conformance report includes:

- `S6-PROVIDER-01`, offline checking imports nothing and connected checking
  validates readiness without evidence release,
- `S6-PROVIDER-02`, exactly four tools route search and exact fetch through
  policy, audit, and release receipts,
- `S6-PROVIDER-03`, evidence reads create no governed memory, sensitive
  provider details stay out of diagnostics and audit metadata, and shutdown
  revokes the process credential.

## Still Blocked

- external or live knowledge providers,
- provider registry, discovery, or hot reload,
- provider credential or endpoint handling by Source-Wire,
- non-disposable or production database use,
- hosted API or hosted MCP,
- HTTP or SSE MCP,
- deployment,
- real user or client data,
- production authentication, secret custody, and support,
- publication of the Alpha runtime.

The next dependency-ordered unit is
[#281 Story 6.4: Fail closed across local orchestration and cleanup](https://github.com/DanielJD1216/Source-Wire/issues/281).
