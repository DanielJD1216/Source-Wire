# Hosted Runtime Child Issue Proof Intake Gate Refresh

Status: complete.

Date: 2026-07-03

## Direct Answer

The hosted-runtime child issue publication path now requires both runtime readiness and runtime proof intake before child issue publication can be treated as mechanically ready.

This refresh does not publish child issues, implement API runtime, implement MCP runtime, add database migrations, deploy services, add managed hosting, use real data, publish npm, create a GitHub release, accept code contributions, copy AGPLv3 or private implementation code, or allow automatic trusted-memory promotion.

## What Changed

- `runtime:child-issue-publication-preflight` now runs:
  - `npm run runtime-readiness:smoke`
  - `npm run runtime-proof-intake:smoke`
- The child issue publication preflight now reports:
  - `ok runtime readiness gate current`
  - `ok runtime proof intake gate current`
- The hosted-runtime slice map now requires both gates before child issue publication.
- The hosted-runtime slice approval request now includes both gates in the post-publication verification list.
- The child issue publication packet now includes both gates and updates the fixture/verification issue payload to require runtime proof intake.
- The CI marker map and marker self-smoke now include the two new child issue preflight markers.

## Verification

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Passed:

```bash
npm run runtime:slice-approval-request
npm run runtime:child-issue-publication-packet
npm run runtime:child-issue-publication-preflight
npm run ci:markers:smoke
npm run docs:links
npm run docs:anchors
npm run docs:command-setup
npm run docs:external-links
npm run safety:scan
npm run claims:scan
npm run typecheck
npm run build
npm run ci:check
git diff --check
```

## Failure Record

Failure point: first `npm run ci:markers:smoke` after adding the new preflight markers.

Observed error: complete synthetic marker log reported `209` markers while the self-smoke still expected `207`.

Supported cause: the hosted-runtime child issue publication preflight gained two new required markers, but the marker-count assertion had not been updated.

Impact: marker self-smoke failed even though the new markers were present.

Next action taken: updated the expected complete marker count from `207` to `209`, then reran marker and docs checks.

Second failure point: first `npm run docs:command-setup` after adding command snippets to `docs/internal/hosted-runtime-issue-slices.md`.

Observed error: the slice map contained local command snippets without setup context or a Quickstart pointer.

Supported cause: the new pre-publication command list made the slice map a command-bearing doc.

Impact: docs command setup gate failed.

Next action taken: added the standard Node.js 22 plus Quickstart setup sentence to the slice map, then reran docs checks successfully.

## Current Blocked State

Current expected result is completed child issue publication and blocked implementation:

```text
ok hosted runtime child issue publication approval recorded
ok hosted runtime child planning issues published
blocked hosted runtime implementation
```

Still blocked:

- public runtime implementation,
- API server implementation,
- MCP server runtime implementation,
- database migrations,
- deployment or managed hosting,
- production runtime use,
- real user or client data,
- npm publishing or GitHub release mutation,
- code contribution acceptance,
- AGPLv3 or private implementation code copying,
- automatic trusted-memory promotion.
