# Source-Wire Release Implementation Rehearsal

Status: non-mutating release rehearsal only.

This rehearsal does not publish npm, create a GitHub release, create a tag, change package version, change package-lock metadata, deploy services, start hosted runtime behavior, approve production runtime use, or accept code contributions.

## Purpose

Use this check before approved release execution.

It proves the planned first release path is internally consistent while the real package remains blocked at version `0.0.0`.

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
blocked release mutation not performed
```

## What It Checks

The command verifies:

- real `package.json` version remains `0.0.0`,
- real `package-lock.json` root version remains `0.0.0`,
- license remains `Apache-2.0`,
- `publishConfig.access` remains `restricted`,
- the simulated future manifest uses `0.1.0`,
- simulated future `publishConfig.access` is `public`,
- release runbook, version recommendation, release candidate, approval request, and release notes docs exist,
- required package paths include the release runbook, publish config plan, version recommendation, release notes, `README.md`, `LICENSE`, and `package.json`,
- package scripts do not include direct publish, release, tag, version, or deploy commands.

## What It Does Not Do

The command does not:

- edit `package.json`,
- edit `package-lock.json`,
- run `npm version`,
- run `npm publish`,
- create a GitHub release,
- create a git tag,
- deploy services,
- enable hosted runtime behavior,
- accept code contributions.

## Current Meaning

If this check passes, Source-Wire has a rehearsed future release path for `0.1.0` with public npm package access, but release execution is still unperformed.

The real package must stay at `0.0.0` until approved release execution opens the release channel.

## Related Docs

- [Release Implementation Runbook](release-implementation-runbook.md)
- [Release Publish Config Plan](release-publish-config-plan.md)
- [First Release Version Recommendation](release-version-recommendation.md)
- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
- [Draft GitHub Release Notes](release-notes-draft.md)
- [Launch Decision Status](launch-decision-status.md)
