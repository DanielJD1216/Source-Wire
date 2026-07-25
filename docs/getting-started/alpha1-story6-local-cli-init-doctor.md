# Alpha 1 Story 6.1 Local CLI Init And Offline Doctor

Latest source and published local-runtime `0.1.0-alpha.2` include the first
Story 6 local CLI slice:

```text
empty owner-controlled directory
  -> source-wire-local init
  -> owner-only non-secret configuration
  -> source-wire-local doctor
  -> deterministic offline compatibility result
```

This slice does not start Source-Wire, load a provider, connect PostgreSQL,
contact a service, apply a migration, create an account, request an API key,
send telemetry, or provision paid infrastructure.

Published `@source-wire/local-runtime@0.1.0-alpha.1` is deprecated and must not
be used. The corrected `0.1.0-alpha.2` is published under the npm `alpha` tag.
The local runtime is not part of `@source-wire/contracts@0.2.0` and is not
approved for production or real data.

## What This Slice Proves

- `source-wire-local` is a separate experimental binary. The public
  `source-wire validate` command remains unchanged.
- `init` writes one versioned `source-wire.local.v1` configuration with mode
  `0600`.
- The configuration contains environment-variable names, not database URLs,
  verifier material, provider credentials, owner tokens, harness tokens, or
  API keys.
- Existing files are never overwritten.
- Configuration permits zero or one owner-selected provider declaration.
- API binding is loopback only and MCP transport is exactly stdio.
- `doctor` validates the file, permissions, package version, provider and
  memory contract versions, identifiers, environment references, and local
  transport restrictions.
- Offline diagnostics do not resolve or import provider code, inspect
  environment values, connect PostgreSQL, or make network requests.
- Human and JSON output share the same operation and error vocabulary and
  disclose no private path or dependency endpoint.

## Requirements

- Node.js `22.23.1`
- npm
- a private owner-controlled directory

PostgreSQL and a knowledge provider are not required for this slice.

## Build

From the repository root:

```bash
npm install
npm run alpha1:build
```

## Initialize

Choose a configuration destination outside the public repository or inside the
ignored `.source-wire-local/` directory. Do not commit owner identifiers or
local provider selections.

```bash
npm run local --workspace @source-wire/local-runtime -- \
  init \
  --config /absolute/owner-controlled/source-wire.local.json \
  --owner-id owner_local \
  --namespace-id namespace_local
```

The owner and namespace options are optional. The private Alpha defaults are
`owner_local` and `namespace_local`.

Successful human output is:

```text
ok local.init
schema source-wire.local.v1
next source-wire-local doctor --config <path>
```

The output deliberately uses `<path>` instead of echoing the private
destination.

## Run Offline Doctor

```bash
npm run local --workspace @source-wire/local-runtime -- \
  doctor \
  --config /absolute/owner-controlled/source-wire.local.json
```

For machine-readable output:

```bash
npm run local --workspace @source-wire/local-runtime -- \
  doctor \
  --config /absolute/owner-controlled/source-wire.local.json \
  --json
```

The result reports only the stable schema, contract versions, provider
presence, loopback posture, stdio posture, and that external checks were
skipped. It never prints environment values, endpoints, credentials, queries,
evidence, or the configuration path.

## Configuration Boundary

The current private Alpha template contains:

- exact `@source-wire/contracts`, `KnowledgeProvider v1`, and `MemoryStore v1`
  compatibility versions,
- one owner identifier,
- one to 64 explicit unique namespaces,
- PostgreSQL runtime, migrator, and verifier environment-variable references,
- zero or one bare provider package declaration,
- exactly one stdio MCP transport,
- one literal loopback API host and a local port or `auto`.

Validation rejects:

- unknown fields,
- raw database URLs or API keys,
- provider registries or multiple providers,
- hot reload,
- relative, absolute, URL, or `file:` provider module paths,
- arbitrary shell hooks,
- HTTP or SSE MCP,
- non-loopback API binding,
- malformed or incompatible contract versions,
- symlink, hard-linked, group-writable, or world-writable config files.

Provider modules are executable owner-selected code. This slice records only a
bare package name and export name. It does not install, resolve, or execute
that code.

## Focused Verification

```bash
npm run alpha1:test
```

The focused suite proves:

- owner-only creation and no overwrite,
- memory-only and one-provider offline validation,
- no PostgreSQL or provider dependency during `doctor`,
- remote transport, registry, hot-reload, hook, and raw-secret rejection,
- safe permission and symlink rejection,
- exact compatibility failure,
- stable human and JSON vocabulary,
- compiled private-binary behavior,
- preservation of the public contracts CLI.

## Still Outside Story 6.1

- provider-backed runtime startup,
- database migration,
- provider loading or connected health checks,
- provider-backed MCP process orchestration,
- owner export,
- a live evidence-first adapter,
- a published local-runtime package,
- Source-Wire accounts, API keys, telemetry, billing, or hosted services,
- non-disposable databases,
- production, deployment, live providers, and real data.

Story 6.2 now owns the implemented memory-only startup path. Continue with
[Alpha 1 Story 6.2 Memory-Only Local Runtime](alpha1-story6-memory-only-local-runtime.md).
