# Memory Engine Baseline Public-Safe Fixtures And Verification Gates

Status: Slice 5 local gate packet complete. Runtime implementation remains blocked.

Date: 2026-07-02

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../getting-started/quickstart.md).

## Scope

This document defines the public-safe fixtures and verification gates required before any Source-Wire memory-engine runtime implementation starts.

The goal is simple:

```text
Future runtime behavior must be testable without private data, secrets, live connectors, production exports, or real owner memory.
```

This is a planning and boundary document only.

It does not add:

- new fixture implementation,
- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration code,
- Docker or installer bundling,
- Mission Control UI implementation,
- real user data,
- live connectors,
- deployment,
- Source-Wire-managed hosting,
- npm publishing,
- GitHub release publishing.

## Prior Inputs

- [Memory Engine Baseline Runtime Capability Audit](memory-engine-baseline-runtime-capability-audit.md)
- [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md)
- [Memory Engine Baseline API And MCP Wrapper Boundary](memory-engine-baseline-api-mcp-wrapper-boundary.md)
- [Memory Engine Baseline BYO Self-Hosted Setup Path](memory-engine-baseline-byo-self-hosted-setup-path.md)
- [Owner-Hosted API Plus MCP Boundary Contract](../contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Runtime Boundary Readiness](runtime-boundary-readiness.md)
- [Source-Wire Fixtures](../../examples/fixtures/README.md)
- [Memory Engine Baseline Audit Diagram Pack](diagrams/memory-engine-baseline-audit/README.md)

## Core Gate Decision

Runtime implementation must not start until public-safe proof data and verification gates exist for the behavior being implemented.

Plain English:

```text
No private data to prove public code.
No runtime code before fake proof cases exist.
No agent memory claims without checks that catch unsafe wording and unsafe data.
```

## Fixture Safety Rules

All runtime-adjacent fixtures must be fictional and synthetic.

Fixtures must not include:

- real user data,
- real client data,
- real private notes,
- real chat exports,
- real emails,
- real SMS or WhatsApp messages,
- real Slack or Discord messages,
- real screenshots,
- real account IDs,
- real domains,
- real email addresses,
- real phone numbers,
- real addresses,
- real API keys,
- real tokens,
- real database connection strings,
- real local filesystem paths,
- real production exports,
- real private repo history,
- real customer names,
- real financial data,
- real health data,
- real legal data.

Fixtures may include:

- fake owners,
- fake namespaces,
- fake projects,
- fake source items,
- fake source text,
- fake trusted memory,
- fake candidates,
- fake denials,
- fake MCP calls,
- fake audit events,
- fake timestamps,
- fake identifiers,
- fake provider labels.

Fake values should be obviously fake.

Use examples like:

- `owner_demo_001`,
- `namespace_atlas_demo`,
- `source_markdown_demo_001`,
- `memory_demo_001`,
- `candidate_demo_001`,
- `harness_claude_code_demo`,
- `trace_demo_001`.

Avoid fake values that look like a real private person, client, company, domain, address, or token.

## Required Fixture Categories

Before runtime implementation starts, the future runtime unit should define or extend synthetic fixtures for these categories.

| Fixture category | Required purpose | Must prove |
| --- | --- | --- |
| Owner | Represents the memory owner without real identity. | Owner-scoped runtime behavior can be tested without real profile data. |
| Namespace | Represents project, client, or workspace separation. | Cross-namespace access is blocked unless allowed. |
| Harness caller | Represents Codex, Claude Code, or another agent harness. | Capability scope, token scope, and audit caller metadata are preserved. |
| Source connection | Represents an imported or synced source. | Sources stay separate from trusted memory. |
| Source evidence | Represents chunks, citations, freshness, sensitivity, and source edges. | Answers can cite evidence without trusting all imports. |
| Trusted memory | Represents approved memory records. | Trusted search is separate from source-only search. |
| Candidate memory | Represents pending owner review. | Candidates do not become trusted memory automatically. |
| Approval and rejection | Represents owner or application-controlled review. | Approval creates trusted memory only through an allowed path, rejection creates no trusted memory. |
| Denied access | Represents blocked capability, namespace, or sensitivity access. | Denials return safe metadata without leaking restricted content. |
| Gaps and stale evidence | Represents missing, weak, stale, or blocked evidence. | Agents know when context is incomplete. |
| MCP calls | Represents agent-facing tool calls. | MCP routes through API policy and cannot bypass it. |
| Audit events | Represents allowed, denied, and partial-success decisions. | Every policy decision can be inspected safely. |
| Runtime adapter result | Represents separate memory-engine runtime output. | Runtime output is shaped by Source-Wire policy before reaching MCP. |

## Existing Fixture Baseline

Current public fixtures already include:

- [Project Context Pack fixture](../../examples/fixtures/project-context-pack/project-context.json)
- [`second-brain.v1` fixture](../../examples/fixtures/second-brain/use-2nd-brain-example.json)
- [Chat export fixture](../../examples/fixtures/chat-export/agent-session.jsonl)
- [Markdown vault fixture](../../examples/fixtures/markdown-vault)
- [Owner-hosted API plus MCP boundary fixture](../../examples/fixtures/owner-hosted-api-mcp-boundary)

These fixtures are enough for the current contract package.

They are not enough to approve real runtime implementation by themselves.

Future runtime slices must add or extend fixture coverage only after separate approval.

## Required Verification Gates

Before runtime implementation starts, the future runtime unit must identify the exact checks that will be run.

Minimum local gates:

| Gate | Command or evidence | Purpose |
| --- | --- | --- |
| TypeScript typecheck | `npm run typecheck` | Contract and package types still compile. |
| Build | `npm run build` | Package output builds from source. |
| Fixture validation | `npm run validate:fixtures` | Schema-backed fixtures stay valid. |
| Schema export proof | `npm run verify:schema-exports` | Public schema subpaths remain valid. |
| CLI smoke | `npm run cli:smoke` | Validation CLI still works. |
| Minimal runtime smoke | `npm run minimal-runtime:smoke` | Current synthetic policy boundary still passes. |
| Runtime boundary smoke | `npm run runtime-boundary:smoke` | Runtime-boundary example still proves no hosted runtime. |
| Docs links | `npm run docs:links` | Markdown links resolve. |
| Docs anchors | `npm run docs:anchors` | Anchor links resolve. |
| Docs command setup | `npm run docs:command-setup` | Setup commands documented in docs remain coherent. |
| Public safety scan | `npm run safety:scan` | Public files avoid private data and unsafe sensitive patterns. |
| Public claim-boundary scan | `npm run claims:scan` | Docs do not overclaim runtime, hosting, or production behavior. |
| README entrypoint smoke | `npm run readme:entrypoint-smoke` | First reader sees public status and blocked channels. |
| Package required paths | `npm run package:required-paths` | Required package files stay present. |
| Package dry run | `npm run package:dry-run` | Package contents are inspectable before publishing decisions. |
| Consumer smoke | `npm run consumer:smoke` | Package can be consumed by a synthetic consumer. |
| Full readiness gate | `npm run publish:readiness` | Full local readiness gate for the current package state. |

Minimum diagram gates:

| Gate | Evidence | Purpose |
| --- | --- | --- |
| Diagram source exists | `docs/internal/diagrams/memory-engine-baseline-audit/self-hosted-runtime-boundary.puml` | Boundary diagram is source-controlled. |
| Diagram render proof exists | `docs/internal/diagrams/memory-engine-baseline-audit/render-proof.json` | Diagram was rendered from source. |
| Diagram outputs exist | `.svg` and `.png` files | Reviewers can inspect the diagram without rendering locally. |
| Visual quality proof exists | `docs/internal/diagrams/memory-engine-baseline-audit/quality-review.json` | Diagram was reviewed for clarity and privacy. |

## Runtime Implementation Entry Proof

A future runtime implementation PRD must include a proof packet with:

- fixture categories covered,
- fixture files added or reused,
- exact commands run,
- command outputs or stable markers,
- diagram render proof when boundaries changed,
- public safety scan result,
- claim-boundary scan result,
- package readiness result,
- explicit statement that no real data was used,
- explicit statement that no secrets were used,
- explicit statement that no Source-Wire-managed hosting was added.

Minimum statement:

```text
All runtime proof fixtures are synthetic.
No real owner, client, account, token, path, database, export, or production data was used.
```

## No-Go Conditions

Runtime implementation must not start if any of these are true:

- fixture categories are undefined,
- fixture data includes private or real-world data,
- public safety scan has unresolved high or medium findings,
- claim-boundary scan reports unsafe runtime or hosted claims,
- package checks are failing,
- diagram boundary is stale after a boundary-changing decision,
- license path is unresolved for copied or linked runtime code,
- MCP bypass of API policy is allowed,
- trusted memory can be auto-promoted by default,
- owner-hosted setup path is unclear,
- Source-Wire-managed hosting is implied without a separate approved PRD.

## Fixture Implementation Boundary

This Slice 5 packet does not approve adding new fixtures.

New fixtures require separate implementation approval when the future runtime unit starts.

When approved, fixture implementation should be small and boring:

1. Add synthetic data.
2. Add schema or contract validation if needed.
3. Add a deterministic smoke test.
4. Run public safety and claim-boundary scans.
5. Update docs with exact proof.

## Slice 5 Decision

Proceed to Slice 6 after this packet.

Default verification posture:

```text
Synthetic fixtures first.
Automated public-safety gates always.
Claim-boundary gates always.
Package checks always.
Diagram proof whenever architecture or boundary changes.
No runtime implementation before these proofs exist.
```

Runtime implementation remains blocked.

## Still Blocked

- new fixture implementation unless separately approved,
- API server implementation,
- MCP server implementation,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine code copy,
- Docker or installer bundling with the AGPLv3 runtime,
- live connector implementation,
- Mission Control UI implementation,
- real user data,
- production runtime use,
- managed-hosted operation,
- public contribution acceptance,
- new npm publishing,
- new GitHub release or tag.
