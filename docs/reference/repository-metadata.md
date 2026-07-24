# Source-Wire Repository Metadata

This page explains the GitHub-visible files and status surfaces in Source-Wire.

## Current Boundary

Source-Wire is Apache-2.0 licensed as a source package.

It is still:

- version `0.1.0`,
- published to npm as `@source-wire/contracts@0.1.0`,
- released on GitHub as `v0.1.0`,
- undeployed,
- not a hosted runtime,
- not accepting code contributions.

## GitHub About Panel

The actual GitHub repository About panel should use source-package wording.

Intended description:

```text
Apache-2.0 agent-memory contracts. npm v0.1.0, GitHub release v0.1.0, not hosted.
```

Intended homepage URL:

```text
https://github.com/DanielJD1216/Source-Wire/blob/main/docs/guides/share-for-review.md
```

The description must stay short enough for the GitHub About panel but explicit enough that visitors do not confuse Apache-2.0 source reuse, npm publication, or GitHub release publication with deployment, hosted runtime behavior, or code contribution acceptance.

## Live GitHub Settings

Expected live repository settings:

- Visibility: public
- Default branch: `main`
- License: Apache-2.0
- Issues: enabled
- Projects: disabled
- Wiki: disabled
- Discussions: disabled
- Secret scanning: enabled
- Secret scanning push protection: enabled
- Security advisories: none
- Branch protection: enabled
- Repository rulesets: none

Expected topics:

- `agent-memory`
- `apache-2-0`
- `llm-memory`
- `mcp`
- `second-brain`
- `source-graph`
- `typescript`

Check live metadata with:

```bash
gh repo view DanielJD1216/Source-Wire --json name,description,homepageUrl,repositoryTopics,visibility,isArchived,isFork,defaultBranchRef,hasIssuesEnabled,hasProjectsEnabled,hasWikiEnabled,licenseInfo,url
```

The live metadata should match this page before broad public sharing.

Owner-side live check:

```bash
npm run repository:live-github
```

This command uses `gh` and the configured GitHub account to verify the live public repository surface, latest Package Checks run, and published GitHub release. It is intentionally not part of `publish:readiness` because public reviewers and forks should not need owner GitHub authentication.

Owner-side live security check:

```bash
npm run security:live-surface
```

This command uses `gh` and the configured GitHub account to verify the live security surface, safe public intake docs, secret scanning, push protection, disabled discussions/projects/wiki, and empty security advisory list. It is intentionally not part of `publish:readiness` because public reviewers and forks should not need owner GitHub authentication.

Owner-side live branch governance check:

```bash
npm run repository:live-branch
```

This command uses `gh` and the configured GitHub account to verify the default branch, live `main` SHA, local `origin/main` match, branch protection state, required branch-protection check context when enabled, and repository ruleset state. It reports minimal branch protection as implemented and repository rulesets as deferred.

## GitHub-Visible Files

| File | Purpose |
| --- | --- |
| `README.md` | Main public entrypoint and current status summary. |
| `LICENSE` | Apache-2.0 source package license. |
| `SECURITY.md` | Safe security and boundary concern reporting rules. |
| `SUPPORT.md` | Review support boundaries and verification-first support path. |
| `CONTRIBUTING.md` | Structured feedback path and code-contribution boundary. |
| `.github/pull_request_template.md` | Pull request boundary warning for owner-approved maintenance and verification branches. |
| `.github/ISSUE_TEMPLATE/*.yml` | Structured issue intake for verification, docs/contracts, and boundary concerns. |
| `.github/workflows/package-checks.yml` | GitHub Actions package readiness workflow. |

## CI Visibility

Package checks run through:

```text
.github/workflows/package-checks.yml
```

The README links the workflow status and the [CI Checks](ci-checks.md) marker map.

The workflow runs:

```bash
npm ci
npm run publish:readiness
```

Despite the command name, this does not publish a new package version.

The release gate must still print:

```text
ok license Apache-2.0
ok package lock Apache-2.0
ok version 0.1.0
ok npm public access ready
```

## What Metadata Does Not Approve

Repository metadata does not approve:

- code contribution acceptance,
- hosted runtime backend,
- production runtime use,
- real MCP server runtime,
- database setup,
- live connectors,
- real data examples.

## Related Docs

- [Public Status](../status/public-status.md)
- [First-Time Visitor Share-Readiness Audit](../internal/first-time-visitor-share-readiness-audit.md)
- [Technical Reviewer Guide](../guides/technical-reviewer-guide.md)
- [Reviewer Feedback Guide](../guides/reviewer-feedback-guide.md)
- [CI Checks](ci-checks.md)
- [Publish Readiness](../guides/publish-readiness.md)
