# Source-Wire Legal Review Question Packet

Status: question packet only.

This document is not legal advice. It does not approve a future npm package version, future GitHub release, deployment, hosted runtime behavior, production runtime use, or code contribution acceptance.

## Purpose

Source-Wire is Apache-2.0 licensed as a source package.

Before contributor intake, future package releases, production adoption, or hosted runtime work, the owner should answer the legal and governance questions below or route them to counsel.

## Current Boundary

| Field | Current value |
| --- | --- |
| Package license | `Apache-2.0` |
| Package version | `0.1.0` |
| `LICENSE` file | present |
| npm package | published as `@source-wire/contracts@0.1.0` |
| GitHub release | published as `v0.1.0` |
| Hosted runtime backend | blocked |
| Code contributions | blocked |
| Public support | review feedback and issue templates only |
| Real user data examples | blocked |

## Command

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

Install dependencies first:

```bash
npm install
```

Then run:

```bash
npm run legal:packet
```

Expected markers:

```text
ok legal review packet ready
ok owner license approval recorded
```

The command verifies the current boundary and prints review topics. It does not give legal advice, publish npm, create a GitHub release, deploy services, accept contributions, or approve production runtime use.

## Questions For Counsel Or Owner Review

### 1. License Path

- Should Source-Wire become a permissive open-source package, stay unlicensed, use a source-available license, or wait for further legal review?
- If permissive open source is approved, is Apache-2.0 the right license for this agent-memory contract package?
- Should license approval be separate from npm publishing and GitHub release approval?
- Should the public contract package and any future hosted runtime use the same license posture or separate postures?

### 2. Commercial Reuse

- Should other people or companies be allowed to use Source-Wire commercially?
- If yes, are there restrictions or attribution expectations beyond the chosen license?
- If no, should the project use a noncommercial or source-available license instead of an open-source license?
- Should commercial reuse of future hosted-memory services be handled differently from reuse of the contract package?

### 3. Contributor Terms

- When should code contributions be accepted, if ever?
- Does the project need a contributor license agreement, developer certificate of origin, or another contribution policy before accepting code?
- Are issue reports and docs feedback safe to accept before code contribution terms are approved?
- What wording should `CONTRIBUTING.md` use after license approval?

### 4. Support Boundary

- What public support is offered before licensing, publishing, or runtime release?
- What support is explicitly not offered?
- Should issue templates keep blocking real user data, local paths, account IDs, client names, screenshots, and production exports?
- Should the support boundary change after licensing and first package publication?

### 5. Security Boundary

- What security reports are meaningful while Source-Wire has no hosted runtime, API server, MCP server, database, or live connectors?
- Should vulnerability reporting use public issues, private security advisories, or another channel after runtime work begins?
- What security promises should not be made while the repo is contract-only?

### 6. Name, Brand, And Trademark

- Is the Source-Wire name clear to use publicly?
- Should the owner reserve rights around the project name, logo, or hosted-service branding?
- Should future docs distinguish between the open contract package and any managed service name?

### 7. Hosted Runtime And Managed Service Rights

- If a future hosted or managed memory service is built, should its code, deployment, data model, or commercial use be licensed differently from the public contract package?
- Should the public license permit others to host competing services?
- Should database schemas, connectors, or Mission Control UI be licensed separately from contracts?

### 8. Data And Privacy Boundary

- Are the current public examples and fixtures safe because they are synthetic only?
- What kinds of user data, client data, private screenshots, source payloads, chat logs, memory records, account IDs, domains, emails, and local paths must stay out of public issues and fixtures?
- What should the public repo say if a reviewer accidentally submits private data?

## Decision Outputs Needed

Before broad public reuse, record:

- chosen license path,
- commercial reuse stance,
- contribution policy,
- support boundary,
- security reporting boundary,
- name or trademark guidance,
- hosted runtime and managed-service boundary,
- private-data handling rule.

For the launch approval order that depends on these answers, read [Owner Launch Checklist](owner-launch-checklist.md).

## Related Docs

- [License Decision Gate](license-decision-gate.md)
- [Owner Launch Checklist](owner-launch-checklist.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Future License Change Plan](future-license-change-plan.md)
- [World-Share Readiness](world-share-readiness.md)
- [Public Status](public-status.md)
- [Contributing](https://github.com/DanielJD1216/Source-Wire/blob/main/CONTRIBUTING.md)
- [Support](https://github.com/DanielJD1216/Source-Wire/blob/main/SUPPORT.md)
- [Security Policy](https://github.com/DanielJD1216/Source-Wire/blob/main/SECURITY.md)
