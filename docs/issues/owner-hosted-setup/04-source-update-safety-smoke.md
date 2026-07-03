# Slice 4: Source Update Safety Smoke

## Goal

Prove safe source update behavior with synthetic fixtures.

## Acceptance Criteria

- Caller-supplied snapshot is required.
- Local folder crawling is blocked.
- Broad private import is blocked.
- Trusted memory delta stays `0`.
- `noAutoPromotion: true` is visible.
- Pending review remains owner or application controlled.

## Out Of Scope

- Live connectors.
- Whole-vault import.
- Local filesystem crawling.
- Automatic trusted-memory promotion.

## Implementation Status

Implemented as a synthetic local smoke.

Proof:

- `examples/owner-hosted-setup/source-update-safety-smoke.mjs`
- `docs/owner-hosted-setup-source-update-safety-smoke.md`
- `docs/owner-hosted-setup-slice-4-proof.md`
