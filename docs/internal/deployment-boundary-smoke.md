# Source-Wire Deployment Boundary Smoke

Status: implemented synthetic deployment-boundary smoke.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Direct Answer

`npm run runtime:deployment-boundary-smoke` validates the synthetic deployment-boundary package.

It proves the fixture matrix can be evaluated locally without secrets, servers, databases, deployment config, cloud provider config, container runtime config, hosted services, managed hosting, live connectors, private owner data, client data, production exports, screenshots, local paths, or automatic trusted memory promotion.

## Command

```bash
npm run runtime:deployment-boundary-smoke
```

## Expected Markers

```text
ok deployment boundary case local_development_ready
ok deployment boundary case owner_hosted_runtime_requires_owner_infra
ok deployment boundary case managed_hosted_deferred
ok deployment boundary case stop_condition_blocks_runtime
ok deployment boundary case rollback_evidence_present
ok deployment boundary case rollback_evidence_missing_requires_review
ok deployment boundary case unsafe_hosting_claim_blocked
ok deployment boundary case no_hosted_service_proof
ok deployment boundary case mcp_bypass_blocked
ok deployment boundary case trusted_memory_promotion_boundary
ok deployment boundary smoke
```

## Blocked Side Effects

The smoke asserts:

- no deployment config,
- no cloud provider config,
- no Docker or container deployment config for runtime services,
- no hosted services,
- no managed hosting,
- no database migrations,
- no real database connections,
- no PostgreSQL setup,
- no pgvector setup,
- no API server runtime,
- no MCP server runtime,
- no live connectors,
- no Mission Control UI,
- no real data,
- no client data,
- no private implementation code,
- no AGPLv3 code,
- no MCP bypass around Source-Wire API policy,
- no automatic trusted memory promotion,
- no Source-Wire-hosted user memory claim.

## Related Docs

- [Deployment Boundary Implementation Proof](deployment-boundary-implementation-proof.md)
- [Deployment Boundary Implementation Packet](deployment-boundary-implementation-packet.md)
- [Deployment Boundary Implementation Slices](deployment-boundary-implementation-slices.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
