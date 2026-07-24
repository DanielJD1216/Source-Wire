# Source-Wire First Release Version Recommendation

Status: historical recommendation, implemented for the first public release.

This document records the first public version recommendation. It does not change package version again, publish a new npm version, create a new GitHub release, create a new tag, deploy services, or accept code contributions.

## Current Version

```text
0.1.0
```

`0.1.0` is the implemented first public release version.

## Recommended Release Version Path

Implemented first public release path:

```text
0.1.0
```

Issue `#255` recorded owner approval for this first release path. Future version changes require a new approved release unit.

## Why 0.1.0

- Source-Wire has stable contract surfaces, schema exports, fixtures, local validation, and package readiness gates.
- Source-Wire does not yet have a hosted runtime, real MCP server runtime, database backend, live connectors, or contribution intake.
- `0.1.0` honestly signals early public package availability without implying production runtime maturity.

## What 0.1.0 Means

`0.1.0` means:

- Apache-2.0 source package release,
- public TypeScript contract package,
- public JSON schema package,
- validation CLI,
- synthetic examples and fixtures,
- local package verification,
- no hosted runtime,
- no real memory backend,
- no contribution acceptance.

## Version Choices Not Recommended Yet

| Version | Why not yet |
| --- | --- |
| `1.0.0` | Implies a stable public API and production maturity that Source-Wire does not claim yet. |
| `0.0.0` | Technically valid but weak for public release communication. |
| `0.0.1` | Too small to communicate that this is the first public contract package release. |

## Still Blocked

Changing the package version again is blocked until a future release implementation unit records owner approval.
