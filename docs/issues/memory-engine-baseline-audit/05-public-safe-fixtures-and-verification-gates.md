# Public-Safe Fixtures And Verification Gates

Local artifact: [Memory Engine Baseline Public-Safe Fixtures And Verification Gates](../../memory-engine-baseline-public-safe-fixtures-and-verification-gates.md).

## Parent

Source-Wire Memory Engine Baseline Audit PRD.

## What to build

Define public-safe fixture categories and verification gates required before runtime implementation starts.

This slice keeps the future runtime testable without secrets, private data, real owner memory, client data, or live connectors.

## Acceptance criteria

- [ ] Synthetic fixture categories are defined for owner, namespace, source evidence, trusted memory, candidates, denied access, and MCP calls.
- [ ] Fixtures prohibit real user data, client data, private paths, tokens, account IDs, emails, domains, screenshots, and production exports.
- [ ] Verification includes docs link checks.
- [ ] Verification includes public safety scans.
- [ ] Verification includes public claim-boundary scans.
- [ ] Verification includes package checks.
- [ ] Verification includes diagram render proof and visual quality proof.
- [ ] Proof required before implementation starts is listed.
- [ ] No fixture implementation is added unless separately approved.

## Blocked by

- Runtime Baseline Capability Audit.
- License Path Decision Packet.
- Owner-Hosted API And MCP Wrapper Boundary.
