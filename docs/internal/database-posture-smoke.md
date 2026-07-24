# Source-Wire Database Posture Smoke

Status: active synthetic smoke test.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

`npm run runtime:database-posture-smoke` validates the synthetic database posture package.

It runs locally, uses synthetic fixtures only, does not require secrets or services, and does not connect to a database.

## Command

```bash
npm run runtime:database-posture-smoke
```

## Expected Markers

```text
ok database posture case authorized_namespace_data_class_read
ok database posture case wrong_namespace_denied_without_leak
ok database posture case source_evidence_submitted_to_indexed
ok database posture case candidate_prepared_to_approved
ok database posture case candidate_prepared_to_rejected
ok database posture case trusted_memory_approved_to_revoked
ok database posture case trusted_memory_approved_to_deleted
ok database posture case retention_policy_summary
ok database posture case deletion_marks_dependent_citations_stale
ok database posture case backup_keeps_owner_namespace_boundaries
ok database posture case restore_cannot_bypass_candidate_review
ok database posture case cache_and_embedding_inherit_parent_namespace
ok database posture smoke
```

## Boundary

This smoke does not add:

- database migrations,
- real database connections,
- PostgreSQL setup,
- pgvector setup,
- API server runtime,
- MCP server runtime,
- live connectors,
- Mission Control UI,
- deployment,
- managed hosting,
- real user data,
- client data,
- private implementation code,
- AGPLv3 code,
- automatic trusted memory promotion.

## Related Files

- [Database Posture Implementation Proof](database-posture-implementation-proof.md)
- [Database Posture Implementation Packet](database-posture-implementation-packet.md)
- [Database Posture Fixtures](../../examples/fixtures/database-posture/README.md)
- [Database Posture Smoke Example](../../examples/database-posture/README.md)
