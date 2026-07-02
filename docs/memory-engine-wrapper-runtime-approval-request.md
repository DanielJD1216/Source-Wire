# Source-Wire Memory Engine Wrapper Runtime Approval Request

Status: approval request only. No implementation or public issue publication has been performed by this document.

Date: 2026-07-02

## Purpose

Use this packet before any future wrapper runtime implementation unit.

The local PRD is drafted in [Source-Wire Memory Engine Wrapper Runtime PRD](memory-engine-wrapper-runtime-prd.md).

Implementation should not start from a vague `proceed`.

## Exact Approval Text

Use this exact approval text if the owner wants to open the future wrapper runtime implementation unit:

```text
Approved for a future Source-Wire wrapper runtime implementation unit: build a narrow owner-hosted API policy wrapper and MCP adapter path around a separate runtime candidate. Keep Source-Wire-Memory-Engine separate. Do not copy AGPLv3 code into Source-Wire. Use synthetic fixtures only. Do not add real user data. Do not deploy services. Do not publish npm. Do not create a GitHub release. Do not accept code contributions. Do not add managed-hosted behavior. Trusted memory promotion must remain owner or application controlled. MCP must not bypass Source-Wire API policy.
```

## What Approval Would Allow

- Create implementation slices from the wrapper runtime PRD.
- Implement a narrow owner-hosted API policy wrapper if the later slices approve code.
- Implement MCP adapter behavior only through the Source-Wire API policy boundary if the later slices approve code.
- Use a separate runtime candidate through a policy-controlled adapter if the later slices approve code.
- Add or extend synthetic fixtures if the later slices approve fixture work.

## What Approval Would Not Allow

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

## Required Next Step After Approval

Run `/to-issues` against [Source-Wire Memory Engine Wrapper Runtime PRD](memory-engine-wrapper-runtime-prd.md).

Keep each issue narrow enough to prove one boundary without opening deployment, release, contribution, managed-hosting, or real-data paths.
