# Source-Wire License Recommendation

Date: 2026-06-29

## Recommendation

The next Source-Wire implementation unit should be:

**Unit 31: Source-Wire Owner License Approval Packet**

## Decision

Do not change the license yet.

Keep Source-Wire:

- license: `UNLICENSED`,
- version: `0.0.0`,
- npm publishing: blocked,
- GitHub release publishing: blocked,
- runtime backend: blocked.

## Why This Wins

The license question is not only a software question.

It controls what other people can do with Source-Wire commercially, whether companies can adopt it, whether contributors understand the boundary, and whether future hosted-memory business models stay protected.

Changing from `UNLICENSED` to a permissive license is easy to do technically, but hard to undo socially and legally.

The right next unit is therefore an owner approval packet, not a license change.

## Best Future Candidate

If the owner chooses a true permissive open-source release, the best current candidate is:

**Apache-2.0**

Reason:

- familiar open-source license,
- standard SPDX identifier,
- strong enterprise compatibility,
- clearer fit for infrastructure and agent tooling than MIT,
- explicit patent language.

This is not approval to switch to Apache-2.0 now.

## Why Not MIT Now

MIT is simple and adoption-friendly.

It is too permissive for the current stage because Source-Wire is still separating:

- public contracts,
- private implementation,
- future runtime,
- hosted memory,
- business use cases.

## Why Not Apache-2.0 Now

Apache-2.0 is probably the best open-source candidate later.

It still grants broad commercial reuse, so it should wait for explicit owner approval.

## Why Not Noncommercial Now

Noncommercial protects against commercial reuse.

It also makes adoption harder and should not be presented as normal open source.

It might become a business strategy, but it needs clearer owner intent and likely legal review.

## Why Not Dual-License Now

Dual licensing may fit later if Source-Wire splits into:

- open public contracts,
- commercial hosted/runtime package,
- private business implementation.

It is too complex for the next implementation step.

## What Unit 31 Should Build

Unit 31 should prepare an owner approval packet with:

- final license recommendation,
- options the owner can approve or reject,
- practical impact table,
- exact package metadata changes that would happen after approval,
- exact files that would be added,
- release and npm publish blockers that remain,
- legal-review warning,
- explicit no-publish boundary.

## What Unit 31 Should Not Build

Unit 31 should not:

- change package license,
- add a `LICENSE` file,
- change package version,
- publish npm,
- create a GitHub release,
- deploy services,
- add runtime backend behavior.

## Boundary Confirmation

This recommendation does not approve a license change.

It recommends one more owner decision gate before any release action.
