# Alpha 1 Story 6 Local CLI Integration Design

Status: Owner-accepted design. Risk-ordered implementation issues #278 through
#285 are published. Issue #278 is implemented in latest source; later slices
remain dependency-gated.

Date: 2026-07-24

## Decision Summary

Source-Wire should add a local, adopter-operated CLI as the common entrypoint
for configuring and running a future supported local runtime. The CLI should
orchestrate Source-Wire's local runtime and stdio MCP boundary; it should not
replace MCP as the agent tool protocol.

The recommended package boundary is:

```text
@source-wire/contracts
  -> public contracts, schemas, validation, and `source-wire validate`

future local runtime package
  -> supported provider-host composition
  -> local PostgreSQL memory runtime
  -> loopback API policy
  -> stdio MCP
  -> `source-wire-local` CLI

adopter-owned provider package
  -> implements SourceWireKnowledgeProviderV1
  -> owns its own credentials and retrieval dependency
```

The future local-runtime CLI must not require a Source-Wire account, a
Source-Wire API key, a Source-Wire-operated service, telemetry, or maintainer
funding. Each adopter supplies and pays for any PostgreSQL service, knowledge
base, model, storage, compute, or third-party API they choose to connect.

The first implementation target should remain private inside the Alpha
workspace. Publishing a runtime or CLI package is a separate release decision.

## Current Truth

The relevant current surfaces are:

| Surface | Current state |
| --- | --- |
| `@source-wire/contracts@0.2.0` | Published; includes `KnowledgeProvider v1` |
| Public `source-wire` binary | Supports schema validation only |
| Alpha runtime | Unpublished, loopback-only, disposable PostgreSQL proof |
| Alpha operator CLI | Private migration, initialization, and recovery commands |
| Alpha owner CLI | Private owner decisions, credentials, export, correction, and revocation commands |
| Story 5 provider host | Consumes the public provider contract through zero or one immutable composition |
| Story 5 provider selection | Synthetic adapters only, enabled only in Story 5 conformance mode |
| MCP surface | Four stdio tools; provider configuration and owner actions remain outside MCP |
| Evidence-first knowledge base | Public design repository; adapter Story 1 is designed but implementation has not started |
| Supported public runtime-host package | Not available |
| Live provider or production database support | Not approved |

Executable evidence:

- `src/cli.ts` owns the current validation-only public binary.
- `apps/alpha1-runtime/src/cli/operator.ts` and
  `apps/alpha1-runtime/src/cli/owner.ts` contain private Alpha control-plane
  commands.
- `apps/alpha1-runtime/src/runtime-composition.ts` defines the current
  immutable zero-or-one-provider seam.
- `apps/alpha1-runtime/src/server.ts` allows only synthetic Story 5 provider
  composition under conformance guards.
- `apps/alpha1-runtime/src/mcp/server.ts` exposes the four policy-routed stdio
  tools.
- The evidence-first knowledge-base repository records its proposed adapter in
  `docs/SOURCE_WIRE_ADAPTER_STORY_1.md`.

## Design Target

The module in scope is the future local-runtime CLI and its configuration seam.

Its callers are:

- a human adopter setting up and operating their own local Source-Wire
  installation,
- an AI coding agent configuring Source-Wire as a local stdio MCP server,
- an owner performing explicit administrative actions,
- test harnesses proving the same observable CLI behavior.

The pressure motivating this module is repeated setup knowledge. Today, a
caller must understand package boundaries, environment variables, migration
ordering, local API startup, MCP startup, provider composition, credential
classes, loopback restrictions, and redacted diagnostics. A supported CLI
should concentrate those decisions without broadening authority.

This design does not own the provider's retrieval implementation, PostgreSQL
provisioning, cloud deployment, hosted runtime architecture, billing, or
production readiness.

## Invariants

Every interface option must preserve:

- Source evidence, pending candidates, and trusted memory are separate states.
- Provider evidence cannot create or promote trusted memory automatically.
- Knowledge providers are optional and read-only.
- Memory-only operation remains valid with no provider configured.
- MCP routes through Source-Wire API policy and cannot configure providers.
- Owner actions remain outside the agent MCP authority boundary.
- Provider credentials remain adapter-owned and out of band.
- Database credentials remain adopter-owned and out of band.
- The runtime binds zero or one provider immutably at startup.
- No dynamic registry, provider switching, or hot reload is introduced.
- The default MCP transport is stdio only.
- Any HTTP listener remains loopback-only and internal to the local runtime.
- Protected reads retain durable audit and single-use response-release
  behavior.
- Public examples and conformance use synthetic, disposable data only.
- No command provisions or charges a third-party service implicitly.

## Current Interface Burden

An adopter currently has to know:

1. which package is contracts-only and which workspace contains the Alpha
   runtime,
2. the complete environment-variable vocabulary for database, verifier, owner,
   harness, API, and MCP processes,
3. which credentials belong to the migrator, runtime, owner, harness, and
   provider,
4. the correct order for migration, initialization, server startup, harness
   issuance, and MCP startup,
5. how to keep MCP stdout free of logs and protocol corruption,
6. how to constrain the API listener to loopback,
7. how to inject a provider without giving MCP provider credentials,
8. which failures must stop startup rather than degrade silently,
9. which commands mutate state and which are safe diagnostics,
10. how to redact diagnostics and keep secrets out of configuration files.

Those decisions currently live across scripts, environment variables,
conformance code, private CLIs, and documentation. Deleting the proposed CLI
module would spill that orchestration back into every adopter launcher, so the
module earns its seam.

## Alternatives

### Option A: Expand `@source-wire/contracts` into the runtime CLI

The existing `source-wire` binary would gain runtime, database, provider, and
MCP commands.

Advantages:

- one package and one binary name,
- shortest apparent installation path.

Costs:

- the contracts package would acquire PostgreSQL, MCP runtime, process,
  credential, and provider-loading responsibilities,
- its package name and current release claims would become misleading,
- validation-only consumers would inherit runtime dependencies and advisories,
- contracts and runtime versioning would become coupled,
- Alpha internals could become accidental public API.

Decision: reject.

### Option B: Require every adopter to write a custom launcher

Each adopter would import a future host API, construct its provider, supply
runtime dependencies, and start API plus MCP processes themselves.

Advantages:

- smallest Source-Wire implementation,
- maximum adopter control,
- no dynamic configuration loader.

Costs:

- every adopter must reproduce security-sensitive startup ordering,
- agents need repository-specific commands instead of one predictable entrypoint,
- diagnostics, redaction, shutdown, and configuration behavior fragment,
- integration failures become difficult to reproduce.

Decision: retain as an advanced programmatic escape hatch, not the common
path.

### Option C: Add a separate local-runtime package with an integrated CLI

A future local-runtime package would expose a programmatic composition API and
the `source-wire-local` binary. The CLI would use the same composition API as
programmatic callers.

Advantages:

- contracts remain lightweight and stable,
- the CLI hides repeated setup and process decisions,
- programmatic and CLI callers share one test surface,
- runtime dependencies and advisories remain isolated,
- adopters can install only the surfaces they need,
- Source-Wire can remain unhosted and free of centralized billing.

Costs:

- a second package and binary must be versioned,
- users must distinguish `source-wire` from `source-wire-local`,
- runtime publication requires a separate security and release gate.

Decision: recommend.

## Recommended External Interface

The initial public shape should be small and grouped by authority.

### Existing contracts command

```bash
source-wire validate <schema> <file...>
```

This remains owned by `@source-wire/contracts`.

### Future local-runtime commands

```bash
source-wire-local init --config <path>
source-wire-local doctor --config <path> [--connect] [--json]
source-wire-local mcp stdio --config <path>

source-wire-local db status --config <path> [--json]
source-wire-local db migrate --config <path> --apply

source-wire-local provider check --config <path> [--connect] [--json]

source-wire-local owner export \
  --config <path> \
  --namespace <id> \
  --destination <path>
```

The first implementation slice should include only:

1. `init`,
2. `doctor`,
3. `provider check`,
4. `mcp stdio`.

Database mutation and owner export should migrate behind the same CLI only
after the common startup path passes conformance. Existing private Alpha
operator and owner commands remain the executable reference until then.

### Why there is no `provider add`

`provider add` implies a mutable registry. Source-Wire currently supports zero
or one immutable provider composition selected at process startup.

The local configuration names one owner-selected provider adapter. Changing
that provider requires changing owner-controlled configuration and restarting
the local runtime. MCP and API callers cannot select or change it.

## Proposed Configuration

This is a design sketch, not a public schema or implemented format.

```ts
type SourceWireLocalConfigV1 = Readonly<{
  schema: "source-wire.local.v1";
  ownerId: string;
  namespaces: readonly string[];
  memory: Readonly<{
    kind: "postgres";
    runtimeDatabaseUrlEnv: string;
    migratorDatabaseUrlEnv: string;
  }>;
  knowledgeProvider?: Readonly<{
    module: string;
    exportName: string;
    providerScopeId: string;
    timeoutMs: number;
  }>;
  mcp: Readonly<{
    transport: "stdio";
  }>;
  api: Readonly<{
    host: "127.0.0.1" | "::1";
    port: number | "auto";
  }>;
}>;
```

Configuration contains references to environment-variable names, never secret
values. It must not contain:

- database URLs,
- provider credentials,
- owner or harness bearer tokens,
- verifier key material,
- API keys,
- private evidence,
- arbitrary shell commands.

The provider module is owner-selected executable code. Loading it is therefore
an explicit local trust decision. `doctor` should validate configuration
without importing provider code by default. `provider check --connect` and
`mcp stdio` may load the configured provider only after filesystem, package,
profile, version, and immutable-binding checks pass.

The first Alpha implementation may use an explicit TypeScript composition
module instead of freezing this configuration format. The configuration
schema should become public only after both Source-Wire's synthetic adapter and
the evidence-first knowledge-base synthetic adapter exercise the same seam.

## Operation Semantics

### `init`

Inputs:

- destination path,
- optional non-secret owner and namespace identifiers.

Behavior:

- creates a non-secret configuration template,
- creates no account,
- contacts no service,
- provisions no database,
- installs no provider,
- performs no migration,
- prints the exact next diagnostic command.

Errors:

- destination already exists,
- unsafe permissions or path,
- invalid owner or namespace identifiers.

### `doctor`

Inputs:

- configuration path,
- optional `--connect`,
- optional machine-readable `--json`.

Default behavior:

- parses and validates configuration,
- checks exact package and contract compatibility,
- checks required environment-variable names are present without printing
  values,
- checks loopback and stdio restrictions,
- checks that no forbidden hosted or remote transport is configured,
- checks local executable and file permissions,
- does not import provider code or connect external dependencies.

`--connect` behavior:

- performs bounded PostgreSQL compatibility checks,
- imports and validates the configured provider profile,
- invokes only a bounded provider readiness operation,
- redacts endpoints, credentials, queries, and evidence.

The command is non-mutating in both modes.

### `provider check`

Inputs:

- configuration path,
- optional `--connect`.

Behavior:

- validates the provider's public contract identity and version,
- validates immutable provider ID and scope binding,
- validates read-only, provenance, bounds, and no-auto-promotion posture,
- rejects unsupported mutation or authority claims,
- with `--connect`, invokes the provider's bounded readiness operation,
- releases no source evidence.

### `mcp stdio`

Inputs:

- configuration path.

Ordering:

1. Validate configuration and package compatibility.
2. Resolve required secret values from the adopter's environment.
3. Verify database migration compatibility without applying migrations.
4. Construct zero or one immutable provider composition.
5. Start the internal API on loopback only.
6. Issue a least-privilege, process-scoped MCP credential.
7. Start the stdio MCP process.
8. Keep protocol frames on stdout and diagnostics on stderr.
9. On either child failure, stop the complete local composition.
10. Revoke or invalidate ephemeral process credentials and close local
    resources.

Startup fails closed on:

- missing or malformed configuration,
- missing required secrets,
- schema incompatibility,
- non-loopback binding,
- unsupported transport,
- malformed provider profile,
- owner, namespace, or provider-scope mismatch,
- provider construction failure,
- runtime or MCP child failure.

### `db migrate`

This is an explicit operator mutation.

- It never runs during `init`, `doctor`, or `mcp stdio`.
- It requires migrator credentials distinct from runtime credentials.
- It prints the current and target migration set before mutation.
- `--apply` is mandatory.
- It returns a machine-readable result and never prints credentials.

### `owner export`

This is an explicit owner action.

- It requires owner authority, never an MCP harness credential.
- It writes atomically to an explicit destination.
- It preserves the current bounded, secret-free portable format.
- It never uploads or sends the export to Source-Wire.

## Programmatic Composition Seam

The CLI and advanced launchers should share one local-runtime operation.

This is a proposal, not verified implementation:

```ts
type SourceWireLocalRuntimeOptions = Readonly<{
  memory: SourceWirePostgresMemoryOptions;
  ownerId: string;
  namespaces: readonly string[];
  knowledgeProvider?: AlphaKnowledgeProviderComposition;
  mcp: Readonly<{ transport: "stdio" }>;
}>;

interface SourceWireLocalRuntime {
  start(): Promise<Readonly<{
    stop(): Promise<void>;
  }>>;
  inspect(): Promise<SourceWireLocalRuntimeInspection>;
}

function createSourceWireLocalRuntime(
  options: SourceWireLocalRuntimeOptions
): SourceWireLocalRuntime;
```

The caller supplies a fully constructed
`SourceWireKnowledgeProviderV1`. Source-Wire does not receive the adapter's
credential object or database client.

The runtime module owns:

- configuration validation,
- immutable binding validation,
- migration compatibility checks,
- loopback API startup,
- least-privilege process credential issuance,
- stdio MCP startup,
- audit and response-release coordination,
- redacted diagnostics,
- graceful shutdown and child cleanup.

The provider adapter owns:

- its retrieval client,
- its query-only credential,
- source authorization and entitlement evaluation,
- active and deleted evidence filtering,
- transport cancellation,
- mapping provider failures into public safe results.

## Seam And Adapters

Only proven variation receives an adapter seam:

| Dependency | Classification | Seam |
| --- | --- | --- |
| PostgreSQL memory store | Local-substitutable for disposable conformance; adopter-owned in use | Existing database boundary |
| Knowledge provider | External and replaceable | `SourceWireKnowledgeProviderV1` |
| Evidence-first knowledge base | First independent target provider | Provider-owned adapter package |
| Agent harness | External caller | stdio MCP protocol |
| Hosted HTTP/SSE MCP | Not approved | No seam |
| Source-Wire cloud control plane | Not part of the product | No seam |
| Billing or account service | Not part of the product | No seam |

The design intentionally declines:

- a provider registry,
- arbitrary runtime provider selection,
- cloud-provider abstractions,
- managed secret storage,
- managed PostgreSQL provisioning,
- hosted transport configuration,
- automatic plugin discovery,
- Source-Wire-owned telemetry or billing.

## Hidden Implementation

The CLI should hide these recurring caller decisions:

- safe startup and shutdown order,
- ephemeral local port selection,
- internal process credential creation and revocation,
- environment-to-runtime mapping,
- provider profile and scope validation,
- migration compatibility checks,
- loopback enforcement,
- stdio/log stream separation,
- child-process failure propagation,
- constant safe error translation,
- secret and private-data redaction.

It should not hide consequential owner decisions. Migration application,
provider selection, owner approval, correction, revocation, and export remain
explicit actions.

## Error And Output Contract

All commands should support stable exit classes:

| Exit | Meaning |
| --- | --- |
| `0` | Requested operation succeeded |
| `1` | Validation or compatibility failure |
| `2` | Required local dependency unavailable |
| `3` | Authorization or credential class denied |
| `4` | Explicit mutation failed safely |

Machine-readable mode should use one envelope:

```ts
type SourceWireCliResultV1<T> =
  | Readonly<{
      ok: true;
      operation: string;
      result: T;
      warnings: readonly SourceWireCliWarningV1[];
    }>
  | Readonly<{
      ok: false;
      operation: string;
      error: Readonly<{
        code: string;
        message: string;
        retryable: boolean;
        detailsRedacted: true;
      }>;
    }>;
```

Errors must not include:

- secret values,
- database or provider URLs,
- private file contents,
- raw provider failures,
- evidence bodies or queries,
- hidden result counts,
- bearer tokens or verifier material.

## Cost And Ownership Boundary

Source-Wire's open-source distribution should impose no maintainer-funded
per-user runtime cost.

| Component | Selected and funded by |
| --- | --- |
| Source-Wire source and packages | Public Apache-2.0 distribution |
| User device or server | Adopter |
| PostgreSQL | Adopter |
| Knowledge base and its storage | Adopter |
| Provider adapter dependencies | Adopter |
| Embedding or model APIs, if chosen | Adopter |
| Agent harness | Adopter |
| Backups and recovery storage | Adopter |
| Network egress | Adopter |

The CLI must:

- work without a Source-Wire account,
- contain no Source-Wire-operated API endpoint,
- contain no Source-Wire billing credential,
- perform no phone-home or telemetry request by default,
- provision no paid service,
- require explicit adopter configuration for every external dependency,
- identify external dependency failures without claiming Source-Wire will pay
  for or operate them.

If a managed Source-Wire service is considered later, it must be optional and
must not become a requirement for the open-source local path.

## Test Surface

Tests should exercise observable behavior through the same CLI and
programmatic interface used by adopters.

### Configuration and offline diagnostics

- `init` creates only non-secret local configuration.
- Existing files are not overwritten.
- `doctor` succeeds without network access for valid offline configuration.
- `doctor` rejects raw secrets in configuration.
- Unknown fields, transports, provider registries, and remote API hosts fail.
- JSON output is deterministic and redacted.

### Provider composition

- no-provider configuration starts in memory-only mode,
- one conforming provider binds immutably,
- a second or mutable provider selection is rejected,
- contract, version, profile, family, scope, and bound mismatches fail startup,
- provider credentials and clients never appear in Source-Wire config or
  diagnostics,
- both the existing synthetic adapter and the evidence-first synthetic adapter
  occupy the same seam.

### MCP orchestration

- the exact four-tool stdio surface remains stable,
- MCP receives no provider, database, owner, or migrator credential,
- stdout contains only valid MCP protocol frames,
- diagnostics use stderr and remain redacted,
- API binding remains loopback-only,
- API, MCP, provider, or database startup failure tears down the composition,
- child crashes invalidate process-scoped credentials,
- no HTTP or SSE MCP transport is reachable.

### Authority

- agents can search authorized evidence and active trusted memory,
- agents can propose pending candidates,
- agents cannot configure providers, migrate, approve, correct, revoke, or
  export,
- owner and operator actions reject harness credentials,
- no provider result creates memory automatically.

### Cost boundary

- installation and startup contain no Source-Wire account flow,
- no Source-Wire API key is requested,
- no Source-Wire endpoint is contacted,
- no telemetry request occurs,
- tests use adopter-style local configuration and synthetic dependencies.

### Cross-repository proof

The final synthetic conformance path should be:

```text
source-wire-local CLI
  -> supported local-runtime composition
  -> evidence-first synthetic adapter
  -> authorized synthetic evidence reader
  -> Source-Wire protected audit and release
  -> stdio MCP client
```

It must prove zero private evidence, zero automatic memory promotion, zero
Source-Wire-owned service dependency, and complete cleanup.

## Migration And Compatibility

- `source-wire validate` remains compatible in
  `@source-wire/contracts`.
- The existing Alpha operator and owner CLIs remain private references until
  equivalent local-runtime commands pass conformance.
- The future runtime package must pin a compatible contracts major version.
- The CLI configuration schema must not be published before two independently
  implemented provider adapters pass the same composition tests.
- The evidence-first adapter must depend on a stable public contracts version,
  not a moving Git commit.
- A runtime package, CLI package, tag, or release requires separate owner
  approval.

## Tradeoffs And Remaining Uncertainty

Leverage gained:

- one predictable local entrypoint for people and AI agents,
- centralized startup, redaction, shutdown, and compatibility behavior,
- clear separation between contracts, runtime, provider, and MCP,
- no central operating cost for the Source-Wire maintainer.

Flexibility declined:

- no dynamic provider registry,
- no hosted transport,
- no automatic provisioning,
- no arbitrary shell hooks in data configuration,
- no managed secret or billing service.

Remaining uncertainty:

1. The final package name and support promise for the local runtime require a
   release decision.
2. Loading an adopter's provider in the same process is a code-level trust
   boundary, not hard process isolation. A separate provider-process protocol
   would be a later design and is not implied here.
3. The evidence-first knowledge base still needs a runnable authorized
   evidence reader and complete provider-ready snapshot contract.
4. Identifier and citation-locator meanings must remain aligned with the
   evidence-first adapter design.
5. Production authentication, secret custody, persistent database operations,
   deployment, and real-data safety remain outside Alpha 1.

## Acceptance Gate

This design is ready for implementation slicing only when the owner accepts:

- a separate local-runtime package boundary,
- preservation of the validation-only contracts CLI,
- `source-wire-local` as the provisional runtime binary,
- the initial command set of `init`, `doctor`, `provider check`, and
  `mcp stdio`,
- zero-or-one immutable provider composition,
- configuration containing secret references rather than secret values,
- no Source-Wire account, hosted dependency, telemetry, billing, or paid
  provisioning,
- all hosting, production, deployment, real-data, and non-disposable database
  blocks remaining in force.

## Implementation Sequence

Issue publication is complete and the owner explicitly started the sequence.

- [#278](https://github.com/DanielJD1216/Source-Wire/issues/278) is implemented
  in latest source with non-secret config initialization, offline diagnostics,
  focused tests, and public boundary documentation.
- [#279](https://github.com/DanielJD1216/Source-Wire/issues/279) is the next
  dependency-ordered unit.
- Issues #280 through #285 remain blocked by their published dependency order.

This status does not approve package publication, deployment, live providers,
production use, non-disposable databases, real data, telemetry, billing, or a
Source-Wire-operated service.
