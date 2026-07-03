# Synthetic Wrapper Runtime Fixture Matrix

Local artifact: [Source-Wire Memory Engine Wrapper Runtime Fixture Matrix](../../memory-engine-wrapper-runtime-fixture-matrix.md).

Fixture artifact: [Wrapper runtime fixture matrix](../../../examples/fixtures/wrapper-runtime/README.md).

## Parent

Source-Wire Memory Engine Wrapper Runtime PRD.

## What to build

Define and, if separately approved inside the implementation unit, add synthetic fixture coverage for the wrapper runtime behavior without using real private data.

## Acceptance criteria

- [x] Fixture categories include owner, namespace, harness caller, source evidence, trusted memory, candidates, denied access, gaps, MCP calls, audit events, and runtime adapter result.
- [x] Fixtures use obviously fake values.
- [x] Fixtures contain no real user data, client data, private paths, tokens, account IDs, emails, domains, screenshots, or production exports.
- [x] Fixture validation or smoke proof is defined.
- [x] No real data or live connector payload is added.

## Blocked by

- Wrapper Runtime Policy Contract And Threat Boundary.
