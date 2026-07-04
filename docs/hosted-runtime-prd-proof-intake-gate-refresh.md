# Hosted Runtime PRD Proof Intake Gate Refresh

Status: complete.

Date: 2026-07-03

## Direct Answer

The hosted-runtime PRD gate now requires both runtime readiness and runtime proof intake before future runtime implementation claims.

This refresh does not implement API runtime, MCP runtime, database migrations, deployment, managed hosting, live connectors, real user data, npm publishing, GitHub release mutation, contribution acceptance, AGPLv3 code copying, private implementation code copying, or automatic trusted-memory promotion.

## What Changed

- `runtime:prd-decision-preflight` now runs:
  - `npm run runtime-readiness:smoke`
  - `npm run runtime-proof-intake:smoke`
- The hosted-runtime PRD docs now treat runtime proof intake as a required companion gate, not an optional note.
- The PRD preparation, execution packet, acceptance matrix, runtime implementation gate, and public runtime decision docs now name proof intake explicitly.
- The owner decision freshness script now expects the new decision-preflight markers.
- The malformed external license links in `docs/memory-engine-baseline-license-path-decision-packet.md` were corrected from inline-code URLs to Markdown links.

## Verification

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Passed:

```bash
npm run runtime:prd-preparation
npm run runtime:prd-execution-packet
npm run runtime:prd-acceptance-matrix
npm run runtime-readiness:smoke
npm run runtime-proof-intake:smoke
npm run docs:external-links
npm run runtime:prd-decision-preflight
npm run docs:links
npm run docs:anchors
npm run docs:command-setup
npm run safety:scan
npm run claims:scan
npm run typecheck
npm run build
git diff --check
```

## Failure Record

Failure point: first `npm run runtime:prd-decision-preflight`.

Observed error: `npm run docs:external-links` failed through `world:share-preflight` because two older license reference URLs were parsed with trailing backticks and returned `404 Not Found`.

Supported cause: `docs/memory-engine-baseline-license-path-decision-packet.md` used inline-code URL formatting, and the external-link checker included the closing backtick in the fetched URL.

Impact: the owner-side preflight could not complete until the stale link formatting was repaired.

Next action taken: converted both license references to Markdown links, reran `npm run docs:external-links`, then reran `npm run runtime:prd-decision-preflight` successfully.

## Still Blocked

- Public runtime implementation.
- API server runtime.
- MCP server runtime.
- Database migrations or database connection code.
- Live connectors.
- Mission Control UI.
- Deployment or managed hosting.
- Real user or client data.
- npm publishing or GitHub release mutation.
- Code contribution acceptance.
- AGPLv3 or private implementation code copying.
- Automatic trusted-memory promotion.
