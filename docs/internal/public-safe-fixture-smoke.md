# Source-Wire Public-Safe Fixture Smoke

Status: implemented synthetic hosted-runtime fixture smoke.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

`npm run runtime:fixture-smoke` validates the synthetic hosted-runtime fixture package.

It proves the fixture matrix can be evaluated locally without secrets, servers, databases, live connectors, private owner data, client data, production exports, screenshots, local paths, or automatic trusted memory promotion.

## Command

```bash
npm run runtime:fixture-smoke
```

## Expected Markers

```text
ok hosted runtime fixture case authorized_owner_read
ok hosted runtime fixture case unauthorized_caller_denial
ok hosted runtime fixture case wrong_namespace_denial_without_leak
ok hosted runtime fixture case source_evidence_citation
ok hosted runtime fixture case candidate_prepared_no_promotion
ok hosted runtime fixture case trusted_memory_read_after_approval
ok hosted runtime fixture case source_maintenance_no_auto_promotion
ok hosted runtime fixture case mcp_policy_route_cannot_bypass_api
ok hosted runtime fixture case mcp_bypass_denied
ok hosted runtime fixture case audit_metadata_allowed_case
ok hosted runtime fixture case audit_metadata_denied_case
ok hosted runtime fixture case stale_or_deleted_evidence_gap
ok hosted runtime fixture case owner_application_approval_allowed
ok hosted runtime fixture case agent_approval_requires_owner_control
ok hosted runtime fixture smoke
```

## Blocked Side Effects

The smoke asserts:

- no database migrations,
- no real database connections,
- no PostgreSQL setup,
- no pgvector setup,
- no API server runtime,
- no MCP server runtime,
- no live connectors,
- no Mission Control UI,
- no deployment,
- no managed hosting,
- no real data,
- no client data,
- no private implementation code,
- no AGPLv3 code,
- no MCP bypass around Source-Wire API policy,
- no automatic trusted memory promotion.

## Related Docs

- [Public-Safe Fixture Implementation Proof](public-safe-fixture-implementation-proof.md)
- [Public-Safe Fixture Implementation Packet](public-safe-fixture-implementation-packet.md)
- [Public-Safe Fixture Implementation Slices](public-safe-fixture-implementation-slices.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
