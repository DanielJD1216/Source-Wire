# Runtime Readiness Fixture Matrix

Status: synthetic fixture matrix for public runtime-readiness gates.

This matrix records the gates that must be clear before public owner-hosted runtime implementation can start.

It does not start runtime work.

## Fixture

Fixture path:

```text
examples/fixtures/runtime-readiness/runtime-readiness-fixture-matrix.json
```

Fixture type:

```text
source-wire-runtime-readiness-fixture-matrix
```

Contract version:

```text
source-wire-runtime-readiness.v1
```

## Covered Cases

| Case | Category | Status | Purpose |
| --- | --- | --- | --- |
| `private_daily_workflow_proof_ready` | private proof | ready | Records that private owner workflow proof can inform public planning. |
| `private_proof_missing_blocked` | private proof | blocked | Blocks public runtime implementation from assumption-only design. |
| `api_policy_contract_ready` | API policy | ready | Allows contract and fixture work without starting an API server. |
| `mcp_policy_bypass_blocked` | MCP policy | blocked | Blocks MCP from bypassing Source-Wire API policy. |
| `database_posture_unapproved_blocked` | database posture | blocked | Blocks migrations and connection code before storage approval. |
| `source_update_safety_ready` | source update | ready | Preserves caller-supplied snapshots, no crawling, and no auto-promotion. |
| `memory_engine_license_boundary_ready` | memory engine boundary | ready | Keeps the AGPLv3 memory-engine candidate separate. |
| `release_mutation_blocked` | release boundary | blocked | Blocks npm publishing, GitHub releases, version changes, and deployment. |

## Boundary

Every case preserves:

- synthetic fixtures only,
- no runtime implementation,
- no API server runtime,
- no MCP server runtime,
- no database migrations,
- no database connection attempt,
- no live connectors,
- no deployment,
- no managed hosting,
- no real user data,
- no copied private implementation code,
- no copied AGPLv3 code,
- no automatic trusted memory promotion,
- no package version change requirement.

## Verification

Run:

```bash
npm run runtime-readiness:smoke
```

Expected final marker:

```text
ok runtime readiness smoke
```

## Related Docs

- [Runtime Readiness Contract](contracts/runtime-readiness-contract.md)
- [Runtime Readiness Smoke](runtime-readiness-smoke.md)
- [Runtime Readiness Implementation Proof](runtime-readiness-implementation-proof.md)
