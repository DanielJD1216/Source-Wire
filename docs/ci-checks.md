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
- `npm run minimal-runtime:smoke`
- `npm run runtime-boundary:smoke`
- `npm run safety:scan`
- `npm run claims:scan`
- `npm run release:gate`
- `npm run release-command-guard:smoke`
- `npm run release:implementation-plan`
- `npm run release:review`
- `npm run release:approval-request`
- `npm run release:candidate-readiness`
- `npm run license:rehearsal`
- `npm run license:decision-record`
- `npm run license:approval-request`
- `npm run license:implementation-plan`
- `npm run license:history-boundary`
- `npm run legal:packet`
- `npm run owner:launch-checklist`
- `npm run owner:license-preflight`
- `npm run owner:decision-intake`
- `npm run owner:decision-workflow`
- `npm run world:readiness`
- `npm run launch:decision-status`
- `npm run share:audit`
- `npm run intake:boundary`
- `npm run repository:metadata`
- `npm run repository:branch-governance-request`
- `npm run repository:branch-governance-plan`
- `npm run pull-request:boundary`
- `npm run package:required-paths`
- `npm run package:dry-run`
- `npm run consumer:smoke`
- `npm run package:content-smoke`
- `npm run examples:installed-smoke`
- `npm run runtime-boundary:installed-smoke`
- `npm run runtime-boundary:diagnostics-smoke`
- `npm run readiness:report`
- `npm run docs:links`
- `npm run docs:anchors`
- `npm run docs:command-setup`
- `npm run safety:scan`
- `npm run claims:scan`
- `npm run ci:markers:smoke`

`npm run ci:check` remains as a sub-gate inside `npm run publish:readiness`.

Owner-side live and public-network checks are intentionally outside CI and `publish:readiness` because they require live network access and some checks require `gh` authentication:

- `npm run docs:external-links`
- `npm run world:live-status`
- `npm run repository:live-github`
- `npm run repository:live-branch`
- `npm run security:live-surface`
- `npm run registry:live-npm`
- `npm run release:live-tags`

## Stable Log Markers

Use these markers when reading local or GitHub Actions Package Checks logs.

They prove package readiness and synthetic runtime-boundary behavior only. They do not prove a deployed backend, API server, MCP server runtime, database, connector, or real memory system exists.

| Marker group | Expected markers | What it proves |
| --- | --- | --- |
| Release gate | `ok release gate`, `ok license Apache-2.0`, `ok package lock Apache-2.0`, `ok version 0.0.0`, `ok publishing blocked` | Apache-2.0 licensing is implemented in package metadata and lockfile metadata while version and publishing boundaries stay blocked. |
| Release command guard smoke | `ok blocked release commands smoke` | The shared release-command guard catches direct package publish, GitHub release, git tag, package version, and service deployment commands in package scripts. |
| Release implementation plan | `ok release implementation plan ready`, `ok release version target documented`, `blocked release execution approval missing` | Future release execution order, target version, and stop conditions are documented while release execution approval is still missing. |
| Release review | `ok release review packet ready`, `ok release decision inputs documented`, `blocked release implementation approval missing` | Current release inputs, draft release notes, and the recommended future first release version are documented while implementation approval is still missing. |
| Release approval request | `ok release approval request ready`, `blocked npm publishing not approved`, `blocked github release not approved`, `blocked version release not approved` | Exact future owner release choices are available while npm publishing, GitHub release publishing, and version release remain blocked. |
| Release candidate readiness | `ok release candidate readiness ready`, `ok local package verification ready`, `blocked release implementation approval missing` | The package is locally ready for an owner release decision, but release implementation approval is still missing. |
| Package required paths | `ok package required paths` | The shared required package path manifest is sorted and duplicate-free. |
| License decision record | `ok license decision record ready`, `ok license decision captured`, `ok license implementation complete` | The owner license decision record is implemented for Apache-2.0 source package licensing. |
| License approval request | `ok license approval request ready`, `ok owner license approval captured`, `ok license implementation complete` | The owner approval path is captured and implemented. |
| License implementation plan | `ok license implementation plan ready`, `ok license decision paths mapped`, `ok license implementation complete` | The Apache-2.0 implementation path is complete and remaining paths stay separate. |
| Legal-review packet | `ok legal review packet ready`, `ok owner license approval recorded` | Legal advice is not provided, but owner license approval is recorded and remaining legal questions stay visible. |
| Owner launch checklist | `ok owner launch checklist ready`, `blocked launch channels missing` | Source package reuse is ready, but launch channels remain blocked. |
| Owner license approval preflight | `ok owner license approval preflight ready`, `ok owner approval package complete`, `ok owner license approval captured` | The owner approval package is complete and Apache-2.0 approval is captured. |
| Owner decision intake | `ok owner decision intake ready`, `ok owner decision options available`, `ok owner decision captured` | The owner decision intake records the selected Apache-2.0 implementation path. |
| Owner decision workflow | `ok owner decision workflow ready`, `ok owner decision options available`, `ok owner license decision captured` | The owner decision workflow records the selected Apache-2.0 implementation path. |
| World-share boundary | `ok world share open source ready`, `blocked production launch channels` | Source package sharing is ready under Apache-2.0, but production launch channels remain blocked. |
| Launch decision status | `ok launch decision status ready`, `ok apache 2 license implemented`, `ok source repo sharing ready`, `blocked npm publishing not approved`, `blocked github release not approved`, `blocked hosted runtime not approved`, `blocked contributions not accepted` | One command reports Apache-2.0 source sharing as ready while keeping blocked launch paths explicit. |
| First visitor share audit | `ok first visitor share audit ready`, `ok apache 2 reuse ready`, `blocked production launch channels` | First visitors can reuse the source package under Apache-2.0 without confusing it for a product launch. |
| Public intake boundary | `ok public intake boundary ready`, `ok apache 2 intake wording current`, `blocked code contribution acceptance` | GitHub-visible support, security, contribution, issue-template, and feedback surfaces match Apache-2.0 source reuse while code contribution acceptance remains blocked. |
| Repository metadata boundary | `ok repository metadata boundary ready`, `ok github about wording current`, `blocked metadata launch approval` | Expected GitHub About panel, topics, and feature flags match the Apache-2.0 source-package state while launch channels remain blocked. |
| Branch governance approval request | `ok branch governance approval request ready`, `blocked branch protection approval missing`, `blocked repository ruleset approval missing` | Future branch protection and repository ruleset decision options are documented while live GitHub settings remain unchanged. |
| Branch governance implementation plan | `ok branch governance implementation plan ready`, `ok branch governance recommended path documented`, `blocked branch governance implementation approval missing` | Future branch protection implementation order, preflight, post-change verification, and rollback plan are documented while live GitHub settings remain unchanged. |
| Historical license boundary | `ok historical license boundary ready`, `ok unlicensed recommendation superseded`, `blocked license history launch approval` | Historical license decision docs preserve old `UNLICENSED` analysis without presenting it as current guidance. |
| Pull request boundary | `ok pull request boundary ready`, `ok code contribution pr blocked`, `blocked private data in pull requests` | Pull request template blocks code contribution assumptions and private-data leakage until contribution terms are approved. |
| Package dry run | `ok package dry-run @source-wire/contracts@0.0.0`, `ok package file count` | The local package can be packed and the shared required package path manifest is present. |
| Package content smoke | `ok package content smoke @source-wire/contracts@0.0.0`, `ok installed required paths`, `ok installed runtime readiness summary`, `ok installed runtime readiness summary content`, `ok installed package docs links`, `ok installed package docs anchors` | The shared required package path manifest, README/docs/examples links and anchors, and runtime readiness summary assertions work from the packed package after install. |
| Minimal runtime smoke | `ok minimal runtime boundary smoke` | Exported synthetic in-memory runtime boundary code matches owner-hosted API plus MCP proof cases. |
| Runtime boundary smoke | `ok runtime boundary check authorized_read`, `ok runtime boundary check unauthorized_read_denial`, `ok runtime boundary check wrong_namespace_denial`, `ok runtime boundary check source_maintenance_no_auto_promotion`, `ok runtime boundary check owner_controlled_approval`, `ok runtime boundary check agent_approval_denial`, `ok synthetic runtime boundary smoke` | Synthetic owner-hosted API plus MCP boundary cases still fail closed and preserve no-auto-promotion. |
| Installed runtime boundary smoke | `ok runtime boundary installed smoke @source-wire/contracts@0.0.0`, `ok installed runtime boundary example` | The packaged synthetic runtime-boundary example runs after local tarball installation. |
| Diagnostic regression smoke | `ok runtime boundary diagnostics smoke authorized_read`, `ok diagnostic failure includes check name`, `ok diagnostic failure includes assertion`, `ok diagnostic failure includes expected value`, `ok diagnostic failure includes received value`, `ok diagnostic failure includes next action` | Boundary smoke failures remain useful to diagnose when a synthetic check breaks. |
| Docs and readiness | `ok readiness report`, `ok docs links`, `ok docs anchors`, `ok command docs setup`, `ok readiness command docs match package scripts` | Readiness summary, required readiness docs, local Markdown links, local Markdown anchors, command-doc setup pointers, and documented readiness command lists are current. |
| Public safety | `Findings: 0 high=0 medium=0 low=0` | Public-safety scan found no obvious private-data or secret findings. |
| Public claim boundary | `ok public claim boundary scan` | Public docs do not make unsafe production, contribution, npm publishing, GitHub release, or hosted-runtime claims while Source-Wire remains unpublished and not hosted. |
| CI marker self-smoke | `ok ci markers smoke` | The marker helper accepts a complete synthetic log and rejects an incomplete synthetic log. |

If one marker group is missing, inspect the command that owns that group before treating CI as release-ready.

For the branch governance implementation plan marker group, run:

```bash
npm run repository:branch-governance-plan
```

This verifies the non-mutating future implementation plan. It does not enable branch protection or create repository rulesets.

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

Run only the marker helper self-smoke:

```bash
npm run ci:markers:smoke
```

The self-smoke is part of package readiness and verifies that `ci:markers` passes a synthetic complete log and fails a synthetic incomplete log.

## Public-Safety Scan

The public-safety scan is self-contained inside Source-Wire:

```bash
npm run safety:scan
```

It scans public Source-Wire files for obvious private data, secrets, local paths, private implementation references, and similar public-extraction risks.

The scan is non-destructive.

It exits non-zero when high-risk findings are present.

## Public Claim Boundary Scan

The public claim-boundary scan is self-contained inside Source-Wire:

```bash
npm run claims:scan
```

It scans public README, docs, and examples for unsafe production, contribution, npm publishing, GitHub release, or hosted-runtime wording while Source-Wire remains unpublished and not hosted.

The scan is non-destructive.

It exits non-zero when unsafe claims are present.

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
- `owner-hosted-api-mcp-boundary`

Markdown vault fixtures are not part of the installed fixture validation matrix until a Markdown vault schema exists.

It does not publish npm, create a release, deploy services, or call backend runtime.

The package content smoke check installs a locally packed tarball into a temporary project, verifies the same required package path manifest checked by package dry-run, asserts key installed runtime-boundary readiness summary boundary claims, and runs the Markdown link checker from the installed package root.

It verifies installed `README.md`, `docs`, and `examples` local links from `node_modules/@source-wire/contracts`.

It also protects the installed readiness summary claims that only a minimal synthetic in-memory boundary is included, Source-Wire-hosted memory remains blocked, Source-Wire does not host memory, and trusted memory requires owner or application approval.

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

The minimal runtime PRD package is documentation only. It does not add API server runtime, MCP server runtime, database migrations, deployment, or Source-Wire-hosted memory.

The docs link check validates local Markdown links in README, docs, and examples.

It does not check external URLs or validate anchor existence.

## Current Boundary

Source-Wire remains a public contract package with schema exports, fixture validation, and a local validation CLI.

Runtime backend behavior remains out of scope until a later PRD explicitly opens it.
