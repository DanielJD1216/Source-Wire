# Source-Wire Runtime-Adjacent Recommendation

Date: 2026-06-29

## Recommendation

The next Source-Wire implementation unit should be:

**Unit 25: JSON Schema Package Exports**

## Why This Wins

JSON Schema package exports are the best next step because they give public users a real package surface while staying inside the current contract-only boundary.

This step:

- reuses schemas that already exist,
- supports future CLI validation,
- supports external validation tools,
- supports future app forms and SDKs,
- stays testable with current synthetic fixtures,
- avoids servers, databases, connectors, and memory runtime behavior.

## What Unit 25 Should Build

Unit 25 should make the existing schemas easier to consume from the package.

Expected scope:

- export schema file paths or schema objects through the package boundary,
- document how to import and use the schemas,
- keep fixture validation passing,
- add a minimal test proving the exported schema surface works,
- keep public-safety scanning clean.

## What Unit 25 Should Not Build

Unit 25 should not add:

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

## Why Not The Other Options First

### Tiny Local Validation CLI

A CLI is useful, but it should depend on a clean schema export surface.

If schema exports are done first, the CLI can be smaller and cleaner.

### CI For Package Checks And Public-Safety Scanning

CI is important, but it is a guardrail.

It improves release confidence, but it does not make the package easier to consume by itself.

### TypeScript Helper Functions

Helpers can help later.

Right now they carry more risk because helper logic can drift into source sync, retrieval, memory policy, or trusted-promotion behavior.

## Suggested Follow-Up Order

1. Unit 25: JSON Schema Package Exports.
2. Unit 26 candidate: Tiny Local Validation CLI.
3. Unit 27 candidate: CI Package Checks And Public-Safety Scan.
4. Later candidate: TypeScript helper functions after the validation surface is stable.

## Boundary Confirmation

This recommendation does not open runtime implementation.

It only selects the next public package step.
