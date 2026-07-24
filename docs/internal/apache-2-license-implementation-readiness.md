# Source-Wire Apache-2.0 License Implementation Readiness

Status: implemented.

## Purpose

This page records the completed Apache-2.0 implementation path and keeps it separate from future package releases, deployment, hosted runtime work, and contribution acceptance.

For the implementation map across all owner decision options, read [License Decision Implementation Plan](license-decision-implementation-plan.md).

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.1.0` |
| `LICENSE` file | present |
| Source package reuse | allowed under Apache-2.0 |
| npm package | published as `@source-wire/contracts@0.1.0` |
| GitHub release | published as `v0.1.0` |
| Hosted runtime backend | blocked |
| Code contribution acceptance | blocked |

## Owner Approval

The owner approved this exact path:

```text
Approved for a future Source-Wire license implementation unit: implement Apache-2.0 licensing. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

## Implemented File Plan

| File | Implemented change |
| --- | --- |
| `LICENSE` | Added the Apache License 2.0 text. |
| `package.json` | Changed `"license": "UNLICENSED"` to `"license": "Apache-2.0"`. |
| `package-lock.json` | Root package metadata matches `Apache-2.0`, version `0.1.0`, and the installed CLI bin. |
| `scripts/release-gate.mjs` | Expects `Apache-2.0`, version `0.1.0`, and public npm package access. |
| `scripts/readiness-report.mjs` | Reports Apache-2.0 as the package license. |
| `README.md` | States Apache-2.0 source package status and blocked launch channels. |
| `docs/internal/license-decision-gate.md` | Records that Apache-2.0 implementation was approved and completed. |
| `docs/internal/license-approval-decision-record.md` | Records the implemented owner decision. |
| `docs/internal/license-version-policy.md` | Updates license policy while keeping version policy separate. |
| `docs/internal/release-decision.md` | Records the first release as complete while keeping future release mutation gated. |
| `docs/guides/publish-readiness.md` | States that source package licensing and first release are complete while hosted runtime and contribution acceptance remain blocked. |

## Release-Gate State

The release gate now expects:

```text
Apache-2.0
```

It still enforces:

- version remains `0.1.0`,
- `publishConfig.access` remains public,
- scripts do not run package-manager publish commands for new versions,
- scripts do not create GitHub releases,
- scripts do not create release tags,
- scripts do not change package version,
- scripts do not deploy services.

## Verification Commands

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
test -f LICENSE
node -e "const p=require('./package.json'); if (p.license !== 'Apache-2.0') process.exit(1)"
npm run release:gate
npm run publish:readiness
npm run safety:scan
git diff --check
```

Expected markers:

```text
ok release gate
ok license Apache-2.0
ok package lock Apache-2.0
ok version 0.1.0
ok npm public access ready
```

## Still Blocked After Apache-2.0

Apache-2.0 implementation does not approve:

- npm publishing,
- GitHub release publishing,
- deployment,
- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- live connectors,
- Mission Control UI,
- real user data examples,
- trusted Memory Record auto-promotion,
- accepting code contributions,
- production runtime use.
