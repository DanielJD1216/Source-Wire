# Wrapper Runtime Policy Contract And Threat Boundary

Local artifact: [Wrapper Runtime Policy Contract](../../../contracts/wrapper-runtime-policy-contract.md).

## Parent

Source-Wire Memory Engine Wrapper Runtime PRD.

## What to build

Define the exact policy contract and threat boundary for the future wrapper runtime so implementation cannot drift into direct runtime merge, MCP bypass, real data, deployment, or AGPLv3 code copy.

## Acceptance criteria

- [x] Owner, harness, namespace, capability, source, trusted-memory, citation, gap, denied-result, audit, and runtime-adapter policy terms are defined.
- [x] MCP bypass is explicitly forbidden.
- [x] Trusted-memory auto-promotion is explicitly forbidden.
- [x] Direct runtime merge and AGPLv3 code copy remain blocked.
- [x] Stop conditions are listed before code starts.
- [x] No implementation is added.

## Blocked by

None - can start immediately after exact owner approval opens the wrapper runtime unit.
