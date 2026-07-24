# Alpha 1 Story 5 MCP Dependency Advisory Disposition

Status: Owner accepted

Date: 2026-07-24

Owner: Source-Wire repository owner

Review deadline: 2026-08-24

Accepted: 2026-07-24

Use Node.js 22 with npm from the repository root. For the complete local setup
path, read the [Quickstart](../getting-started/quickstart.md).

## Decision

Keep `@modelcontextprotocol/sdk@1.29.0` for the unpublished, loopback-only,
stdio-only Alpha runtime while production and hosted use remain blocked.

The current production dependency audit reports the known moderate
`GHSA-frvp-7c67-39w9` advisory through the SDK's nested
`@hono/node-server@1.19.15`. The affected surface is Windows static-file
serving with encoded backslashes.

Source-Wire's MCP process does not import Hono, `@hono/node-server`,
`serveStatic`, an HTTP MCP transport, or an SSE MCP transport. It uses the MCP
SDK's stdio server transport only. The loopback API uses a separate direct
`@hono/node-server@2.0.11` dependency, which is outside the affected version
range and does not register static-file serving.

## Rejected Remediation

Downgrading to `@modelcontextprotocol/sdk@1.24.3` removes the nested Hono
dependency but introduces high-severity SDK advisories:

- `GHSA-345p-7cg4-v4c7`, cross-client data leakage through shared
  server or transport reuse,
- `GHSA-8r9q-7v3j-jr4g`, regular-expression denial of service.

That downgrade is not an acceptable security improvement.

A forced nested dependency override was also rejected. npm does not produce a
valid workspace dependency tree when the SDK's declared `^1.19.9` dependency is
replaced with Hono 2.x. Source-Wire will not ship an invalid dependency tree.

## Exposure Evidence

- Runtime mode: unpublished local Alpha only.
- MCP transport: stdio only.
- Network authority: MCP routes through the loopback API.
- Static-file serving in MCP: absent.
- Windows hosted runtime claim: absent and blocked.
- Real data: blocked.
- Deployment: blocked.
- Production authentication and secret custody: blocked.

The executable `npm run alpha1:story5:security-gate` command fails if:

- the MCP source adds static-file, HTTP, or SSE server transports,
- the known advisory set changes,
- the MCP SDK enters a known high-severity range,
- the immutable provider-binding policy is broadened,
- this disposition lacks owner acceptance.

## Review Triggers

Review immediately when any of these occurs:

- the MCP SDK releases a version that removes or patches the nested Hono
  dependency,
- Source-Wire adds any MCP transport other than stdio,
- Source-Wire adds static-file serving,
- Windows runtime support is proposed,
- hosted or production runtime work is proposed,
- real-data use is proposed,
- the npm advisory set or severity changes,
- the review deadline arrives.

## Production Stop Gate

This disposition does not approve hosted use, production use, deployment,
Windows runtime support, real data, or secret custody.

The advisory must be removed or reviewed again before any production or hosted
runtime decision.

## Recorded Owner Acceptance

The repository owner recorded:

```text
Approved: temporarily accept the known moderate MCP dependency advisory for Source-Wire’s local, stdio-only synthetic Alpha runtime. Review it again no later than August 24, 2026, or immediately if the dependency, transport, platform, or runtime scope changes. Keep production, hosting, Windows runtime, HTTP/SSE MCP, static serving, deployment, and real-data use blocked.
```
