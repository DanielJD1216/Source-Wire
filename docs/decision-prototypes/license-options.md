# Source-Wire License Options Decision Matrix

Date: 2026-06-29

## Purpose

Source-Wire is public, package-shaped, and package-ready in dry-run form.

It is not released for reuse yet.

This matrix compares license postures before any actual license change.

## Boundary

This decision prototype is not legal advice.

It does not change:

- `package.json` license,
- package version,
- npm publish status,
- GitHub release status,
- deployment status,
- runtime backend status.

It does not add a `LICENSE` file.

## Scoring

Scores use `1` to `5`.

For positive categories, `5` is strongest.

For risk categories, `5` means lowest risk.

| Option | Public adoption value | Owner control | Contributor clarity | Commercial reuse protection | Enterprise compatibility | Simplicity | Reversibility before release | Agent-memory fit | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Stay `UNLICENSED` until release approval | 1 | 5 | 3 | 5 | 1 | 5 | 5 | 4 | 29 |
| MIT | 5 | 1 | 5 | 1 | 5 | 5 | 2 | 3 | 27 |
| Apache-2.0 | 5 | 2 | 5 | 1 | 5 | 4 | 2 | 5 | 29 |
| Source-available noncommercial | 3 | 4 | 3 | 5 | 2 | 3 | 3 | 3 | 26 |
| Dual-license or delayed-license model | 3 | 5 | 2 | 5 | 3 | 2 | 4 | 4 | 28 |

## Option Notes

### Stay `UNLICENSED` Until Release Approval

This keeps the current boundary intact.

It is the strongest short-term control posture because it avoids accidentally approving reuse before the owner chooses a real release strategy.

It is weak for adoption because public users cannot safely treat the project as reusable software yet.

### MIT

MIT is the simplest permissive option.

It is easy for developers to understand and easy for companies to consume.

The tradeoff is control: it allows broad commercial reuse, modification, redistribution, sublicensing, and selling under the license terms.

### Apache-2.0

Apache-2.0 is also permissive, but it is more explicit than MIT.

It is usually a stronger fit for infrastructure, agent tooling, and package ecosystems because it includes an express patent grant and clearer contribution language.

The tradeoff is that it still allows broad commercial reuse.

### Source-Available Noncommercial

A noncommercial posture can protect against commercial reuse before the business model is settled.

It is not the same as open source if commercial use is restricted.

The tradeoff is adoption friction: many companies and open-source contributors avoid noncommercial software because the boundary is harder to use safely.

### Dual-License Or Delayed-License Model

A dual-license or delayed-license model keeps more owner control while preserving a future open-source path.

Examples:

- source-visible now, open-source later,
- noncommercial now, commercial license by permission,
- Apache-2.0 later after approval,
- separate public contract package license and private runtime license.

The tradeoff is complexity. It needs clearer docs and likely legal review before release.

## Early Read

The best immediate posture is to stay `UNLICENSED` until owner approval.

The best likely open-source release candidate is Apache-2.0 if the owner chooses a permissive public release later.

## Current Recommendation Status

This file is a decision matrix only.

The final Unit 30 recommendation belongs in the next decision prototype document.
