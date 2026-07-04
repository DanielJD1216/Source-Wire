# Runtime Proof Intake Fixture

This fixture is a synthetic redacted-proof manifest.

It models how a private owner-hosted implementation can tell Source-Wire:

```text
I have private proof evidence,
but I am only giving public-safe metadata.
```

It does not include:

- private repo paths,
- raw private content,
- real user data,
- client data,
- tokens or secrets,
- AGPLv3 code,
- private implementation code,
- runtime implementation,
- database migrations,
- deployment config.

## Files

- `runtime-proof-intake-manifest.json`: synthetic proof-intake manifest.

## Smoke

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../docs/quickstart.md).

Run from the repository root:

```bash
npm run runtime-proof-intake:smoke
```

The smoke compares the intake manifest to the runtime-readiness fixture matrix and keeps runtime implementation blocked.
