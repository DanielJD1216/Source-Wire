# Source-Wire Contribution Terms PRD Execution Packet

Status: execution packet only.

This packet does not accept code contributions, change contribution policy, add a CLA, add a DCO requirement, publish a new npm version, create a new GitHub release, create tags, deploy services, add hosted runtime behavior, enable branch governance, or approve production runtime use.

## Purpose

Use this packet after the owner records exact approval for issue `#258`.

The goal is to make the future contribution terms PRD unit bounded and boring: define whether and how Source-Wire can accept outside code, how private data stays out, what maintainer review requires, what support expectations exist, what security reports mean, and how Apache-2.0 compatibility is preserved.

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run contribution:terms-execution-packet
```

Expected markers:

```text
ok contribution terms PRD execution packet ready
ok contribution terms PRD execution scope documented
ok exact contribution terms PRD approval recorded
blocked code contribution acceptance
```

This command verifies the packet and docs only. It does not accept pull requests, add contribution legal terms, or change GitHub collaboration settings.

## Required Owner Approval

Do not start contribution terms PRD work until this exact approval is recorded on issue `#258`:

```text
Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit.
```

## Pre-Execution Checks

Before starting the future PRD unit:

1. Run `npm run publish:readiness`.
2. Run `npm run world:share-final-preflight`.
3. Run `npm run contribution:terms-decision-preflight`.
4. Run `npm run owner:decision-status`.
5. Confirm issue `#258` has exact approval recorded.
6. Confirm the latest `Package Checks` is green on `origin/main`.
7. Confirm local `main` and `origin/main` point to the same commit.
8. Confirm no npm package version, GitHub release, tag, deployment, hosted runtime behavior, or branch governance change is being opened in the same unit.

## Future PRD Scope

The future PRD unit should define, but not activate:

| Area | Required PRD decision |
| --- | --- |
| Contribution posture | DCO, CLA, or no-external-code policy |
| Private-data exclusion | no owner-private data, no customer data, no secrets, no personal account data |
| Maintainer review | required reviewer, CI gates, security scan gates, docs requirements |
| PR workflow | labels, templates, triage states, and close conditions |
| License compatibility | Apache-2.0 compatibility and inbound contribution terms |
| Support expectations | what maintainers will and will not support |
| Security reports | meaningful scope while no hosted runtime exists |
| Public feedback | issue feedback remains separate from code contribution acceptance |

## Future Verification

After the future PRD unit lands, run:

```bash
npm run publish:readiness
npm run world:share-final-preflight
npm run contribution:terms-policy
npm run owner:refresh-decision-issues
npm run owner:decision-issues-freshness
```

Expected future result while contribution acceptance remains blocked:

```text
ok contribution terms PRD decision preflight ready
ok contribution terms PRD evidence current
ok contribution terms policy current
blocked code contribution acceptance
```

## Stop Conditions

Stop the future PRD unit if:

- it accepts code contributions instead of defining terms,
- it adds CLA or DCO enforcement before the policy is approved,
- it weakens private-data exclusion rules,
- it changes npm package version,
- it creates a GitHub release or tag,
- it deploys services,
- it adds hosted runtime behavior,
- it enables branch governance,
- it implies production runtime support.

## Still Blocked

This packet does not approve:

- accepting public code contributions,
- merging outside pull requests,
- adding CLA enforcement,
- adding DCO enforcement,
- changing npm package version,
- creating new GitHub releases or tags,
- deployment,
- hosted runtime behavior,
- production runtime use.

## Related Docs

- [Contribution Terms PRD Preparation](contribution-terms-prd-preparation.md)
- [Contribution Terms PRD](contribution-terms-prd.md)
- [Contribution Policy](contribution-policy.md)
- [Contribution Terms PRD Decision Preflight](contribution-terms-prd-decision-preflight.md)
- [Reviewer Feedback Guide](reviewer-feedback-guide.md)
- [Legal Review Question Packet](legal-review-question-packet.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Public Status](public-status.md)
