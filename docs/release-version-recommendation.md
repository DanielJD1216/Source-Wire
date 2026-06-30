# Source-Wire First Release Version Recommendation

Status: recommendation only.

This document does not change package version, publish npm, create a GitHub release, create a tag, deploy services, or accept code contributions.

## Current Version

```text
0.0.0
```

`0.0.0` is useful while Source-Wire is a pre-release package skeleton, but it is not a good public release signal.

## Recommended Release Version Path

Recommended first public release path:

```text
0.1.0
```

Use `0.1.0` only in a future release implementation unit after owner approval.

## Why 0.1.0

- Source-Wire has stable contract surfaces, schema exports, fixtures, local validation, and package readiness gates.
- Source-Wire does not yet have a hosted runtime, real MCP server runtime, database backend, live connectors, or contribution intake.
- `0.1.0` honestly signals early public package availability without implying production runtime maturity.

## What 0.1.0 Would Mean

If approved later, `0.1.0` should mean:

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

Changing the package version is blocked until a future release implementation unit records owner approval.
