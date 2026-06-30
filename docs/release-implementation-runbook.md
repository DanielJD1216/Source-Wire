# Source-Wire Release Implementation Runbook

Status: implementation runbook only.

This runbook does not approve npm publishing, GitHub release publishing, release tags, package version changes, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this runbook only after the owner explicitly approves a future release implementation unit.

It records the execution order, stop conditions, and verification evidence needed before Source-Wire is published beyond source-repo sharing.

## Current Recommended Path

Recommended future approval:

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:implementation-plan
```

Expected markers:

```text
ok release implementation plan ready
ok release version target documented
blocked release execution approval missing
```

Run the non-mutating release implementation rehearsal:

```bash
npm run release:implementation-rehearsal
```

Expected markers:

```text
ok release implementation rehearsal ready
ok future version rehearsal 0.1.0
blocked release mutation not performed
```

The rehearsal simulates the future `0.1.0` release manifest in memory only. It keeps real `package.json` and `package-lock.json` at `0.0.0`.

## Future Execution Order

When a separate release implementation unit is approved, execute in this order:

1. Confirm the owner approval text names the release path and version.
2. Confirm `npm run publish:readiness` passes from a clean Source-Wire checkout.
3. Confirm `npm run release:artifact-manifest` records the exact package identity, shasum, and integrity.
4. Confirm public CI passes on the exact commit to release.
5. Confirm package name, license, and publish boundary are still intentional.
6. Change package version only inside the approved implementation unit.
7. Re-run the full local readiness gate and artifact manifest after the version change.
8. Publish npm only if npm publishing was explicitly approved.
9. Create the matching GitHub release only if GitHub release publishing was explicitly approved.
10. Record public release evidence and private closeout proof.

## Stop Conditions

Stop before publishing or releasing if any of these are true:

- owner approval text is missing or ambiguous,
- release version is not explicit,
- `npm run publish:readiness` fails,
- `npm run release:artifact-manifest` does not record shasum and integrity,
- public CI is not green on the exact release commit,
- package contents differ from the approved release package,
- public docs imply hosted runtime or production runtime behavior,
- contribution terms are still missing but contribution acceptance is being requested,
- any private data, local paths, real user records, or private proof history appear in package contents.

## Still Separate Decisions

The future release implementation must not silently include:

- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record auto-promotion,
- code contribution acceptance.

## Current Blocked State

Until a future owner-approved release implementation unit exists:

- npm publishing remains blocked,
- GitHub release publishing remains blocked,
- release tag creation remains blocked,
- package version remains `0.0.0`,
- deployment remains blocked,
- hosted runtime behavior remains blocked,
- production runtime claims remain blocked,
- code contribution acceptance remains blocked.
