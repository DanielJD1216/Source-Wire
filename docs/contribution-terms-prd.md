# Source-Wire Contribution Terms PRD

Status: PRD complete, contribution acceptance still blocked.

This PRD defines how Source-Wire can prepare for public code contributions later. It does not accept code contributions, add CLA or DCO enforcement, publish a new npm version, create a GitHub release, create tags, deploy services, add hosted runtime behavior, change branch governance, or approve production runtime use.

## Problem Statement

Source-Wire is now Apache-2.0 licensed, published to npm, released on GitHub, and ready for source-package review. That makes the repo useful to outside readers, but it also creates a confusing surface: people may assume they can open pull requests or contribute code.

The project needs clear contribution terms before accepting outside code so maintainers do not accidentally accept private data, incompatible license obligations, unsupported runtime claims, or unreviewed security-sensitive changes.

## Solution

Keep public code contribution acceptance blocked for now.

Allow structured public feedback through issues, but route pull requests to owner-approved maintenance only until a later contribution acceptance implementation unit opens the channel.

Prepare for a future DCO-based contribution path rather than a CLA path. The future path should require commit sign-off, Apache-2.0-compatible inbound terms, maintainer review, Package Checks, public-safety scans, and strict private-data exclusion.

## User Stories

1. As a public reviewer, I want to know whether Source-Wire accepts code pull requests, so that I do not submit work through the wrong channel.
2. As a public reviewer, I want a safe issue feedback path, so that I can report docs, contract, boundary, or verification problems without sending private data.
3. As the project owner, I want code contribution acceptance blocked until terms are implemented, so that no outside code is accepted by accident.
4. As the project owner, I want a future DCO path defined, so that contribution acceptance can open later without heavy CLA process.
5. As a maintainer, I want private-data exclusion rules, so that pull requests never include real user data, secrets, local paths, client names, real chat logs, screenshots, or production exports.
6. As a maintainer, I want license compatibility rules, so that inbound changes stay compatible with Apache-2.0.
7. As a maintainer, I want review requirements, so that any future contribution is checked for tests, docs, safety, and product-boundary drift.
8. As a security reporter, I want clear security-report scope, so that I know what matters before hosted runtime exists.
9. As a user of the npm package, I want contribution docs to separate source-package reuse from production runtime support, so that I do not assume the package is a hosted memory service.
10. As a future contributor, I want PR workflow boundaries, so that I know when a PR may be closed without review.
11. As a future contributor, I want support expectations, so that I know maintainers are not promising implementation help, production support, or custom integration support.
12. As a maintainer, I want a rollback path, so that contribution acceptance can be closed again if private data, low-quality PRs, or governance burden becomes unsafe.

## Implementation Decisions

- Current posture: Source-Wire does not accept public code contributions yet.
- Feedback posture: public issues remain the feedback path for verification failures, docs or contract feedback, and boundary or safety concerns.
- Future contribution posture: prefer DCO over CLA for a lightweight open-source contribution path, but do not enforce DCO until contribution acceptance is separately opened.
- No-external-code fallback: if maintainer bandwidth, legal confidence, or safety posture is insufficient, Source-Wire may remain issue-feedback-only while still allowing Apache-2.0 source reuse.
- License compatibility: future inbound contributions must be compatible with Apache-2.0 and must not introduce copied code, unclear provenance, or restrictive license obligations.
- Private-data exclusion: future contribution surfaces must reject secrets, tokens, local private paths, production exports, account IDs, client names, private screenshots, real source payloads, real chat logs, and real memory records.
- Maintainer review: future PRs must require maintainer review, Package Checks, safety scans, docs checks when docs change, and explicit confirmation that no blocked launch channel was opened.
- Support expectations: maintainers may review feedback and accepted PRs, but do not promise custom support, production integration support, hosted runtime support, or emergency response for source-package use.
- Security-report scope: meaningful security reports include package safety, docs claims, private-data leakage risks, fixture leakage, and future runtime-boundary concerns. Hosted runtime vulnerabilities are out of scope until hosted runtime exists.
- PR workflow boundary: pull requests remain blocked for public contribution until a separate implementation unit updates the templates, docs, labels, and guards.
- Close conditions: maintainers may close PRs that include private data, add hosted runtime behavior, change release channels, weaken boundaries, lack tests, or bypass issue-feedback-first process.

## Testing Decisions

- Test external behavior through command markers and public docs checks, not internal implementation details.
- Update public intake and pull-request boundary checks to verify the policy remains visible and contribution acceptance stays blocked.
- Keep package readiness as the top-level regression gate.
- Use GitHub issue status checks to prove owner approvals are recorded separately from recommended approval text.
- Keep final share checks live-owner-side because they depend on GitHub, npm, release, branch, and issue state.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run contribution:terms-policy
```

Expected markers:

```text
ok contribution terms PRD defined
ok contribution policy boundary current
blocked code contribution acceptance
```

## Out Of Scope

- Accepting public code contributions.
- Adding CLA enforcement.
- Adding DCO enforcement.
- Creating a new npm package version.
- Creating a new GitHub release or tag.
- Changing branch protection or repository rulesets.
- Deploying services.
- Adding hosted runtime behavior.
- Adding API server, MCP server, database migrations, live connectors, or real user data.
- Claiming production runtime readiness.

## Future Acceptance Gate

Before code contribution acceptance can open, a separate implementation unit must:

1. Update `CONTRIBUTING.md`, the pull request template, support docs, security docs, and issue docs.
2. Add DCO sign-off instructions or explicitly choose no DCO.
3. Add or document contribution labels and review states.
4. Verify Package Checks and public-safety scans.
5. Decide whether issue `#258` should close as completed history.
6. Run `npm run publish:readiness`.
7. Run owner-side live checks after the readiness commit.

## Current Decision

Contribution terms PRD work is approved and defined.

Code contribution acceptance is still blocked.
