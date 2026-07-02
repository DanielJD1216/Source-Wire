# Source-Wire Release Implementation Rehearsal

Status: approved release metadata check.

This check does not publish npm, create a GitHub release, create a tag, deploy services, start hosted runtime behavior, approve production runtime use, or accept code contributions.

## Purpose

Use this check after approved release metadata is applied and before npm publish plus GitHub release creation.

It proves the first release metadata is internally consistent at version `0.1.0` with public npm package access while release channels are still waiting for final verification.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:implementation-rehearsal
```

Expected markers:

```text
ok release implementation rehearsal ready
ok future version rehearsal 0.1.0
ok future npm public access rehearsal
ok release metadata applied
```

## What It Checks

The command verifies:

- real `package.json` version is `0.1.0`,
- real `package-lock.json` root version is `0.1.0`,
- license remains `Apache-2.0`,
- real `publishConfig.access` is `public`,
- the simulated future manifest uses `0.1.0`,
- simulated future `publishConfig.access` is `public`,
- release runbook, version recommendation, release candidate, approval request, and release notes docs exist,
- required package paths include the release runbook, publish config plan, version recommendation, release notes, `README.md`, `LICENSE`, and `package.json`,
- package scripts do not include direct publish, release, tag, version, or deploy commands.

## What It Does Not Do

The command does not:

- run `npm publish`,
- create a GitHub release,
- create a git tag,
- deploy services,
- enable hosted runtime behavior,
- accept code contributions.

## Current Meaning

If this check passes, Source-Wire has approved release metadata applied for `0.1.0` with public npm package access, but npm publishing and GitHub release creation are still unperformed.

The next gate is final local readiness, exact-commit CI, then npm publish and matching GitHub release creation.

## Related Docs

- [Release Implementation Runbook](release-implementation-runbook.md)
- [Release Publish Config Plan](release-publish-config-plan.md)
- [First Release Version Recommendation](release-version-recommendation.md)
- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
- [Draft GitHub Release Notes](release-notes-draft.md)
- [Launch Decision Status](launch-decision-status.md)
