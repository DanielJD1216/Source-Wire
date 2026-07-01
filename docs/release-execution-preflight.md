# Source-Wire Release Execution Preflight

Status: owner-side release execution preflight only.

This command is read-only. It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this command before any future approved release implementation unit.

It gathers the strongest release-execution evidence in one place:

- exact release approval status,
- npm and GitHub authentication status,
- release decision preflight,
- full package readiness,
- release artifact manifest,
- live world-share status,
- live release tag boundary,
- live npm registry boundary.

Today, the expected result is blocked if issue `#255` does not contain the exact owner approval record or this machine is not authenticated to npm and GitHub for release execution.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

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
blocked release publish credentials missing
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
- `npm run release:approval-status` does not show a separate exact approval record,
- `npm run release:decision-preflight` fails,
- `npm run publish:readiness` fails,
- `npm run release:artifact-manifest` does not record shasum and integrity,
- `npm run world:live-status` does not match the expected public source-package boundary,
- `npm run release:live-tags` shows existing local tags, remote tags, or GitHub releases,
- `npm run registry:live-npm` does not show Source-Wire as unpublished,
- public CI is not green on the exact release commit,
- package contents differ from the approved release package,
- public docs imply hosted runtime or production runtime behavior,
- contribution terms are still missing but contribution acceptance is being requested,
- any private data, local paths, real user records, or private proof history appear in package contents.

## Still Blocked

Until issue `#255` contains exact owner approval and a focused implementation unit runs:

- npm publishing remains blocked,
- GitHub release publishing remains blocked,
- release tag creation remains blocked,
- package version remains `0.0.0`,
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
- [Publish Readiness](publish-readiness.md)
