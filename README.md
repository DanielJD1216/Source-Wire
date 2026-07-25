# Source-Wire

[![Package Checks](https://github.com/DanielJD1216/Source-Wire/actions/workflows/package-checks.yml/badge.svg)](https://github.com/DanielJD1216/Source-Wire/actions/workflows/package-checks.yml)
[![npm](https://img.shields.io/npm/v/@source-wire/contracts.svg?label=npm)](https://www.npmjs.com/package/@source-wire/contracts)
[![local runtime alpha](https://img.shields.io/npm/v/@source-wire/local-runtime/alpha.svg?label=local%20runtime)](https://www.npmjs.com/package/@source-wire/local-runtime)
[![License](https://img.shields.io/badge/license-Apache--2.0-c56f37.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22-3c873a.svg)](https://nodejs.org/)

![Source evidence passing through owner approval into trusted memory for authorized AI agents](docs/assets/source-wire-higgsfield-hero.jpg)

**The governed memory layer between your knowledge sources and AI agents.**

Source-Wire defines how agents can retrieve evidence, preserve provenance, propose durable memories, and use trusted context without silently turning every document, message, or model output into truth.

Current public status: Source-Wire is Apache-2.0 licensed as a source package. Version `0.2.0` is published to npm and released on GitHub with the public `KnowledgeProvider v1` contract. Latest source also contains a loopback-only Alpha workspace for disposable local PostgreSQL, MCP candidate proposal, owner approval, audited trusted-memory search, owner correction and revocation, bounded portability, and audited source-evidence reads through synthetic providers. The first public npm Alpha, `@source-wire/local-runtime@0.1.0-alpha.1`, is deprecated because namespace binding and provider deadline enforcement were incomplete. Latest source prepares an unpublished `0.1.0-alpha.2` security candidate. No local-runtime Git tag or GitHub release was created, and nothing is deployed or hosted.

> Bring your own knowledge base, PostgreSQL, credentials, and agent harness. Source-Wire keeps the memory lifecycle and trust boundary explicit.

## In One Minute

![Source-Wire system overview showing replaceable knowledge sources, owner approval, adopter-owned memory, and policy-routed agents](docs/assets/source-wire-overview.svg)

Source-Wire separates three states that retrieval systems often blur:

1. **Source evidence** is information an authorized system can find.
2. **A memory candidate** is something an agent or owner proposes remembering.
3. **Trusted memory** is durable context approved by the owner or owner-controlled application.

The non-negotiable rule:

```text
Source evidence is not trusted memory.
Trusted memory requires explicit owner or owner-application approval.
```

## Knowledge Base Versus Memory System

![A knowledge base retrieves current evidence while Source-Wire governs durable owner-approved memory](docs/assets/knowledge-vs-memory.svg)

| Layer | Job | Source-Wire relationship |
| --- | --- | --- |
| Knowledge base | Find current information across documents, chats, code, databases, or indexes. | Optional and read-only through `KnowledgeProvider v1`. |
| Source-Wire memory | Preserve reviewed decisions, corrections, project state, provenance, and lifecycle history. | Governed through `MemoryStore v1`. |
| Agent harness | Choose tools and use retrieved context. | Routes through MCP and Source-Wire API policy. |
| PostgreSQL | Store adopter-owned memory data. | Planned `MemoryStore v1` backend, with disposable local Alpha proof in latest source. |

Source-Wire works without a knowledge base. When one is connected, its evidence may support a pending candidate, but it cannot approve or promote memory.

Read [Knowledge Provider And Memory Store Boundary](docs/concepts/knowledge-provider-memory-store-boundary.md).

## Trusted Memory Lifecycle

![Evidence becomes a pending candidate, waits for owner review, and can become active, corrected, rejected, or revoked](docs/assets/trusted-memory-lifecycle.svg)

- Agents may propose candidates and retrieve authorized active memory.
- Owners control approval, rejection, correction, and revocation.
- Corrections create a new immutable revision and supersede the previous one.
- Rejected, revoked, and superseded records are excluded from active reads.
- Protected reads and successful mutations require durable audit evidence.

## Choose Your Path

| You are... | Start here | You will learn |
| --- | --- | --- |
| A first-time visitor | [Product direction](docs/concepts/product-direction.md) | What Source-Wire is becoming and what exists now |
| An adopter or evaluator | [Adopter walkthrough](docs/getting-started/adopter-walkthrough.md) | How to assess the contracts and local proof safely |
| An AI coding agent | [AGENTS.md](https://github.com/DanielJD1216/Source-Wire/blob/main/AGENTS.md) | Read order, invariants, commands, and change boundaries |
| A technical or security reviewer | [Technical reviewer guide](docs/guides/technical-reviewer-guide.md) | Claims, evidence, verification, and feedback routes |

Use the [Documentation Index](docs/README.md) when you already know the task you need to complete.

## What Source-Wire Is Today

| Surface | Current state |
| --- | --- |
| Public package | `@source-wire/contracts@0.2.0` |
| Previous immutable snapshot | `@source-wire/contracts@0.1.0` and GitHub release `v0.1.0` |
| License | Apache-2.0 |
| GitHub release | `v0.2.0` |
| Contracts, schemas, fixtures, validation | Included |
| Synthetic policy and conformance proofs | Included |
| Local Alpha 1 Stories 1 through 5 | Included in latest source as an unpublished workspace using generated disposable PostgreSQL state and one synthetic read-only provider |
| Local Story 6.1 CLI tracer | Included in latest source for owner-only non-secret config creation and offline validation; it starts no runtime and contacts no dependency |
| Local Story 6.2 memory-only runner | Included in latest source as a private one-command loopback API plus two-tool stdio MCP composition over generated disposable PostgreSQL; it is unpublished and not production approved |
| Local Story 6.3 synthetic provider runner | Included in latest source as immutable zero-or-one-provider composition with offline and explicit connected checks plus four-tool stdio proof; no external or live provider is included |
| Local Story 6.4 fail-closed runner | Included in latest source for stable redacted startup failures, coordinated child shutdown, API-crash credential invalidation, empty pre-start protocol stdout, and deterministic disposable cleanup |
| Local Story 6.5 database control plane | Included in latest source for read-only runtime-role status, safe migration planning, explicit `--apply`, exact migrator authority, transaction rollback, and idempotent disposable migration proof |
| Local Story 6.6 owner-controlled export | Included in latest source for explicit namespaces, canonical bounded output, atomic owner-only local files, default no-overwrite, exact owner authority, interruption cleanup, and zero upload |
| Local Story 6.7 evidence-first compatibility | Included in latest source as cross-repository synthetic proof against a pinned private adapter that depends on published `@source-wire/contracts@0.2.0`; no live connector or real evidence is included |
| Local Story 6.8 package release | `@source-wire/local-runtime@0.1.0-alpha.1` was published and is now deprecated with a security warning |
| Local Story 6.9 security candidate | Unpublished `0.1.0-alpha.2` candidate binds owner and namespace before provider invocation, enforces hard provider deadlines, and unifies protected search and exact-fetch handoff |
| Hosted API, hosted MCP, deployment | Not included |
| Live knowledge connectors or real user data | Not included |
| Automatic trusted-memory promotion | Forbidden |

The published `0.2.0` contracts package, public npm Alpha runtime package, and latest-source Alpha workspace are separate boundaries. Read [Public Status](docs/status/public-status.md) before making runtime, hosting, or production claims.

## First Reviewer Quickstart

Use Node.js 22 with npm.

```bash
git clone https://github.com/DanielJD1216/Source-Wire.git
cd Source-Wire
npm install
npm run readiness:report
```

Run the isolated first-reviewer path:

```bash
npm run reviewer:smoke
```

Run the complete local verification gate:

```bash
npm run publish:readiness
```

Despite its name, `publish:readiness` does not publish a package, create a release, deploy a service, connect a production database, or use real data.

For setup details, read the [Quickstart](docs/getting-started/quickstart.md). For the local Alpha proof, follow [Alpha 1 Story 1 Local Runtime](docs/getting-started/alpha1-story1-local-runtime.md), [Alpha 1 Story 2 Candidate Approval](docs/getting-started/alpha1-story2-candidate-approval.md), [Alpha 1 Story 3 Audited Search](docs/getting-started/alpha1-story3-audited-search.md), [Alpha 1 Story 4 Governed Lifecycle And Portability](docs/getting-started/alpha1-story4-governed-lifecycle-portability.md), [Alpha 1 Story 5 Knowledge Provider Runtime Host](docs/getting-started/alpha1-story5-knowledge-provider-runtime-host.md), [Alpha 1 Story 6.1 Local CLI Init And Offline Doctor](docs/getting-started/alpha1-story6-local-cli-init-doctor.md), [Alpha 1 Story 6.2 Memory-Only Local Runtime](docs/getting-started/alpha1-story6-memory-only-local-runtime.md), [Alpha 1 Story 6.3 Synthetic Provider Local Runtime](docs/getting-started/alpha1-story6-synthetic-provider-local-runtime.md), [Alpha 1 Story 6.4 Fail-Closed Orchestration And Cleanup](docs/getting-started/alpha1-story6-fail-closed-orchestration.md), [Alpha 1 Story 6.5 Explicit Database Control Plane](docs/getting-started/alpha1-story6-database-control-plane.md), [Alpha 1 Story 6.6 Owner-Controlled Local Export](docs/getting-started/alpha1-story6-owner-controlled-local-export.md), [Alpha 1 Story 6.7 Evidence-First Compatibility](docs/getting-started/alpha1-story6-evidence-first-compatibility.md), and [Alpha 1 Story 6.8 Local Runtime Package Release](docs/getting-started/alpha1-story6-local-runtime-package-candidate.md) in order.

Use [Share For Technical Review](docs/guides/share-for-review.md) and [Reviewer Feedback Guide](docs/guides/reviewer-feedback-guide.md) when sharing findings.

## Still Blocked

- repository ruleset governance,
- hosted runtime,
- production runtime use,
- non-disposable or production database use,
- hosted or production MCP service behavior,
- production or real-data correction, revocation, export, and recovery,
- live knowledge connectors,
- real user or client data,
- local-runtime Git tags and GitHub releases,
- code contribution acceptance.

The package and release are available for technical review and Apache-2.0 source reuse. They do not imply that a hosted or production memory system exists.

## What This Public Skeleton Includes

| Area | Included |
| --- | --- |
| Contracts | `KnowledgeProvider v1`, `MemoryStore v1`, MCP behavior, API policy, source graph, and cited response shapes |
| Developer surfaces | TypeScript exports, JSON schemas, validation CLI, synthetic fixtures, and conformance checks |
| Policy proofs | In-memory and owner-hosted skeletons for identity, namespace, denial, audit, and no-auto-promotion behavior |
| Latest-source Alpha | Disposable local PostgreSQL bootstrap, candidate proposal, owner decisions, audited memory search, correction, revocation, export, recovery, and synthetic source-evidence read proof |

The Alpha workspace under `apps/alpha1-runtime/` is local developer proof. Story 6.7 installs a pinned private synthetic package from the separate evidence-first repository and proves it through the same CLI, API policy, audit, receipt, MCP, and official-client path. Story 6.8 publishes the public npm Alpha tarball, limits its public exports, and proves a clean installed consumer and AI-agent binary path. Provider replacement requires a config change and restart. npm publication does not establish production availability, hosting, deployment, managed database provisioning, production backup guarantees, external or live providers, or real-data support.

## For AI Agents

The canonical agent entrypoint is [AGENTS.md](https://github.com/DanielJD1216/Source-Wire/blob/main/AGENTS.md).

Use this order:

1. Read this README for the product and trust boundaries.
2. Read [AGENTS.md](https://github.com/DanielJD1216/Source-Wire/blob/main/AGENTS.md) for repository operating rules.
3. Use the [Documentation Index](docs/README.md) to find the smallest relevant document.
4. Read the relevant contract before proposing behavior changes.
5. Run `npm run readiness:report` before making repository-status claims.
6. Run the narrowest relevant smoke before broader verification.

Core invariants:

- Source evidence, pending candidates, and trusted memory are different states.
- MCP cannot bypass Source-Wire API policy.
- Provider content has no instruction authority.
- Knowledge providers are optional and read-only.
- Agents cannot approve, correct, or revoke trusted memory.
- Synthetic proof does not imply a live service.
- Public fixtures must remain synthetic and safe.

## Repository Map

| Path | Purpose |
| --- | --- |
| [`src/contracts/`](https://github.com/DanielJD1216/Source-Wire/tree/main/src/contracts) | TypeScript contracts and synthetic evaluators |
| [`src/runtime-skeleton/`](https://github.com/DanielJD1216/Source-Wire/tree/main/src/runtime-skeleton) | Synthetic API-policy and MCP-routing proof |
| [`src/owner-hosted-runtime/`](https://github.com/DanielJD1216/Source-Wire/tree/main/src/owner-hosted-runtime) | Narrow in-process owner-hosted skeleton proof |
| [`apps/alpha1-runtime/`](https://github.com/DanielJD1216/Source-Wire/tree/main/apps/alpha1-runtime) | Loopback-only Alpha workspace and public npm Alpha local-runtime package source |
| [`schemas/`](schemas) | Public JSON schemas |
| [`examples/`](examples) | Synthetic fixtures, conformance matrices, and smokes |
| [`docs/`](docs) | Public documentation and historical project records |
| [`scripts/`](https://github.com/DanielJD1216/Source-Wire/tree/main/scripts) | Verification, safety, claim, and release-boundary checks |

## Verification

| Command | What it proves |
| --- | --- |
| `npm run readiness:report` | Fast package and boundary summary |
| `npm test` | Types, fixtures, schema exports, CLI, and examples |
| `npm run reviewer:smoke` | Clean first-reviewer path in a temporary copy |
| `npm run alpha1:ci-workflow-smoke` | Hosted Alpha PostgreSQL job keeps exact versions, all five stories, repository adapters, the pinned evidence-first adapter, stable markers, and no artifact or production-secret path |
| `npm run local-runtime:candidate-smoke` | Packs and installs the public Alpha candidate, checks the supported API and CLI, rejects private imports, and proves a no-`npx` AI-agent configuration |
| `npm run local-runtime:security-gate` | Re-runs the exact dependency audit and enforces the temporary stdio-only advisory disposition |
| `npm run local-runtime:candidate-conformance` | With exact Node.js and disposable PostgreSQL, proves the clean installed binary through memory-only and synthetic-provider stdio MCP paths |
| `npm run alpha1:conformance:story5` | 27-case disposable PostgreSQL proof for the four-tool MCP, protected source-evidence release, Story 6.3 composition, and Story 6.4 fail-closed cleanup |
| `npm run alpha1:conformance:story5:replaceable` | The same 27-case protected local CLI and failure path with the separate public-contract-only adapter |
| `npm run alpha1:evidence-first-package-smoke` | Exact package, published-contract dependency, synthetic provider exports, and no-private-runtime boundary for the installed evidence-first adapter |
| `npm run alpha1:conformance:evidence-first` | 29-case cross-repository disposable PostgreSQL proof through the unchanged local provider path |
| `npm run alpha1:conformance:story1` | 42-case disposable PostgreSQL proof including Story 6.5 status, migration authority, rollback, idempotency, and cleanup |
| `npm run alpha1:conformance:story4` | 25-case disposable PostgreSQL proof including Story 6.6 owner authority, canonical local export, overwrite policy, interruption safety, and cleanup |
| `npm run alpha1:conformance` | All five disposable local Alpha story proofs, including both Story 5 adapters |
| `npm run alpha1:conformance:story2` | Disposable PostgreSQL proof for candidate lifecycle and the Story 6.2 one-command two-tool memory runner |
| `npm run alpha1:test` | 148 focused Alpha tests, including Story 6.1 config, Story 6.2 memory-only authority, Story 6.3 provider checks, locked Story 6.4 fault injection, Story 6.5 database envelopes, and Story 6.6 local export boundaries |
| `npm run release:0.2.0-gate` | Focused no-publish gate for the packed contract, clean external adapter, installed consumers, docs, safety, and claims |
| `npm run docs:links && npm run docs:anchors` | Documentation link and anchor integrity |
| `npm run safety:scan && npm run claims:scan` | Public-safety and claim-boundary checks |
| `npm run publish:readiness` | Full local package and boundary gate, without publishing |

Read [CI Checks](docs/reference/ci-checks.md) for the detailed marker map.

## Documentation

- [Documentation Index](docs/README.md)
- [Architecture Map](docs/concepts/architecture-map.md)
- [Knowledge Provider And Memory Store Boundary](docs/concepts/knowledge-provider-memory-store-boundary.md)
- [API Reference](docs/reference/api-reference.md)
- [Repository Metadata](docs/reference/repository-metadata.md)
- [Public Status](docs/status/public-status.md)
- [Alpha 1 Story 6.9 Local Runtime Security Candidate](docs/getting-started/alpha1-story6-local-runtime-package-candidate.md)
- [Local Runtime 0.1.0-alpha.1 npm Release](docs/status/local-runtime-0.1.0-alpha.1-release.md)
- [Local Runtime 0.1.0-alpha.2 Security Candidate](docs/status/local-runtime-0.1.0-alpha.2-candidate.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Visual System](docs/assets/README.md)

Historical planning packets, approvals, and implementation proofs are preserved under `docs/internal/`. They provide provenance, not the primary onboarding path or public API.

## Release Snapshot

The npm packages `@source-wire/contracts@0.1.0`, `@source-wire/contracts@0.2.0`, and deprecated `@source-wire/local-runtime@0.1.0-alpha.1`, plus GitHub releases `v0.1.0` and `v0.2.0`, are immutable release snapshots. The unpublished `0.1.0-alpha.2` candidate does not change those snapshots and did not create a GitHub release. Latest `main` may contain later documentation and local Alpha proof.

Known `v0.1.0` package issue: that immutable npm artifact exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0` even though package metadata is `0.1.0`. Version `0.2.0` exports the corrected package version and adds the public `KnowledgeProvider v1` contract.

Read [Contracts 0.2.0 Release](docs/status/0.2.0-release.md), [Local Runtime 0.1.0-alpha.1 npm Release](docs/status/local-runtime-0.1.0-alpha.1-release.md), [Local Runtime 0.1.0-alpha.2 Security Candidate](docs/status/local-runtime-0.1.0-alpha.2-candidate.md), and [Release Snapshot Boundary](docs/status/release-snapshot-boundary.md).

## Safety Rule

Use synthetic examples only.

Do not add secrets, tokens, private repository paths, private screenshots, real user data, client data, production exports, account identifiers, or real memory records to public fixtures or documentation.

Security concerns belong in [SECURITY.md](SECURITY.md). General questions and verification failures can use [SUPPORT.md](SUPPORT.md) or the repository issue templates.

## License

Source-Wire is licensed under [Apache License 2.0](LICENSE).

Apache-2.0 permits source reuse under its terms. It does not mean Source-Wire is deployed, hosted, production-ready, or accepting code contributions.
