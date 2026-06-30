# Source-Wire License Decision Implementation Plan

Status: implementation plan only.

This plan does not approve a license change, public reuse, npm publishing, GitHub release publishing, deployment, hosted runtime behavior, or code contribution acceptance.

## Purpose

Use this after reading the [Owner License Decision Workflow](owner-license-decision-workflow.md), before opening any future license implementation unit.

It maps each owner decision option to the next implementation unit, allowed file changes, stop conditions, and verification checks.

Before opening a later implementation unit, use [Owner License Decision Intake](owner-license-decision-intake.md) or run `npm run owner:decision-intake` to confirm the decision has a single exact capture point.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run license:implementation-plan
```

Expected markers:

```text
ok license implementation plan ready
ok license decision paths mapped
blocked license implementation awaiting owner decision
```

## Current Blocked State

| Field | Current value |
| --- | --- |
| Package license | `UNLICENSED` |
| Package version | `0.0.0` |
| `LICENSE` file | none |
| License decision record | pending |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime | blocked |
| Contributions | blocked |
| Broad public reuse | blocked |

## Decision Paths

### Path 1: Apache-2.0 Implementation

Use only after this exact owner decision:

```text
Approved for a future Source-Wire license implementation unit: implement Apache-2.0 licensing.
```

Next unit:

```text
Source-Wire Apache-2.0 License Implementation Gate
```

Allowed implementation changes:

- add unmodified Apache License 2.0 text as `LICENSE`,
- change `package.json` license from `UNLICENSED` to `Apache-2.0`,
- update release gate expectations,
- update public docs that currently say the license is pending,
- keep package version `0.0.0`,
- keep npm publishing blocked,
- keep GitHub release publishing blocked,
- keep hosted runtime blocked,
- keep contribution acceptance blocked.

Verification:

```bash
test -f LICENSE
node -e "const p=require('./package.json'); if (p.license !== 'Apache-2.0') process.exit(1)"
npm run release:gate
npm run publish:readiness
npm run safety:scan
git diff --check
```

### Path 2: Stay Unlicensed

Use only after this exact owner decision:

```text
Approved for a future Source-Wire license decision unit: keep Source-Wire UNLICENSED and version 0.0.0.
```

Next unit:

```text
Source-Wire Explicit Stay-Unlicensed Decision Record
```

Allowed implementation changes:

- keep `package.json` license as `UNLICENSED`,
- keep no `LICENSE` file,
- update license decision docs from pending to explicit hold,
- update public reuse docs to say broad reuse remains blocked,
- keep npm publishing blocked,
- keep GitHub release publishing blocked,
- keep hosted runtime blocked,
- keep contribution acceptance blocked.

Verification:

```bash
test ! -f LICENSE
node -e "const p=require('./package.json'); if (p.license !== 'UNLICENSED') process.exit(1)"
npm run release:gate
npm run publish:readiness
npm run safety:scan
git diff --check
```

### Path 3: Legal Review First

Use only after this exact owner decision:

```text
Approved for a future Source-Wire legal review unit: prepare and route license, contributor, commercial reuse, support, security, brand, hosted runtime, and private-data boundary questions for legal or owner review.
```

Next unit:

```text
Source-Wire Legal Review Routing Packet
```

Allowed implementation changes:

- keep `package.json` license as `UNLICENSED`,
- keep no `LICENSE` file,
- prepare a review packet from existing legal questions,
- record the review routing state,
- keep broad public reuse blocked,
- keep npm publishing blocked,
- keep GitHub release publishing blocked,
- keep hosted runtime blocked,
- keep contribution acceptance blocked.

Verification:

```bash
test ! -f LICENSE
node -e "const p=require('./package.json'); if (p.license !== 'UNLICENSED') process.exit(1)"
npm run legal:packet
npm run release:gate
npm run publish:readiness
npm run safety:scan
git diff --check
```

### Path 4: Compare Source-Available Options

Use only after this exact owner decision:

```text
Approved for a future Source-Wire license comparison unit: compare source-available and noncommercial license options before any package metadata, LICENSE file, npm publishing, GitHub release, deployment, hosted runtime, or contribution acceptance change.
```

Next unit:

```text
Source-Wire Source-Available License Comparison
```

Allowed implementation changes:

- keep `package.json` license as `UNLICENSED`,
- keep no `LICENSE` file,
- compare source-available and noncommercial options without selecting one silently,
- record tradeoffs, allowed reuse, commercial restrictions, contribution implications, and hosted-runtime implications,
- keep broad public reuse blocked,
- keep npm publishing blocked,
- keep GitHub release publishing blocked,
- keep hosted runtime blocked,
- keep contribution acceptance blocked.

Verification:

```bash
test ! -f LICENSE
node -e "const p=require('./package.json'); if (p.license !== 'UNLICENSED') process.exit(1)"
npm run release:gate
npm run publish:readiness
npm run safety:scan
git diff --check
```

## Stop Conditions

Stop any future implementation if:

- owner approval is missing,
- owner approval does not match one exact option,
- the requested change mixes two decision paths,
- legal advice is required but not available,
- the package version changes away from `0.0.0`,
- npm publishing becomes possible without a publish PRD,
- GitHub release publishing is added without a release PRD,
- deployment behavior is added,
- hosted runtime behavior is added,
- contribution acceptance is added,
- real user data appears in public docs, fixtures, issues, or examples.

## Related Docs

- [Owner License Decision Workflow](owner-license-decision-workflow.md)
- [Owner License Decision Intake](owner-license-decision-intake.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [License Decision Gate](license-decision-gate.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Launch Decision Status](launch-decision-status.md)
