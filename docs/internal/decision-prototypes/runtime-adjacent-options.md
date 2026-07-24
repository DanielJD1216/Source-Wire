# Source-Wire Runtime-Adjacent Options Decision Matrix

Date: 2026-06-29

## Purpose

Source-Wire is currently a public contract package skeleton.

This decision matrix compares the next safe public step before adding backend runtime behavior.

## Boundary

This decision prototype does not add:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- npm publishing,
- real user data,
- trusted Memory Record promotion,
- private implementation code.

## Scoring

Scores use `1` to `5`.

For positive categories, `5` is strongest.

For risk categories, `5` means lowest risk.

| Option | Public user value | Safety risk | Implementation size | Testability | Future extensibility | Backend-opening risk | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| TypeScript helper functions | 3 | 3 | 3 | 4 | 4 | 3 | 20 |
| JSON Schema package exports | 4 | 5 | 5 | 5 | 5 | 5 | 29 |
| Tiny local validation CLI | 5 | 4 | 4 | 5 | 4 | 4 | 26 |
| CI for package checks and public-safety scanning | 4 | 5 | 4 | 5 | 4 | 5 | 27 |

## Option Notes

### TypeScript Helper Functions

Helper functions could make the package easier to use from TypeScript projects.

They are useful, but they can accidentally become runtime behavior if they start making policy decisions, source sync decisions, retrieval decisions, or memory-promotion decisions.

Best fit later, after the validation and schema export surface is stable.

### JSON Schema Package Exports

Schema exports make the existing public contracts easier for other tools to consume.

They fit the current package promise because schemas are already public, synthetic-fixture-backed, and validation-oriented.

This option is low-risk because it does not require storage, auth, servers, connectors, or private implementation logic.

### Tiny Local Validation CLI

A CLI would make Source-Wire useful to non-library users.

It could validate fixture files or user-created contract payloads without asking them to write TypeScript.

This option is useful, but it should probably come after package-level schema exports so the CLI has a clean contract surface to call.

### CI For Package Checks And Public-Safety Scanning

CI makes public checks repeatable.

It should run typecheck, build, tests, fixture validation, and public-safety scanning.

CI is valuable, but it is a guardrail, not a product surface. It should support the selected package step rather than replace it.

## Early Read

The strongest next implementation candidate is JSON Schema package exports.

The likely follow-up is either a tiny validation CLI or CI, depending on whether the next bottleneck is public usability or release confidence.

## Current Recommendation Status

This file is a decision matrix only.

The final recommendation belongs in the next Unit 24 slice.
