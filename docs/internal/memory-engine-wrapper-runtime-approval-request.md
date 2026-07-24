# Source-Wire Memory Engine Wrapper Runtime Approval Request

Status: approval request recorded. Synthetic implementation was completed after owner approval. Public issue publication was not performed.

Date: 2026-07-02

## Purpose

This packet records the approval language that opened the synthetic wrapper runtime implementation unit.

The local PRD is drafted in [Source-Wire Memory Engine Wrapper Runtime PRD](memory-engine-wrapper-runtime-prd.md).

Implementation should not start from a vague `proceed`.

## Exact Approval Text

The owner approved this implementation scope:

```text
Approved for a future Source-Wire wrapper runtime implementation unit: build a narrow owner-hosted API policy wrapper and MCP adapter path around a separate runtime candidate. Keep Source-Wire-Memory-Engine separate. Do not copy AGPLv3 code into Source-Wire. Use synthetic fixtures only. Do not add real user data. Do not deploy services. Do not publish npm. Do not create a GitHub release. Do not accept code contributions. Do not add managed-hosted behavior. Trusted memory promotion must remain owner or application controlled. MCP must not bypass Source-Wire API policy.
```

## What Approval Allowed

- Created implementation slices from the wrapper runtime PRD.
- Implemented a narrow synthetic owner-hosted API policy wrapper smoke.
- Implemented synthetic MCP adapter behavior only through the Source-Wire API policy boundary.
- Proved a separate synthetic runtime candidate boundary through policy-controlled shaping.
- Added or extended synthetic fixtures.

## What Approval Did Not Allow

- Direct merge of `Source-Wire-Memory-Engine`.
- Copying AGPLv3 code into Source-Wire.
- Real user data.
- Real client data.
- Deployment.
- Production runtime use.
- Source-Wire-managed hosting.
- Npm publishing.
- GitHub release creation.
- Git tags.
- Public code contribution acceptance.
- Mission Control UI implementation unless separately sliced and approved.
- Database migrations unless separately sliced and approved.

## Actual Follow-Up

The implementation slices are recorded in [Source-Wire Memory Engine Wrapper Runtime Issue Slices](memory-engine-wrapper-runtime-issue-slices.md).

The closeout proof is recorded in [Source-Wire Memory Engine Wrapper Runtime Proof Docs And Stop Conditions](memory-engine-wrapper-runtime-proof-docs-stop-conditions.md).

Next decision gate: [Owner-Hosted Runtime Direction Gate](owner-hosted-runtime-direction-gate.md).
