# Source-Wire Patch Release Approval Request

Status: patch release approval request only.

This request does not publish npm, create a GitHub release, create a tag, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this packet to approve a future patch release that corrects the known immutable `@source-wire/contracts@0.1.0` artifact mismatch:

- package metadata says `0.1.0`,
- the immutable npm `0.1.0` artifact exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0`,
- latest `main` fixes the source export to `0.1.0`,
- latest `main` adds a consumer-smoke guard so this cannot silently regress again.

Because npm artifacts are immutable, correcting the registry artifact requires a new owner-approved patch release. The likely patch version is `0.1.1`.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:patch-approval-request
```

Expected markers:

```text
ok release patch approval request ready
ok exported version fix on main
blocked patch release approval missing
blocked npm artifact immutable at @source-wire/contracts@0.1.0
```

Dry-run the guarded approval recorder:

```bash
npm run owner:record-approval -- --target patch-release-implementation
```

## Recommended Owner Approval

Use this exact text only when ready to approve a future patch release implementation unit:

```text
Approved for a future Source-Wire patch release implementation unit: publish a patch release that corrects the exported SOURCE_WIRE_PACKAGE_VERSION mismatch in the npm package. Use version 0.1.1 unless the implementation unit finds a blocking reason to choose a different explicit patch version. Create the matching GitHub release and tag only after final release-candidate verification. Keep hosted runtime behavior, production runtime claims, deployment, real user data, and code contribution acceptance blocked. Hosted runtime child planning issues are already published as #259 through #264 and must not be republished in this patch unit.
```

## Required Pre-Release Evidence

Before any patch release implementation starts later:

1. Confirm `src/index.ts` exports `SOURCE_WIRE_PACKAGE_VERSION = "0.1.0"`.
2. Confirm `npm run consumer:smoke` checks the exported version against package metadata.
3. Confirm current Package Checks are green on `origin/main`.
4. Run `npm run publish:readiness`.
5. Run `npm run release:execution-preflight`.
6. Confirm npm authentication and second factor are owner-controlled.
7. Confirm the exact patch release approval has been separately recorded.

## Still Blocked

This packet keeps these blocked:

- package version change,
- npm publishing,
- GitHub release creation,
- release tag creation,
- hosted runtime implementation,
- hosted-runtime child planning issue republication,
- API server runtime,
- MCP server runtime,
- database migrations,
- deployment,
- production runtime use,
- real user data,
- code contribution acceptance.

## Related Docs

- [Release Approval Request Packet](release-approval-request-packet.md)
- [Release Execution Preflight](release-execution-preflight.md)
- [Release Snapshot Boundary](../status/release-snapshot-boundary.md)
- [Public Status](../status/public-status.md)
- [World Share Packet](world-share-packet.md)
