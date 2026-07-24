# Source-Wire Documentation

Source-Wire is a contracts-first toolkit for building governed agent memory. It keeps source evidence, proposed memories, and trusted memory separate, with explicit provenance, namespace, policy, approval, and audit boundaries.

Start with the [project README](../README.md) if this is your first visit.

## Choose Your Path

| I want to... | Start here |
| --- | --- |
| Understand the project in five minutes | [Project README](../README.md) |
| Install and verify the repository | [Quickstart](getting-started/quickstart.md) |
| Run the local bootstrap and credential foundation | [Alpha 1 Story 1 Local Runtime](getting-started/alpha1-story1-local-runtime.md) |
| Prove MCP candidate proposal and owner approval | [Alpha 1 Story 2 Candidate Approval](getting-started/alpha1-story2-candidate-approval.md) |
| Prove audited trusted-memory search | [Alpha 1 Story 3 Audited Search](getting-started/alpha1-story3-audited-search.md) |
| Prove correction, revocation, and local portability | [Alpha 1 Story 4 Governed Lifecycle And Portability](getting-started/alpha1-story4-governed-lifecycle-portability.md) |
| Evaluate Source-Wire as an adopter | [Adopter Walkthrough](getting-started/adopter-walkthrough.md) |
| Understand the architecture | [Architecture Map](concepts/architecture-map.md) |
| Compare memory with a knowledge base | [Knowledge Provider And Memory Store Boundary](concepts/knowledge-provider-memory-store-boundary.md) |
| Integrate the TypeScript package | [API Reference](reference/api-reference.md) |
| Validate fixtures or schemas | [Validation CLI](reference/validation-cli.md) |
| Review the current release boundary | [Public Status](status/public-status.md) |
| Perform a technical review | [Technical Reviewer Guide](guides/technical-reviewer-guide.md) |

## Getting Started

- [Quickstart](getting-started/quickstart.md)
- [Alpha 1 Story 1 Local Runtime](getting-started/alpha1-story1-local-runtime.md)
- [Alpha 1 Story 2 Candidate Approval](getting-started/alpha1-story2-candidate-approval.md)
- [Alpha 1 Story 3 Audited Search](getting-started/alpha1-story3-audited-search.md)
- [Alpha 1 Story 4 Governed Lifecycle And Portability](getting-started/alpha1-story4-governed-lifecycle-portability.md)
- [Adopter Walkthrough](getting-started/adopter-walkthrough.md)

## Concepts

- [Architecture Map](concepts/architecture-map.md)
- [Product Direction](concepts/product-direction.md)
- [Runtime Boundary](concepts/runtime-boundary.md)
- [Knowledge Provider And Memory Store Boundary](concepts/knowledge-provider-memory-store-boundary.md)

## Contracts

The contracts define public behavior. They do not imply that a hosted or production runtime exists.

- [KnowledgeProvider v1](contracts/knowledge-provider-v1-contract.md)
- [MemoryStore v1](contracts/memory-store-v1-contract.md)
- [Source Graph Adapter](contracts/source-graph-adapter-contract.md)
- [Source Connection](contracts/source-connection-contract.md)
- [`second-brain.v1`](contracts/second-brain-v1-contract.md)
- [MCP Tool Behavior](contracts/mcp-tool-behavior-contract.md)
- [Owner-Hosted API Plus MCP Boundary](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Wrapper Runtime Policy](contracts/wrapper-runtime-policy-contract.md)
- [Owner-Hosted Setup](contracts/owner-hosted-setup-contract.md)
- [Daily Workflow](contracts/daily-workflow-contract.md)
- [Runtime Readiness](contracts/runtime-readiness-contract.md)
- [Runtime Proof Intake](contracts/runtime-proof-intake-contract.md)

## Guides

- [Share For Technical Review](guides/share-for-review.md)
- [Technical Reviewer Guide](guides/technical-reviewer-guide.md)
- [Reviewer Feedback Guide](guides/reviewer-feedback-guide.md)
- [Publish Readiness](guides/publish-readiness.md)

## Reference

- [API Reference](reference/api-reference.md)
- [Schema Exports](reference/schema-exports.md)
- [Validation CLI](reference/validation-cli.md)
- [CI Checks](reference/ci-checks.md)
- [KnowledgeProvider Smoke](reference/knowledge-provider-smoke.md)
- [MemoryStore Smoke](reference/memory-store-smoke.md)
- [Repository Metadata](reference/repository-metadata.md)

## Status And Governance

- [Public Status](status/public-status.md)
- [Release Snapshot Boundary](status/release-snapshot-boundary.md)
- [Contribution Policy](status/contribution-policy.md)
- [Security Policy](../SECURITY.md)
- [Support](../SUPPORT.md)
- [Contributing](../CONTRIBUTING.md)
- [Changelog](../CHANGELOG.md)

## Architecture Decisions

- [ADR 0001: Memory Store And Knowledge Provider Boundary](adr/0001-memory-store-and-knowledge-provider-boundary.md)

## Historical Project Records

Planning packets, approval records, implementation proofs, issue drafts, and release rehearsals are preserved in the [internal archive](internal/README.md). They are useful for provenance and project history, but they are not the recommended onboarding path or the public API reference.
## Documentation Rule

Use the smallest relevant document:

1. Concepts explain why the system is shaped this way.
2. Contracts define stable behavior.
3. Guides explain how to complete a task.
4. Reference pages describe exact commands and exports.
5. Status pages state what is publicly available now.
