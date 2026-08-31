# Alpha 1 Story 5 MCP Dependency Advisory Disposition

Status: Resolved

Date: 2026-08-31

Resolved: 2026-08-31

Owner: Source-Wire repository owner

Prior status: Owner accepted

Prior acceptance date: 2026-07-24

Prior review deadline: 2026-08-24

Use Node.js 22 with npm from the repository root. For the complete local setup
path, read the [Quickstart](../getting-started/quickstart.md).

## Resolution

The current production dependency audit reports zero vulnerabilities for the
exact pinned Alpha dependency tree. The prior moderate
`GHSA-frvp-7c67-39w9` advisory for nested `@hono/node-server` through
`@modelcontextprotocol/sdk@1.29.0` is no longer reported by npm.

The disposition was resolved on August 31, 2026 without changing dependency
versions, runtime behavior, transports, package publication state, or support
scope. Any future production dependency finding fails the security gates and
requires explicit remediation or a new reviewed disposition.

## Historical Decision

Source-Wire previously kept `@modelcontextprotocol/sdk@1.29.0` for the local,
stdio-only Alpha runtime while production and hosted use remained blocked. The
reported advisory concerned Windows static-file path handling. Source-Wire did
not import Hono static serving, HTTP MCP, or SSE MCP in the MCP process, and
Windows remained unsupported.

Downgrading to `@modelcontextprotocol/sdk@1.24.3` was rejected because it
introduced high-severity SDK advisories:

- `GHSA-345p-7cg4-v4c7`, cross-client data leakage through shared server or
  transport reuse;
- `GHSA-8r9q-7v3j-jr4g`, regular-expression denial of service.

A forced nested dependency override was also rejected because npm did not
produce a valid workspace dependency tree when the SDK's declared dependency
was replaced with Hono 2.x.

## Unchanged Exposure Boundary

- Runtime mode: local experimental Alpha only.
- MCP transport: stdio only.
- Network authority: MCP routes through the loopback API.
- Static-file serving in MCP: absent.
- Windows runtime claim: absent and blocked.
- Real data: blocked.
- Deployment: blocked.
- Production authentication and secret custody: blocked.

The executable `npm run alpha1:story5:security-gate` command now fails if:

- the production dependency audit reports any vulnerability;
- the MCP source adds static-file, HTTP, or SSE server transports;
- the MCP SDK enters a known high-severity range;
- the immutable provider-binding policy is broadened;
- this resolved disposition record is absent.

## Review Triggers

Review immediately when any of these occurs:

- the production dependency audit reports a vulnerability;
- Source-Wire changes an Alpha dependency;
- Source-Wire adds any MCP transport other than stdio;
- Source-Wire adds static-file serving;
- Windows runtime support is proposed;
- hosted or production runtime work is proposed;
- real-data use is proposed;
- the npm advisory set or severity changes.

## Production Stop Gate

Resolution of the prior advisory does not approve hosted use, production use,
deployment, Windows runtime support, real data, or secret custody.

## Historical Owner Acceptance

The repository owner previously recorded:

```text
Approved: temporarily accept the known moderate MCP dependency advisory for Source-Wire’s local, stdio-only synthetic Alpha runtime. Review it again no later than August 24, 2026, or immediately if the dependency, transport, platform, or runtime scope changes. Keep production, hosting, Windows runtime, HTTP/SSE MCP, static serving, deployment, and real-data use blocked.
```
