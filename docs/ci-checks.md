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
- `npm run release:implementation-preparation`
- `npm run release:implementation-plan`
- `npm run release:publish-config-plan`
- `npm run release:implementation-rehearsal`
- `npm run release:review`
- `npm run release:approval-request`
- `npm run release:auth-handoff`
- `npm run release:candidate-readiness`
- `npm run release:artifact-manifest`
- `npm run license:rehearsal`
- `npm run license:decision-record`
- `npm run license:approval-request`
- `npm run license:implementation-plan`
- `npm run license:history-boundary`
- `npm run legal:packet`
- `npm run runtime:prd-preparation`
- `npm run contribution:terms-preparation`
- `npm run owner:approval-packet`
- `npm run owner:launch-checklist`
- `npm run owner:license-preflight`
- `npm run owner:decision-intake`
- `npm run owner:decision-workflow`
- `npm run world:readiness`
- `npm run world:share-packet`
- `npm run launch:decision-status`
- `npm run share:audit`
- `npm run readme:entrypoint-smoke`
- `npm run intake:boundary`
- `npm run reviewer:intake-smoke`
- `npm run reviewer:smoke`
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
- `npm run world:share-preflight`
- `npm run repository:live-github`
- `npm run repository:live-branch`
- `npm run repository:branch-governance-preflight`
- `npm run owner:open-issues-status`
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
| Release implementation preparation | `ok release implementation preparation ready`, `ok release implementation evidence map ready`, `blocked release execution not performed` | The release execution packet, issue `#255` approval evidence, required evidence, and stop conditions are documented while release execution remains unperformed. |
| Release implementation plan | `ok release implementation plan ready`, `ok release version target documented`, `blocked release execution not performed` | Release execution order, target version, and stop conditions are documented while release execution remains unperformed. |
| Release publish config plan | `ok release publish config plan ready`, `ok future npm public access documented`, `blocked publish config mutation not performed` | The future `publishConfig.access` transition from `restricted` to `public` is documented while current package metadata remains blocked. |
| Release implementation rehearsal | `ok release implementation rehearsal ready`, `ok future version rehearsal 0.1.0`, `blocked release mutation not performed` | The future `0.1.0` release metadata path is rehearsed in memory while real package and lockfile metadata remain at `0.0.0`. |
| Release review | `ok release review packet ready`, `ok release decision inputs documented`, `blocked release execution not performed` | Current release inputs, draft release notes, and the recommended future first release version are documented while release mutation remains unperformed. |
| Release approval request | `ok release approval request ready`, `blocked npm publishing release execution not performed`, `blocked github release execution not performed`, `blocked version release execution not performed` | Exact owner release choices are available while npm publishing, GitHub release publishing, and version release remain blocked until execution. |
| Release auth handoff | `ok release auth handoff ready`, `ok npm authentication owner steps documented`, `blocked release auth owner action required` | The owner-side npm login handoff and follow-up release preflights are documented while publish and release execution remain blocked. |
| Release approval status | `ok release approval status readable`, `ok exact release approval recorded`, `blocked release execution requires npm auth and final preflight` | Issue `#255` is readable and contains a separate exact owner approval comment while execution remains blocked by npm auth and final release preflight. |
| Release decision preflight | `ok release decision preflight ready`, `ok world share preflight current`, `ok owner open issue boundary current`, `ok release approval status current`, `ok release candidate evidence current`, `ok release artifact evidence current`, `blocked release execution not performed` | The owner-side world-share preflight, owner open-issue boundary, issue `#255` approval status, release-candidate readiness, artifact manifest, approval request, and launch decision status are current before release execution. |
| Release candidate readiness | `ok release candidate readiness ready`, `ok local package verification ready`, `blocked release execution not performed` | The package is locally ready for approved release execution preflight, but release mutation is not performed. |
| Release artifact manifest | `ok release artifact manifest ready`, `ok release artifact package identity @source-wire/contracts@0.0.0`, `ok release artifact integrity recorded`, `blocked release artifact publish not approved` | The release artifact identity, file count, size, shasum, integrity, required paths, and blocked release channels are verified before any release channel opens. |
| Package required paths | `ok package required paths` | The shared required package path manifest is sorted and duplicate-free. |
| License decision record | `ok license decision record ready`, `ok license decision captured`, `ok license implementation complete` | The owner license decision record is implemented for Apache-2.0 source package licensing. |
| License approval request | `ok license approval request ready`, `ok owner license approval captured`, `ok license implementation complete` | The owner approval path is captured and implemented. |
| License implementation plan | `ok license implementation plan ready`, `ok license decision paths mapped`, `ok license implementation complete` | The Apache-2.0 implementation path is complete and remaining paths stay separate. |
| Legal-review packet | `ok legal review packet ready`, `ok owner license approval recorded` | Legal advice is not provided, but owner license approval is recorded and remaining legal questions stay visible. |
| Hosted runtime PRD preparation | `ok hosted runtime PRD preparation ready`, `ok hosted runtime PRD evidence map ready`, `blocked hosted runtime PRD approval missing` | Future hosted runtime PRD inputs, evidence, and stop conditions are documented while runtime implementation remains blocked. |
| Contribution terms PRD preparation | `ok contribution terms PRD preparation ready`, `ok contribution terms evidence map ready`, `blocked contribution terms PRD approval missing` | Future contribution terms PRD inputs, evidence, and stop conditions are documented while code contribution acceptance remains blocked. |
| Owner approval packet | `ok owner approval packet ready`, `ok exact owner approval texts available`, `blocked approval recording is manual owner action` | Exact approval text for issues `#255` through `#258` is available while recording approval remains a separate manual owner action. |
| Owner launch checklist | `ok owner launch checklist ready`, `blocked launch channels missing` | Source package reuse is ready, but launch channels remain blocked. |
| Owner license approval preflight | `ok owner license approval preflight ready`, `ok owner approval package complete`, `ok owner license approval captured` | The owner approval package is complete and Apache-2.0 approval is captured. |
| Owner decision intake | `ok owner decision intake ready`, `ok owner decision options available`, `ok owner decision captured` | The owner decision intake records the selected Apache-2.0 implementation path. |
| Owner decision workflow | `ok owner decision workflow ready`, `ok owner decision options available`, `ok owner license decision captured` | The owner decision workflow records the selected Apache-2.0 implementation path. |
| World-share boundary | `ok world share open source ready`, `blocked production launch channels` | Source package sharing is ready under Apache-2.0, but production launch channels remain blocked. |
| World-share packet | `ok world share packet ready`, `ok public share copy current`, `blocked production launch channels` | Public-safe copy, first reviewer commands, owner preflight, feedback route, and blocked launch channels are available in one packet. |
| Launch decision status | `ok launch decision status ready`, `ok apache 2 license implemented`, `ok source repo sharing ready`, `blocked npm publishing release execution not performed`, `blocked github release execution not performed`, `blocked hosted runtime not approved`, `blocked contributions not accepted` | One command reports Apache-2.0 source sharing as ready while keeping blocked launch paths explicit. |
| First visitor share audit | `ok first visitor share audit ready`, `ok apache 2 reuse ready`, `blocked production launch channels` | First visitors can reuse the source package under Apache-2.0 without confusing it for a product launch. |
| README entrypoint smoke | `ok readme entrypoint smoke ready`, `ok readme first reviewer path visible`, `blocked unsafe readme launch claims` | README keeps the public status, first reviewer path, share links, and blocked launch channels visible before package details. |
| Public intake boundary | `ok public intake boundary ready`, `ok apache 2 intake wording current`, `blocked code contribution acceptance` | GitHub-visible support, security, contribution, issue-template, and feedback surfaces match Apache-2.0 source reuse while code contribution acceptance remains blocked. |
| Reviewer intake smoke | `ok reviewer intake smoke ready`, `ok reviewer issue templates structured`, `blocked unsafe reviewer data intake` | Reviewers have structured issue templates, blank issues are disabled, private-data intake is blocked, and code contributions remain blocked. |
| Reviewer first-pass smoke | `ok reviewer first-pass smoke` | A temporary clean checkout-style copy can install dependencies and run the first reviewer readiness report path. |
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
