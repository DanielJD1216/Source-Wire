# Source-Wire Contribution Terms PRD Preparation

Status: future PRD preparation only.

This preparation packet does not accept code contributions, change contribution policy, add a CLA, add a DCO requirement, publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or approve production runtime use.

## Purpose

Use this packet before opening a future contribution terms PRD unit from issue `#258`.

The goal is to decide how public code contributions can be accepted later without mixing that decision into release, runtime, or support work.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run contribution:terms-preparation
```

Expected markers:

```text
ok contribution terms PRD preparation ready
ok contribution terms evidence map ready
ok exact contribution terms PRD approval recorded
blocked code contribution acceptance
```

Before asking the owner for a contribution terms PRD decision, run the complete read-only decision preflight:

```bash
npm run contribution:terms-decision-preflight
```

Expected final markers:

```text
ok contribution terms PRD decision preflight ready
ok world share preflight current
ok owner decision status current
ok owner open issue boundary current
ok contribution terms PRD evidence current
ok public intake boundary current
ok exact contribution terms PRD approval recorded
blocked code contribution acceptance
```

## Required Approval Before PRD Work

Issue `#258` must contain the exact owner approval text before a future contribution terms PRD unit starts:

```text
Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit.
```

## PRD Must Define

The future PRD must define:

- whether public code contributions will be accepted,
- DCO, CLA, or no-external-code posture,
- maintainer review policy,
- private-data exclusion rules,
- support expectations,
- security-report scope,
- license compatibility,
- pull request workflow boundaries,
- issue feedback versus code contribution boundary,
- rollback and stop conditions.

## Required Inputs

Before starting the PRD unit, review:

- [Contributing Boundary](../CONTRIBUTING.md)
- [Support Boundary](../SUPPORT.md)
- [Security Policy](../SECURITY.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Pull Request Template](https://github.com/DanielJD1216/Source-Wire/blob/main/.github/pull_request_template.md)

## Stop Conditions

Stop before PRD implementation if:

- issue `#258` does not contain exact owner approval,
- the PRD accepts code contributions before contribution terms are defined,
- the PRD asks reviewers to send private data, secrets, local paths, real source payloads, real chat logs, client names, account IDs, screenshots, or production exports,
- the PRD changes npm publishing, GitHub release, hosted runtime, deployment, or production runtime status,
- the PRD does not define license compatibility,
- the PRD does not define a maintainer review policy.

## Still Blocked

This packet keeps these blocked:

- code contribution acceptance,
- CLA or DCO enforcement,
- public pull request acceptance,
- npm publishing,
- GitHub release publishing,
- release tags,
- package version changes,
- deployment,
- hosted runtime behavior,
- production runtime use.

## Related Docs

- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [Owner Approval Record Packet](owner-approval-record-packet.md)
- [Launch Decision Status](launch-decision-status.md)
