# Source-Wire Contribution Terms PRD Decision Preflight

Status: contribution terms PRD decision preflight only.

This preflight does not accept code contributions, change contribution policy, add a CLA, add a DCO requirement, publish npm, create a GitHub release, deploy services, add hosted runtime behavior, enable branch governance, or approve production runtime use.

## Purpose

Use this before opening a future contribution terms PRD unit from issue `#258`.

This command proves the public source-package state, owner decision issues, open-issue boundary, contribution terms preparation packet, public intake boundary, pull request boundary, and launch decision blockers are current before contribution terms PRD work starts.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run contribution:terms-decision-preflight
```

This runs:

- `npm run world:share-preflight`
- `npm run owner:decision-status`
- `npm run owner:open-issues-status`
- `npm run contribution:terms-preparation`
- `npm run pull-request:boundary`
- `npm run intake:boundary`
- `npm run launch:decision-status`

Expected final markers:

```text
ok contribution terms PRD decision preflight ready
ok world share preflight current
ok owner decision status current
ok owner open issue boundary current
ok contribution terms PRD evidence current
ok public intake boundary current
blocked contribution terms PRD approval missing
```

## Required Approval Before PRD Work

Issue `#258` must contain the exact owner approval text before a future contribution terms PRD unit starts:

```text
Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit.
```

This check intentionally does not count recommended approval text as approval. Approval must be recorded separately in issue `#258`.

## Stop Conditions

Stop before PRD work if:

- issue `#258` does not contain exact owner approval,
- `npm run owner:decision-status` cannot read issue `#258`,
- `npm run owner:open-issues-status` shows unexpected open issues,
- `npm run world:share-preflight` fails,
- `npm run contribution:terms-preparation` fails,
- `npm run pull-request:boundary` fails,
- `npm run intake:boundary` fails,
- the planned PRD accepts code contributions instead of defining contribution terms,
- private data, secrets, local paths, real source payloads, real chat logs, client names, account IDs, screenshots, or production exports are requested.

## Still Blocked

This preflight keeps these blocked:

- code contribution acceptance,
- CLA or DCO enforcement,
- public pull request acceptance,
- npm publishing,
- GitHub release publishing,
- release tags,
- package version changes,
- deployment,
- hosted runtime behavior,
- branch governance enforcement,
- production runtime use.

## Related Docs

- [Contribution Terms PRD Preparation](contribution-terms-prd-preparation.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Owner Open Issues Status](owner-open-issues-status.md)
- [Pull Request Boundary](https://github.com/DanielJD1216/Source-Wire/blob/main/.github/pull_request_template.md)
- [Launch Decision Status](launch-decision-status.md)
- [World-Share Readiness](world-share-readiness.md)
