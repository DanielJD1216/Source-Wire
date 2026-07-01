# Source-Wire Release Publish Config Plan

Status: publish-config transition plan only.

This plan does not change package metadata, publish npm, create a GitHub release, create tags, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Source-Wire is a scoped npm package. While npm publishing is blocked, the current package metadata intentionally keeps publishing closed:

```text
Current package version: 0.0.0
Current `publishConfig.access`: `restricted`
```

The first approved public npm release needs an explicit access transition so the package is not accidentally prepared as a private scoped package.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

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
ok future npm public access documented
blocked publish config mutation not performed
```

## Current Boundary

Current `publishConfig.access`: `restricted`

That is correct while npm publishing is blocked.

## Future Approved Release Value

Future approved release value: `public`

During an approved release execution unit, after npm auth is ready and before `npm publish`, the release implementer must:

1. Change `package.json` version from `0.0.0` to `0.1.0`.
2. Change `package-lock.json` version from `0.0.0` to `0.1.0`.
3. Change `publishConfig.access` from `restricted` to `public`.
4. Re-run `npm run publish:readiness`.
5. Re-run `npm run release:artifact-manifest`.
6. Confirm GitHub Actions Package Checks pass on the exact release commit.
7. Re-run `npm run release:execution-preflight`.

## Stop Conditions

Stop before publishing if any of these are true:

- `publishConfig.access` is still `restricted` during the approved public npm release execution unit,
- package version and package-lock version do not match,
- the intended release version is not explicit,
- `npm run release:auth-preflight` does not show release publish credentials ready,
- `npm run publish:readiness` fails after metadata changes,
- `npm run release:artifact-manifest` was not regenerated after metadata changes,
- GitHub Actions Package Checks are not green on the exact release commit,
- hosted runtime, production runtime, or contribution acceptance changed without separate approval.

## Still Blocked

Until approved release execution starts:

- `publishConfig.access` remains `restricted`,
- package version remains `0.0.0`,
- package-lock version remains `0.0.0`,
- npm publishing remains blocked,
- GitHub release publishing remains blocked,
- release tag creation remains blocked.
