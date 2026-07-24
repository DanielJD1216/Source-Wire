# Source-Wire Runtime-Adjacent Evidence And Scoring

Date: 2026-06-29

## Purpose

This document explains the scoring behind the runtime-adjacent decision matrix.

It is evidence for choosing the next public Source-Wire step without opening backend runtime behavior too early.

## Evidence Rules

The evidence is limited to public Source-Wire state:

- public contract docs,
- public TypeScript contract types,
- public JSON schemas,
- synthetic fixtures,
- fixture validation,
- runtime boundary docs.

It does not use private implementation details.

## Scoring Categories

Scores use `1` to `5`.

For positive categories, `5` is strongest.

For risk categories, `5` means lowest risk.

### Public User Value

This measures how much the option helps a public user now.

### Safety Risk

This measures how safely the option can be added without exposing private data, private architecture, or real runtime behavior.

### Implementation Size

This measures how small and reversible the work is.

### Testability

This measures how easily the option can be tested with the current package.

### Future Extensibility

This measures whether the option creates a stable base for later runtime, CLI, SDK, or app work.

### Backend-Opening Risk

This measures how likely the option is to accidentally pull the project toward servers, databases, connectors, or memory-engine integration.

## Option Evidence

| Option | Evidence | Main risk | Score read |
| --- | --- | --- | --- |
| TypeScript helper functions | Public types already exist, so helpers could reduce boilerplate for TypeScript users. | Helpers can drift into policy, retrieval, sync, or promotion behavior too early. | Useful, but not first. |
| JSON Schema package exports | Public schemas already exist and are validated against synthetic fixtures. | Low risk if exports stay file/package-level and do not add runtime services. | Strongest next package surface. |
| Tiny local validation CLI | Fixture validation already exists, so a user-facing CLI is plausible. | CLI design should depend on a stable schema export surface. | Strong follow-up after schema exports. |
| CI for package checks and public-safety scanning | Checks already run locally and safety scanning has zero findings. | CI improves confidence but does not create a public user surface by itself. | Strong guardrail, not the main product step. |

## Detailed Rationale

### TypeScript Helper Functions

TypeScript helpers are attractive because Source-Wire already exports contract types.

Good helpers could:

- normalize fixture loading,
- validate common fields,
- create small typed wrappers around contract payloads.

The problem is timing.

Helpers can quietly become runtime decisions. For example, a helper that decides whether evidence is trusted or whether a source should be synced is no longer a simple helper. That becomes product behavior.

Current score:

- public user value: 3
- safety risk: 3
- implementation size: 3
- testability: 4
- future extensibility: 4
- backend-opening risk: 3

### JSON Schema Package Exports

Schema exports are the cleanest next package step.

The schemas already exist. They are already tested against synthetic fixtures. Making them easier to import from the package helps:

- other validation tools,
- CLI work,
- app forms,
- future SDKs,
- documentation examples.

This option stays close to the current package promise: define public shapes and validate public fixtures.

Current score:

- public user value: 4
- safety risk: 5
- implementation size: 5
- testability: 5
- future extensibility: 5
- backend-opening risk: 5

### Tiny Local Validation CLI

A tiny CLI would make Source-Wire more useful for people who do not want to write TypeScript.

Good CLI examples:

- validate a Project Context Pack file,
- validate a `second-brain.v1` response file,
- validate a chat-export JSONL file,
- print clear file-level errors.

The CLI should not import local folders automatically, call remote services, create memories, or promote trusted records.

Current score:

- public user value: 5
- safety risk: 4
- implementation size: 4
- testability: 5
- future extensibility: 4
- backend-opening risk: 4

### CI For Package Checks And Public-Safety Scanning

CI is a strong quality gate.

It can repeat:

- typecheck,
- build,
- tests,
- fixture validation,
- public-safety scanning.

But CI is not the public package surface. It helps maintainers avoid mistakes, but users still need better exports or CLI entry points.

Current score:

- public user value: 4
- safety risk: 5
- implementation size: 4
- testability: 5
- future extensibility: 4
- backend-opening risk: 5

## Evidence Conclusion

The next public package step should probably be JSON Schema package exports.

The strongest follow-up options are:

1. Tiny local validation CLI, if the goal is public usability.
2. CI package checks and public-safety scan, if the goal is release confidence.

TypeScript helper functions should wait until the validation surface is stable.

## Boundary Confirmation

This evidence document does not open:

- API server runtime,
- MCP server runtime,
- database migrations,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- npm publishing,
- real user data,
- private implementation code.
