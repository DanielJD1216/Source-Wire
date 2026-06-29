# Source-Wire CI Checks

Source-Wire uses GitHub Actions to run package checks on push and pull request.

The workflow is for release confidence only. It does not publish, deploy, run a backend, or call private services.

## Workflow

Workflow file:

```text
.github/workflows/package-checks.yml
```

The workflow uses:

- `actions/checkout@v5`
- `actions/setup-node@v5`

Those actions use Node 24 for their own action internals.

Source-Wire package checks still run on Node 22 through `actions/setup-node`.

The workflow runs:

```bash
npm ci
npm run publish:readiness
```

## Local Mirror

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Run the same readiness gate locally:

```bash
npm run publish:readiness
```

## Check Coverage

For the runtime-boundary proof lane summarized across these checks, see [Runtime Boundary Readiness](runtime-boundary-readiness.md).

The readiness gate runs:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run validate:fixtures`
- `npm run verify:schema-exports`
- `npm run cli:smoke`
- `npm run runtime-boundary:smoke`
- `npm run safety:scan`
- `npm run release:gate`
- `npm run package:required-paths`
- `npm run package:dry-run`
- `npm run consumer:smoke`
- `npm run package:content-smoke`
- `npm run examples:installed-smoke`
- `npm run runtime-boundary:installed-smoke`
- `npm run runtime-boundary:diagnostics-smoke`
- `npm run readiness:report`
- `npm run docs:links`
- `npm run docs:command-setup`
- `npm run safety:scan`

`npm run ci:check` remains as a sub-gate inside `npm run publish:readiness`.

## Stable Log Markers

Use these markers when reading local or GitHub Actions Package Checks logs.

They prove package readiness and synthetic runtime-boundary behavior only. They do not prove a deployed backend, API server, MCP server runtime, database, connector, or real memory system exists.

| Marker group | Expected markers | What it proves |
| --- | --- | --- |
| Release gate | `ok release gate`, `ok license UNLICENSED`, `ok version 0.0.0`, `ok publishing blocked` | Release, license, version, and publishing boundaries are still blocked. |
| Package required paths | `ok package required paths` | The shared required package path manifest is sorted and duplicate-free. |
| Package dry run | `ok package dry-run @source-wire/contracts@0.0.0`, `ok package file count` | The local package can be packed and the shared required package path manifest is present. |
| Package content smoke | `ok package content smoke @source-wire/contracts@0.0.0`, `ok installed required paths`, `ok installed runtime readiness summary`, `ok installed runtime readiness summary content`, `ok installed package docs links` | The shared required package path manifest, README/docs/examples links, and runtime readiness summary assertions work from the packed package after install. |
| Runtime boundary smoke | `ok runtime boundary check authorized_read`, `ok runtime boundary check unauthorized_read_denial`, `ok runtime boundary check wrong_namespace_denial`, `ok runtime boundary check source_maintenance_no_auto_promotion`, `ok runtime boundary check owner_controlled_approval`, `ok runtime boundary check agent_approval_denial`, `ok synthetic runtime boundary smoke` | Synthetic owner-hosted API plus MCP boundary cases still fail closed and preserve no-auto-promotion. |
| Installed runtime boundary smoke | `ok runtime boundary installed smoke @source-wire/contracts@0.0.0`, `ok installed runtime boundary example` | The packaged synthetic runtime-boundary example runs after local tarball installation. |
| Diagnostic regression smoke | `ok runtime boundary diagnostics smoke authorized_read`, `ok diagnostic failure includes check name`, `ok diagnostic failure includes assertion`, `ok diagnostic failure includes expected value`, `ok diagnostic failure includes received value`, `ok diagnostic failure includes next action` | Boundary smoke failures remain useful to diagnose when a synthetic check breaks. |
| Docs and readiness | `ok readiness report`, `ok docs links`, `ok command docs setup` | Readiness summary, required readiness docs, local Markdown links, and command-doc setup pointers are current. |
| Public safety | `Findings: 0 high=0 medium=0 low=0` | Public-safety scan found no obvious private-data or secret findings. |

If one marker group is missing, inspect the command that owns that group before treating CI as release-ready.

## Marker Helper

Save the GitHub Actions log, then run the marker helper:

```bash
gh run view <run-id> --log > /tmp/source-wire-ci.log
npm run ci:markers -- /tmp/source-wire-ci.log
```

The marker helper also accepts stdin:

```bash
gh run view <run-id> --log | npm run ci:markers -- -
```

The helper checks the stable marker groups above and exits non-zero when required marker evidence is missing.

It does not call GitHub by itself, publish, deploy, start runtime services, connect to databases, or use real data.

## Public-Safety Scan

The public-safety scan is self-contained inside Source-Wire:

```bash
npm run safety:scan
```

It scans public Source-Wire files for obvious private data, secrets, local paths, private implementation references, and similar public-extraction risks.

The scan is non-destructive.

It exits non-zero when high-risk findings are present.

## What CI Does Not Do

CI does not:

- publish npm,
- create GitHub releases,
- deploy services,
- call API server runtime,
- call MCP server runtime,
- call databases,
- call connectors,
- call memory engines,
- require secrets,
- check out private repos,
- use real user data,
- create or promote trusted Memory Records.

The consumer smoke check installs a locally packed tarball into a temporary project.

It verifies package-root imports and the installed `source-wire` CLI against every schema-backed synthetic fixture shipped inside the installed package:

- `project-context-pack`
- `second-brain-v1`
- `chat-export-message`

Markdown vault fixtures are not part of the installed fixture validation matrix until a Markdown vault schema exists.

It does not publish npm, create a release, deploy services, or call backend runtime.

The package content smoke check installs a locally packed tarball into a temporary project, verifies the same required package path manifest checked by package dry-run, asserts key installed runtime-boundary readiness summary boundary claims, and runs the Markdown link checker from the installed package root.

It verifies installed `README.md`, `docs`, and `examples` local links from `node_modules/@source-wire/contracts`.

It also protects the installed readiness summary claims that no runtime implementation is included, Source-Wire-hosted memory remains blocked, Source-Wire does not host memory, and trusted memory requires owner or application approval.

It does not typecheck installed TypeScript examples because those examples currently use repo-local path mapping.

The installed TypeScript examples smoke check installs a locally packed tarball into a temporary project, copies the public TypeScript examples into that project, and typechecks them against the installed package declarations.

It verifies consumer package-root imports without repo-local TypeScript path mapping.

It does not execute compiled example JavaScript.

The runtime boundary smoke check runs the local synthetic owner-hosted API plus MCP boundary example.

It does not start a server, call a database, call an MCP server runtime, add package exports, or use real data.

Its CI output includes `ok runtime boundary check ...` markers. Those markers identify which synthetic boundary passed before the final `ok synthetic runtime boundary smoke` marker.

The installed runtime boundary smoke check installs a locally packed tarball into a temporary project and runs the packaged synthetic runtime-boundary example from `node_modules/@source-wire/contracts`.

It does not publish npm, start a server, call a database, call an MCP server runtime, add package exports, or use real data.

The installed smoke surfaces the same diagnostic markers from the packaged example.

The diagnostic regression smoke intentionally forces one synthetic check failure and verifies the failure output includes the check name, assertion, expected value, received value, and next action.

It does not publish npm, start a server, call a database, call an MCP server runtime, add package exports, or use real data.

The readiness report prints a fast read-only summary of package posture, package surfaces, readiness commands, installed package smokes, required readiness docs, and intentionally blocked scope.

It does not replace the full readiness gate.

The docs link check validates local Markdown links in README, docs, and examples.

It does not check external URLs or validate anchor existence.

## Current Boundary

Source-Wire remains a public contract package with schema exports, fixture validation, and a local validation CLI.

Runtime backend behavior remains out of scope until a later PRD explicitly opens it.
