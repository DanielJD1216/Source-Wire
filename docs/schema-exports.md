# Source-Wire Schema Exports

Source-Wire exposes its public JSON schemas through the package boundary.

These exports are for validation and tooling. They are not a runtime backend.

## Exported Schemas

| Schema | Package subpath | Source file |
| --- | --- | --- |
| Project Context Pack | `@source-wire/contracts/schemas/project-context-pack` | `schemas/project-context-pack.schema.json` |
| `second-brain.v1` response fixture | `@source-wire/contracts/schemas/second-brain-v1` | `schemas/second-brain-v1.schema.json` |
| Chat export message | `@source-wire/contracts/schemas/chat-export-message` | `schemas/chat-export-message.schema.json` |
| Owner-hosted API plus MCP boundary fixture | `@source-wire/contracts/schemas/owner-hosted-api-mcp-boundary` | `schemas/owner-hosted-api-mcp-boundary.schema.json` |

## Typed Registry

The package also exports a typed schema registry:

```ts
import { SOURCE_WIRE_SCHEMA_EXPORTS, SOURCE_WIRE_SCHEMA_EXPORT_LIST } from "@source-wire/contracts";

console.log(SOURCE_WIRE_SCHEMA_EXPORTS.projectContextPack.schemaId);
console.log(SOURCE_WIRE_SCHEMA_EXPORT_LIST.map((schemaExport) => schemaExport.packageSubpath));
```

## Loading A Schema

In Node.js, JSON schemas can be loaded from the package subpaths with `createRequire`:

```ts
import { createRequire } from "node:module";

import { SOURCE_WIRE_SCHEMA_EXPORTS } from "@source-wire/contracts";

const require = createRequire(import.meta.url);
const projectContextPackSchema = require(SOURCE_WIRE_SCHEMA_EXPORTS.projectContextPack.packageSubpath);

console.log(projectContextPackSchema.$id);
```

## What This Enables

Schema exports support:

- local validation scripts,
- future CLI validation,
- app forms,
- SDKs,
- documentation examples,
- package-level compatibility tests.

Related TypeScript package exports are documented in the [API Reference](api-reference.md).

## What This Does Not Include

Schema exports do not include:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- trusted Memory Record promotion,
- validation CLI implementation,
- CI workflow implementation,
- broad TypeScript helper functions.

## Verification

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Run:

```bash
npm run verify:schema-exports
```

This command builds the package, imports the built package surface, loads each schema subpath, and checks each schema `$id` and title.
