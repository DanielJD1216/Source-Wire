# BYO Self-Hosted Setup Path For Nontechnical Owners

## Parent

Source-Wire Memory Engine Baseline Audit PRD.

## What to build

Define the future setup path for a nontechnical owner who wants to run Source-Wire with their own infrastructure.

The setup path should explain what the owner brings: device or server, PostgreSQL-compatible database, model/API keys, data sources, and MCP-capable agent harnesses.

This slice is HITL because it defines the adoption path and deployment posture.

## Acceptance criteria

- [ ] Local device, local network, cloud VM, and managed database paths are separated.
- [ ] PostgreSQL-compatible database requirements are explained in plain English.
- [ ] Owner-supplied model/API key requirements are explained in plain English.
- [ ] MCP harness connection expectations are explained.
- [ ] Minimum nontechnical Mission Control needs are defined without implementing UI.
- [ ] Source-Wire-managed hosting remains out of scope.
- [ ] No deployment config or runtime implementation is added.

## Blocked by

- Runtime Baseline Capability Audit.
- Owner-Hosted API And MCP Wrapper Boundary.
