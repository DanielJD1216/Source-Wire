# Source-Wire Runtime Boundary Readiness

Status: readiness summary with one minimal synthetic in-memory runtime boundary. No hosted runtime implementation is included.

## What Exists

Source-Wire currently includes a synthetic runtime-boundary proof lane for a future owner-hosted API plus MCP boundary.

The proof lane includes:

- exported synthetic in-memory runtime boundary code,
- a local minimal-runtime smoke command,
- a local synthetic runtime-boundary example,
- an official local smoke command,
- an installed-package smoke command,
- diagnostic markers for each boundary check,
- a diagnostic regression smoke for failure-message shape,
- package readiness wiring through `npm run publish:readiness`.

## What This Proves

The synthetic proof lane checks:

| Proof area | Evidence |
| --- | --- |
| Authorized read | An allowed synthetic caller can read cited synthetic evidence. |
| Unauthorized read denial | Missing credentials fail closed without leaked content. |
| Wrong namespace denial | Cross-namespace access is denied without leaked content. |
| Source evidence boundary | Source evidence stays evidence only. |
| Source maintenance boundary | Maintenance preserves `noAutoPromotion`. |
| Pending candidate boundary | Candidate creation does not create trusted memory. |
| Trusted-memory approval | Trusted memory requires owner or application approval. |
| Agent approval denial | Agents cannot self-promote trusted memory by default. |
| MCP-to-API boundary | MCP calls go through the synthetic API policy boundary. |
| Exported runtime boundary | The package exports synthetic in-memory policy code for the proof cases. |
| Installed package behavior | The packaged synthetic example runs after local tarball install. |
| Diagnostic failure format | A controlled synthetic failure proves check name, assertion, expected value, received value, and next action remain visible. |

## Commands

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Run the minimal exported runtime smoke:

```bash
npm run minimal-runtime:smoke
```

Run the original local synthetic example smoke:

```bash
npm run runtime-boundary:smoke
```

Run the installed-package synthetic smoke:

```bash
npm run runtime-boundary:installed-smoke
```

Run the diagnostic regression smoke:

```bash
npm run runtime-boundary:diagnostics-smoke
```

Run the full readiness gate:

```bash
npm run publish:readiness
```

## Stable Success Markers

The minimal runtime smoke should print:

```text
ok minimal runtime boundary smoke
```

The local and installed runtime-boundary smokes should print:

```text
ok runtime boundary check authorized_read
ok runtime boundary check unauthorized_read_denial
ok runtime boundary check wrong_namespace_denial
ok runtime boundary check source_maintenance_no_auto_promotion
ok runtime boundary check owner_controlled_approval
ok runtime boundary check agent_approval_denial
ok synthetic runtime boundary smoke
```

The installed smoke should also print:

```text
ok runtime boundary installed smoke @source-wire/contracts@0.0.0
ok installed runtime boundary example
```

The diagnostic regression smoke should print:

```text
ok runtime boundary diagnostics smoke authorized_read
ok diagnostic failure includes check name
ok diagnostic failure includes assertion
ok diagnostic failure includes expected value
ok diagnostic failure includes received value
ok diagnostic failure includes next action
```

For the full local readiness marker map, read [Publish Readiness](publish-readiness.md). For the GitHub Actions Package Checks marker map, read [CI Checks](ci-checks.md).

## What Is Still Blocked

This readiness lane does not add or approve:

- API server runtime,
- MCP server runtime,
- runtime scaffolding,
- database migrations,
- PostgreSQL or pgvector setup,
- storage schema approval,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- npm publishing,
- GitHub release publishing,
- deployment,
- real user data,
- trusted Memory Record auto-promotion,
- Source-Wire-hosted memory.

## Owner-Hosted Boundary

The only future runtime lane currently described is owner-hosted API plus MCP boundary.

The synthetic in-memory boundary is now open for public package proof only.

Hosted API server runtime, real MCP server runtime, database runtime, live connectors, and deployment remain blocked until later PRDs explicitly open them.

Source-Wire does not host memory.

Source-Wire does not decide that imported source evidence is trusted memory.

Trusted memory must require owner or application approval.

## Related Docs

- [Runtime Boundary](runtime-boundary.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [First Runtime PRD Package](first-runtime-prd.md)
- [Public Runtime Decision](public-runtime-decision.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Synthetic Runtime Boundary Example](../examples/runtime-boundary/README.md)
- [Minimal Synthetic Runtime Boundary](../examples/minimal-runtime/README.md)
- [Publish Readiness](publish-readiness.md)
- [CI Checks](ci-checks.md)
