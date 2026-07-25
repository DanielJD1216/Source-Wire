# Local Runtime 0.1.0-alpha.1 npm Release

`@source-wire/local-runtime@0.1.0-alpha.1` was published to the public npm
registry on July 25, 2026 for experimental macOS and Linux local evaluation
with synthetic or disposable data only.

> [!CAUTION]
> This version was deprecated on July 25, 2026. A security review confirmed
> incomplete namespace binding and provider deadline enforcement. Do not
> install or use `0.1.0-alpha.1`. A corrected `0.1.0-alpha.2` candidate is
> being prepared but is not published.

## Release Identity

| Field | Value |
| --- | --- |
| Package | `@source-wire/local-runtime@0.1.0-alpha.1` |
| npm publication time | `2026-07-25T17:30:00.360Z` |
| Approved source revision | `84b2f83f6099f7991539a86eebcd413712e0e083` |
| Hosted verification | [Package Checks run 30167367865](https://github.com/DanielJD1216/Source-Wire/actions/runs/30167367865) |
| Tarball files | `95` |
| Tarball size | `118892` bytes |
| Unpacked size | `743266` bytes |
| SHA-1 | `6bc5df3f3e9ddedce2505743f9e9d2a9342cdb44` |
| Integrity | `sha512-r31r1qpem2W9f37yuo72u4nwBLS+fMLeJ9fhEgpUeFP7/1w+6aXkY1HijKokqkJ7N3bJ+f2T0iZjksFN5Hh0FQ==` |

The exact owner approval authorized public npm publication from that revision.
It did not authorize a Git tag, GitHub release, hosted service, deployment,
production use, real data, or live provider.

## Registry Verification

A clean temporary consumer installed the exact registry version under Node.js
`22.23.1`. Verification confirmed:

- the installed `source-wire-local` binary,
- non-secret local config initialization,
- dependency-free offline doctor output,
- the root runtime composition API,
- the synthetic provider package export,
- `@source-wire/contracts@0.2.0`,
- stdio MCP and loopback API posture,
- no Source-Wire account, billing, telemetry, or hosted endpoint requirement.

## npm Tag Behavior

The publish command and package metadata both selected `alpha`. npm nevertheless
created a required `latest` alias because this is the package's first and only
version. npm's registry documentation states that every package has a
`latest` tag. Supported removal attempts with npm `11.9.0` and `11.18.0` were
rejected by the registry with `E400`.

Current registry state:

```text
alpha: 0.1.0-alpha.1
latest: 0.1.0-alpha.1
```

Both aliases resolve to the same prerelease. `latest` is not a stable-support
claim. The historical exact installation was:

```bash
npm install --save-exact @source-wire/local-runtime@0.1.0-alpha.1
```

Do not run that command. The package is deprecated and no registry
local-runtime version is currently recommended.

## Support Boundary

The original release boundary was experimental local evaluation only:

- macOS and Linux,
- Node.js `22.23.1`,
- PostgreSQL `16.x`,
- stdio MCP,
- synthetic or disposable data,
- synthetic provider proof or separately installed read-only adapters.

Still blocked:

- production,
- hosting and deployment,
- Windows,
- HTTP or SSE MCP,
- static serving,
- real user or client data,
- live providers,
- non-disposable databases,
- Git tags and GitHub releases for this local-runtime Alpha.

## Dependency Advisory

The two moderate nested MCP findings remain temporarily accepted for this
stdio-only, non-Windows, non-static-serving Alpha. Re-review is due no later
than August 24, 2026, or immediately if the dependency, transport, platform,
runtime, publication, hosting, deployment, or data scope changes.

## Rollback Posture

If a critical security, integrity, or boundary defect is confirmed:

1. stop recommending installation,
2. deprecate this exact npm version with a clear warning after owner approval,
3. publish a corrected Alpha only after a new exact release gate,
4. unpublish only under separate explicit owner authorization because npm
   version identity cannot be reused.

The approved deprecation step is complete. npm returns:

```text
Security review: namespace binding and provider deadline enforcement are incomplete. Do not use this version. Upgrade to a later reviewed Alpha when available.
```
