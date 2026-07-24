# MemoryStore Conformance Smoke

Use Node.js 22 with npm for local checks. See the [Quickstart](../../docs/getting-started/quickstart.md).

This example loads the synthetic `MemoryStore v1` fixture matrix and evaluates the PostgreSQL ownership, lifecycle, audit, compatibility, role, and query-safety rules.

From the repository root:

```bash
npm run runtime:memory-store-smoke
```

Expected output includes exactly 107 unique `ok memory store case` markers and ends with:

```text
ok memory store conformance smoke
```

The smoke proves TypeScript contract and synthetic posture behavior. It does not connect to PostgreSQL, apply migrations, test real grants, or operate stored data.

Related docs:

- [MemoryStore v1 Contract](../../docs/contracts/memory-store-v1-contract.md)
- [MemoryStore Smoke](../../docs/reference/memory-store-smoke.md)
