# Separate Runtime Adapter Boundary Smoke

Local artifact: [Source-Wire Memory Engine Wrapper Runtime Separate Runtime Adapter Boundary Smoke](../../memory-engine-wrapper-runtime-separate-runtime-adapter-boundary-smoke.md).

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../getting-started/quickstart.md).

Smoke command:

```bash
npm run wrapper-runtime:runtime-adapter-smoke
```

## Parent

Source-Wire Memory Engine Wrapper Runtime PRD.

## What to build

Implement the narrowest adapter boundary proof for accepting a separate runtime candidate result while keeping Source-Wire policy outside that runtime.

## Acceptance criteria

- [x] Adapter uses synthetic runtime results only.
- [x] Source-Wire policy remains outside the runtime candidate.
- [x] Runtime result is shaped before reaching MCP.
- [x] Adapter cannot own auth, namespace, approval, citation, denied-result, or audit policy.
- [x] No AGPLv3 code is copied.
- [x] No Docker or installer bundling is added.

## Blocked by

- Owner-Hosted API Policy Wrapper Smoke.
