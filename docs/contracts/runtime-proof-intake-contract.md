# Runtime Proof Intake Contract

Status: synthetic public-safe contract.

The runtime proof intake contract defines how Source-Wire can accept redacted private-proof metadata before future runtime PRD or implementation decisions.

It does not import private proof files. It does not copy private implementation code. It does not approve runtime implementation.

## Purpose

Source-Wire needs proof from a real owner-hosted implementation before public runtime work is safe.

The public repo cannot contain that private proof directly.

So this contract records only safe metadata:

- which runtime-readiness case the private proof supports,
- what kind of evidence exists,
- whether the case is available or intentionally blocked,
- whether the evidence reference is redacted,
- whether private data is excluded.

## Boundary

The contract requires:

- synthetic fixture data only,
- proof metadata only,
- redacted proof references only,
- no private repo paths,
- no raw private content,
- no real user data,
- no client data,
- no tokens or secrets,
- no copied AGPLv3 code,
- no copied private implementation code,
- no runtime implementation,
- no database migration,
- no deployment config.

## Decision Rule

A valid intake manifest may allow:

```text
runtime PRD refresh
```

It must not allow:

```text
runtime implementation
```

Runtime implementation still requires a separate explicit owner-approved unit.

## Related Files

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../quickstart.md).

- Fixture: `examples/fixtures/runtime-proof-intake/runtime-proof-intake-manifest.json`
- Smoke: `examples/runtime-proof-intake/runtime-proof-intake-smoke.mjs`
- Command: `npm run runtime-proof-intake:smoke`
- Runtime readiness: `docs/contracts/runtime-readiness-contract.md`
