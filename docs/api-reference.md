# Source-Wire API Reference

Source-Wire exports contract types, schema metadata, validation helpers, and runtime-boundary constants.

It does not export a runtime backend, database client, connector sync engine, MCP server, memory engine, or Mission Control UI.

## Package Entry Point

Import from the package root:

```ts
import {
  SOURCE_WIRE_PACKAGE_VERSION,
  SOURCE_WIRE_RUNTIME_BOUNDARY,
  SOURCE_WIRE_SCHEMA_EXPORTS,
  SOURCE_WIRE_VALIDATION_SCHEMA_NAMES,
  isSourceWireValidationSchemaName,
  validateSourceWireFile
} from "@source-wire/contracts";

import type {
  SourceWireRuntimeBoundary,
  SourceWireSourceGraph,
  SourceWireSecondBrainResponse,
  SourceWireValidationResult
} from "@source-wire/contracts";
```

During local development, build first:

```bash
npm run build
```

## Runtime Boundary Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `SOURCE_WIRE_PACKAGE_VERSION` | value | Current package version string. Currently `0.0.0`. |
| `SourceWireRuntimeBoundary` | type | Compile-time shape for the runtime boundary object. |
| `SOURCE_WIRE_RUNTIME_BOUNDARY` | value | Declares this package is a contract skeleton, not runtime software. |

Example:

```ts
import { SOURCE_WIRE_RUNTIME_BOUNDARY } from "@source-wire/contracts";

if (SOURCE_WIRE_RUNTIME_BOUNDARY.runtimeIncluded === false) {
  console.log("Source-Wire is contracts only.");
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

### Fixture Types

| Export | Purpose |
| --- | --- |
| `SourceWireFixtureSafety` | Fixture safety label. |
| `SourceWireFixtureMetadata` | Shared fixture metadata. |
| `SourceWireProjectContextPack` | Synthetic Project Context Pack fixture shape. |
| `SourceWireSecondBrainFixture` | Synthetic second-brain request and response fixture shape. |
| `SourceWireChatExportMessage` | Synthetic chat export message shape. |

Related docs:

- [Fixtures README](../examples/fixtures/README.md)
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

- license is `UNLICENSED`,
- version is `0.0.0`,
- no `LICENSE` file exists,
- npm publishing is blocked,
- GitHub release publishing is blocked,
- runtime backend work is blocked.

This API reference documents the current contract package surface only.
