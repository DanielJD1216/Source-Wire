# Source-Wire License And Version Policy

Source-Wire is Apache-2.0 licensed as a source package.

## License Policy

Current package license:

```text
Apache-2.0
```

This means source package reuse is allowed under Apache-2.0.

Do not interpret the source license as approval for future package versions, future GitHub releases, deployment, hosted runtime use, production runtime use, or code contribution acceptance.

## Version Policy

Current package version:

```text
0.1.0
```

This means Source-Wire has an early public contract-package release, not a production runtime promise.

The package may still change contracts, schema names, docs, examples, and CLI behavior across future `0.x` releases.

## Before The Version Can Change Again

A later PRD must decide:

- next release version,
- compatibility promise,
- changelog format,
- release notes,
- npm access policy,
- post-publish verification.

## Current Publishing Rule

The first npm publication and matching GitHub release are complete.

Do not run:

```bash
npm publish
```

for a future package version until a later approved release unit explicitly opens that version and records owner approval.
