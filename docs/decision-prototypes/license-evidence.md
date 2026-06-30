# Source-Wire License Evidence And Scoring

Date: 2026-06-29

Historical status: superseded.

Apache-2.0 is now implemented for Source-Wire as a source package. This document is retained as decision history from before owner approval. The old evidence below explains why owner approval was needed before implementation; it is not current licensing guidance.

## Purpose

This document explains the scoring behind the Source-Wire license options matrix.

It is decision support, not legal advice.

## Evidence Rules

The evidence is limited to:

- current Source-Wire repo state,
- public package metadata,
- public release decision docs,
- public license references.

It does not use private implementation details.

## Public References

- SPDX lists `MIT` as the identifier for the MIT License and `Apache-2.0` as the identifier for Apache License 2.0: <https://spdx.org/licenses>
- SPDX's MIT page records the canonical MIT license identifier: <https://spdx.org/licenses/MIT>
- Apache's own Apache-2.0 page identifies the license as OSI approved and gives the SPDX short identifier `Apache-2.0`: <https://www.apache.org/licenses/LICENSE-2.0>
- OSI's Apache-2.0 page includes both copyright and patent license grants: <https://opensource.org/license/apache-2-0>
- PolyForm Noncommercial says noncommercial purposes are permitted purposes under that license: <https://polyformproject.org/licenses/noncommercial/1.0.0>
- OSI describes approved open-source licenses as licenses that allow software to be freely used, modified, and shared: <https://opensource.org/licenses>

## Scoring Categories

Scores use `1` to `5`.

For positive categories, `5` is strongest.

For risk categories, `5` means lowest risk.

### Public Adoption Value

How easy it is for outside developers and companies to use Source-Wire.

### Owner Control

How much control the owner keeps over reuse, commercial use, and release timing.

### Contributor Clarity

How clearly a contributor can understand what they are allowed to do.

### Commercial Reuse Protection

How strongly the option protects against commercial reuse without separate permission.

### Enterprise Compatibility

How likely the option is to pass normal company intake.

### Simplicity

How easy the option is to explain and maintain.

### Reversibility Before Release

How easy it is to change direction before a real release.

### Agent-Memory Fit

How well the option fits a reusable agent-memory contract package that may later sit under runtime products, hosted memory, MCP tools, and business use cases.

## Option Evidence

| Option | Evidence | Main risk | Score read |
| --- | --- | --- | --- |
| Stay `UNLICENSED` until release approval | Current package already uses `UNLICENSED`, current release decision blocks public reuse, and no `LICENSE` file exists. | Public users cannot safely adopt it yet. | Best short-term safety posture. |
| MIT | Very simple permissive license with a standard SPDX identifier. | Gives up commercial reuse control early. | Strong adoption, weak control. |
| Apache-2.0 | OSI-approved permissive license with explicit patent language and standard SPDX identifier. | Still gives broad commercial reuse permission. | Strong likely open-source candidate. |
| Source-available noncommercial | PolyForm Noncommercial permits noncommercial use and protects commercial reuse. | Not the same as open source when commercial use is restricted. | Good control, weaker adoption. |
| Dual-license or delayed-license model | Can preserve control while keeping an open-source path available later. | More complex and needs careful docs or legal review. | Strong strategy option, not first implementation. |

## Detailed Rationale

### Stay `UNLICENSED` Until Release Approval

This is the current state.

It scores high for owner control, commercial reuse protection, simplicity, and reversibility because no public reuse permission has been granted yet.

It scores low for adoption and enterprise compatibility because public users should not treat it as usable open-source software.

Current score:

- public adoption value: 1
- owner control: 5
- contributor clarity: 3
- commercial reuse protection: 5
- enterprise compatibility: 1
- simplicity: 5
- reversibility before release: 5
- agent-memory fit: 4

### MIT

MIT is attractive because it is short, familiar, and easy for developers to recognize.

It helps adoption because companies and developers usually understand it quickly.

It is weaker for Source-Wire right now because this project is still deciding what should be public contract surface, what should become runtime, and what should remain private.

Current score:

- public adoption value: 5
- owner control: 1
- contributor clarity: 5
- commercial reuse protection: 1
- enterprise compatibility: 5
- simplicity: 5
- reversibility before release: 2
- agent-memory fit: 3

### Apache-2.0

Apache-2.0 is the best likely permissive release candidate if Source-Wire becomes a true open-source contract package.

It is familiar, enterprise-compatible, and more explicit than MIT for infrastructure work because it includes patent language.

The tradeoff is still commercial reuse. If the owner is not ready for commercial reuse, Apache-2.0 is too early.

Current score:

- public adoption value: 5
- owner control: 2
- contributor clarity: 5
- commercial reuse protection: 1
- enterprise compatibility: 5
- simplicity: 4
- reversibility before release: 2
- agent-memory fit: 5

### Source-Available Noncommercial

A source-available noncommercial posture fits the fear of giving away too much too early.

It allows public visibility and some noncommercial use while protecting commercial reuse.

The tradeoff is trust and adoption. If a license restricts commercial use, it should not be described as ordinary open source.

Current score:

- public adoption value: 3
- owner control: 4
- contributor clarity: 3
- commercial reuse protection: 5
- enterprise compatibility: 2
- simplicity: 3
- reversibility before release: 3
- agent-memory fit: 3

### Dual-License Or Delayed-License Model

This model may fit Source-Wire long term.

It could keep public contracts visible while reserving commercial runtime, hosted memory, or managed-service rights.

It is not the right immediate implementation because dual licensing creates more explanation burden and should get legal review before release.

Current score:

- public adoption value: 3
- owner control: 5
- contributor clarity: 2
- commercial reuse protection: 5
- enterprise compatibility: 3
- simplicity: 2
- reversibility before release: 4
- agent-memory fit: 4

## Evidence Conclusion

There are two different questions:

1. What should Source-Wire do right now?
2. What license is the best likely candidate if Source-Wire becomes truly open source?

At the time this evidence document was written, Source-Wire should have stayed `UNLICENSED` until owner approval.

If the owner chooses a permissive open-source release later, Apache-2.0 is the strongest likely candidate because it fits infrastructure and agent tooling better than MIT.

## Boundary Confirmation

This evidence document does not change:

- package license,
- package version,
- npm publish status,
- GitHub release status,
- deployment status,
- runtime backend status.

It does not add a `LICENSE` file.
