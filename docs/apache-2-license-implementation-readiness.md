# Source-Wire Apache-2.0 License Implementation Readiness

Status: readiness checklist only. Apache-2.0 is not approved or implemented by this document.

## Purpose

This checklist prepares the exact implementation path for a future owner-approved Apache-2.0 license unit.

It exists so the later implementation can be small, reviewable, and hard to confuse with npm publishing or runtime release.

## Current State

| Field | Current value |
| --- | --- |
| Package license | `UNLICENSED` |
| Package version | `0.0.0` |
| `LICENSE` file | none |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime backend | blocked |

## Required Owner Approval

Do not execute this checklist until the owner approves this exact path:

```text
Approved for Unit 240: implement Apache-2.0 licensing for Source-Wire. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, or add hosted runtime behavior.
```

## Future Implementation File Plan

When approved, change only these public files unless the implementation PRD records a new required path first.

| File | Future change |
| --- | --- |
| `LICENSE` | Add the Apache License 2.0 text. |
| `package.json` | Change `"license": "UNLICENSED"` to `"license": "Apache-2.0"`. |
| `scripts/release-gate.mjs` | Expect `Apache-2.0` while keeping version `0.0.0` and publishing blocked. |
| `scripts/readiness-report.mjs` | Report Apache-2.0 as the package license. |
| `README.md` | Add or update a License section that states Apache-2.0 and still says npm publishing is blocked. |
| `docs/license-decision-gate.md` | Record that Apache-2.0 implementation was approved and completed. |
| `docs/owner-license-approval-packet.md` | Move current decision from pending to approved. |
| `docs/future-license-change-plan.md` | Mark the Apache-2.0 path as implemented. |
| `docs/license-version-policy.md` | Update license policy while keeping version policy separate. |
| `docs/release-decision.md` | Update license status while keeping npm publishing and GitHub release blocked. |
| `docs/publish-readiness.md` | State that license approval is complete but npm publish approval is still separate. |
| `docs/index.md` | Link the updated license docs if needed. |

## Release-Gate Transition

Before approval, the release gate must keep expecting:

```text
UNLICENSED
```

After approval and implementation, the release gate should expect:

```text
Apache-2.0
```

It should still enforce:

- version remains `0.0.0`,
- `publishConfig.access` remains restricted,
- scripts do not run `npm publish`,
- scripts do not create GitHub releases,
- scripts do not deploy services.

## Verification Commands

When approved, use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

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

Expected post-implementation markers:

```text
ok release gate
ok license Apache-2.0
ok version 0.0.0
ok publishing blocked
```

## Still Blocked After Apache-2.0

Apache-2.0 implementation would not approve:

- npm publishing,
- GitHub release publishing,
- deployment,
- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record auto-promotion.

## Stop Conditions

Stop the future implementation if:

- owner approval is missing or ambiguous,
- the Apache-2.0 license text is edited by hand,
- package version changes away from `0.0.0`,
- npm publishing becomes possible,
- GitHub release publishing is added,
- deployment behavior is added,
- hosted runtime behavior is added,
- real user data appears in public docs or fixtures.

## Related Docs

- [License Decision Gate](license-decision-gate.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Future License Change Plan](future-license-change-plan.md)
- [License And Version Policy](license-version-policy.md)
- [Release Decision](release-decision.md)
- [Publish Readiness](publish-readiness.md)
