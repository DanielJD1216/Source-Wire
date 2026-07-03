# Owner-Hosted API Policy Wrapper Smoke

Local artifact: [Source-Wire Memory Engine Wrapper Runtime API Policy Wrapper Smoke](../../memory-engine-wrapper-runtime-api-policy-wrapper-smoke.md).

Smoke command:

```bash
npm run wrapper-runtime:api-policy-smoke
```

## Parent

Source-Wire Memory Engine Wrapper Runtime PRD.

## What to build

Implement the narrowest synthetic owner-hosted API policy wrapper proof for authorized reads, denied reads, namespace isolation, source evidence, trusted memory, pending candidates, approval boundary, and audit-safe metadata.

## Acceptance criteria

- [x] Authorized read succeeds.
- [x] Unauthorized caller fails closed.
- [x] Wrong namespace fails closed.
- [x] Source evidence remains separate from trusted memory.
- [x] Pending candidates do not become trusted memory.
- [x] Owner or application approval path is represented.
- [x] Denied, gap, citation, namespace, caller, and audit metadata are shaped safely.
- [x] No database migration, deployment, real data, or direct runtime merge is added.

## Blocked by

- Wrapper Runtime Policy Contract And Threat Boundary.
- Synthetic Wrapper Runtime Fixture Matrix.
