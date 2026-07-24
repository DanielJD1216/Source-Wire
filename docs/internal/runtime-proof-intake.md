# Runtime Proof Intake

Status: synthetic private-proof intake gate.

## Direct Answer

Runtime proof intake is the bridge between private owner-hosted proof and public Source-Wire runtime planning.

It lets Source-Wire record that private proof exists without moving private data, private paths, or private implementation code into the public repo.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Run from the repository root:

```bash
npm run runtime-proof-intake:smoke
```

## What It Verifies

The smoke verifies:

- the intake manifest is synthetic,
- only proof metadata is included,
- proof references are redacted,
- no private repo paths are included,
- no raw private content is included,
- no real user or client data is included,
- no tokens or secrets are included,
- no AGPLv3 code or private implementation code is copied,
- each required runtime-readiness case has proof metadata,
- runtime PRD refresh is allowed,
- runtime implementation remains blocked.

## Why This Exists

The runtime-readiness gate says private owner behavior must be proven before public runtime work starts.

The private proof should stay private.

This gate gives the public repo a safe intake format:

```text
private proof exists,
redacted metadata is present,
runtime PRD refresh may proceed,
runtime implementation is still not approved.
```

The current private-proof-to-public-runtime bridge is recorded in [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md). It is verified by:

```bash
npm run runtime:extraction-readiness
```

## Related Docs

- [Runtime Proof Intake Contract](../contracts/runtime-proof-intake-contract.md)
- [Runtime Readiness Contract](../contracts/runtime-readiness-contract.md)
- [Runtime Readiness Smoke](runtime-readiness-smoke.md)
- [Runtime Implementation Decision Gate](runtime-implementation-decision-gate.md)
- [Private Proof To Runtime Extraction Readiness](private-proof-runtime-extraction-readiness.md)
