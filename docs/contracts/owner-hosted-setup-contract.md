# Owner-Hosted Setup Contract

Source-Wire owner-hosted setup means the adopter brings the machine, database, secrets, selected sources, MCP-capable harness, and review time.

This contract is public and synthetic.

It is not a runtime implementation.

## Package Exports

The package root exports:

- `SOURCE_WIRE_OWNER_HOSTED_SETUP_CONTRACT`
- `SOURCE_WIRE_OWNER_HOSTED_SETUP_REQUIREMENTS`
- `SOURCE_WIRE_OWNER_HOSTED_SETUP_BOUNDARY`
- `SOURCE_WIRE_OWNER_HOSTED_SETUP_STOP_CONDITIONS`
- `summarizeOwnerHostedSetupContract`

It also exports matching TypeScript types:

- `SourceWireOwnerHostedSetupContract`
- `SourceWireOwnerHostedSetupRequirement`
- `SourceWireOwnerHostedSetupRequirementKind`
- `SourceWireOwnerHostedSetupBoundary`
- `SourceWireOwnerHostedSetupStopCondition`
- `SourceWireOwnerHostedSetupReadinessSummary`

## Owner Brings

The setup contract requires:

- owner device or server,
- PostgreSQL-compatible database,
- owner-controlled secret storage,
- owner-selected sources,
- MCP-capable harness,
- owner review time.

## Boundary

The setup contract explicitly does not include:

- Source-Wire-hosted memory by default,
- managed hosting,
- API server runtime,
- MCP server runtime,
- database migrations,
- Mission Control UI,
- deployment,
- real user data,
- automatic trusted memory promotion,
- AGPLv3 code copied into Source-Wire,
- private implementation code copied into Source-Wire.

## Stop Conditions

Stop the setup path if any artifact asks for real secrets, crawls private folders, claims Source-Wire hosts memory by default, starts runtime or deployment work, promotes trusted memory automatically, or copies AGPLv3/private implementation code into Source-Wire.

## Fixture

Synthetic fixtures:

- [Owner-hosted setup checklist](../../examples/fixtures/owner-hosted-setup/README.md)
- [Owner-hosted setup readiness matrix](../internal/owner-hosted-setup-readiness-fixture-matrix.md)

These fixtures are not schema-validated by the current CLI.

## Related Docs

- [Owner-Hosted Setup PRD](../internal/owner-hosted-setup-prd.md)
- [Owner-Hosted Setup Issue Slices](../internal/owner-hosted-setup-issue-slices.md)
