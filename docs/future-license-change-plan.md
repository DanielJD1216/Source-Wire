# Source-Wire Future License Change Plan

Date: 2026-06-30

Status: future plan only.

## Purpose

This plan lists what would happen only after the owner approves a future license, publishing, release, hosted runtime, or contribution-policy change.

Apache-2.0 source package licensing is already implemented.

For the current one-page owner decision gate, read [License Decision Gate](license-decision-gate.md).

For the full decision-path implementation map, read [License Decision Implementation Plan](license-decision-implementation-plan.md).

For the Apache-2.0 record, read [Apache-2.0 License Implementation Readiness](apache-2-license-implementation-readiness.md).

## Current Boundary

Current Source-Wire state:

- package license: `Apache-2.0`,
- package version: `0.0.0`,
- `LICENSE` file present,
- source package reuse allowed under Apache-2.0,
- npm publishing blocked,
- GitHub release publishing blocked,
- runtime backend blocked,
- code contribution acceptance blocked.

## If npm Publishing Is Approved Later

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Expected future work:

- keep the license as `Apache-2.0`,
- choose a release version or explicitly keep `0.0.0`,
- update publish access policy,
- add release notes or changelog if needed,
- run `npm run publish:readiness`,
- perform a separate publish proof,
- keep hosted runtime work separate.

## If GitHub Release Publishing Is Approved Later

Expected future work:

- keep the license as `Apache-2.0`,
- define tag naming and release notes,
- decide whether the release should include package artifacts,
- verify docs and marker maps,
- keep npm publishing separate unless explicitly approved.

## If A Different License Is Approved Later

Expected future work:

- run a separate decision prototype or legal review,
- choose exact license text,
- update package metadata only after approval,
- replace or add the approved license file only after approval,
- clearly state whether the project remains open source, source-available, or commercially restricted,
- keep npm publishing separate unless a release PRD approves it.

## If Legal Review Is Required First

Expected future work:

- keep package license as `Apache-2.0` unless counsel or owner approves a change,
- collect questions for counsel,
- decide contributor policy,
- decide public support boundary,
- decide hosted or commercial runtime boundary,
- return to an owner approval packet after review.

## Explicit Non-Goals

This future plan does not approve:

- changing package license,
- changing package version,
- npm publishing,
- GitHub release publishing,
- deployment,
- runtime backend behavior,
- accepting contributors,
- private implementation extraction.

## Next Implementation Gate

If the owner approves any future change, open a focused PRD for that single lane. Do not mix license changes, npm publishing, GitHub releases, hosted runtime work, and contribution acceptance in one unbounded unit.
