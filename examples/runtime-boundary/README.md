# Synthetic Runtime Boundary Example

This example is fictional and synthetic.

It models the first proposed owner-hosted API plus MCP runtime boundary without starting a server.

It is not a production runtime.

It is not exported from the package root.

It is not schema-validated by the current CLI.

## Local Setup

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../docs/quickstart.md).

Install dependencies first:

```bash
npm install
```

## Run The Smoke Proof

```bash
npm run runtime-boundary:smoke
```

Expected output:

```text
ok runtime boundary check authorized_read
ok runtime boundary check unauthorized_read_denial
ok runtime boundary check wrong_namespace_denial
ok runtime boundary check source_maintenance_no_auto_promotion
ok runtime boundary check owner_controlled_approval
ok runtime boundary check agent_approval_denial
ok synthetic runtime boundary smoke
```

Underlying local command:

```bash
node examples/runtime-boundary/synthetic-boundary-smoke.mjs
```

Installed package smoke:

```bash
npm run runtime-boundary:installed-smoke
```

Expected installed smoke markers:

```text
ok runtime boundary installed smoke @source-wire/contracts@0.1.0
ok installed runtime boundary example
```

Diagnostic regression smoke:

```bash
npm run runtime-boundary:diagnostics-smoke
```

Expected diagnostic markers:

```text
ok runtime boundary diagnostics smoke authorized_read
ok diagnostic failure includes check name
ok diagnostic failure includes assertion
ok diagnostic failure includes expected value
ok diagnostic failure includes received value
ok diagnostic failure includes next action
```

For the full local readiness marker map, read [Publish Readiness](../../docs/publish-readiness.md). For the GitHub Actions Package Checks marker map, read [CI Checks](../../docs/ci-checks.md).

## What It Proves

The smoke proof checks:

- authorized read,
- unauthorized read,
- wrong-namespace denial,
- source evidence remains evidence only,
- source maintenance preserves `noAutoPromotion`,
- pending candidates do not create trusted Memory Records,
- trusted-memory approval is owner or application controlled,
- MCP boundary calls the API boundary instead of bypassing policy,
- audit-friendly metadata is returned.

## Failure Diagnostics

Each line that starts with `ok runtime boundary check` names one boundary that passed.

If the smoke fails, the error includes:

- check name,
- assertion,
- expected value,
- received value,
- next action.

Common failure areas:

| Check | What broke first |
| --- | --- |
| `authorized_read` | Read scope, namespace access, citation shape, or MCP-to-API boundary. |
| `unauthorized_read_denial` | Missing-credential denial or leak prevention. |
| `wrong_namespace_denial` | Namespace isolation, denied evidence count, or leak prevention. |
| `source_maintenance_no_auto_promotion` | Source maintenance, pending candidates, or trusted-memory auto-promotion boundary. |
| `owner_controlled_approval` | Owner approval boundary or trusted-memory delta. |
| `agent_approval_denial` | Agent self-promotion denial. |

These diagnostics do not add runtime behavior. They only make the synthetic smoke easier to debug.

The diagnostic regression smoke intentionally forces one synthetic check to fail through `SOURCE_WIRE_RUNTIME_BOUNDARY_SMOKE_FORCE_FAILURE`.

It passes only when the failure output includes the check name, assertion, expected value, received value, and next action.

## What It Does Not Do

This example does not add:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- storage schema approval,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- package exports,
- CLI commands,
- schema-backed validation,
- deployment,
- npm publishing,
- real user data.

## Related Docs

- [First Runtime PRD Package](../../docs/first-runtime-prd.md)
- [Runtime Implementation Gate](../../docs/runtime-implementation-gate.md)
- [Owner-Hosted API Plus MCP Boundary Contract](../../docs/contracts/owner-hosted-api-mcp-boundary-contract.md)
