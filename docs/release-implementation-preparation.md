# Source-Wire Release Implementation Preparation

Status: release implementation preparation only.

This packet does not approve npm publishing, GitHub release publishing, release tags, package version changes, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

Do not execute release mutation until npm and GitHub release credentials are ready.

## Purpose

Use this packet after the owner approves the first public release path. It turns the release runbook into a concrete execution checklist with required evidence, stop conditions, and exact commands.

The recorded approval text is:

```text
Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.
```

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:implementation-preparation
```

Expected markers:

```text
ok release implementation preparation ready
ok release implementation evidence map ready
blocked release execution not performed
```

## Required Evidence Before Execution

Before any version change, npm publish, tag, or GitHub release:

1. Issue `#255` must contain the exact owner approval text.
2. `npm run release:approval-status` must show the exact approval is recorded separately in issue `#255`.
3. `npm run release:auth-preflight` must show npm and GitHub authentication are ready.
4. `npm run release:decision-preflight` must pass.
5. `npm run publish:readiness` must pass from a clean checkout.
6. `npm run release:artifact-manifest` must record package identity, shasum, and integrity.
7. GitHub Actions Package Checks must pass on the exact release commit.
8. Release notes and version target must still be intentional.
9. `publishConfig.access` must be intentionally changed from `restricted` to `public` during the approved public npm release execution unit.
10. Package contents must not include private data, local paths, real user records, or private proof history.

## Execution Checklist After Approval

Current state: issue `#255` contains exact release approval, but npm authentication is missing. Run this sequence again after npm login and before any release mutation.

```bash
git status --short --branch
npm run release:approval-status
npm run release:auth-preflight
npm run release:decision-preflight
npm run release:publish-config-plan
npm run publish:readiness
npm run release:artifact-manifest
gh run list --repo DanielJD1216/Source-Wire --workflow package-checks.yml --limit 5 --json databaseId,status,conclusion,url,headSha,createdAt
gh run watch <run-id> --repo DanielJD1216/Source-Wire --exit-status
```

If all evidence is green, the approved release implementation unit may change the package version to `0.1.0`, change `publishConfig.access` from `restricted` to `public`, rerun all gates, and then use the approved release commands:

```bash
npm publish
gh release create v0.1.0 --title "Source-Wire v0.1.0" --notes-file docs/release-notes-draft.md
```

Those commands are intentionally documented here as future execution commands, not package scripts. They must not be added to `package.json`.

## Stop Conditions

Stop before publishing or releasing if any of these are true:

- issue `#255` does not contain the exact owner approval text,
- `npm run release:approval-status` does not show separate exact approval evidence,
- `npm run release:auth-preflight` does not show release publish credentials ready,
- release version is not explicit,
- `publishConfig.access` is still `restricted` during the approved public npm release execution unit,
- `npm run release:decision-preflight` fails,
- `npm run publish:readiness` fails,
- `npm run release:artifact-manifest` does not record shasum and integrity,
- public CI is not green on the exact release commit,
- package contents differ from the approved release package,
- public docs imply hosted runtime or production runtime behavior,
- contribution terms are still missing but contribution acceptance is being requested,
- any private data, local paths, real user records, or private proof history appear in package contents.

## Not Included

This packet does not approve:

- hosted API server runtime,
- real MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record auto-promotion,
- accepting code contributions,
- branch protection or repository ruleset enforcement.

## Current Boundary

Until npm and GitHub release credentials are ready and approved release execution runs:

- npm publishing remains blocked,
- GitHub release publishing remains blocked,
- release tag creation remains blocked,
- package version remains `0.0.0`,
- deployment remains blocked,
- hosted runtime behavior remains blocked,
- production runtime claims remain blocked,
- code contribution acceptance remains blocked.

## Related Docs

- [Release Implementation Runbook](release-implementation-runbook.md)
- [Release Publish Config Plan](release-publish-config-plan.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
- [Release Candidate Readiness](release-candidate-readiness.md)
- [Release Artifact Manifest](release-artifact-manifest.md)
- [Draft GitHub Release Notes](release-notes-draft.md)
