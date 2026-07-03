# Source-Wire Owner-Hosted Runtime Direction Gate

Status: decision gate. No implementation is included.

Date: 2026-07-02

## Purpose

The wrapper runtime proof is complete as a synthetic public-safe proof.

This gate decides the next runtime direction without accidentally adding:

- real user data,
- deployment,
- database migrations,
- managed hosting,
- AGPLv3 code copy,
- Source-Wire-managed memory hosting,
- public code contribution acceptance,
- npm or GitHub release mutation.

## Direct Decision

Recommended next path:

```text
Private owner implementation first,
then extract a clean Apache-2.0 Source-Wire runtime skeleton from proven behavior.
```

Plain English:

```text
Prove the real memory workflow privately first.
Then make the public Source-Wire runtime from contracts, tests, and synthetic examples.
Do not copy AGPLv3 engine code into Source-Wire.
```

## Why This Is The Best Next Path

The limiting constraint is not whether Source-Wire can draw the policy boundary anymore.

That is now proven by:

- [Wrapper Runtime Policy Contract](contracts/wrapper-runtime-policy-contract.md),
- [Wrapper Runtime Fixture Matrix](memory-engine-wrapper-runtime-fixture-matrix.md),
- [API Policy Wrapper Smoke](memory-engine-wrapper-runtime-api-policy-wrapper-smoke.md),
- [MCP Adapter Policy Routing Smoke](memory-engine-wrapper-runtime-mcp-adapter-policy-routing-smoke.md),
- [Separate Runtime Adapter Boundary Smoke](memory-engine-wrapper-runtime-separate-runtime-adapter-boundary-smoke.md),
- [Wrapper Runtime Proof Docs And Stop Conditions](memory-engine-wrapper-runtime-proof-docs-stop-conditions.md).

The current limiting constraint is product truth:

```text
Which runtime behavior actually helps the owner and agents every day?
```

That cannot be fully proven with synthetic public fixtures.

It needs private owner use against real workflows, then public extraction.

## Option Matrix

| Option | What it means | Strength | Risk | Decision |
| --- | --- | --- | --- | --- |
| Clean Apache-2.0 runtime skeleton now | Build Source-Wire runtime in public from the contracts and synthetic smokes. | Clean license path. Public adopters can inspect early runtime shape. | Could build the wrong runtime before private behavior proves value. | Later. |
| Optional adapter to separately installed runtime candidate | Keep Source-Wire Apache-2.0 and let owners connect a separate runtime candidate. | Fast bridge to existing runtime behavior. | Legal and setup confusion around AGPLv3 runtime candidate. Higher adopter burden. | Later, only after legal/setup docs improve. |
| Private owner implementation first | Build the real owner-hosted workflow privately with real data and agent usage. | Best product truth. Keeps real data out of Source-Wire. | Public runtime waits longer. Requires disciplined extraction later. | Recommended now. |
| Mission Control owner setup flow first | Build nontechnical owner setup and status UX before deeper runtime work. | Helps adoption and reduces setup confusion. | UI may imply runtime readiness before runtime is real. | Later, after private workflow proves the actual setup steps. |

## Recommended Next Unit

The next unit should happen in a private owner implementation path, not inside public Source-Wire runtime code.

Recommended unit:

```text
Private Owner-Hosted Memory Runtime Proof
```

Goal:

- connect the private owner memory workflow to the current owner-hosted API and MCP policy shape,
- use real owner data only inside the private implementation environment,
- prove daily agent usage against actual source retrieval and memory maintenance,
- keep Source-Wire updated only with synthetic contracts, docs, and extraction notes.

## Public Source-Wire Role During That Unit

Source-Wire should remain the public contract and proof package.

Allowed public updates during the private proof:

- synthetic fixtures,
- contract clarifications,
- public-safe smoke cases,
- docs corrections,
- extraction notes,
- no-real-data architecture diagrams,
- setup decision notes.

Blocked public updates during the private proof:

- real owner data,
- client data,
- private paths,
- private source exports,
- private tokens,
- live connector payloads,
- database dumps,
- copied private implementation code,
- copied AGPLv3 engine code,
- deployment config,
- managed-hosting behavior.

## Extraction Rule

When private owner behavior proves useful, extract to Source-Wire only through this route:

```text
Private behavior observed
  -> public requirement written
  -> synthetic fixture added
  -> public smoke/test added
  -> clean Apache-2.0 implementation written
```

Do not extract by copying:

- AGPLv3 runtime code,
- private owner implementation code,
- private data,
- private migrations,
- private connector payloads,
- private UI state.

## Success Criteria For Private Proof

Before Source-Wire starts a true public runtime skeleton, the private proof should answer:

- Can an agent call memory through MCP without bypassing owner policy?
- Can source evidence stay separate from trusted memory?
- Can trusted memory promotion stay owner or application controlled?
- Can stale, weak, missing, or permission-blocked evidence return useful gaps?
- Can daily maintenance happen without reimporting everything manually?
- Can the owner understand source health and memory decisions without reading logs?
- Can the setup path be explained to a nontechnical owner?
- Can public Source-Wire reproduce the behavior with synthetic fixtures?

## Stop Conditions

Stop and require a new owner decision if the next work needs:

- Source-Wire production runtime,
- Source-Wire database migrations,
- Source-Wire deployment,
- Source-Wire managed hosting,
- Source-Wire public release mutation,
- public contribution acceptance,
- copied AGPLv3 code,
- copied private owner implementation code,
- real data inside Source-Wire.

## Current Source-Wire State

Source-Wire is ready for:

- public review,
- synthetic wrapper runtime proof,
- contract-first extraction planning,
- future clean runtime design.

Source-Wire is not ready for:

- production owner-hosted runtime,
- real user memory,
- live connectors,
- database-backed memory,
- managed hosting,
- one-click nontechnical install.

## Related Docs

- [Source-Wire Memory Engine Wrapper Runtime Proof Docs And Stop Conditions](memory-engine-wrapper-runtime-proof-docs-stop-conditions.md)
- [Source-Wire Public Runtime Decision](public-runtime-decision.md)
- [Source-Wire Runtime Implementation Gate](runtime-implementation-gate.md)
- [Source-Wire First Runtime PRD Package](first-runtime-prd.md)
- [Memory Engine Baseline BYO Self-Hosted Setup Path](memory-engine-baseline-byo-self-hosted-setup-path.md)
- [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md)
