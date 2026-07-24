# KnowledgeProvider v1 Smoke

## Purpose

The KnowledgeProvider smoke proves that document-index and relational-view profiles follow one exact, read-only contract without provider-specific policy exceptions.

## Run

Use Node.js 22 with npm from the repository root. See [Quickstart](../getting-started/quickstart.md) for setup.

```bash
npm run runtime:knowledge-provider-smoke
```

The command builds the package, loads the synthetic matrix, runs all 37 cases through `evaluateKnowledgeProviderConformanceFixtureMatrix`, and exits non-zero on a missing, duplicate, unexpected, or mismatched case or result.

## Stable Markers

Representative markers:

```text
ok knowledge provider case kp_document_index_conforms
ok knowledge provider case kp_relational_view_conforms
ok knowledge provider case kp_unknown_profile_denied
ok knowledge provider case kp_wrong_namespace_denied
ok knowledge provider case kp_wrong_owner_denied
ok knowledge provider case kp_missing_digest_rejected
ok knowledge provider conformance smoke
```

## What It Proves

- exact v1 compatibility and required capabilities,
- read-only provider authority,
- explicit profile identity with no default-profile substitution,
- complete scoped evidence and citations,
- zero-content denial for namespace, ACL, and provenance failures,
- visible empty, partial, unavailable, and rate-limited gaps,
- provider-bound opaque cursors,
- safe error shape and retry bound,
- prompt-injection non-authority,
- internal unreleased evidence and no automatic promotion.

## What It Does Not Prove

It does not connect to a provider, evaluate a real provider credential, measure latency, mutate a source, or create trusted memory.

Related docs:

- [KnowledgeProvider v1 Contract](../contracts/knowledge-provider-v1-contract.md)
- [KnowledgeProvider Fixture Matrix](../../examples/fixtures/knowledge-provider/README.md)
