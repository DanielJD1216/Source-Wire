# Source-Wire License Decision Implementation Plan

Status: implemented.

This plan records the implemented Apache-2.0 source package license path. It does not approve npm publishing, GitHub release publishing, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Use this after reading the [Owner License Decision Workflow](owner-license-decision-workflow.md) to understand what was implemented and which decision paths remain separate future work.

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
ok license implementation complete
```

## Current State

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.0.0` |
| `LICENSE` file | present |
| License decision record | implemented |
| npm publishing | blocked |
| GitHub release publishing | blocked |
| Hosted runtime | blocked |
| Contributions | blocked |
| Source package reuse | allowed under Apache-2.0 |

## Decision Paths

### Path 1: Apache-2.0 Implementation

Implemented after this exact owner decision:

```text
Approved for a future Source-Wire license implementation unit: implement Apache-2.0 licensing. Add the Apache-2.0 LICENSE file, update package metadata from UNLICENSED to Apache-2.0, update public docs and release gate expectations, and keep package version 0.0.0. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

Implemented changes:

- added unmodified Apache License 2.0 text as `LICENSE`,
- changed `package.json` license from `UNLICENSED` to `Apache-2.0`,
- updated release gate expectations,
- updated public docs that described the old pending license state,
- kept package version `0.0.0`,
- kept npm publishing blocked,
- kept GitHub release publishing blocked,
- kept hosted runtime blocked,
- kept contribution acceptance blocked.

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

Status: historical option, not selected.

Apache-2.0 implementation is complete.

Historical option only. It was not selected.

Use only after a separate future owner decision:

```text
Approved for a future Source-Wire license decision unit: keep Source-Wire UNLICENSED and version 0.0.0.
```

Next unit:

```text
Source-Wire Explicit Stay-Unlicensed Decision Record
```

### Path 3: Legal Review First

Historical option only. It was not selected.

Use only after a separate future owner decision:

```text
Approved for a future Source-Wire legal review unit: prepare and route license, contributor, commercial reuse, support, security, brand, hosted runtime, and private-data boundary questions for legal or owner review.
```

Next unit:

```text
Source-Wire Legal Review Routing Packet
```

### Path 4: Compare Source-Available Options

Historical option only. It was not selected.

Use only after a separate future owner decision:

```text
Approved for a future Source-Wire license comparison unit: compare source-available and noncommercial license options before any package metadata, LICENSE file, npm publishing, GitHub release, deployment, hosted runtime, or contribution acceptance change.
```

Next unit:

```text
Source-Wire Source-Available License Comparison
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
- production runtime behavior is claimed,
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
