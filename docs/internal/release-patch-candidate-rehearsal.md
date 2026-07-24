# Source-Wire Patch Candidate Rehearsal

Status: read-only patch candidate rehearsal.

This command does not change real package files, publish npm, create a GitHub release, create tags, deploy services, implement hosted runtime behavior, republish hosted-runtime child planning issues, accept code contributions, add real user data, or approve production runtime use.

## Purpose

Use this command before any future patch release implementation unit to prove the likely `0.1.1` patch would fix the `SOURCE_WIRE_PACKAGE_VERSION` export mismatch.

The command creates a temporary copy of the repo, changes only the temporary copy to `0.1.1`, builds it, packs it, installs the temporary tarball into a synthetic consumer project, and verifies that the package-root export reports `0.1.1`.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:patch-candidate-rehearsal
```

Expected current markers:

```text
ok release patch candidate rehearsal ready
ok patch candidate version 0.1.1
ok patch candidate export matches package version
ok patch candidate consumer smoke
blocked real package version unchanged
blocked npm publish not performed
blocked github release not created
```

## What It Proves

- A temporary `0.1.1` package can be built.
- The temporary `0.1.1` package can be packed.
- A synthetic consumer can install the temporary tarball.
- `SOURCE_WIRE_PACKAGE_VERSION` can match the package metadata at `0.1.1`.
- The real repo remains at `0.1.0` until exact owner approval opens the patch release implementation.

## Stop Conditions

Stop before any real package mutation if:

- this rehearsal fails,
- `npm run release:patch-execution-preflight` fails,
- `npm run publish:readiness` fails,
- exact patch release approval is not recorded,
- npm publish credentials are not owner-controlled and ready,
- public Package Checks are not green on the patch candidate commit,
- the patch would republish hosted-runtime child planning issues,
- the patch would include deployment, API server runtime, MCP server runtime, database migrations, code contribution acceptance, or real user data.

## Still Blocked

Until a future patch release implementation unit is approved and its preflights pass:

- real package version remains `0.1.0`,
- npm package publication remains blocked,
- GitHub release creation remains blocked,
- release tag creation remains blocked,
- deployment remains blocked,
- hosted runtime behavior remains blocked,
- hosted-runtime child planning issues remain published as `#259` through `#264` and must not be republished in this patch unit,
- production runtime use remains blocked,
- code contribution acceptance remains blocked,
- real user data remains blocked.

## Related Docs

- [Release Patch Execution Preflight](release-patch-execution-preflight.md)
- [Release Patch Approval Request](release-patch-approval-request.md)
- [Owner Approval Recorder](owner-approval-recorder.md)
- [Release Auth Handoff](release-auth-handoff.md)
- [Publish Readiness](../guides/publish-readiness.md)
