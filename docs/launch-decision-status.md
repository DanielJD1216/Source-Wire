# Source-Wire Launch Decision Status

Status: read-only launch decision report.

This command does not approve licensing, add a `LICENSE` file, change package metadata, publish npm, create a GitHub release, deploy services, accept contributions, or grant reuse rights.

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
ok technical review sharing ready
blocked legal approval not granted
blocked owner launch approval missing
blocked license implementation missing
blocked npm publishing not approved
blocked github release not approved
blocked hosted runtime not approved
blocked contributions not accepted
```

## What It Checks

The command verifies:

- package name remains `@source-wire/contracts`,
- package version remains `0.0.0`,
- package license remains `UNLICENSED`,
- no `LICENSE` file exists,
- npm publishing remains blocked through restricted publish config,
- launch decision docs exist,
- support, security, and contribution boundary docs exist.

## Current Meaning

| Area | Status |
| --- | --- |
| Technical review sharing | Ready |
| Legal approval | Blocked |
| Owner launch approval | Blocked |
| License decision record | Pending |
| License implementation | Blocked |
| npm publishing | Blocked |
| GitHub release | Blocked |
| Hosted runtime | Blocked |
| Contributions | Blocked |

## Related Docs

- [Share For Technical Review](share-for-review.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [License Approval Decision Record](license-approval-decision-record.md)
- [License Approval Request Packet](license-approval-request-packet.md)
- [Owner License Approval Preflight](owner-license-approval-preflight.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [World-Share Readiness](world-share-readiness.md)
- [License Decision Gate](license-decision-gate.md)
- [Publish Readiness](publish-readiness.md)
