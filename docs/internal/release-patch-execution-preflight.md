# Source-Wire Patch Release Execution Preflight

Status: owner-side patch release execution preflight only.

This command is read-only. It does not publish npm, create a GitHub release, create tags, change package version, deploy services, implement hosted runtime behavior, republish hosted-runtime child planning issues, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this command before any future patch release implementation unit.

It verifies that the known immutable npm `0.1.0` artifact mismatch is still correctly bounded:

- latest `main` exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.1.0`,
- consumer smoke keeps the package version export aligned with package metadata,
- the immutable npm `0.1.0` artifact mismatch is disclosed,
- the owner approval recorder has the exact patch-release target,
- the exact patch approval has not been recorded unless the owner separately approves it.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:patch-execution-preflight
```

Expected current markers:

```text
ok release patch execution preflight ready
ok patch source export fixed on main
ok patch npm artifact mismatch disclosed
ok patch approval recorder target ready
blocked exact patch release approval missing
ok hosted runtime child planning issues already published
blocked patch release mutation not approved
blocked hosted runtime implementation
```

## Stop Conditions

Stop before changing package version, publishing npm, creating a GitHub release, or creating tags if any of these are true:

- the exact patch release approval has not been recorded,
- `src/index.ts` does not export `SOURCE_WIRE_PACKAGE_VERSION = "0.1.0"`,
- consumer smoke does not guard the runtime package version,
- the immutable npm `0.1.0` mismatch is not disclosed,
- `npm run publish:readiness` fails,
- Package Checks are not green on the exact release-candidate commit,
- npm publish credentials are not owner-controlled and ready,
- public docs imply hosted runtime or production runtime behavior,
- the patch would republish hosted-runtime child planning issues,
- the patch would include deployment, API server runtime, MCP server runtime, database migrations, code contribution acceptance, or real user data.

## Exact Approval Required

Before any future patch release implementation starts, record the exact approval through the guarded owner approval recorder:

```bash
npm run owner:record-approval -- --target patch-release-implementation
```

The exact approval text is in [Release Patch Approval Request](release-patch-approval-request.md).

## Still Blocked

Until a future patch release implementation unit is approved and its preflights pass:

- package version remains `0.1.0`,
- new npm package versions remain blocked,
- new GitHub release publishing remains blocked,
- new release tag creation remains blocked,
- deployment remains blocked,
- hosted runtime behavior remains blocked,
- hosted-runtime child planning issues remain published as `#259` through `#264` and must not be republished in this patch unit,
- production runtime use remains blocked,
- code contribution acceptance remains blocked,
- real user data remains blocked.

## Related Docs

- [Release Patch Approval Request](release-patch-approval-request.md)
- [Owner Approval Recorder](owner-approval-recorder.md)
- [Release Snapshot Boundary](../status/release-snapshot-boundary.md)
- [Release Auth Handoff](release-auth-handoff.md)
- [Publish Readiness](../guides/publish-readiness.md)
