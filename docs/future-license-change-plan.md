# Source-Wire Future License Change Plan

Date: 2026-06-29

Status: future plan only.

## Purpose

This plan lists the exact changes that would happen only after the owner approves a separate license implementation PRD.

It does not change the license now.

## Current Boundary

Current Source-Wire state:

- package license: `UNLICENSED`,
- package version: `0.0.0`,
- no `LICENSE` file,
- npm publishing blocked,
- GitHub release publishing blocked,
- runtime backend blocked.

## If Apache-2.0 Is Approved Later

Expected future package metadata changes:

| File | Future change |
| --- | --- |
| `package.json` | Change `"license": "UNLICENSED"` to `"license": "Apache-2.0"`. |
| `package.json` | Keep `"version": "0.0.0"` unless a separate release PRD approves a release version. |
| `package.json` | Keep `publishConfig.access` restrictive until a separate publish PRD approves npm publishing. |

Expected future file changes:

| File | Future change |
| --- | --- |
| `LICENSE` | Add Apache License 2.0 text. |
| `README.md` | Add a License section with the approved license and current publish boundary. |
| `docs/release-decision.md` | Update license status from `UNLICENSED` to the approved license. |
| `docs/license-version-policy.md` | Update license policy and keep version policy separate. |
| `docs/publish-readiness.md` | State that license approval is separate from npm publish approval. |
| `scripts/release-gate.mjs` | Update expected license only inside the approved implementation PRD. |

Expected future verification commands:

```bash
test -f LICENSE
npm run release:gate
npm run publish:readiness
npm run safety:scan -- --format=json
git diff --check
```

## If Staying UNLICENSED Is Approved Later

Expected future changes:

- keep `package.json` license as `UNLICENSED`,
- keep no `LICENSE` file,
- update `docs/release-decision.md` only if the owner wants to record a longer hold period,
- keep release gate expecting `UNLICENSED`,
- keep npm publishing blocked.

## If Source-Available Or Noncommercial Is Chosen Later

Expected future work:

- run a separate decision prototype or legal review,
- choose exact license text,
- update package metadata only after approval,
- add the approved license file only after approval,
- clearly state that the project is source-available or noncommercial, not ordinary permissive open source,
- keep npm publishing separate unless a release PRD approves it.

## If Legal Review Is Required First

Expected future work:

- keep package license as `UNLICENSED`,
- keep no `LICENSE` file,
- collect questions for counsel,
- decide contributor policy,
- decide public support boundary,
- decide hosted or commercial runtime boundary,
- return to an owner approval packet after review.

## Explicit Non-Goals

This future plan does not approve:

- changing package license,
- adding a `LICENSE` file,
- changing package version,
- npm publishing,
- GitHub release publishing,
- deployment,
- runtime backend behavior,
- accepting contributors,
- commercial reuse,
- private implementation extraction.

## Next Implementation Gate

If the owner approves Apache-2.0 later, the next implementation PRD should be:

**Source-Wire Apache-2.0 License Implementation Gate**

That PRD should make only the approved license implementation changes and still leave npm publishing blocked unless another release PRD opens it.
