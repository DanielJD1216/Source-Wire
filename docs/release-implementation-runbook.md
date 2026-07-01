# Source-Wire Release Implementation Runbook

Status: implementation runbook only.

This runbook does not approve npm publishing, GitHub release publishing, release tags, package version changes, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this runbook after the owner-approved release path is recorded and before the focused release implementation unit mutates package metadata or release channels.

It records the execution order, stop conditions, and verification evidence needed before Source-Wire is published beyond source-repo sharing.

## Current Recommended Path

Recorded release approval:

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
blocked release execution not performed
```

Run the non-mutating release implementation rehearsal:

```bash
npm run release:implementation-rehearsal
```

Expected markers:

```text
ok release implementation rehearsal ready
ok future version rehearsal 0.1.0
ok future npm public access rehearsal
blocked release mutation not performed
```

The rehearsal simulates the future `0.1.0` release manifest and future `publishConfig.access: public` in memory only. It keeps real `package.json` and `package-lock.json` at `0.0.0` with current `publishConfig.access: restricted`.

Run the non-mutating npm publish config plan:

```bash
npm run release:publish-config-plan
```

Expected markers:

```text
ok release publish config plan ready
ok future npm public access documented
blocked publish config mutation not performed
```

The plan keeps current `publishConfig.access` as `restricted` while publishing is blocked. During approved public npm release execution, change `publishConfig.access` from `restricted` to `public` before publishing.

## Future Execution Order

Current state: release approval is recorded in issue `#255`, but npm authentication is missing. When npm authentication is available and the final release implementation unit is ready, execute in this order:

1. Confirm `npm run release:approval-status` shows the exact owner approval text is recorded.
2. Confirm `npm run release:auth-preflight` shows npm and GitHub authentication are ready.
3. Confirm `npm run publish:readiness` passes from a clean Source-Wire checkout.
4. Confirm `npm run release:artifact-manifest` records the exact package identity, shasum, and integrity.
5. Confirm public CI passes on the exact commit to release.
6. Confirm package name, license, and publish boundary are still intentional.
7. Change package version only inside the approved implementation unit.
8. Change `publishConfig.access` from `restricted` to `public` only inside the approved public npm release execution unit.
9. Re-run the full local readiness gate and artifact manifest after the metadata changes.
10. Publish npm only if npm publishing was explicitly approved.
11. Create the matching GitHub release only if GitHub release publishing was explicitly approved.
12. Record public release evidence and private closeout proof.

## Stop Conditions

Stop before publishing or releasing if any of these are true:

- owner approval text is missing or ambiguous,
- release version is not explicit,
- `publishConfig.access` is still `restricted` during the approved public npm release execution unit,
- `npm run release:auth-preflight` does not show release publish credentials ready,
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

Until approved release execution runs:

- npm publishing remains blocked,
- GitHub release publishing remains blocked,
- release tag creation remains blocked,
- package version remains `0.0.0`,
- deployment remains blocked,
- hosted runtime behavior remains blocked,
- production runtime claims remain blocked,
- code contribution acceptance remains blocked.
