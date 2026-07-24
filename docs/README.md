# Source-Wire Documentation

Source-Wire is a contracts-first toolkit and local Alpha proof for governed agent memory. It keeps source evidence, pending candidates, and trusted memory separate through provenance, namespace, policy, owner approval, lifecycle, and audit boundaries.

If this is your first visit, start with the [project README](../README.md).

## Choose By Role

| I am... | Start here | Then use |
| --- | --- | --- |
| A curious human | [Project README](../README.md) | [Product Direction](concepts/product-direction.md) and [Architecture Map](concepts/architecture-map.md) |
| An adopter or evaluator | [Adopter Walkthrough](getting-started/adopter-walkthrough.md) | [Quickstart](getting-started/quickstart.md) and [Public Status](status/public-status.md) |
| An AI coding agent | [AGENTS.md](https://github.com/DanielJD1216/Source-Wire/blob/main/AGENTS.md) | The relevant contract, fixture, and narrow smoke |
| A package integrator | [API Reference](reference/api-reference.md) | [Schema Exports](reference/schema-exports.md) and [TypeScript Examples](../examples/typescript/README.md) |
| A technical reviewer | [Technical Reviewer Guide](guides/technical-reviewer-guide.md) | [CI Checks](reference/ci-checks.md) and [Reviewer Feedback Guide](guides/reviewer-feedback-guide.md) |
| A security reviewer | [Security Policy](../SECURITY.md) | [Runtime Boundary](concepts/runtime-boundary.md) and the boundary-safety issue template |

## The System Model

![Source-Wire separates owner-selected knowledge, policy, owner approval, trusted memory, and authorized AI agents](assets/source-wire-overview.svg)

The fastest conceptual path is:

1. [Knowledge Provider And Memory Store Boundary](concepts/knowledge-provider-memory-store-boundary.md)
2. [Architecture Map](concepts/architecture-map.md)
3. [ADR 0001: Memory Store And Knowledge Provider Boundary](adr/0001-memory-store-and-knowledge-provider-boundary.md)
4. [Visual System](assets/README.md)

## Learn

Use explanation documents when you need the system model and tradeoffs.

- [Product Direction](concepts/product-direction.md)
- [Architecture Map](concepts/architecture-map.md)
- [Runtime Boundary](concepts/runtime-boundary.md)
- [Knowledge Provider And Memory Store Boundary](concepts/knowledge-provider-memory-store-boundary.md)

## Run And Evaluate

Use tutorials and walkthroughs when you need a safe, executable path.

- [Quickstart](getting-started/quickstart.md)
- [Adopter Walkthrough](getting-started/adopter-walkthrough.md)
- [Alpha 1 Story 1: Local Runtime](getting-started/alpha1-story1-local-runtime.md)
- [Alpha 1 Story 2: Candidate Approval](getting-started/alpha1-story2-candidate-approval.md)
- [Alpha 1 Story 3: Audited Search](getting-started/alpha1-story3-audited-search.md)
- [Alpha 1 Story 4: Governed Lifecycle And Portability](getting-started/alpha1-story4-governed-lifecycle-portability.md)

The Alpha stories use generated disposable PostgreSQL state. They do not establish hosting, deployment, production readiness, live-provider support, production backup guarantees, or real-data safety.

## Build Against Contracts

Contracts define public behavior. They do not imply that a hosted or production runtime exists.

### Memory and evidence

- [KnowledgeProvider v1](contracts/knowledge-provider-v1-contract.md)
- [MemoryStore v1](contracts/memory-store-v1-contract.md)
- [Source Graph Adapter](contracts/source-graph-adapter-contract.md)
- [Source Connection](contracts/source-connection-contract.md)
- [`second-brain.v1`](contracts/second-brain-v1-contract.md)

### Agent and runtime boundaries

- [MCP Tool Behavior](contracts/mcp-tool-behavior-contract.md)
- [Owner-Hosted API Plus MCP Boundary](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Wrapper Runtime Policy](contracts/wrapper-runtime-policy-contract.md)
- [Owner-Hosted Setup](contracts/owner-hosted-setup-contract.md)
- [Daily Workflow](contracts/daily-workflow-contract.md)
- [Runtime Readiness](contracts/runtime-readiness-contract.md)
- [Runtime Proof Intake](contracts/runtime-proof-intake-contract.md)

## Verify And Review

Use guides for tasks and reference pages for exact commands or exports.

### Guides

- [Share For Technical Review](guides/share-for-review.md)
- [Technical Reviewer Guide](guides/technical-reviewer-guide.md)
- [Reviewer Feedback Guide](guides/reviewer-feedback-guide.md)
- [Publish Readiness](guides/publish-readiness.md)

### Reference

- [API Reference](reference/api-reference.md)
- [Schema Exports](reference/schema-exports.md)
- [Validation CLI](reference/validation-cli.md)
- [CI Checks](reference/ci-checks.md)
- [KnowledgeProvider Smoke](reference/knowledge-provider-smoke.md)
- [MemoryStore Smoke](reference/memory-store-smoke.md)
- [Repository Metadata](reference/repository-metadata.md)

## Current Status And Project Boundaries

- [Public Status](status/public-status.md)
- [Release Snapshot Boundary](status/release-snapshot-boundary.md)
- [Contribution Policy](status/contribution-policy.md)
- [Security Policy](../SECURITY.md)
- [Support](../SUPPORT.md)
- [Contributing](../CONTRIBUTING.md)
- [Changelog](../CHANGELOG.md)

## For AI Agents

The canonical machine-operating entrypoint is [AGENTS.md](https://github.com/DanielJD1216/Source-Wire/blob/main/AGENTS.md).

Before changing the repository:

1. Read the relevant concept and contract.
2. Inspect its synthetic fixture and smoke test.
3. Preserve source-evidence, candidate, and trusted-memory separation.
4. Run `npm run readiness:report` before making status claims.
5. Use the narrowest relevant verification command.
6. Keep public fixtures synthetic and report denied paths or evidence gaps explicitly.

Do not infer a live service, production readiness, provider availability, or automatic trusted-memory promotion from a schema, fixture, or smoke test.

## Historical Project Records

Planning packets, approval records, implementation proofs, issue drafts, and release rehearsals are preserved in the [internal archive](internal/README.md).

Use that archive for provenance and historical decisions. Do not use it as the primary onboarding path, current API reference, or product landing page.
