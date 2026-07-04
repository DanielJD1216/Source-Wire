# Source-Wire Owner Approval Record Packet

Status: owner approval copy packet only.

This packet does not approve npm publishing, GitHub release publishing, release tags, package version changes, deployment, repository ruleset governance, hosted runtime behavior, production runtime use, code contribution acceptance, or real data examples.

## Purpose

Use this packet when the owner is ready to record an exact approval for one of the remaining Source-Wire decision issues.

Approval must be recorded separately in the matching public issue, either in an `Owner Approval Record` section or in an issue comment containing the exact approval text.

Do not edit package metadata, publish npm, create a GitHub release, create tags, deploy services, enable branch governance, accept code contributions, or start hosted runtime work from this packet.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run owner:approval-packet
```

Expected markers:

```text
ok owner approval packet ready
ok exact owner approval texts available
blocked approval recording is manual owner action
```

For a guarded dry-run or exact-text issue-comment recorder, run:

```bash
npm run owner:record-approval
npm run owner:record-approval -- --issue 255
npm run owner:record-approval -- --target patch-release-implementation
npm run owner:record-approval -- --target hosted-runtime-child-issue-publication
npm run owner:record-approval -- --target runtime-skeleton-implementation
npm run owner:record-approval -- --target threat-model-implementation
npm run owner:record-approval -- --target database-posture-implementation
npm run owner:record-approval -- --target public-safe-fixture-implementation
npm run owner:record-approval -- --target deployment-boundary-implementation
```

The recorder does not write unless `--write` and a matching `--confirm-exact` value are supplied.

After recording an approval separately, check status with:

```bash
npm run owner:decision-status
```

For hosted-runtime child issue publication approval only, also run:

```bash
npm run runtime:child-issue-approval-status
```

For patch release approval only, also run:

```bash
npm run release:patch-execution-preflight
```

For release approval only, also run:

```bash
npm run release:approval-status
```

## Current Approval Targets

| Issue | Decision | Current execution boundary |
| --- | --- | --- |
| `#255` | First public release path | Record approval before a future release implementation unit. |
| `#255`, target `patch-release-implementation` | Patch release path | Record approval before a future patch release for the immutable npm `0.1.0` exported-version mismatch. |
| `#256` | Branch governance path | Record approval before a future branch governance implementation unit. |
| `#257` | Hosted runtime PRD path | Record approval before a future hosted runtime PRD unit. |
| `#257`, target `hosted-runtime-child-issue-publication` | Hosted runtime child issue publication path | Record approval before publishing the six PRD/planning child issues. |
| `#257`, target `runtime-skeleton-implementation` | Runtime skeleton implementation path | Record approval before a future narrow runtime skeleton implementation unit. |
| `#259`, target `threat-model-implementation` | Threat model implementation path | Record approval before a future synthetic trust-boundary implementation unit. |
| `#262`, target `database-posture-implementation` | Database posture implementation path | Record approval before a future synthetic database posture implementation unit. |
| `#263`, target `public-safe-fixture-implementation` | Public-safe fixture implementation path | Record approval before a future synthetic fixture implementation unit. |
| `#264`, target `deployment-boundary-implementation` | Deployment boundary implementation path | Record approval before a future synthetic deployment-boundary implementation unit. |
| `#258` | Contribution terms path | Completed contribution terms PRD approval; code contribution acceptance still needs a separate future implementation approval. |

## Exact Approval Texts

Copy exactly one of these only when the owner is ready to approve that future unit.

### Issue #255: First public release path

Target: `release-implementation`

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

### Issue #255: Patch release path

Target: `patch-release-implementation`

```text
Approved for a future Source-Wire patch release implementation unit: publish a patch release that corrects the exported SOURCE_WIRE_PACKAGE_VERSION mismatch in the npm package. Use version 0.1.1 unless the implementation unit finds a blocking reason to choose a different explicit patch version. Create the matching GitHub release and tag only after final release-candidate verification. Keep hosted runtime behavior, hosted-runtime child issue publication, production runtime claims, deployment, real user data, and code contribution acceptance blocked.
```

### Issue #256: Branch governance path

Target: `branch-governance-implementation`

```text
Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.
```

### Issue #257: Hosted runtime PRD path

Target: `hosted-runtime-prd`

```text
Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit.
```

### Issue #257: Hosted runtime child issue publication path

Target: `hosted-runtime-child-issue-publication`

```text
Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.
```

### Issue #257: Runtime skeleton implementation path

Target: `runtime-skeleton-implementation`

```text
Approved for a future Source-Wire owner-hosted runtime skeleton implementation unit: build a public-safe synthetic owner-hosted API policy route skeleton and MCP adapter skeleton using the private Unit 25 through Unit 30 proof trail as redacted evidence only. Use synthetic fixtures only. Do not copy private implementation code or AGPLv3 code. Do not add real user data, client data, database migrations, real database connections, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, or public contribution acceptance. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.
```

### Issue #259: Threat model implementation path

Target: `threat-model-implementation`

```text
Approved for a future Source-Wire threat model implementation unit: build a public-safe synthetic trust-boundary package and validation smoke tests for unauthorized callers, cross-namespace access, source-to-memory separation, prompt-injection handling, secrets handling, audit gaps, backup and restore risk, deployment misconfiguration, MCP bypass prevention, and owner/application-controlled trusted memory approval. Use synthetic fixtures only. Do not add API server implementation, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.
```

### Issue #262: Database posture implementation path

Target: `database-posture-implementation`

```text
Approved for a future Source-Wire database posture implementation unit: build a public-safe synthetic database posture package that defines data-class contracts, lifecycle state fixtures, namespace isolation fixtures, deletion/retention fixtures, backup/restore risk fixtures, and validation/smoke checks. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.
```

### Issue #263: Public-safe fixture implementation path

Target: `public-safe-fixture-implementation`

```text
Approved for a future Source-Wire public-safe fixture implementation unit: build a synthetic hosted-runtime fixture package and validation smoke tests for caller identity, namespaces, source evidence, candidates, trusted memory, denied cases, audit metadata, and no-auto-promotion. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Fixtures must not include real local paths, account IDs, emails, domains, tokens, screenshots, client data, production exports, or private proof content. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.
```

### Issue #264: Deployment boundary implementation path

Target: `deployment-boundary-implementation`

```text
Approved for a future Source-Wire deployment boundary implementation unit: build a public-safe synthetic deployment readiness package and validation smoke tests for local development, owner-hosted runtime, managed-hosted deferral, stop conditions, rollback evidence, claim boundaries, and no-hosted-service proof. Use synthetic fixtures only. Do not add deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source-Wire must not imply it hosts memory for users. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.
```

### Issue #258: Contribution terms path

Target: `contribution-terms-prd`

```text
Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit.
```

## Manual Recording Options

Option A: add an issue comment containing the exact approval text.

Option B: edit the issue body and add:

```text
## Owner Approval Record

<exact approval text>
```

The status checks intentionally require this separate record so approval text in docs or scripts is not mistaken for an actual owner decision.

## Still Blocked

Until a matching exact approval is recorded and a focused implementation unit runs, these stay blocked:

- npm publishing,
- GitHub release publishing,
- release tags,
- package version change,
- repository ruleset governance,
- hosted runtime,
- production runtime use,
- runtime skeleton implementation,
- threat model implementation,
- database posture implementation,
- public-safe fixture implementation,
- deployment boundary implementation,
- code contribution acceptance.

## Related Docs

- [Owner Launch Checklist](owner-launch-checklist.md)
- [Owner Approval Recorder](owner-approval-recorder.md)
- [Launch Decision Status](launch-decision-status.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
- [Branch Governance Approval Request](branch-governance-approval-request.md)
- [Runtime Skeleton Implementation Packet](runtime-skeleton-implementation-packet.md)
- [Threat Model Implementation Packet](threat-model-implementation-packet.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Deployment Boundary Implementation Packet](deployment-boundary-implementation-packet.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
