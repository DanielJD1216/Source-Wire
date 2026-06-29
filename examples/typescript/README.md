# Source-Wire TypeScript Examples

These examples show the current public contract package surface.

They use synthetic data only.

They do not run a memory backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Import Shape

Package consumers should import from the package root:

```ts
import { SOURCE_WIRE_RUNTIME_BOUNDARY } from "@source-wire/contracts";

import type { SourceWireSourceGraph } from "@source-wire/contracts";
```

Because this package is not published to npm yet, local repo examples map `@source-wire/contracts` to `../../src/index.ts` through `examples/typescript/tsconfig.json`.

The installed examples smoke copies these same `.ts` files into a temporary external project and typechecks them against a locally packed package install.

## Local Setup

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../docs/quickstart.md).

Install dependencies first:

```bash
npm install
```

## Examples

- [runtime-boundary.ts](runtime-boundary.ts), confirms the package is contracts only.
- [schema-registry.ts](schema-registry.ts), reads the exported JSON schema registry metadata.
- [validation-helper.ts](validation-helper.ts), shows explicit file validation helper usage.
- [contract-types.ts](contract-types.ts), creates synthetic Source Graph, Source Connection, MCP behavior, and `/2nd-brain` contract payloads.

## Local Typecheck

```bash
npm run examples:typecheck
```

This command checks examples against the public TypeScript surface.

It does not build or run backend behavior.

## Installed Package Typecheck

```bash
npm run examples:installed-smoke
```

This command checks copied examples against the installed package declarations from `node_modules/@source-wire/contracts`.

It does not use repo-local TypeScript path mapping.

Related docs:

- [API Reference](../../docs/api-reference.md)
- [Quickstart](../../docs/quickstart.md)
- [Runtime Boundary](../../docs/runtime-boundary.md)
