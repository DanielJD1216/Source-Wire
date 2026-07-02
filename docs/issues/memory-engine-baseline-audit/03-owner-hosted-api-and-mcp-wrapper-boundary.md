# Owner-Hosted API And MCP Wrapper Boundary

## Parent

Source-Wire Memory Engine Baseline Audit PRD.

## What to build

Define how Source-Wire would wrap or call a runtime through owner-hosted API and MCP boundaries while preserving policy checks.

The output should explain how an agent harness calls Source-Wire tools, how Source-Wire enforces policy, and how a separate runtime candidate may be called without letting MCP bypass the API policy boundary.

## Acceptance criteria

- [ ] Required API policy checks are defined.
- [ ] Required MCP tool behavior is defined.
- [ ] Citation, gap, denied-result, namespace, caller, and audit metadata expectations are mapped.
- [ ] The wrapper relationship to a separate runtime candidate is explained.
- [ ] MCP bypass of API policy is explicitly forbidden.
- [ ] Trusted memory promotion remains owner or application controlled.
- [ ] No API server or MCP server implementation is added.

## Blocked by

- Runtime Baseline Capability Audit.
