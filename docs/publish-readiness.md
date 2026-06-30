# Source-Wire Publish Readiness

Source-Wire has package readiness checks, but it is not published to npm yet.

Publishing requires a later explicit release decision.

## Local Readiness Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run publish:readiness
```

This command runs:

- `npm run ci:check`
- `npm run release:gate`
- `npm run license:rehearsal`
- `npm run legal:packet`
- `npm run owner:launch-checklist`
- `npm run world:readiness`
- `npm run package:required-paths`
- `npm run package:dry-run`
- `npm run consumer:smoke`
- `npm run package:content-smoke`
- `npm run examples:installed-smoke`
- `npm run minimal-runtime:smoke`
- `npm run runtime-boundary:installed-smoke`
- `npm run runtime-boundary:diagnostics-smoke`
- `npm run readiness:report`
- `npm run docs:links`
- `npm run docs:command-setup`
- `npm run safety:scan`
- `npm run claims:scan`
- `npm run ci:markers:smoke`

The `ci:check` sub-gate includes:

- `npm run minimal-runtime:smoke`
- `npm run runtime-boundary:smoke`

## Local Success Marker Map

When `npm run publish:readiness` passes, scan the output for these stable markers.

They prove the current package skeleton, installed package behavior, docs, safety scan, and synthetic runtime-boundary lane. They do not prove runtime deployment, database setup, connector sync, real memory storage, MCP server runtime, or npm publication.

| Area | Markers to look for |
| --- | --- |
| Release boundary | `ok release gate`, `ok license UNLICENSED`, `ok version 0.0.0`, `ok publishing blocked` |
| License rehearsal | `ok license rehearsal current boundary`, `ok license rehearsal future checklist` |
| Legal-review packet | `ok legal review packet ready`, `blocked legal approval not granted` |
| Owner launch checklist | `ok owner launch checklist ready`, `blocked owner launch approval missing` |
| World-share boundary | `ok world share technical review ready`, `blocked world share broad reuse` |
| Package required paths | `ok package required paths` |
| Package dry run | `ok package dry-run @source-wire/contracts@0.0.0`, `ok package file count` |
| Package content smoke | `ok package content smoke @source-wire/contracts@0.0.0`, `ok installed required paths`, `ok installed runtime readiness summary`, `ok installed runtime readiness summary content`, `ok installed package docs links` |
| Minimal runtime smoke | `ok minimal runtime boundary smoke` |
| Runtime boundary smoke | `ok runtime boundary check authorized_read`, `ok runtime boundary check unauthorized_read_denial`, `ok runtime boundary check wrong_namespace_denial`, `ok runtime boundary check source_maintenance_no_auto_promotion`, `ok runtime boundary check owner_controlled_approval`, `ok runtime boundary check agent_approval_denial`, `ok synthetic runtime boundary smoke` |
| Installed runtime boundary smoke | `ok runtime boundary installed smoke @source-wire/contracts@0.0.0`, `ok installed runtime boundary example` |
| Diagnostic regression smoke | `ok runtime boundary diagnostics smoke authorized_read`, `ok diagnostic failure includes check name`, `ok diagnostic failure includes assertion`, `ok diagnostic failure includes expected value`, `ok diagnostic failure includes received value`, `ok diagnostic failure includes next action` |
| Docs and readiness | `ok readiness report`, `ok docs links`, `ok command docs setup` |
| Public safety | `Findings: 0 high=0 medium=0 low=0` |
| Public claim boundary | `ok public claim boundary scan` |
| CI marker self-smoke | `ok ci markers smoke` |

The Docs and readiness row proves the readiness summary, required readiness docs, local Markdown links, and command-doc setup pointers are current.

Use [CI Checks](ci-checks.md) for the same marker map from the GitHub Actions perspective.

## Marker Helper

Save the local readiness output, then run the marker helper:

```bash
npm run publish:readiness > /tmp/source-wire-readiness.log 2>&1
npm run ci:markers -- /tmp/source-wire-readiness.log
```

The marker helper reads a log file or stdin, checks the stable marker groups above, and exits non-zero when required marker evidence is missing.

It does not run readiness, call GitHub, publish, deploy, start runtime services, connect to databases, or use real data.

Run only the marker helper self-smoke:

```bash
npm run ci:markers:smoke
```

The self-smoke checks that a synthetic complete log passes `ci:markers` and a synthetic incomplete log fails.

## Package Required Paths

Run only the package required path manifest check:

```bash
npm run package:required-paths
```

The manifest check verifies the shared required package path list is sorted and duplicate-free.

It does not build, pack, install, publish, or run runtime behavior.

## Readiness Report

Run only the package readiness report:

```bash
npm run readiness:report
```

The readiness report is a fast read-only summary of current package posture.

It prints package metadata, publish boundary, runtime boundary, package exports, validation schemas, readiness commands, installed package smokes, required readiness docs, and intentionally blocked scope.

The report includes the minimal runtime PRD package as a required readiness doc. That PRD package does not add runtime implementation.

It fails if required posture fields are missing or inconsistent.

It does not run the full readiness gate. Use `npm run publish:readiness` for verification before committing or releasing.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Reviewer First-Pass Smoke

Run only the reviewer first-pass smoke:

```bash
npm run reviewer:smoke
```

The smoke creates a temporary clean checkout-style copy from git-visible files, runs `npm install`, runs `npm run readiness:report`, checks expected review-only markers, and removes the temporary copy.

It does not publish npm, create a GitHub release, deploy services, start a backend, connect to a database, accept contributions, or use real data.

## Public Claim Boundary Scan

Run only the public claim-boundary guard:

```bash
npm run claims:scan
```

The guard scans public README, docs, and examples for unsafe release, reuse, open-source, contribution, npm publishing, GitHub release, and hosted-runtime claims while the package license remains `UNLICENSED`.

It skips fenced code blocks so docs can include unsafe wording examples as examples.

It does not change files, approve licensing, publish npm, create a release, deploy services, start a runtime, accept contributions, or grant reuse rights.

## License Approval Rehearsal

Run only the read-only license approval rehearsal:

```bash
npm run license:rehearsal
```

The rehearsal verifies the current `UNLICENSED` boundary, confirms no `LICENSE` file exists, checks publish and release scripts remain blocked, and prints the future owner-approved Apache-2.0 transition checklist.

It does not add a `LICENSE` file, change package metadata, publish npm, create a GitHub release, deploy services, start a runtime, connect to a database, accept contributions, or grant reuse rights.

## Legal Review Packet

Run only the legal-review question packet check:

```bash
npm run legal:packet
```

The command verifies the current blocked boundary and prints the legal or owner review topics for licensing, commercial reuse, contribution terms, support, security, name and trademark, hosted runtime, and private-data boundaries.

It does not provide legal advice, approve licensing, change package metadata, add a `LICENSE` file, publish npm, create a GitHub release, deploy services, accept contributions, or grant reuse rights.

## Owner Launch Checklist

Run only the owner launch decision checklist:

```bash
npm run owner:launch-checklist
```

The checklist reports that technical review sharing is ready and broad public launch remains blocked until explicit owner approvals are recorded for licensing, npm publishing, GitHub release publishing, hosted runtime work, and contribution terms.

It does not approve open-source launch, change package metadata, add a `LICENSE` file, publish npm, create a GitHub release, deploy services, accept contributions, or grant reuse rights.

## World-Share Readiness

Run only the world-share readiness boundary report:

```bash
npm run world:readiness
```

The report separates technical-review readiness from broad public reuse. It exits successfully only when the current review-only boundary is intact: `UNLICENSED`, version `0.0.0`, no `LICENSE` file, npm publishing blocked, release blocked, hosted runtime blocked, and code contributions blocked.

It does not approve open-source launch, publish npm, create a GitHub release, deploy services, add a `LICENSE` file, accept contributions, or grant reuse rights.

## Package Dry Run

Run only the package dry-run check:

```bash
npm run package:dry-run
```

The dry-run check builds the package, runs `npm pack --dry-run --json`, and verifies the shared required package path manifest.

It checks the same required package path manifest that `npm run package:content-smoke` verifies after local tarball install.

It does not publish.

## Consumer Smoke

Run only the consumer smoke check:

```bash
npm run consumer:smoke
```

The consumer smoke check builds and packs Source-Wire locally, creates a temporary external TypeScript project, installs the local tarball, typechecks package-root imports from `@source-wire/contracts`, runs a tiny compiled import check, runs the installed `source-wire` CLI against every schema-backed synthetic fixture shipped inside the installed package, and removes the temporary project.

Installed fixture matrix:

| Installed fixture | CLI schema |
| --- | --- |
| `examples/fixtures/project-context-pack/project-context.json` | `project-context-pack` |
| `examples/fixtures/second-brain/use-2nd-brain-example.json` | `second-brain-v1` |
| `examples/fixtures/chat-export/agent-session.jsonl` | `chat-export-message` |
| `examples/fixtures/owner-hosted-api-mcp-boundary/boundary-proof-cases.json` | `owner-hosted-api-mcp-boundary` |

Markdown vault fixtures are package contents, but they are not part of this validation matrix until a Markdown vault schema exists.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Package Content Smoke

Run only the package content smoke check:

```bash
npm run package:content-smoke
```

The package content smoke check builds and packs Source-Wire locally, creates a temporary external project, installs the local tarball, checks the shared required package path manifest in the installed package, asserts that the installed runtime-boundary readiness summary still contains the key runtime-boundary claims, and runs the Markdown link checker from the installed package root.

It checks installed `README.md`, `docs`, and `examples` local links from `node_modules/@source-wire/contracts`.

The installed readiness summary content assertions protect:

- only a minimal synthetic in-memory runtime boundary is included,
- Source-Wire-hosted memory remains blocked,
- Source-Wire does not host memory,
- trusted memory requires owner or application approval.

Expected markers include `ok installed required paths`, `ok installed runtime readiness summary`, `ok installed runtime readiness summary content`, and `ok installed package docs links`.

This is different from `npm run docs:links`, which checks links in the repository checkout.

Installed TypeScript example typechecking is handled by `npm run examples:installed-smoke`.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Installed TypeScript Examples Smoke

Run only the installed TypeScript examples smoke:

```bash
npm run examples:installed-smoke
```

The installed examples smoke builds and packs Source-Wire locally, creates a temporary external project, installs the local tarball, copies the public TypeScript example files into that project, and typechecks them against the installed package declarations.

This is different from `npm run examples:typecheck`, which checks examples in the repository checkout through repo-local TypeScript path mapping.

The installed smoke proves package-root imports from `@source-wire/contracts` work for consumer TypeScript examples.

It does not execute compiled example JavaScript.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Minimal Runtime Smoke

Run only the minimal synthetic runtime smoke:

```bash
npm run minimal-runtime:smoke
```

The minimal runtime smoke builds the package and runs `examples/minimal-runtime/minimal-runtime-smoke.mjs`.

It validates exported synthetic in-memory runtime boundary code against the owner-hosted API plus MCP boundary proof cases.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Runtime Boundary Smoke

For the full runtime-boundary proof lane, see [Runtime Boundary Readiness](runtime-boundary-readiness.md).

Run only the synthetic runtime boundary smoke:

```bash
npm run runtime-boundary:smoke
```

The runtime boundary smoke runs `examples/runtime-boundary/synthetic-boundary-smoke.mjs`.

It checks the synthetic owner-hosted API plus MCP boundary cases without starting a server.

The smoke output includes `ok runtime boundary check ...` markers before `ok synthetic runtime boundary smoke`.

If the smoke fails, the error names the failed check, expected value, received value, and next action.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Installed Runtime Boundary Smoke

Run only the installed synthetic runtime boundary smoke:

```bash
npm run runtime-boundary:installed-smoke
```

The installed runtime boundary smoke builds and packs Source-Wire locally, creates a temporary external project, installs the local tarball, and runs `examples/runtime-boundary/synthetic-boundary-smoke.mjs` from `node_modules/@source-wire/contracts`.

It proves the packaged runtime-boundary example can execute after package installation.

The installed smoke surfaces the same diagnostic markers from the packaged example.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Runtime Boundary Diagnostics Smoke

Run only the diagnostic regression smoke:

```bash
npm run runtime-boundary:diagnostics-smoke
```

The diagnostics smoke intentionally forces one synthetic runtime-boundary check to fail through `SOURCE_WIRE_RUNTIME_BOUNDARY_SMOKE_FORCE_FAILURE`.

It passes only when the failure output includes the failed check name, assertion, expected value, received value, and next action.

It does not publish npm.

It does not run a backend, database, MCP server, connector sync engine, memory engine, Mission Control UI, or trusted-memory promotion workflow.

## Docs Link Check

Run only the docs link check:

```bash
npm run docs:links
```

The docs link check validates local Markdown links in README, docs, and examples.

It ignores external URLs, mailto links, and pure page anchors.

It strips optional anchor fragments before checking local file or directory targets.

It does not validate external URL availability or anchor existence.

## Command Docs Setup Check

Run only the command-doc setup check:

```bash
npm run docs:command-setup
```

The command-doc setup check scans README, docs, and examples Markdown files.

It verifies command-bearing files include setup context or a Quickstart pointer before readers copy local commands.

Expected marker:

```text
ok command docs setup
```

It does not validate shell behavior or external services.

## Expected Package Contents

The package should include:

- `README.md`
- `package.json`
- built `dist` files
- docs index
- adopter walkthrough
- architecture map
- quickstart
- API reference
- public contract docs
- public extraction checklist
- runtime boundary docs
- runtime boundary readiness summary
- runtime implementation gate
- runtime decision docs
- runtime and license decision prototypes
- schema docs
- validation CLI docs
- CI docs
- publish-readiness docs
- release and license planning docs
- synthetic examples
- runtime-boundary example files
- owner-hosted API plus MCP boundary fixtures
- TypeScript examples
- Markdown vault fixtures
- JSON schemas

The package should not include:

- `.git`
- `.github`
- `node_modules`
- `src`
- `scripts`
- `.env` files
- `package-lock.json`
- `tsconfig.json`
- private files
- build junk outside the intentional `dist` output

## Current Publish Boundary

Publishing remains blocked.

Do not run:

```bash
npm publish
```

until a later PRD explicitly opens npm publishing and records owner approval.

## Release Gate

Run:

```bash
npm run release:gate
```

The release gate verifies that current package metadata still matches the release decision:

- license is `UNLICENSED`,
- version is `0.0.0`,
- npm publishing remains blocked through restricted publish config,
- package scripts do not include publish, release, or deployment commands.

Release decision docs:

- [Release Decision](release-decision.md)
- [License Decision Gate](license-decision-gate.md)
- [License And Version Policy](license-version-policy.md)

## What Is Still Blocked

This readiness work does not include:

- npm publishing,
- GitHub release publishing,
- deployment,
- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- real user data,
- trusted Memory Record promotion,
- private implementation code,
- secret-dependent checks,
- private repo checkout.

## Future Release Gate

A future publish unit should decide:

- package name and scope finality,
- license posture,
- versioning policy,
- npm access policy,
- release notes,
- owner approval,
- post-publish verification.
