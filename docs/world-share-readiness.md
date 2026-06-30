# Source-Wire World-Share Readiness

Source-Wire is ready to share for technical review.

It is not ready for broad public reuse, redistribution, npm publishing, GitHub release publishing, deployment, or hosted runtime use.

## Purpose

This page prevents one mistake:

```text
Public repo equals open-source launch.
```

That is false for Source-Wire today.

Public visibility currently means reviewers can inspect contracts, schemas, fixtures, examples, docs, and readiness gates. It does not grant reuse rights.

## Current Share State

| Area | Current state |
| --- | --- |
| Technical review | Ready |
| Broad reuse | Blocked |
| Open-source licensing | Blocked |
| npm publishing | Blocked |
| GitHub release | Blocked |
| Hosted runtime | Blocked |
| Code contributions | Blocked |
| Real user data examples | Blocked |

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run world:readiness
```

Expected markers:

```text
ok world share technical review ready
blocked world share broad reuse
```

This command does not publish npm, create a GitHub release, deploy services, add a `LICENSE` file, change package metadata, accept contributions, start runtime services, connect to a database, or grant reuse rights.

## What You Can Do Now

Use [Share For Technical Review](share-for-review.md) to send the repo to a technical reviewer.

Safe current action:

```text
Please review Source-Wire as a public technical-review repo. It is UNLICENSED, unpublished, unreleased, and not hosted.
```

## What Must Happen Before Broad Public Reuse

Before Source-Wire can be described as open source, ready to use, or reusable by the public, the owner must approve and implement a license path from [License Decision Gate](license-decision-gate.md).

The likely path is Apache-2.0, but it is not approved yet.

Read:

- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md)
- [Future License Change Plan](future-license-change-plan.md)

## What License Approval Still Would Not Allow

Even after a future license approval, separate approvals would still be required for:

- npm publishing,
- GitHub release publishing,
- deployment,
- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- live connectors,
- Mission Control UI,
- real user data examples,
- trusted Memory Record auto-promotion.

## Bottom Line

Source-Wire can be shared for technical review now.

Source-Wire cannot be shared as an open-source project, production dependency, hosted memory service, or reusable package until the owner approves and implements the missing release decisions.
