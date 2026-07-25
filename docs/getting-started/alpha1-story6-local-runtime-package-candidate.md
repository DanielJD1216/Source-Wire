# Alpha 1 Story 6.8: Local Runtime Package Candidate

Source-Wire prepares `@source-wire/local-runtime@0.1.0-alpha.1` for public npm
Alpha distribution under the `alpha` dist-tag.

The installed binary is `source-wire-local`. The package is configured with
public npm access, while Git tags, GitHub releases, deployment, and hosted
services remain separate and blocked. Before the registry write, the exact
candidate can be evaluated by packing an explicit local checkout.

## Support Boundary

This candidate is experimental Alpha software for:

- macOS or Linux,
- Node.js `22.23.1`,
- PostgreSQL `16.x`,
- stdio MCP,
- `@source-wire/contracts@0.2.0`,
- `KnowledgeProvider v1`,
- synthetic or disposable data,
- exact dependency pins in the package manifest.

It is not supported for:

- production,
- hosting or deployment,
- Windows,
- HTTP or SSE MCP,
- static serving,
- real user or client data,
- live knowledge providers,
- non-disposable databases.

## Install The Public Alpha

After npm publication, install the exact version:

```bash
npm install --save-exact @source-wire/local-runtime@0.1.0-alpha.1
```

The package uses the `alpha` dist-tag. Exact-version installation is
recommended for repeatable evaluation.

## Prepare The Local Tarball

From the Source-Wire repository:

```bash
npm run alpha1:build
npm run local-runtime:candidate-smoke
npm pack --workspace @source-wire/local-runtime --pack-destination /tmp
```

This creates a local tarball. It does not publish anything.

Install the exact tarball into an evaluation project:

```bash
npm install --ignore-scripts /tmp/source-wire-local-runtime-0.1.0-alpha.1.tgz
```

Do not use `npx` or a floating version. An AI-agent MCP configuration should
point to the already-installed binary:

```json
{
  "mcpServers": {
    "source-wire": {
      "command": "/absolute/evaluation/project/node_modules/.bin/source-wire-local",
      "args": [
        "mcp",
        "stdio",
        "--config",
        "/owner-controlled/source-wire.local.json"
      ]
    }
  }
}
```

## Public Programmatic Surface

The package root exposes configuration helpers and one supported runtime
composition API:

```ts
import {
  createSourceWireLocalConfig,
  createSourceWireLocalRuntime,
  initializeSourceWireLocalConfig
} from "@source-wire/local-runtime";
import { createSyntheticKnowledgeProvider } from "@source-wire/local-runtime/synthetic-provider";

const provider = createSyntheticKnowledgeProvider();
const base = createSourceWireLocalConfig({
  ownerId: "owner_local",
  namespaceIds: ["namespace_local"]
});
const config = {
  ...base,
  knowledgeProvider: {
    module: "@source-wire/local-runtime/synthetic-provider",
    exportName: "createSyntheticKnowledgeProvider",
    providerScopeId: provider.profile.providerScopeId,
    timeoutMs: 1_000
  }
};

await initializeSourceWireLocalConfig(
  "/owner-controlled/source-wire.local.json",
  config
);

const runtime = createSourceWireLocalRuntime({
  configPath: "/owner-controlled/source-wire.local.json"
});
console.log(await runtime.inspect());
await runtime.startStdioMcp();
```

`startStdioMcp()` requires the approved local environment references and a
compatible disposable PostgreSQL database. It starts the loopback API policy
process and stdio MCP process as one fail-closed composition.

Private Alpha modules are not package exports. Provider adapters remain
separate dependencies that implement the public `KnowledgeProvider v1`
contract. The included synthetic provider exists only for evaluation and
conformance.

## Cost And Ownership

Installation and execution require no Source-Wire account, Source-Wire API
key, telemetry, billing, or Source-Wire-operated endpoint.

Each adopter supplies and pays for their own machine, PostgreSQL, provider
adapter, provider credentials, and agent harness.

## Advisory Disposition

A fresh production-dependency audit reports two moderate nested MCP findings
from `@hono/node-server@1.19.15` through
`@modelcontextprotocol/sdk@1.29.0`. The underlying advisory is
`GHSA-frvp-7c67-39w9` for Windows static-file path handling.

The findings are temporarily accepted only because this candidate blocks
Windows, HTTP and SSE MCP, static serving, hosting, deployment, production,
real data, and live providers. The direct `@hono/node-server` dependency is
pinned to `2.0.11`.

The npm publication review was completed on July 25, 2026 for this exact
version and support boundary. Re-review is required no later than August 24,
2026, and immediately after any dependency, transport, platform, runtime,
future publication, hosting, deployment, or data-scope change.

Run:

```bash
npm run local-runtime:security-gate
```

## Verification

```bash
npm run alpha1:build
npm run alpha1:test
npm run local-runtime:candidate-smoke
npm run local-runtime:security-gate
npm run alpha1:ci-workflow-smoke
```

With exact Node.js `22.23.1` and disposable PostgreSQL `16.x`:

```bash
npm run local-runtime:candidate-conformance
```

The packed-candidate conformance installs the tarball into an empty consumer,
uses the installed runtime entrypoint, starts stdio MCP through the official
MCP client, exercises both the memory-only and synthetic provider
compositions, and verifies disposable PostgreSQL cleanup.

## Package Content Boundary

The packed candidate includes only package documentation, license, compiled
runtime implementation, declarations, and the six forward-only local
migrations required by the disposable proof.

It excludes source tests, conformance sources and reports, generated
databases, environment files, credential material, evidence records, private
paths, deployment configuration, hosted-service configuration, and real data.

Public npm Alpha distribution authorizes installation of this exact package
only. It does not authorize Git tags, GitHub releases, deployment, hosting,
production use, real data, live providers, Windows, HTTP or SSE MCP, static
serving, or a non-disposable database.
