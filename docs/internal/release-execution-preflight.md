# Source-Wire Release Execution Preflight

Status: owner-side release execution preflight only.

This command is read-only. It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this command before any future approved release implementation unit.

It gathers the strongest release-execution evidence in one place:

- exact release approval status,
- npm authentication, npm publish second-factor status, and GitHub authentication status,
- release decision preflight,
- full package readiness,
- release artifact manifest,
- live world-share status,
- live release tag boundary,
- live npm registry boundary.

Current state: issue `#255` contains exact owner approval evidence, the first npm package is published as `@source-wire/contracts@0.1.0`, the matching GitHub release is published as `v0.1.0`, GitHub authentication is ready, and npm release authentication is owner-controlled. The expected result is ready for read-only evidence gathering, while future release mutation remains blocked until a new approved release unit exists.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:execution-preflight
```

Expected current markers:

```text
ok release execution preflight ready
ok release approval status current
ok release auth preflight current
ok release decision preflight current
ok publish readiness current
ok release artifact evidence current
ok live release boundaries current
ok exact release approval recorded
ok release publish credentials ready
```

## Checks Run

The command runs:

```bash
npm run release:approval-status
npm run release:auth-preflight
npm run release:decision-preflight
npm run publish:readiness
npm run release:artifact-manifest
npm run world:live-status
npm run release:live-tags
npm run registry:live-npm
```

## Stop Conditions

Stop before changing package version, publishing npm, creating a GitHub release, or creating tags if any of these are true:

- issue `#255` does not contain the exact owner approval text,
- `npm run release:auth-preflight` does not show release publish credentials ready,
- npm publish second-factor evidence is missing for a future approved release mutation,
- `npm run release:approval-status` does not show separate exact approval evidence,
- `npm run release:decision-preflight` fails,
- `npm run publish:readiness` fails,
- `npm run release:artifact-manifest` does not record shasum and integrity,
- `npm run world:live-status` does not match the expected public source-package boundary,
- `npm run release:live-tags` does not show the expected release tag and GitHub release,
- `npm run registry:live-npm` does not show `@source-wire/contracts@0.1.0` as published,
- public CI is not green on the exact release commit,
- package contents differ from the approved release package,
- public docs imply hosted runtime or production runtime behavior,
- contribution terms are still missing but contribution acceptance is being requested,
- any private data, local paths, real user records, or private proof history appear in package contents.

## Still Blocked

Until a future release execution unit is approved and its preflights pass:

- new npm package versions remain blocked,
- new GitHub release publishing remains blocked,
- new release tag creation remains blocked,
- package version remains `0.1.0`,
- deployment remains blocked,
- hosted runtime behavior remains blocked,
- production runtime use remains blocked,
- code contribution acceptance remains blocked.

## Related Docs

- [Release Implementation Preparation](release-implementation-preparation.md)
- [Release Implementation Runbook](release-implementation-runbook.md)
- [Release Auth Preflight](release-auth-preflight.md)
- [Release Approval Request Packet](release-approval-request-packet.md)
- [Release Artifact Manifest](release-artifact-manifest.md)
- [Publish Readiness](../guides/publish-readiness.md)
