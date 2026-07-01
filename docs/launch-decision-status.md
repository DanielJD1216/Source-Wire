# Source-Wire Launch Decision Status

Status: read-only launch decision report.

This command reports the current launch boundary. It does not publish npm, create a GitHub release, deploy services, accept contributions, or approve production runtime use.

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
blocked npm publishing release execution not performed
blocked github release execution not performed
blocked hosted runtime not approved
blocked contributions not accepted
```

## What It Checks

The command verifies:

- package name remains `@source-wire/contracts`,
- package version remains `0.0.0`,
- package license remains `Apache-2.0`,
- `LICENSE` file exists,
- npm publishing remains blocked through restricted publish config,
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
| npm publishing | Blocked, release execution not performed |
| GitHub release | Blocked, release execution not performed |
| Hosted runtime | Blocked |
| Contributions | Blocked |

## Next Physical Action

Run the release auth handoff, authenticate npm, then run the release auth and execution preflights:

```bash
npm run release:auth-handoff
npm login --registry=https://registry.npmjs.org/
npm whoami
npm run release:auth-preflight
npm run release:execution-preflight
```

The recorded release path is:

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

This is still only a future approval path. This status command does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable hosted runtime, or accept contributions.

## Owner Decision Issues

The command prints the current public owner-decision issues:

- [#255 First public release path](https://github.com/DanielJD1216/Source-Wire/issues/255)
- [#256 Branch governance path](https://github.com/DanielJD1216/Source-Wire/issues/256)
- [#257 Hosted runtime PRD path](https://github.com/DanielJD1216/Source-Wire/issues/257)
- [#258 Contribution terms before accepting code](https://github.com/DanielJD1216/Source-Wire/issues/258)

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
