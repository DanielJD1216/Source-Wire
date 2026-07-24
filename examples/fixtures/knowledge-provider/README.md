# KnowledgeProvider v1 Fixture Matrix

Use Node.js 22 with npm for local checks. See the [Quickstart](../../../docs/getting-started/quickstart.md).

This directory contains one fictional, synthetic conformance matrix for the read-only `KnowledgeProvider v1` contract.

The matrix defines two profiles:

- `synthetic_document_index`
- `synthetic_relational_view`

Both profiles run through the same evaluator and the same policy rules. The relational profile represents predefined read-only views. It does not represent arbitrary table access or model-generated SQL.

The 37 cases cover exact version matching, explicit provider-profile identity, required capabilities, all four allowed operations, owner, namespace, and ACL denial, provenance completeness, opaque cursor binding, degraded providers, bounded safe errors, prompt-injection non-authority, and no automatic promotion.

The smoke requires the exact case count and unique profile, fixture-case, and result IDs.

Run the matrix from the repository root:

```bash
npm run runtime:knowledge-provider-smoke
```

The fixture contains no provider SDK, credential, connection, live connector, external mutation, database connection, or real data.

Related docs:

- [KnowledgeProvider v1 Contract](../../../docs/contracts/knowledge-provider-v1-contract.md)
- [KnowledgeProvider Smoke](../../../docs/reference/knowledge-provider-smoke.md)
- [Knowledge Provider And Memory Store Boundary](../../../docs/concepts/knowledge-provider-memory-store-boundary.md)
