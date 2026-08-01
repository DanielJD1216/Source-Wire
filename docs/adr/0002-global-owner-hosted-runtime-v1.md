# ADR 0002: Global Owner-Hosted Runtime V1

Use Node.js 22 with npm for local checks. See the [Quickstart](../getting-started/quickstart.md).

Status: Accepted for architecture definition only

Date: 2026-07-31

Issue: `#286`

## Decision Scope

This ADR records **Gate A**, the architecture decision for a future Global Owner-Hosted Runtime V1. It does not authorize runtime implementation, deployment, private evidence, production activation, or team access.

The architecture is for one single DOO MADE owner/tenant. It is not a managed multi-tenant service and does not turn Source Wire into a universal server for unrelated tools.

## Current State

Source Wire currently provides:

- published contracts;
- synthetic runtime-boundary fixtures and policy proofs;
- a local `stdio` Alpha using disposable state;
- MemoryStore and KnowledgeProvider boundaries;
- four local MCP tools when one provider is configured;
- durable audit and single-use protected-read receipt proofs.

Source Wire does not currently provide:

- a shared remote MCP service;
- a production API listener;
- remote authentication or delegated user identity;
- live connectors;
- production database provisioning;
- private-data activation;
- team-wide Slack authorization;
- managed hosting.

The separately reviewed DOO MADE evidence engine can act as a future KnowledgeProvider, but this ADR does not connect, deploy, copy, publish, or activate that private implementation.

## Decision

Global Owner-Hosted Runtime V1 will be designed as one private organizational knowledge service with multiple separately authenticated clients.

```text
Slack adapter / Hermes ─────────────┐
Codex ──────────────────────────────┤
Claude Code ────────────────────────┼→ private authenticated access plane
Future approved applications ──────┘                 ↓
                                           Source Wire API policy
                                                     ↓
                           MemoryStore + optional KnowledgeProvider
                                                     ↓
                                  governed evidence and exact citations
```

The future shared client transport is private-network authenticated Streamable HTTP MCP backed by one policy API. Local `stdio` remains an evaluation path until a later implementation unit proves semantic parity.

## Product Boundary

Source Wire owns the organizational knowledge domain:

- trusted memory;
- source evidence;
- citations and gaps;
- pending memory candidates;
- owner-controlled approval policy;
- authorization and audit metadata;
- safe abstention.

Source Wire does not absorb unrelated capabilities such as arbitrary shell execution, browser automation, source-control mutation, email sending, image generation, or production database administration. A higher-level agent host may connect to several domain-specific MCP servers.

## Identity And Authorization

Every future request must resolve a server-derived authorization context before content access:

| Context element | Meaning | Source of truth |
| --- | --- | --- |
| human principal | The authenticated person on whose behalf the call is made. | Identity provider or verified channel adapter. |
| client application | Hermes, Slack adapter, Codex, Claude Code, or another registered client. | Authenticated client credential. |
| workspace and channel context | The verified Slack workspace, channel, thread, or equivalent audience when relevant. | Signed platform event or trusted adapter assertion. |
| agent session | One bounded agent or MCP session for audit, cancellation, and revocation. | Access plane. |
| credential audience | The exact Source Wire resource and client for which the credential was issued. | Authorization server and resource validation. |
| owner and tenant | The single DOO MADE owner boundary for V1. | Server configuration and identity mapping. |
| allowed namespaces | The namespace set authorized for the principal and client. | Source Wire policy. |
| capabilities | Read, search, candidate preparation, or owner-controlled actions. | Source Wire policy. |
| destination release ceiling | The highest evidence classification allowed for the client, channel, and model destination. | Source Wire policy. |
| immutable destination tuple | The actual delivery surface, workspace/channel/thread, model provider/account/endpoint, locality, and retention class. | Registered route plus verified adapter and model-runtime identity. |
| multi-hop audience chain | The ordered principal, adapter, client, model/runtime, and final channel/export audiences through which evidence will pass. | Access plane, verified adapters, and registered routes. |

**Model-supplied selectors never grant authority.** A tool payload may request one namespace from the caller's pre-authorized set, but payload fields such as `caller.id`, `ownerId`, `namespaceId`, capability, client identity, or sensitivity ceiling are not trusted grants.

The API policy boundary must intersect all relevant constraints:

```text
authenticated principal
∩ authenticated client
∩ verified workspace/channel audience
∩ active session and credential audience
∩ server-authorized namespaces
∩ server-authorized capabilities
∩ authenticated immutable destination tuple
∩ complete multi-hop audience chain
∩ destination release ceiling for every hop
= effective authorization
```

Missing, ambiguous, expired, revoked, or contradictory context fails closed.
The destination tuple and audience chain are transport-derived and immutable for
one request. Tool payloads cannot claim a local model, private channel, or lower
retention destination. Route substitution, a missing hop, or a change between
search, fetch, and release requires a fresh policy decision and otherwise fails
closed.

## Credential And Session Model

The future access plane is an OAuth/OIDC resource server with an allowlisted
issuer and exact resource audience. It validates issuer, subject, audience,
authorized client, expiry, not-before time, token ID, authorization epoch, and
sender-constrained proof before resolving Source Wire policy. Bearer-only access
tokens are not accepted. Interactive and public clients use DPoP proof-of-possession
bound through the token `cnf` claim; confidential and workload clients use mTLS
certificate binding. The access plane validates the DPoP key thumbprint or mTLS
certificate thumbprint, request method and URI, nonce, issuance time, and replay
state before policy evaluation or retrieval.

Interactive clients use authorization code with PKCE. Service clients use a
separate workload identity. A verified Slack adapter uses bounded token
exchange to create an on-behalf-of assertion for one user, workspace, channel,
client, and request audience. No client shares a credential with another.
Token exchange preserves or replaces the sender constraint with a new bounded
adapter proof; it never downgrades to an unconstrained bearer token.

The planned access token lifetime is at most 15 minutes. Trusted clients may
renew through independently revocable refresh or workload credentials. One
agent session has an eight-hour maximum and must survive safe credential
rotation without gaining scope. Revocation or an authorization-epoch change
invalidates existing and new calls. Tokens are never accepted from query
strings or tool payloads.

Credential custody remains outside evidence storage. PostgreSQL 16 stores
allowlisted issuer configuration, public verification keys, hashed token IDs,
client-secret verifiers, authorization epochs, revocation state, and key-version
metadata. It must not store plaintext client secrets or bearer refresh tokens.
Decryptable refresh or workload credentials, if a later client requires them,
use envelope encryption with a key-encryption key held outside PostgreSQL and a
separate recovery path. Signing-key rollover requires overlapping verification,
bounded old-key retirement, durable replay state, bootstrap recovery, and an
independently tested emergency revocation procedure. A database backup alone
must not be sufficient to impersonate a client.

## Slack And Hermes Boundary

A process-wide Hermes MCP credential proves only that Hermes called. It does not prove which Slack user, workspace, channel, or thread initiated the call.

Multi-user Slack access therefore requires one of these separately implemented paths:

1. A verified Slack adapter exchanges signed user, workspace, and channel context for a bounded Source Wire request identity.
2. An owner-private or workspace-service-principal deployment is fixed server-side to one namespace and documented as not providing individual user authorization.

The model cannot self-assert Slack identity. Multi-user Slack remains blocked until cross-user, cross-channel, and cross-workspace denial is proven.

## Remote Transport Boundary

A future remote implementation must treat Streamable HTTP as a new security boundary, not a wrapper around local `stdio`.

Required controls before implementation can be approved include:

- TLS and trusted proxy configuration;
- OAuth/OIDC resource-server validation;
- subject, resource, audience, client, scope, expiry, and authorization-epoch checks;
- credential rotation and immediate revocation;
- session binding, cancellation, reconnect, and replay protection;
- Origin and Host validation;
- authorization URL and redirect validation;
- confused-deputy prevention;
- per-principal, client, namespace, and extraction budgets;
- distributed overload and denial-of-service controls;
- dependency review triggered by the transport change.

No Internet listener is approved by this ADR.

## Data Topology

Global Owner-Hosted Runtime V1 has a mandatory memory-only core and a
conditional evidence extension:

1. **PostgreSQL 16** is mandatory and is the sole grant authority. It stores
   Source Wire policy, MemoryStore state, candidates, trusted-memory revisions,
   credential-verification state, authorization and deletion epochs, audit, and
   receipts.
2. **PostgreSQL 18** is required only when the optional KnowledgeProvider
   evidence mode is enabled. It stores source revisions, provider-local source
   ACL metadata, retrieval indexes, exact hydration state, and evidence audit.
   Provider-local ACL metadata can remove results but can never grant Source
   Wire authority.

A memory-only deployment remains valid with PostgreSQL 16 and no evidence model
service. An evidence-enabled deployment requires PostgreSQL 18 and the isolated
model service in addition to the memory core. Combining the stores or changing
supported versions requires a later compatibility decision and proof.

Every delegated evidence request carries a bounded request ID, principal/client
binding, immutable destination digest, and the current monotonic authorization
and deletion epochs minted by the PostgreSQL 16 policy boundary. Search may
apply stricter provider-local filtering, but exact fetch reauthorizes against
PostgreSQL 16 after retrieval and immediately before the durable release receipt.
Revocation or deletion increments the authoritative epoch. An in-flight request
with an older epoch releases zero content, even if PostgreSQL 18 or a cache still
contains the prior row.

A revocation or deletion is acknowledged only after a synchronous append to an
independently restored, encrypted epoch-and-tombstone journal outside the base
PostgreSQL backup set. Journal unavailability makes the mutation fail closed.
Recovery loads the latest journal before either store can become ready, which
prevents a five-minute-old PostgreSQL 16 base backup from resurrecting authority.

Each store receives:

- independent runtime and migration identities;
- hostname-verifying TLS;
- least-privilege roles;
- independent backup and point-in-time recovery;
- retention and deletion policy;
- restore verification;
- migration compatibility checks.

A cross-store restore must prove owner, namespace, source version, content digest, candidate provenance, trusted-memory state, deletion state, and audit continuity without resurrecting unauthorized or deleted evidence.

Architecture recovery targets for the first owner-hosted deployment are:

- PostgreSQL 16 policy and memory: RPO at most five minutes and RTO at most one hour;
- PostgreSQL 18 evidence indexes: RPO at most fifteen minutes and RTO at most four hours because indexes remain rebuildable from governed sources;
- revocation and deletion authority: zero active-policy RPO through the synchronous independently restored epoch-and-tombstone journal;
- combined service: RTO at most four hours, with traffic denied until epochs and restore identities reconcile.

Gate E may tighten these targets but cannot weaken revocation or deletion safety.

## Model-Service Isolation And Capacity

The persistent model service remains a narrow fixed embedding and reranking executor. It does not own authorization, database credentials, candidate identity, ranking policy, hydration, citation release, or memory approval.

Production design requires a dedicated model-service UID and a reviewed **cross-UID** local IPC contract. The current same-UID peer requirement cannot be described as dedicated-UID isolation.

V1 chooses a dedicated provider UID, a distinct model-service UID, and one
dedicated socket group. The socket directory is owner/group controlled, and
the socket uses mode `0660`. Group membership permits the provider to attempt a
connection, but it does not decide peer identity. The model service validates
the provider peer UID against an explicit allowlist, and the provider validates
the server peer UID before sending inference input.

UID validation alone cannot reject a stale process running under the same UID.
Each model boot therefore creates a supervisor-minted boot epoch and each
provider process receives a one-use, short-lived instance nonce over an inherited
file descriptor rather than environment, arguments, or disk. The socket
handshake binds both peer UIDs, provider instance ID, model instance ID, model
revision, boot epoch, and nonce. Restart, drain, or revocation rotates the boot
epoch and invalidates prior nonces. An unrelated local user, group member, or
stale same-UID process must fail before inference input is accepted.

A later implementation decision must define:

- approved UID/GID and socket ownership;
- peer and instance authorization for allowed, denied, and stale same-UID processes;
- no database or Source Wire verifier credentials in the model process;
- seccomp, network denial, process limits, and parent-death behavior;
- bounded admission and worker capacity;
- fair concurrency across clients;
- cold-start, replacement, drain, cancellation, and overload behavior.

A single busy model lane is not sufficient production capacity.

## Destination-Aware Evidence Release

Authorization to read evidence internally does not automatically authorize releasing it to every destination.

V1 uses destination-aware evidence release with four classifications:

| Classification | Default release posture |
| --- | --- |
| public | All approved clients and audiences. |
| internal | Approved organizational clients and channels. |
| confidential | Explicitly approved clients, audiences, and private or local model paths. |
| restricted | Denied to cloud-model and shared-channel destinations by default. |

The release decision considers the human principal, client application,
workspace and channel context, namespace, requested operation, the immutable
destination tuple, and every hop in the multi-hop audience chain. The access
plane obtains model provider/account/endpoint and channel identity from
registered routes and verified adapters, not model text. If a downstream hop is
unknown or changes, release fails closed.

Evidence returned to Hermes, Slack, Codex, Claude Code, model contexts, session histories, logs, exports, or user copy/paste becomes a downstream retained copy. Source Wire can prevent future release but cannot guarantee deletion of copies already released. Responses must therefore minimize content and preserve client-specific retention policy.

Audit and ordinary telemetry must not retain raw evidence, credentials, private queries, or private locators. Query-derived digests require a tenant-specific, domain-separated HMAC or must be omitted.

## Prompt And Cross-Tool Safety

Provider content remains untrusted data with no instruction authority. A label alone is not containment.

Every evidence field crosses the provider boundary in a structured envelope
with `instructionAuthority: none`, `contentTaint: untrusted_source`, provenance,
and sensitivity. Agent hosts must keep that envelope outside system messages,
tool schemas, identity fields, destination routing, and policy instructions.

Retrieved evidence cannot authorize a Source Wire proposal or an external write.
A mutation influenced by evidence requires a separate short-lived mutation
authorization bound to the authenticated principal, client, destination,
operation, and canonical argument digest. That authorization comes from an
access-plane approval service after a signed trusted-UI or verified-channel
confirmation, never from the model or general agent host. Source Wire
does not execute unrelated external writes, and agent hosts must refuse
evidence-derived tool routing without this mediation. Synthetic indirect prompt
injection tests must prove that retrieved instructions cannot change identity,
namespace, destination, tool arguments, or mutation authority.

Tool manifests and descriptions should be pinned or reviewed so a compromised remote server cannot silently expand tool authority.

## Citation And Exact Fetch

Search returns a 256-bit random opaque citation handle. The access plane stores
only its digest plus the authorization and evidence binding. The hydration
handle expires after at most five minutes and is valid only for exact fetch.
It is not a transferable bearer capability.

The stored binding includes:

- owner;
- namespace;
- authenticated human principal;
- authenticated client application;
- agent session and replay scope;
- credential and authorization epoch;
- immutable destination tuple digest;
- multi-hop audience-chain digest;
- provider;
- source and segment IDs;
- source version;
- content digest;
- sensitivity;
- expiry;
- one-use redemption state.

Exact fetch atomically redeems the one-use handle and validates the same
principal, client, session/replay scope, authorization epoch, destination tuple,
audience chain, lifecycle, source version, and content digest before release. A
changed, stale, deleted, expired, replayed, copied, destination-substituted, or
unauthorized handle fails closed without existence leakage.

A separate stable citation receipt ID may appear in an answer. It is not an
evidence capability. Resolving it later requires fresh authentication,
authorization, lifecycle, version, digest, and destination-release checks. This
separation provides stable attribution without creating a permanent bearer link.

`publicSafe` or equivalent locator metadata describes whether a locator string may be displayed. It does not make restricted evidence shareable.

Citation deep links require authentication and non-enumerating denial for unauthorized users.

## Evidence-Backed Candidate Provenance

A memory candidate proposed from source evidence must preserve source-evidence provenance:

- provider ID;
- source and segment IDs;
- source version;
- content digest;
- stable citation receipt ID, never the expiring hydration handle;
- release trace;
- proposing principal and client.

Approval must preserve those references into the trusted-memory revision. An agent cannot approve its own candidate by default, and approval remains outside MCP.

## Tool Surface And Activation

The four-tool product direction remains:

1. `search_trusted_memory`
2. `search_source_evidence`
3. `get_source_evidence`
4. `propose_memory_candidate`

Activation is progressive:

- memory-only discovery advertises only `search_trusted_memory` and has no
  KnowledgeProvider, PostgreSQL 18, or model-service dependency;
- evidence-enabled discovery adds `search_source_evidence` and
  `get_source_evidence` only after the evidence chain is ready;
- those three tools are the read-only evidence-enabled surface first;
- proposal remains disabled until source-evidence provenance is implemented;
- trusted-memory approval, correction, revocation, export, connector administration, and database control stay outside MCP.

KnowledgeProvider v1 does not currently advertise per-filter support. Gate B
must first define an additive, versioned `knowledge-provider.query-features.v1`
profile descriptor before a remote adapter advertises optional cursor,
freshness, sensitivity, pagination, or filtering inputs. Until that extension
is implemented and negotiated, the adapter advertises only baseline v1
operations and sends no optional filter the provider has not explicitly
declared. Unknown descriptors remain ignorable; required unknown descriptors
fail closed.

Read tools use consistent output schemas for status, citations, gaps, freshness, sensitivity, denied counts, retryability, safe next actions, truncation, and context budgets.

## Full-Chain Readiness And Operations

Liveness means a process is alive. Readiness means the complete authorized dependency chain can safely accept work.

The full-chain readiness decision is fail closed: partial dependency health is not enough to accept traffic.

Memory-only **full-chain readiness** must verify:

- Source Wire database compatibility and recovery state;
- credential verifier and authorization epoch state;
- certificate and secret validity;
- audit durability;
- request and release deadlines.

When evidence mode is enabled, full-chain readiness additionally verifies:

- exact provider binding and negotiated query-feature descriptor;
- evidence database identity, TLS, read-only posture, and deletion epoch;
- model-service peer and instance handshake, warm state, and capacity;
- policy/evidence authorization and deletion epoch reconciliation.

Evidence tools are not advertised or accepted during model cold start, worker
replacement, provider incompatibility, epoch mismatch, or insufficient
capacity. Memory-only trusted-memory traffic remains independently available
only when its own policy, PostgreSQL 16, and audit readiness is healthy.

Future operations gates must cover privacy-safe logs, stage metrics, trace correlation, rate and extraction budgets, alerting, incident revocation, immutable artifacts, rollback, independent and combined restore drills, source freshness, deletion propagation, and client compatibility.

A release receipt proves an authorized release attempt, not remote client delivery.

## Approval Ladder

Each gate requires a separate owner decision:

| Gate | Scope | Status after this ADR |
| --- | --- | --- |
| Gate A | Architecture definition only. | Approved by issue `#286`. |
| Gate B | Approve and execute synthetic-only runtime implementation. Entry requires reviewed slices, threat model, dependency review, a tests-first plan, a mutation plan, and exact owner approval. | Blocked. |
| Gate C | Operate a synthetic remote pilot. Entry requires Gate B implementation exit proof: all denial, mutation, transport, capacity, readiness, restore, and rollback tests green. | Blocked. |
| Gate D | One approved low-risk data source. | Blocked. |
| Gate E | Private production activation. | Blocked. |
| Gate F | Team and multi-user access. | Blocked. |

The remote runtime implementation remains blocked. The deployment remains blocked. The private evidence remains blocked. The production activation remains blocked. The team access remains blocked. The managed hosting remains blocked.

## Rejected Alternatives

### One shared global bearer token

Rejected because it prevents per-client attribution, independent revocation, least privilege, and destination-aware release.

### Model-supplied caller or namespace authority

Rejected because prompt injection or a confused client could substitute identity or scope.

### One database for both policy and external evidence

Rejected for V1 because current version and trust requirements differ, and because memory policy must remain valid without a knowledge provider.

### One universal MCP server for every tool

Rejected because unrelated tools require different trust, credential, audit, and failure boundaries.

### Immediate managed multi-tenancy

Rejected because it adds operator access, legal, privacy, billing, support, breach, and cross-tenant obligations that are unnecessary for one owner.

### Direct production rollout

Rejected because remote transport, delegated identity, capacity, readiness, lifecycle, and operational controls are not implemented.

## Consequences

Positive:

- One organizational knowledge plane can serve several clients without shared authority.
- Source Wire remains domain-specific and provider-neutral.
- Existing local Alpha and contract boundaries remain truthful.
- Client compromise can be contained and revoked independently.
- Evidence release becomes sensitive to destination risk.
- Citations remain bound to exact evidence versions.

Tradeoffs:

- Memory-only V1 operates PostgreSQL 16; evidence-enabled V1 adds a separately managed PostgreSQL 18 system and model service.
- Remote transport requires new security engineering.
- Slack multi-user support needs a trusted identity bridge.
- Dedicated model isolation requires a cross-UID protocol change.
- Progressive activation takes longer than attaching a shared token to the local Alpha.

## Current Implementation Boundary

This ADR authorizes documentation, synthetic architecture fixtures, deterministic marker checks, and review only.

The remote runtime implementation remains blocked. The deployment remains blocked. The private evidence remains blocked. The production activation remains blocked. The team access remains blocked. The managed hosting remains blocked.

It does not authorize API or MCP server runtime code, authentication code, database migrations, database connections, model-service changes, deployment manifests, cloud resources, DNS, credentials, live connectors, real data, private implementation extraction, package publishing, version changes, tags, GitHub releases, contribution acceptance, or automatic trusted-memory promotion.

## Verification

```bash
npm run runtime:global-owner-hosted-v1-architecture
npm run runtime:global-owner-hosted-v1-architecture:smoke
npm run runtime:global-owner-hosted-v1-architecture:scope
npm run runtime:threat-model
npm run runtime:api-contract
npm run runtime:mcp-contract
npm run runtime:database-posture
npm run runtime:deployment-boundary
npm run docs:links
npm run docs:anchors
npm run safety:scan
npm run claims:scan
```

Related docs:

- [ADR 0001: MemoryStore And Knowledge Provider Boundary](0001-memory-store-and-knowledge-provider-boundary.md)
- [Hosted Runtime Threat Model](../internal/hosted-runtime-threat-model-trust-boundary.md)
- [Hosted Runtime API Contract](../internal/hosted-runtime-api-server-contract.md)
- [Hosted Runtime MCP Contract](../internal/hosted-runtime-mcp-server-contract.md)
- [Hosted Runtime Database Posture](../internal/hosted-runtime-database-posture-data-lifecycle.md)
- [Hosted Runtime Deployment Boundary](../internal/hosted-runtime-deployment-boundary-stop-conditions.md)
- [Global Owner-Hosted Runtime V1 Acceptance Matrix](../internal/global-owner-hosted-runtime-v1-acceptance-matrix.md)
