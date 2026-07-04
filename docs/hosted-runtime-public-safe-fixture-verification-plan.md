# Source-Wire Hosted Runtime Public-Safe Fixture And Verification Plan

Status: accepted PRD/planning artifact for issue `#263`. The approved synthetic hosted-runtime fixture package is implemented.

This document defines the synthetic fixture categories and verification gates required before a future owner-hosted Source-Wire runtime implementation can start. The approved synthetic fixture implementation is recorded in [Public-Safe Fixture Implementation Proof](public-safe-fixture-implementation-proof.md). This plan does not add API server code, MCP server runtime code, database migrations, deployment config, live connectors, real user data, npm publishing, a GitHub release, tags, or code contribution acceptance.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](quickstart.md).

## Purpose

Runtime behavior must be testable before it touches private memory.

The fixture plan exists for one reason:

```text
Public runtime proof must use fake data that still exercises real policy risks.
```

That means the future runtime must be tested with synthetic callers, namespaces, sources, candidates, trusted memory, denied access cases, stale evidence, and audit metadata before any private owner data, client data, local exports, or live connectors are used.

## Upstream Boundary

This plan inherits:

- owner-hosted first posture,
- managed-hosted deferred,
- API policy owns authorization,
- MCP calls the API policy boundary and cannot bypass it,
- database migrations remain blocked,
- source evidence is not trusted memory,
- trusted memory approval remains owner or application controlled,
- public examples stay synthetic only.

References:

- [Hosted Runtime Threat Model And Trust Boundary](hosted-runtime-threat-model-trust-boundary.md)
- [Hosted Runtime API Server Contract](hosted-runtime-api-server-contract.md)
- [Hosted Runtime MCP Server Contract](hosted-runtime-mcp-server-contract.md)
- [Hosted Runtime Database Posture And Data Lifecycle](hosted-runtime-database-posture-data-lifecycle.md)

## Fixture Safety Rules

All hosted-runtime fixtures must be synthetic and obviously fake.

Fixtures may include:

- synthetic owner IDs,
- synthetic caller IDs,
- synthetic harness labels,
- synthetic namespace IDs,
- synthetic source connections,
- synthetic source evidence,
- synthetic candidate memory,
- synthetic trusted memory,
- synthetic denied cases,
- synthetic stale evidence,
- synthetic audit events,
- synthetic vector capability flags,
- synthetic database readiness states,
- synthetic MCP requests and responses.

Fixtures must not include:

- real user data,
- private owner data,
- client data,
- real local paths,
- account IDs,
- emails,
- domains,
- phone numbers,
- addresses,
- tokens,
- credentials,
- database connection strings,
- screenshots,
- production exports,
- private repo history,
- financial data,
- health data,
- legal data.

Use fake values that cannot be confused with a real person or company, such as:

```text
owner_demo_001
caller_codex_demo
namespace_demo_alpha
source_markdown_demo_001
candidate_demo_001
memory_demo_001
audit_demo_001
trace_demo_001
```

## Required Fixture Categories

The implemented synthetic fixture package must add or explicitly reuse synthetic fixture coverage for every category below.

| Fixture category | Purpose | Must prove |
| --- | --- | --- |
| Owner | Represents the memory owner without identity exposure. | Owner-scoped behavior can be tested without a real profile. |
| Caller | Represents Codex, Claude Code, OpenClaw, or another harness. | Caller capability, action, and audit metadata are preserved. |
| Namespace | Represents project, client, user, or workspace separation. | Cross-namespace access fails closed. |
| Source connection | Represents an imported or synced source. | Sources are not trusted memory by default. |
| Source evidence | Represents cited chunks, freshness, and sensitivity. | Answers can cite evidence without trusting all imports. |
| Candidate memory | Represents pending owner review. | Candidates do not promote themselves. |
| Trusted memory | Represents approved memory records. | Trusted search stays separate from source-only search. |
| Approval and rejection | Represents owner or application-controlled review. | Approval creates trusted memory only through an allowed path. |
| Denied access | Represents blocked capability, namespace, or sensitivity access. | Denied results do not leak hidden content. |
| Gaps and stale evidence | Represents weak, stale, missing, or blocked context. | Agents can explain uncertainty without inventing facts. |
| MCP calls | Represents agent-facing tool calls. | MCP routes through API policy and preserves citations and denials. |
| Audit events | Represents allowed, denied, partial, failed, and review actions. | Policy decisions are inspectable without private payloads. |
| Runtime adapter result | Represents output from a separate memory runtime candidate. | Source-Wire policy shapes runtime output before MCP sees it. |

## Minimum Fixture Scenarios

The implemented synthetic fixture package defines scenarios for:

1. Authorized trusted-memory read within one namespace.
2. Authorized source-evidence read that returns citations but no trusted promotion.
3. Denied cross-namespace read with safe metadata only.
4. Denied mutation because the caller lacks approval authority.
5. Candidate creation from source evidence with pending review.
6. Candidate approval through owner or application control.
7. Candidate rejection with no trusted memory delta.
8. Stale source evidence that appears as a gap or warning.
9. Partial source update with skipped and errored items.
10. MCP context assembly that includes citations, gaps, denied counts, and `noAutoPromotion`.
11. Database readiness pass without a real connection string.
12. Database readiness blocked state without migrations.
13. Audit event capture for allowed, denied, partial, and failed actions.

## Verification Gates

Minimum gates before any hosted-runtime implementation unit starts:

| Gate | Command or evidence | Purpose |
| --- | --- | --- |
| Runtime readiness | `npm run runtime-readiness:smoke` | Proves the implementation boundary is still blocked until required planning evidence is present. |
| Runtime proof intake | `npm run runtime-proof-intake:smoke` | Proves future runtime proof packets reject missing, unsafe, or ungrounded evidence. |
| Public safety scan | `npm run safety:scan` | Catches private data, secrets, and unsafe patterns in public files. |
| Claim boundary scan | `npm run claims:scan` | Catches overclaims about hosting, production use, runtime readiness, and managed service behavior. |
| Docs links | `npm run docs:links` | Ensures linked docs resolve. |
| Docs anchors | `npm run docs:anchors` | Ensures anchored references resolve. |
| Docs command setup | `npm run docs:command-setup` | Ensures documented commands have setup context. |
| Fixture validation | `npm run validate:fixtures` | Validates existing schema-backed public fixtures. |
| Package tests | `npm test` | Runs contract, fixture, schema, CLI, and TypeScript checks. |
| Package build | `npm run build` | Proves the public package still builds. |
| Owner open issue status | `npm run owner:open-issues-status` | Confirms hosted runtime planning issues remain open and owner implementation gates remain blocked. |
| Package Checks | GitHub Actions Package Checks | Confirms the public branch is green after changes. |

Minimum owner-side live gates before implementation approval:

- latest `main` Package Checks are green,
- local `main` and `origin/main` match,
- owner decision issues retain exact approval text,
- hosted runtime planning issues remain visible,
- no implementation issue is treated as approved by planning artifacts.

## Runtime Implementation Entry Packet

The approved implementation unit includes a fixture and proof packet that names:

- fixture categories covered,
- fixture files added or reused,
- exact commands run,
- Package Checks run ID,
- safety scan result,
- claim boundary scan result,
- no-private-data statement,
- no-secret statement,
- no-deployment statement,
- no-managed-hosting statement,
- no-trusted-memory-auto-promotion statement,
- unresolved gaps.

Minimum statement:

```text
All runtime proof fixtures are synthetic.
No real owner, client, account, token, path, database, export, screenshot, or production data was used.
```

## No-Go Conditions

Do not start hosted-runtime implementation if:

- fixture categories are undefined,
- fixture scenarios do not include denied access,
- fixtures include private owner data,
- fixtures include client data,
- fixtures include real local paths,
- fixtures include account IDs, emails, domains, tokens, or connection strings,
- tests require a live database before database work is approved,
- tests require live connectors,
- tests require deployment,
- MCP can bypass API policy,
- source evidence can promote itself into trusted memory,
- public docs claim production runtime readiness,
- Package Checks are failing.

## Fixture Non-Goals

This issue does not add:

- additional fixture implementation beyond the approved synthetic hosted-runtime fixture package,
- seed data,
- database schema files,
- database migrations,
- database connection code,
- API server implementation,
- MCP server runtime implementation,
- runtime adapter implementation,
- live connector implementation,
- local filesystem crawling,
- Mission Control UI,
- managed hosting,
- deployment,
- production runtime use,
- real user data,
- trusted Memory Record auto-promotion,
- npm publishing,
- GitHub release creation,
- tags,
- code contribution acceptance.

## Acceptance Mapping

| Acceptance criterion | Status |
| --- | --- |
| Fixtures use synthetic callers, namespaces, sources, candidates, trusted memory, and denied cases. | Covered by fixture categories and minimum scenarios. |
| Fixtures contain no real user data, private owner data, local paths, account IDs, emails, domains, tokens, screenshots, client data, or production exports. | Covered by fixture safety rules and no-go conditions. |
| Verification includes runtime readiness, runtime proof intake, safety, claim boundary, docs, and owner-side live gates. | Covered by verification gates. |
| No additional fixture implementation is added unless a later implementation unit approves it. | Covered by fixture non-goals and status. |
