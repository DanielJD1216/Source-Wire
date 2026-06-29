# Source-Wire Docs

Source-Wire is a public contract package skeleton for agent-first memory systems.

It is not a runtime backend and it is not published to npm yet.

## Start Here

- [Public Adopter Walkthrough](adopter-walkthrough.md)
- [Architecture Map](architecture-map.md)
- [Quickstart](quickstart.md)
- [Runtime Boundary](runtime-boundary.md)
- [Public Runtime Decision](public-runtime-decision.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Synthetic Runtime Boundary Example](../examples/runtime-boundary/README.md)
- [Publish Readiness](publish-readiness.md)
- [Release Decision](release-decision.md)
- [License And Version Policy](license-version-policy.md)
- [Owner License Approval Packet](owner-license-approval-packet.md)

## Contracts

- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Source Graph Adapter Contract](contracts/source-graph-adapter-contract.md)
- [Source Connection Contract](contracts/source-connection-contract.md)
- [`second-brain.v1` Contract](contracts/second-brain-v1-contract.md)
- [MCP Tool Behavior Contract](contracts/mcp-tool-behavior-contract.md)

## Package Use

- [Quickstart](quickstart.md)
- [API Reference](api-reference.md)
- [TypeScript Examples](../examples/typescript/README.md)
- [Synthetic Runtime Boundary Example](../examples/runtime-boundary/README.md)
- [Schema Exports](schema-exports.md)
- [Validation CLI](validation-cli.md)
- [CI Checks](ci-checks.md)

## Decision Prototypes

- [Runtime-Adjacent Options Decision Matrix](decision-prototypes/runtime-adjacent-options.md)
- [Runtime-Adjacent Evidence And Scoring](decision-prototypes/runtime-adjacent-evidence.md)
- [Runtime-Adjacent Recommendation](decision-prototypes/runtime-adjacent-recommendation.md)
- [License Options Decision Matrix](decision-prototypes/license-options.md)
- [License Evidence And Scoring](decision-prototypes/license-evidence.md)
- [License Recommendation](decision-prototypes/license-recommendation.md)

## License And Release Planning

- [Owner License Approval Packet](owner-license-approval-packet.md)
- [Future License Change Plan](future-license-change-plan.md)

Current state:

- package license is `UNLICENSED`,
- package version is `0.0.0`,
- no `LICENSE` file exists,
- npm publishing is blocked,
- GitHub release publishing is blocked,
- runtime backend work is blocked.

## Safety

- [Public Extraction Checklist](proof/public-extraction-checklist.md)

Public examples and fixtures must stay synthetic. Do not add real user data, private implementation history, screenshots, local paths, tokens, domains, emails, account IDs, client names, or production exports.

The synthetic runtime boundary example is local-only. It does not start a server or add runtime package behavior.

## Intentional Gaps

Source-Wire does not currently include:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- npm publishing,
- real user data,
- trusted Memory Record promotion.
