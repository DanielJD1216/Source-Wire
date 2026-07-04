# Source-Wire API Reference

Source-Wire exports contract types, schema metadata, validation helpers, and runtime-boundary constants.

It also exports minimal synthetic in-memory runtime boundary helpers for proof cases.

It does not export a hosted runtime backend, database client, connector sync engine, MCP server, memory engine, or Mission Control UI.

## Package Entry Point

Import from the package root:

```ts
import {
  SOURCE_WIRE_PACKAGE_VERSION,
  SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY,
  SOURCE_WIRE_OWNER_HOSTED_SETUP_CONTRACT,
  SOURCE_WIRE_RUNTIME_PROOF_INTAKE_CONTRACT,
  SOURCE_WIRE_RUNTIME_READINESS_CONTRACT,
  SOURCE_WIRE_RUNTIME_BOUNDARY,
  SOURCE_WIRE_SCHEMA_EXPORTS,
  SOURCE_WIRE_VALIDATION_SCHEMA_NAMES,
  isSourceWireValidationSchemaName,
  runMinimalRuntimeProofCases,
  summarizeOwnerHostedSetupContract,
  summarizeRuntimeProofIntakeManifest,
  summarizeRuntimeReadinessContract,
  validateSourceWireFile
} from "@source-wire/contracts";

import type {
  SourceWireMinimalRuntimeProofResult,
  SourceWireOwnerHostedSetupContract,
  SourceWireRuntimeProofIntakeManifest,
  SourceWireRuntimeReadinessContract,
  SourceWireRuntimeBoundary,
  SourceWireSourceGraph,
  SourceWireSecondBrainResponse,
  SourceWireValidationResult
} from "@source-wire/contracts";
```

During local development, use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then build:

```bash
npm run build
```

Small import examples live in [TypeScript Examples](../examples/typescript/README.md).

Those examples use the package import shape while local typechecking maps `@source-wire/contracts` to `src/index.ts`.

## Runtime Boundary Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `SOURCE_WIRE_PACKAGE_VERSION` | value | Current package version string. Currently `0.1.0`. |
| `SourceWireRuntimeBoundary` | type | Compile-time shape for the runtime boundary object. |
| `SOURCE_WIRE_RUNTIME_BOUNDARY` | value | Declares this package is a contract skeleton, not runtime software. |
| `SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY` | value | Declares the minimal synthetic in-memory runtime proof boundary. |
| `runMinimalRuntimeProofCase` | function | Runs one synthetic owner-hosted API plus MCP proof case through the in-memory policy boundary. |
| `runMinimalRuntimeProofCases` | function | Runs multiple synthetic proof cases through the in-memory policy boundary. |
| `SourceWireMinimalRuntimeProofResult` | type | Result shape returned by minimal runtime proof helpers. |

Example:

```ts
import { SOURCE_WIRE_RUNTIME_BOUNDARY } from "@source-wire/contracts";

if (SOURCE_WIRE_RUNTIME_BOUNDARY.runtimeIncluded === false) {
  console.log("Source-Wire has no hosted runtime backend.");
}
```

Current runtime boundary values:

```ts
{
  packageKind: "contract_skeleton",
  runtimeIncluded: false,
  databaseIncluded: false,
  memoryEngineIncluded: false,
  missionControlIncluded: false
}
```

Minimal synthetic runtime boundary values:

```ts
{
  hosting: "owner_hosted",
  implementationMode: "synthetic_in_memory",
  sourceWireHostsUserMemory: false,
  apiServerIncluded: false,
  mcpServerIncluded: false,
  databaseIncluded: false,
  noAutoPromotionByDefault: true
}
```

Example:

```ts
import {
  SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY,
  runMinimalRuntimeProofCases
} from "@source-wire/contracts";

console.log(SOURCE_WIRE_MINIMAL_RUNTIME_BOUNDARY.implementationMode);
console.log(runMinimalRuntimeProofCases([]));
```

For a fuller consumer-style example, read [minimal-runtime.ts](../examples/typescript/minimal-runtime.ts).

## Schema Registry Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `SourceWireSchemaName` | type | Internal schema registry names: `projectContextPack`, `secondBrainV1`, `chatExportMessage`. |
| `SourceWireSchemaExport` | type | Metadata shape for one exported schema. |
| `SOURCE_WIRE_SCHEMA_EXPORTS` | value | Object keyed by schema registry name. |
| `SOURCE_WIRE_SCHEMA_EXPORT_LIST` | value | Ordered list of schema export metadata. |

Example:

```ts
import { SOURCE_WIRE_SCHEMA_EXPORT_LIST } from "@source-wire/contracts";

for (const schemaExport of SOURCE_WIRE_SCHEMA_EXPORT_LIST) {
  console.log(schemaExport.packageSubpath);
}
```

Related docs:

- [Schema Exports](schema-exports.md)
- [Validation CLI](validation-cli.md)

## Owner-Hosted Setup Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `SOURCE_WIRE_OWNER_HOSTED_SETUP_CONTRACT` | value | Owner-brings setup contract for future BYO owner-hosted usage. |
| `SOURCE_WIRE_OWNER_HOSTED_SETUP_REQUIREMENTS` | value | Required owner inputs: device/server, PostgreSQL-compatible database, secrets, sources, MCP harness, and review time. |
| `SOURCE_WIRE_OWNER_HOSTED_SETUP_BOUNDARY` | value | Explicit false flags for hosted memory, runtime, database migrations, Mission Control, deployment, real data, auto-promotion, and copied AGPL/private code. |
| `SOURCE_WIRE_OWNER_HOSTED_SETUP_STOP_CONDITIONS` | value | Conditions that stop setup work before unsafe or out-of-scope behavior. |
| `summarizeOwnerHostedSetupContract` | function | Returns counts and public-safety flags for the setup contract. |
| `SourceWireOwnerHostedSetupContract` | type | Compile-time setup contract shape. |
| `SourceWireOwnerHostedSetupRequirement` | type | Compile-time owner-brings checklist item shape. |
| `SourceWireOwnerHostedSetupBoundary` | type | Compile-time setup boundary shape. |
| `SourceWireOwnerHostedSetupStopCondition` | type | Compile-time setup stop condition shape. |

Example:

```ts
import {
  SOURCE_WIRE_OWNER_HOSTED_SETUP_CONTRACT,
  summarizeOwnerHostedSetupContract
} from "@source-wire/contracts";

const summary = summarizeOwnerHostedSetupContract(SOURCE_WIRE_OWNER_HOSTED_SETUP_CONTRACT);

console.log(summary.sourceWireHostsMemoryByDefault);
```

Related docs:

- [Owner-Hosted Setup Contract](contracts/owner-hosted-setup-contract.md)
- [Owner-hosted setup fixture](../examples/fixtures/owner-hosted-setup/README.md)

## Runtime Readiness Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `SOURCE_WIRE_RUNTIME_READINESS_CONTRACT` | value | Synthetic contract for runtime-readiness gates before public owner-hosted runtime implementation. |
| `SOURCE_WIRE_RUNTIME_READINESS_BOUNDARY` | value | Explicit false flags for runtime implementation, API runtime, MCP runtime, database migrations, deployment, real data, copied code, auto-promotion, and package version changes. |
| `SOURCE_WIRE_RUNTIME_READINESS_REQUIRED_CASES` | value | Required runtime-readiness fixture case IDs. |
| `summarizeRuntimeReadinessContract` | function | Returns counts and public-safety flags for the runtime-readiness contract. |
| `SourceWireRuntimeReadinessContract` | type | Compile-time runtime-readiness contract shape. |
| `SourceWireRuntimeReadinessCase` | type | Compile-time runtime-readiness fixture case shape. |
| `SourceWireRuntimeReadinessBoundary` | type | Compile-time runtime-readiness boundary shape. |

Example:

```ts
import {
  SOURCE_WIRE_RUNTIME_READINESS_CONTRACT,
  summarizeRuntimeReadinessContract
} from "@source-wire/contracts";

const summary = summarizeRuntimeReadinessContract(SOURCE_WIRE_RUNTIME_READINESS_CONTRACT);

console.log(summary.runtimeImplementationIncluded);
```

Related docs:

- [Runtime Readiness Contract](contracts/runtime-readiness-contract.md)
- [Runtime readiness fixture](../examples/fixtures/runtime-readiness/README.md)

## Runtime Proof Intake Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `SOURCE_WIRE_RUNTIME_PROOF_INTAKE_CONTRACT` | value | Synthetic contract for redacted private-proof metadata intake before public runtime PRD refresh. |
| `SOURCE_WIRE_RUNTIME_PROOF_INTAKE_BOUNDARY` | value | Explicit false flags for private paths, raw private content, real data, secrets, copied code, runtime implementation, migrations, and deployment. |
| `SOURCE_WIRE_RUNTIME_PROOF_INTAKE_REQUIRED_CASES` | value | Required runtime-readiness case IDs covered by proof-intake metadata. |
| `summarizeRuntimeProofIntakeManifest` | function | Returns counts and public-safety flags for a runtime proof intake manifest. |
| `SourceWireRuntimeProofIntakeManifest` | type | Compile-time proof-intake manifest shape. |
| `SourceWireRuntimeProofIntakeProof` | type | Compile-time proof metadata entry shape. |
| `SourceWireRuntimeProofIntakeBoundary` | type | Compile-time proof-intake boundary shape. |

Example:

```ts
import {
  SOURCE_WIRE_RUNTIME_PROOF_INTAKE_CONTRACT,
  summarizeRuntimeProofIntakeManifest
} from "@source-wire/contracts";

console.log(SOURCE_WIRE_RUNTIME_PROOF_INTAKE_CONTRACT.status);

const summary = summarizeRuntimeProofIntakeManifest({
  fixtureType: "source-wire-runtime-proof-intake-manifest",
  fixtureSafety: "synthetic",
  contractVersion: "source-wire-runtime-proof-intake.v1",
  boundary: SOURCE_WIRE_RUNTIME_PROOF_INTAKE_CONTRACT.boundary,
  proofs: [],
  decision: {
    privateProofBaselineAccepted: false,
    runtimePrdRefreshAllowed: false,
    runtimeImplementationAllowed: false,
    allowedNextAction: "Provide redacted private-proof metadata first."
  }
});

console.log(summary.runtimeImplementationAllowed);
```

Related docs:

- [Runtime Proof Intake Contract](contracts/runtime-proof-intake-contract.md)
- [Runtime proof intake fixture](../examples/fixtures/runtime-proof-intake/README.md)

## Validation Helper Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `SourceWireValidationSchemaName` | type | CLI validation schema names: `project-context-pack`, `second-brain-v1`, `chat-export-message`. |
| `SourceWireValidationResult` | type | Result shape returned by `validateSourceWireFile`. |
| `SOURCE_WIRE_VALIDATION_SCHEMA_NAMES` | value | Supported validation schema names. |
| `isSourceWireValidationSchemaName` | function | Type guard for validation schema names. |
| `validateSourceWireFile` | function | Validates an explicit local file against a supported schema name. |

Example:

```ts
import {
  isSourceWireValidationSchemaName,
  validateSourceWireFile
} from "@source-wire/contracts";

const schemaName = "project-context-pack";

if (isSourceWireValidationSchemaName(schemaName)) {
  const result = await validateSourceWireFile(
    schemaName,
    "examples/fixtures/project-context-pack/project-context.json"
  );

  console.log(result.ok);
}
```

The validation helper validates explicit files only.

It does not crawl directories, import sources, sync connectors, call servers, call databases, call memory engines, create trusted Memory Records, or promote candidate memories.

## Contract Type Groups

These exports are TypeScript types only.

They describe contract shapes. They do not run behavior.

### Source Graph Types

| Export | Purpose |
| --- | --- |
| `SourceWireSourceClass` | Source class identifiers such as Markdown vault, chat export, project context pack, second-brain example, or custom. |
| `SourceWireSensitivity` | Source sensitivity labels: public, internal, private, unknown. |
| `SourceWireFreshness` | Source freshness labels: fresh, changed, stale, unknown. |
| `SourceWireCitation` | Citation pointer for a source segment. |
| `SourceWireSourceCollection` | Source collection metadata. |
| `SourceWireSourceItem` | Source item metadata. |
| `SourceWireSourceSegment` | Addressable source segment with content and citation. |
| `SourceWireSourceEdgeKind` | Source graph edge kind. |
| `SourceWireSourceEdge` | Relationship between source graph objects. |
| `SourceWireSourceGraph` | Full source graph payload. |

Related doc:

- [Source Graph Adapter Contract](contracts/source-graph-adapter-contract.md)

### Source Connection Types

| Export | Purpose |
| --- | --- |
| `SourceWireSyncMode` | Sync mode: manual, scheduled, or external trigger. |
| `SourceWireSyncStatus` | Sync status: never synced, synced, partial, or failed. |
| `SourceWireCandidatePolicy` | Candidate policy: disabled or prepare for review. |
| `SourceWireSourceConnection` | Source connection configuration shape. |
| `SourceWireSourceSyncResult` | Source sync result counters and no-auto-promotion marker. |

Related doc:

- [Source Connection Contract](contracts/source-connection-contract.md)

### Second-Brain Types

| Export | Purpose |
| --- | --- |
| `SourceWireSecondBrainIntent` | High-level intent classification. |
| `SourceWireSearchRadius` | Search radius: project, source, or global. |
| `SourceWireSecondBrainRequest` | Request shape for `/2nd-brain`. |
| `SourceWireEvidenceGap` | Missing or weak evidence marker. |
| `SourceWireSecondBrainResponse` | Source-backed response shape. |

Related doc:

- [`second-brain.v1` Contract](contracts/second-brain-v1-contract.md)

### MCP Tool Behavior Types

| Export | Purpose |
| --- | --- |
| `SourceWireMcpToolGroup` | Tool group labels for memory search, source search, maintenance, second-brain, context assembly, and handoff. |
| `SourceWireMcpToolBehavior` | Public MCP behavior contract shape. |

Related doc:

- [MCP Tool Behavior Contract](contracts/mcp-tool-behavior-contract.md)

### Owner-Hosted Setup Types

| Export | Purpose |
| --- | --- |
| `SourceWireOwnerHostedSetupStatus` | Current setup contract status. |
| `SourceWireOwnerHostedSetupRequirementKind` | Required owner input identifiers. |
| `SourceWireOwnerHostedSetupRequirement` | Owner-brings checklist item. |
| `SourceWireOwnerHostedSetupBoundary` | Explicit setup non-goals and false runtime flags. |
| `SourceWireOwnerHostedSetupStopCondition` | Unsafe or out-of-scope setup stop condition. |
| `SourceWireOwnerHostedSetupContract` | Full owner-hosted setup contract payload. |
| `SourceWireOwnerHostedSetupReadinessSummary` | Summary returned by `summarizeOwnerHostedSetupContract`. |

Related doc:

- [Owner-Hosted Setup Contract](contracts/owner-hosted-setup-contract.md)

### Fixture Types

| Export | Purpose |
| --- | --- |
| `SourceWireFixtureSafety` | Fixture safety label. |
| `SourceWireFixtureMetadata` | Shared fixture metadata. |
| `SourceWireProjectContextPack` | Synthetic Project Context Pack fixture shape. |
| `SourceWireSecondBrainFixture` | Synthetic second-brain request and response fixture shape. |
| `SourceWireChatExportMessage` | Synthetic chat export message shape. |
| `SourceWireOwnerHostedApiMcpBoundaryFixture` | Synthetic owner-hosted API plus MCP boundary proof-case fixture shape. |
| `SourceWireOwnerHostedApiMcpProofCase` | Synthetic proof case for owner-hosted API plus MCP policy behavior. |

Related docs:

- [Fixtures README](../examples/fixtures/README.md)
- [TypeScript Examples](../examples/typescript/README.md)
- [Quickstart](quickstart.md)

## What Is Not Exported

Source-Wire does not currently export:

- API server runtime,
- MCP server runtime,
- database client,
- migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- connector sync engine,
- Mission Control UI,
- trusted Memory Record promotion behavior,
- private implementation code.

## Release Boundary

Current package posture:

- license is `Apache-2.0`,
- version is `0.1.0`,
- `LICENSE` file exists,
- npm package `@source-wire/contracts@0.1.0` is published,
- GitHub release `v0.1.0` is published,
- runtime backend work is blocked.

This API reference documents the current contract package surface only.
