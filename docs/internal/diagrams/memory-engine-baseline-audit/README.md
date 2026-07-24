# Memory Engine Baseline Audit Diagram Pack

Status: planning diagram pack. Runtime implementation remains blocked.

## Context Sufficiency Check

Details are sufficient for one required technical source-truth diagram.

Evidence used:

- `docs/concepts/product-direction.md`
- `docs/concepts/runtime-boundary.md`
- `docs/internal/hosted-runtime-prd.md`
- `docs/internal/minimal-runtime-prd.md`
- `docs/internal/license-decision-gate.md`
- `docs/internal/memory-engine-baseline-grill-outcome.md`
- `docs/contracts/owner-hosted-api-mcp-boundary-contract.md`
- deterministic Understand pass on local `Source-Wire-Memory-Engine` commit `5ecfc82`

Assumptions:

- The next unit is audit and planning only.
- `Source-Wire-Memory-Engine` remains separate until a license path is chosen.
- Owner-hosted means each adopter runs their own device, server, database, keys, and sources.
- The private proof system remains private.

Sensitive details to redact:

- real owner data,
- client data,
- private paths,
- secrets,
- tokens,
- API keys,
- email addresses,
- account IDs,
- production hostnames.

## Output Mode Decision

PlantUML only.

Reason: this is private technical planning and public-safe source-controlled architecture. A polished editorial SVG is optional later, but not needed for this planning gate.

## Diagram Recommendation Matrix

| Diagram Type | Status | Why | Evidence |
| --- | --- | --- | --- |
| System Architecture Diagram | Required | The repo/runtime/license/API/MCP/database boundary is the main confusion point. | Product direction, runtime boundary, hosted runtime PRD, Grill outcome |
| AI / ML Pipeline Diagram | Optional | Useful later when auditing RLM search, embeddings, reranking, and candidate promotion behavior. Not needed for the first repo boundary decision. | Memory Engine Understand pass |
| Infrastructure Topology | Optional | Useful when implementation opens real deployment. Current unit is planning only. | Hosted runtime PRD |
| Knowledge Graph / Domain Relationship Map | Do not include now | Would duplicate the required boundary diagram without adding a new decision. | Grill outcome and product direction |

## Required Diagram Mental Model

### Self-Hosted Runtime Boundary

Human question answered:

- Which repo owns what, and why can users fork/run Source-Wire without Jinni hosting their memory?

AI context anchored:

- Source-Wire is Apache-2.0 contracts and public-safe runtime planning.
- Source-Wire-Memory-Engine is an AGPLv3 reference runtime candidate.
- Private proof data remains private.
- Each adopter brings their own infrastructure.

Confusion prevented:

- Avoids treating current Source-Wire as a complete runtime.
- Avoids copying AGPLv3 code into Apache-2.0 Source-Wire by accident.
- Avoids implying Source-Wire hosts other people's memory.

## Visual Output Requirements

- `self-hosted-runtime-boundary.puml`
- `self-hosted-runtime-boundary.svg`
- `self-hosted-runtime-boundary.png`
- `manifest.json`
- `render-proof.json`
- `quality-review.json`

## What Not To Diagram

- Do not diagram all Memory Engine imports. The Understand graph already captures file-level structure.
- Do not diagram a database ERD before the runtime audit decides whether schema comes from Memory Engine, Source-Wire contracts, or a clean rewrite.
- Do not diagram managed-hosted SaaS. That is not the default product path.
- Do not diagram real owner or client data.

## Diagram Maintenance Notes

Update this pack when:

- Source-Wire starts real runtime implementation,
- the license path changes,
- `Source-Wire-Memory-Engine` is merged, replaced, or rewritten,
- owner-hosted deployment boundaries change,
- API/MCP/database contracts change.

Check these sources before updating:

- `docs/concepts/product-direction.md`
- `docs/concepts/runtime-boundary.md`
- `docs/internal/runtime-implementation-gate.md`
- `docs/internal/license-decision-gate.md`
- `docs/internal/memory-engine-baseline-grill-outcome.md`
- `docs/internal/memory-engine-baseline-audit-prd.md`
- `docs/internal/memory-engine-baseline-audit-issue-slices.md`
