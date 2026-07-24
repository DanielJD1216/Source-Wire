# Source-Wire Reviewer Feedback Guide

This guide explains how to give useful Source-Wire review feedback without crossing the current publishing, privacy, contribution, or runtime boundaries.

For the repo's current public state, read [Public Status](../status/public-status.md).

If you received the repo from someone else, start with [Share For Technical Review](share-for-review.md) for the Apache-2.0 source package boundary and first command path.

## Current Boundary

Source-Wire is Apache-2.0 licensed as a source package, but it is still:

- version `0.1.0`,
- published to npm as `@source-wire/contracts@0.1.0`,
- released on GitHub as `v0.1.0`,
- not a hosted runtime,
- not a real MCP server runtime,
- not a database or connector system,
- not approved for real user data examples.

Do not treat Apache-2.0 source package reuse or the first `0.1.0` release as permission to publish new package versions, create new GitHub releases, deploy services, accept code contributions, or claim production runtime readiness.

Public code contributions are not accepted yet.

## Choose The Right Issue Template

Use:

- Verification failure: a documented command fails or a readiness marker is missing.
- Docs or contract feedback: a doc, schema, fixture, example, or contract is unclear or inconsistent.
- Boundary or safety concern: something appears to blur license, runtime, privacy, real-data, publishing, or trusted-memory boundaries.

Blank issues are disabled so public feedback stays structured.

## What To Include

For verification failures, include:

- exact command,
- first observed error,
- Node.js version,
- npm version,
- dependency install state,
- first missing marker from [Publish Readiness](publish-readiness.md), when available.

For docs or contract feedback, include:

- file or surface,
- what is unclear or wrong,
- what would be clearer,
- affected area.

For boundary or safety concerns, include:

- boundary type,
- exact location,
- why the claim is too broad or risky,
- safer wording if you have it.

## What Not To Include

Do not include:

- secrets,
- tokens,
- private data,
- local private paths,
- private screenshots,
- production exports,
- account IDs,
- client names,
- real source payloads,
- real chat logs,
- real memory records,
- private implementation history.

Use synthetic examples or public repo references only.

## Good Feedback Examples

Good:

```text
docs/concepts/runtime-boundary.md says synthetic runtime, but README section X could be read as a hosted runtime. Please narrow the wording.
```

Good:

```text
npm run package:content-smoke fails on Node.js 20. The quickstart says Node.js 22, so the docs are correct, but the error message could point reviewers back to the prerequisite.
```

Good:

```text
The Source Graph Adapter Contract should include a tiny example of a resolved wikilink edge.
```

Not useful:

```text
Please add my real Obsidian vault as a fixture.
```

Not useful:

```text
Publish this to npm now.
```

Not useful:

```text
Remove owner approval so agents can create trusted memory automatically.
```

## Review Priorities

The most useful public review questions are:

- Are the contracts understandable to another agent-memory project?
- Are schemas and fixtures consistent?
- Are the readiness gates proving the right things?
- Are package exports usable from an installed package?
- Are public examples clearly synthetic?
- Are license, release, runtime, and data boundaries clear everywhere?
- Does any doc imply that Source-Wire hosts memory?
- Does any workflow imply trusted memory can be created without owner or application approval?

## Still Blocked

Feedback intake does not approve:

- Apache-2.0 license implementation,
- npm publishing,
- GitHub release publishing,
- hosted runtime backend,
- real MCP server runtime,
- database setup,
- live connectors,
- Mission Control UI,
- real data examples,
- code contribution acceptance,
- contribution enforcement or maintainer workflow changes.

These require separate owner decisions.
