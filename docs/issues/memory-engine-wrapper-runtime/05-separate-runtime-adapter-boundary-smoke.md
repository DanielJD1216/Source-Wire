# Separate Runtime Adapter Boundary Smoke

## Parent

Source-Wire Memory Engine Wrapper Runtime PRD.

## What to build

Implement the narrowest adapter boundary proof for accepting a separate runtime candidate result while keeping Source-Wire policy outside that runtime.

## Acceptance criteria

- [ ] Adapter uses synthetic runtime results only.
- [ ] Source-Wire policy remains outside the runtime candidate.
- [ ] Runtime result is shaped before reaching MCP.
- [ ] Adapter cannot own auth, namespace, approval, citation, denied-result, or audit policy.
- [ ] No AGPLv3 code is copied.
- [ ] No Docker or installer bundling is added.

## Blocked by

- Owner-Hosted API Policy Wrapper Smoke.
