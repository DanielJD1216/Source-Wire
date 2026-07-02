# Source-Wire Release Auth Handoff

Status: owner-side npm authentication handoff only.

This handoff is read-only. It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.

## Purpose

Use this handoff when `npm run release:auth-preflight` reports:

```text
blocked npm auth missing
blocked release publish credentials missing
```

It tells the owner exactly what to do next without opening any release channel.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:auth-handoff
```

Expected markers:

```text
ok release auth handoff ready
ok npm authentication owner steps documented
blocked release auth owner action required
```

## Owner Action

Run npm authentication from an owner-controlled terminal:

```bash
npm login --registry=https://registry.npmjs.org/
npm whoami
```

Confirm `npm whoami` shows the expected npm account for publishing `@source-wire/contracts`.

Then confirm the account has a publish second-factor path. `npm whoami` alone is not enough for publish execution. npm may still reject `npm publish` unless one of these is true:

- npm 2FA for writes is enabled on the publishing account, and the publish command includes a current OTP,
- an owner-controlled granular npm publish token with bypass 2FA enabled is used only for the release command.

Then rerun the release gates:

```bash
npm run release:auth-preflight
npm run release:execution-preflight
```

## Stop Conditions

Do not run `npm publish` from this handoff.

Stop before:

- changing package version,
- publishing npm,
- creating a GitHub release,
- creating release tags,
- deploying services,
- enabling hosted runtime,
- accepting code contributions.

If `npm run release:auth-preflight` still prints `blocked release publish credentials missing`, do not continue release execution.

## Related Docs

- [Release Auth Preflight](release-auth-preflight.md)
- [Release Execution Preflight](release-execution-preflight.md)
- [Release Implementation Preparation](release-implementation-preparation.md)
- [Release Implementation Runbook](release-implementation-runbook.md)
