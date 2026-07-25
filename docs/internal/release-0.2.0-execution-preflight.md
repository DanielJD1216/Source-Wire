# Source-Wire Contracts 0.2.0 Execution Preflight

Status: authenticated, read-only pre-publication gate.

This is the dedicated final execution preflight for the unpublished
`@source-wire/contracts@0.2.0` candidate. It fixes the circular older check
that expected npm and GitHub to show the candidate before the candidate could
be published.

## Command

Use Node.js `22.23.1` with npm from a clean checkout of the exact candidate
commit. For complete setup, read the
[Quickstart](../getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run release:0.2.0-execution-preflight
```

## What It Proves

- npm and GitHub authentication are ready,
- the focused `0.2.0` package and external-adapter gate passes,
- the working tree is clean,
- local `HEAD` matches `origin/main`,
- the latest hosted Package Checks run is green for that exact commit,
- npm access for `@source-wire/contracts` is public,
- npm still exposes `0.1.0` as `latest`,
- npm does not yet contain `0.2.0`,
- local and remote Git do not yet contain `v0.2.0`,
- GitHub does not yet contain a `v0.2.0` release,
- the public GitHub homepage points to the current reviewer guide.

## Expected Markers

```text
ok contracts 0.2.0 execution preflight ready
ok release publish credentials ready
ok exact-commit CI green
ok candidate absent from npm
ok candidate tag and release absent
blocked release mutation not performed
```

## Owner Go Boundary

Passing this command is readiness evidence, not release approval. A named owner
must issue a fresh explicit go for the exact candidate commit after this gate
passes.

## Still Blocked

The preflight does not publish npm, create a Git tag, create a GitHub release,
deploy services, connect a live provider, use real data, start a hosted runtime,
or permit automatic trusted-memory promotion.
