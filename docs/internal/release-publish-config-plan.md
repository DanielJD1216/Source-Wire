# Source-Wire Release Publish Config Plan

Status: publish-config transition plan only.

This plan does not change package metadata, publish npm, create a GitHub release, create tags, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Source-Wire is a scoped npm package. The first public release is complete, so the current package metadata intentionally keeps public package access explicit:

```text
Current package version: 0.1.0
Current `publishConfig.access`: `public`
```

Future package version changes still need a separate owner-approved release unit.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:publish-config-plan
```

Expected markers:

```text
ok release publish config plan ready
ok current npm public access documented
blocked future publish config mutation not performed
```

## Current Boundary

Current `publishConfig.access`: `public`

That is correct after the first public npm release.

## Future New Release Boundary

Future new release changes require separate approval.

During a future approved release execution unit, after npm auth is ready and before publishing a new package version, the release implementer must:

1. Choose the next explicit package version.
2. Change `package.json` and `package-lock.json` to that approved version.
3. Keep `publishConfig.access` as `public`.
4. Re-run `npm run publish:readiness`.
5. Re-run `npm run release:artifact-manifest`.
6. Confirm GitHub Actions Package Checks pass on the exact release commit.
7. Re-run `npm run release:execution-preflight`.

## Stop Conditions

Stop before publishing if any of these are true:

- `publishConfig.access` changes away from `public` without an explicit owner decision,
- package version and package-lock version do not match,
- the intended release version is not explicit,
- `npm run release:auth-preflight` does not show release publish credentials ready,
- `npm run publish:readiness` fails after metadata changes,
- `npm run release:artifact-manifest` was not regenerated after metadata changes,
- GitHub Actions Package Checks are not green on the exact release commit,
- hosted runtime, production runtime, or contribution acceptance changed without separate approval.

## Still Blocked

Until a future new release execution is approved:

- `publishConfig.access` remains `public`,
- package version remains `0.1.0`,
- package-lock version remains `0.1.0`,
- publishing a new npm version remains blocked,
- creating a new GitHub release remains blocked,
- creating a new release tag remains blocked.
