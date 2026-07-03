# Slice 1: Setup Contract And Owner-Brings Checklist

## Goal

Define the owner-hosted setup contract and the owner-brings checklist.

## Acceptance Criteria

- Owner device or server is required.
- PostgreSQL-compatible database is required.
- Owner credentials and secret storage are owner-controlled.
- MCP-capable harnesses are owner-controlled.
- Source packets or configured source connections are owner-selected.
- Source-Wire-hosted memory is explicitly not the default.
- Stop conditions are listed.
- No real secrets, private paths, or private data are included.

## Out Of Scope

- Runtime implementation.
- Database migrations.
- Mission Control UI.
- Deployment.
- Real user data.

## Implementation Status

Implemented in source and docs.

Proof:

- `src/contracts/owner-hosted-setup.ts`
- `examples/fixtures/owner-hosted-setup/README.md`
- `examples/fixtures/owner-hosted-setup/owner-hosted-setup-checklist.json`
- `docs/contracts/owner-hosted-setup-contract.md`
- `docs/owner-hosted-setup-slice-1-proof.md`
