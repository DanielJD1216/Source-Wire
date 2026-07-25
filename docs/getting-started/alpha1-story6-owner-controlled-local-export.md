# Alpha 1 Story 6.6 Owner-Controlled Local Export

Latest source exposes the existing canonical portable memory export through the
private `source-wire-local` CLI.

This is unpublished Alpha proof with generated disposable PostgreSQL 16 state.
It does not upload data, add an MCP administration tool, support production
backup, authorize real data, or change any hosting and deployment block.

## Prerequisites

Start with the repository [Quickstart](quickstart.md), then complete:

1. [Story 6.1 Local CLI Init And Offline Doctor](alpha1-story6-local-cli-init-doctor.md)
2. [Story 6.2 Memory-Only Local Runtime](alpha1-story6-memory-only-local-runtime.md)
3. [Story 6.3 Synthetic Provider Local Runtime](alpha1-story6-synthetic-provider-local-runtime.md)
4. [Story 6.4 Fail-Closed Orchestration And Cleanup](alpha1-story6-fail-closed-orchestration.md)
5. [Story 6.5 Explicit Database Control Plane](alpha1-story6-database-control-plane.md)

Use exact Node.js `22.23.1` and PostgreSQL `16` for disposable Alpha
conformance.

## Authority And Environment

The export command requires:

```bash
export SOURCE_WIRE_DATABASE_URL='<generated disposable runtime URL>'
export SOURCE_WIRE_TOKEN_VERIFIER_KEY='<generated verifier key>'
export SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID='local_alpha1'
export SOURCE_WIRE_OWNER_TOKEN='<active owner-admin token>'
```

The database and verifier environment names come from the owner-controlled
local config. The owner token is runtime input and is never stored in that
config.

The command rejects harness, runtime-shaped, migrator-shaped, provider-shaped,
expired, revoked, foreign-owner, and insufficient-namespace authority. MCP
continues to expose only proposal and protected-read tools. It has no export,
recovery, correction, revocation, or owner-administration tool.

## Export

Choose every namespace explicitly and provide an absolute local destination:

```bash
npm run local --workspace @source-wire/local-runtime -- \
  export \
  --config /owner-controlled/source-wire.local.json \
  --namespace-id namespace_alpha \
  --namespace-id namespace_beta \
  --destination /owner-controlled/source-wire-export.ndjson
```

For a stable machine-readable result:

```bash
npm run local --workspace @source-wire/local-runtime -- \
  export \
  --config /owner-controlled/source-wire.local.json \
  --namespace-id namespace_alpha \
  --destination /owner-controlled/source-wire-export.ndjson \
  --json
```

The result reports only format, integrity, bounded record and byte counts,
namespace count, overwrite policy, and `uploaded: false`. It omits the
destination, database locator, credentials, verifier material, process release
secrets, and provider details.

The file uses the same bounded canonical portable format proven by Story 4.
Its governed records are deterministically ordered. Snapshot metadata can
change between exports, while the logical state digest remains stable for
equivalent governed state.

## Existing Files

The default policy rejects an existing destination and preserves its bytes:

```text
export_destination_exists
```

Replace an existing regular owner-controlled file only after explicitly
accepting that policy:

```bash
npm run local --workspace @source-wire/local-runtime -- \
  export \
  --config /owner-controlled/source-wire.local.json \
  --namespace-id namespace_alpha \
  --destination /owner-controlled/source-wire-export.ndjson \
  --overwrite
```

The writer uses a private temporary file, owner-only permissions, an atomic
finalization boundary, and parent-directory synchronization. Unsafe parent
directories, symbolic links, and hard-linked destinations fail closed.

## Data Custody

The export is a sensitive local plaintext file. Source-Wire does not upload,
email, synchronize, host, retain, or bill for it. The owner controls its path,
storage encryption, retention, transfer, and deletion.

The command does not load or call a knowledge provider. It exports governed
Source-Wire memory state only.

## Verification

Focused tests:

```bash
npm run alpha1:test
```

Generated disposable PostgreSQL proof:

```bash
npm run alpha1:conformance:story4
```

Story 4 now passes 25 cases. The Story 6.6 cases are:

- `S6-EXPORT-01`, exact owner authority exports the canonical bounded bundle
  for an explicit namespace set without upload or sensitive result fields,
- `S6-EXPORT-02`, harness, runtime-shaped, migrator-shaped, and provider-shaped
  credentials cannot export,
- `S6-EXPORT-03`, existing files are preserved by default and replaced only
  after explicit `--overwrite`,
- `S6-EXPORT-04`, an injected interruption leaves no destination or temporary
  artifact.

The existing MCP discovery test also proves that the four-tool provider profile
contains no administration or export tool. Conformance cleanup removes every
generated database, role, credential, config, export, and temporary artifact.

## Still Blocked

- production backup or disaster recovery,
- automatic or scheduled export,
- remote destinations or uploads,
- non-disposable or production databases,
- external or live knowledge providers,
- hosted API or hosted MCP,
- HTTP or SSE MCP,
- deployment,
- real user or client data,
- publication of the Alpha runtime.

The next dependency-ordered unit is
[#284 Story 6.7: Prove evidence-first compatibility end to end](https://github.com/DanielJD1216/Source-Wire/issues/284).
