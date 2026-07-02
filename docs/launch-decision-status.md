# Source-Wire Launch Decision Status

Status: read-only launch decision report.

This command reports the current launch boundary. It does not publish a new npm version, create a new GitHub release, deploy services, accept contributions, or approve production runtime use.

## Purpose

Use this when the owner, a reviewer, or an agent needs one quick answer:

```text
What is ready, what is blocked, and what approval is next?
```

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run launch:decision-status
```

Expected markers:

```text
ok launch decision status ready
ok apache 2 license implemented
ok source repo sharing ready
ok npm package published @source-wire/contracts@0.1.0
ok github release published v0.1.0
blocked hosted runtime implementation
blocked contributions not accepted
```

## What It Checks

The command verifies:

- package name remains `@source-wire/contracts`,
- package version remains `0.1.0`,
- package license remains `Apache-2.0`,
- `LICENSE` file exists,
- npm package publication is complete for `@source-wire/contracts@0.1.0`,
- GitHub release publication is complete for `v0.1.0`,
- launch decision docs exist,
- support, security, and contribution boundary docs exist.

## Current Meaning

| Area | Status |
| --- | --- |
| Technical review sharing | Ready |
| Source repo sharing | Ready under Apache-2.0 |
| Owner license approval | Captured |
| License decision record | Implemented |
| License implementation | Complete |
| npm publishing | Published as `@source-wire/contracts@0.1.0` |
| GitHub release | Published as `v0.1.0` |
| Hosted runtime PRD | Approved |
| Hosted runtime implementation | Blocked |
| Contributions | Blocked |

## Next Physical Action

Use the public package and release for review, then choose the next approval lane:

```bash
npm install @source-wire/contracts
npm run launch:decision-status
npm run owner:decision-status
```

The first public release path, minimal branch-governance path, contribution terms PRD path, and hosted runtime PRD path have been approved or executed as applicable. The remaining runtime lane is child issue publication and later hosted runtime implementation. This status command does not create new release artifacts, deploy services, enable hosted runtime, enable repository rulesets, or accept contributions.

## Owner Decision Status

The command prints the current public owner-decision issues:

- Completed: [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255)
- Completed: [#256 Branch governance path](https://github.com/DanielJD1216/Source-Wire/issues/256)
- Completed: [#258 Contribution terms before accepting code](https://github.com/DanielJD1216/Source-Wire/issues/258)
- Approved for PRD only: [#257 Hosted runtime PRD path](https://github.com/DanielJD1216/Source-Wire/issues/257)

## Related Docs

- [Share For Technical Review](share-for-review.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [Owner License Approval Preflight](owner-license-approval-preflight.md)
- [Owner License Decision Workflow](owner-license-decision-workflow.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [World-Share Readiness](world-share-readiness.md)
- [License Decision Gate](license-decision-gate.md)
- [Publish Readiness](publish-readiness.md)
- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Implementation Runbook](release-implementation-runbook.md)
