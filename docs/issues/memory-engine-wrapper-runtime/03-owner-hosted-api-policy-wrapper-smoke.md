# Owner-Hosted API Policy Wrapper Smoke

## Parent

Source-Wire Memory Engine Wrapper Runtime PRD.

## What to build

Implement the narrowest synthetic owner-hosted API policy wrapper proof for authorized reads, denied reads, namespace isolation, source evidence, trusted memory, pending candidates, approval boundary, and audit-safe metadata.

## Acceptance criteria

- [ ] Authorized read succeeds.
- [ ] Unauthorized caller fails closed.
- [ ] Wrong namespace fails closed.
- [ ] Source evidence remains separate from trusted memory.
- [ ] Pending candidates do not become trusted memory.
- [ ] Owner or application approval path is represented.
- [ ] Denied, gap, citation, namespace, caller, and audit metadata are shaped safely.
- [ ] No database migration, deployment, real data, or direct runtime merge is added.

## Blocked by

- Wrapper Runtime Policy Contract And Threat Boundary.
- Synthetic Wrapper Runtime Fixture Matrix.
