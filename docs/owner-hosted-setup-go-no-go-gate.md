# Owner-Hosted Setup Go/No-Go Gate

Status: no-go for runtime implementation from this package alone.

Date: 2026-07-03

## Direct Decision

Go for:

- public synthetic setup contract,
- public synthetic setup readiness fixtures,
- public synthetic setup readiness smokes,
- public source update safety smoke,
- adopter-facing claim boundary,
- technical review of the setup package.

No-go for:

- API server runtime,
- MCP server runtime,
- database migrations,
- deployment,
- managed hosting,
- production runtime claims,
- real user data,
- copied AGPLv3 code,
- copied private implementation code,
- npm publishing,
- GitHub release creation,
- public code contribution acceptance.

## Reason

The owner-hosted setup package proves the setup boundary, not the runtime.

It answers:

```text
What does the owner bring?
What must setup prove?
What is blocked before runtime?
How do source updates avoid broad private import and auto-promotion?
What public claims are safe?
```

It does not answer:

```text
What API server should run?
What database schema should migrate?
What MCP server should expose tools?
What installer should owners use?
What Mission Control setup UI should ship?
```

Those require a separate implementation decision.

## Required Approval Before Runtime

Before public runtime implementation starts, record a new owner-approved unit that names:

- runtime scope,
- implementation path,
- database posture,
- migration boundary,
- MCP boundary,
- Source-Wire-Memory-Engine relationship,
- privacy and fixture constraints,
- release and deployment constraints,
- verification gates.

## Next Safe Action

Recommended next safe action:

```text
Use the Runtime Implementation Decision Gate before any public runtime code starts.
```

If continuing public Source-Wire without runtime approval, the safest work is:

- more synthetic fixtures,
- clearer adopter docs,
- reviewer feedback handling,
- private-to-public extraction notes,
- non-runtime setup UX planning.

## Stop Conditions

Stop and require a new owner decision if next work needs:

- production runtime files,
- real database access,
- database migrations,
- live connectors,
- real owner or client data,
- deployment config,
- managed-hosted behavior,
- release mutation,
- direct memory-engine code copy,
- automatic trusted-memory promotion.

## Related Docs

- [Owner-Hosted Setup Final Proof](owner-hosted-setup-final-proof.md)
- [Owner-Hosted Setup Docs Audit](owner-hosted-setup-docs-audit.md)
- [Runtime Implementation Decision Gate](runtime-implementation-decision-gate.md)
- [Runtime Implementation Gate](runtime-implementation-gate.md)
- [Owner-Hosted Runtime Direction Gate](owner-hosted-runtime-direction-gate.md)
