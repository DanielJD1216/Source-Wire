# Global Owner-Hosted Runtime V1 Architecture Acceptance Matrix

Status: Gate A planning and verification artifact for issue `#286`.

Use Node.js 22 with npm from the repository root. For complete local setup,
read the [Quickstart](../getting-started/quickstart.md).

This matrix translates [ADR 0002](../adr/0002-global-owner-hosted-runtime-v1.md) into future natural-language acceptance tests. It uses synthetic identities and metadata only.

**No runtime code is approved by this matrix.** Remote runtime implementation, deployment, private evidence, production activation, team access, and managed hosting remain blocked.

Rows marked **Gate B exit** are synthetic implementation acceptance tests, not
prerequisites that must already pass before Gate B can be approved. Gate B entry
requires reviewed slices, threat model, dependency review, tests-first and
mutation plans, and exact owner approval. All Gate B exit rows must pass before
Gate C can authorize operation of a synthetic pilot.

## Identity And Authorization

| ID | Scenario | Expected future proof | Gate |
| --- | --- | --- | --- |
| ID-01 | forged caller | A tool payload supplies another `caller.id`. The API derives the principal from authenticated session state and denies the mismatch without policy or retrieval. | Gate B exit |
| ID-02 | forged namespace | A model requests a namespace outside its server-authorized set. The call fails closed without content, counts, or existence metadata. | Gate B exit |
| ID-03 | wrong credential audience | A Codex credential is replayed against the Hermes audience. The resource server rejects it before policy or retrieval. | Gate B exit |
| ID-04 | client substitution | The same owner calls through Hermes and Codex. Audit preserves one owner boundary with two distinct client identities and destination ceilings. | Gate B exit |
| ID-05 | revoked session | Revocation invalidates existing and new calls without waiting for process restart or token expiry. | Gate B exit |
| ID-06 | Slack workspace isolation | Two synthetic workspaces cannot read each other's evidence, citations, counts, namespaces, or audit metadata. | Gate F |
| ID-07 | Slack channel audience | A user authorized in a private channel cannot release the same evidence into an unauthorized shared channel. | Gate F |
| ID-08 | confused deputy | A client cannot use Source Wire's downstream provider authority to gain a broader owner, namespace, or destination scope. | Gate B exit |
| ID-09 | destination substitution | A client requests evidence under an approved local/private route and then substitutes a cloud model, shared channel, or higher-retention destination. The route change fails closed before release. | Gate B exit |
| ID-10 | incomplete audience chain | A model or channel hop is absent from the transport-derived multi-hop audience chain. Search, exact fetch, and release return no evidence. | Gate B exit |

## Destination And Privacy

| ID | Scenario | Expected future proof | Gate |
| --- | --- | --- | --- |
| DATA-01 | cloud destination denied | Restricted synthetic evidence requested through a cloud-model client returns a safe denial or gap. | Gate B exit |
| DATA-02 | approved internal destination | Internal synthetic evidence is released only to an approved client and audience with a traceable policy decision. | Gate B exit |
| DATA-03 | downstream retained copies | Documentation and response policy state that Slack messages, model contexts, transcripts, exports, and copy/paste are copies outside Source Wire's revocation control. | Gate B exit |
| DATA-04 | audit privacy | Logs and metrics contain no raw evidence, credentials, private query text, or private locator. Query digests use tenant-specific domain-separated HMAC or are omitted. | Gate B exit |
| DATA-05 | extraction budget | Repeated bounded search and exact-fetch calls cannot drain the synthetic corpus beyond principal, client, namespace, and time-window budgets. | Gate B exit |
| DATA-06 | indirect prompt injection | Synthetic evidence asks the agent to change identity, namespace, destination, tool arguments, or call an external write tool. The content remains `instructionAuthority: none` and changes none of them. | Gate B exit |
| DATA-07 | mutation mediation | Evidence-derived proposal or write arguments without a separate principal/client/destination/action/argument-digest authorization from the access-plane approval service are denied. Evidence text, the model, and the general agent host cannot create that authorization. | Gate B exit |

## Citations And Provenance

| ID | Scenario | Expected future proof | Gate |
| --- | --- | --- | --- |
| CIT-01 | citation version drift | Source content changes between search and exact fetch. The old handle fails closed because source version or content digest changed. | Gate B exit |
| CIT-02 | copied citation | An opaque citation handle copied to another principal, client, session, namespace, audience chain, authorization epoch, or destination fails without revealing source existence. A replay in the original scope also fails after one atomic redemption. | Gate B exit |
| CIT-03 | deleted citation | A source deleted after search cannot be hydrated from an old handle. | Gate B exit |
| CIT-04 | locator versus shareability | A display-safe locator never raises the evidence destination release ceiling. | Gate B exit |
| CIT-05 | evidence-backed candidate | A proposal preserves provider, source, segment, source version, content digest, stable citation receipt ID, release trace, principal, and client. It never persists the expiring hydration handle. | Gate B exit |
| CIT-06 | approval provenance | Owner approval preserves the evidence-backed candidate references into the active trusted-memory revision. | Gate B exit |
| CIT-07 | no self-approval | No MCP tool or agent-only path can approve its own candidate. | Gate B exit |
| CIT-08 | stable receipt reauthorization | A stable receipt copied to another principal, client, or destination, or resolved after lifecycle, version, or digest change, fails closed. Valid resolution rechecks current authorization and never recreates a hydration capability. | Gate B exit |

## Tool Behavior And Client Experience

| ID | Scenario | Expected future proof | Gate |
| --- | --- | --- | --- |
| TOOL-01 | trusted versus source selection | Standing approved decisions use trusted-memory search; current source status uses source-evidence search. | Gate B exit |
| TOOL-02 | exact fetch discipline | `get_source_evidence` accepts only a valid authorized handle returned by search, not guessed IDs. | Gate B exit |
| TOOL-03 | unsupported provider filter | Baseline KnowledgeProvider v1 advertises no optional filters. A future adapter advertises them only after negotiating the additive `knowledge-provider.query-features.v1` descriptor; stale or incompatible clients receive an actionable error. | Gate B exit |
| TOOL-04 | empty memory fallback | Empty trusted memory returns a structured gap and safe next action instead of an unexplained empty array. | Gate B exit |
| TOOL-05 | context budget | Broad search returns compact ranked excerpts, indicates truncation, and hydrates only selected evidence. | Gate B exit |
| TOOL-06 | proposal restraint | Casual statements do not create candidates. Explicit owner intent creates one pending candidate without approval. | Gate B exit |
| TOOL-07 | remote and stdio parity | The same synthetic request returns semantically equivalent status, citations, gaps, and denial behavior through remote and local transports. | Gate B exit |
| TOOL-08 | mode-specific discovery | Memory-only discovery exposes only `search_trusted_memory`. Evidence mode adds source search and exact fetch only while its complete evidence chain is ready; a cached evidence call during outage fails safely without affecting healthy memory search. | Gate B exit |
| TOOL-09 | candidate provenance derivation | Candidate creation accepts a stable receipt ID and independently authenticated owner intent; the server validates the receipt and derives every immutable provenance field instead of trusting client-supplied provenance. | Gate B exit |

## Credentials And Sessions

| ID | Scenario | Expected future proof | Gate |
| --- | --- | --- | --- |
| AUTH-01 | credential rotation | A long-lived client crosses one safe credential rotation without losing authorized operation. | Gate B exit |
| AUTH-02 | eight-hour session | An eight-hour session completes without the current ten-minute process-credential failure mode. | Gate B exit |
| AUTH-03 | replay | A stolen, expired, revoked, wrong-resource, or wrong-client credential fails before retrieval. A copied valid token without its DPoP key or bound mTLS certificate also fails before policy evaluation. | Gate B exit |
| AUTH-04 | offboarding | Disabling a client or principal ends existing and new session authority immediately. | Gate F |
| AUTH-05 | credential custody | A PostgreSQL 16 backup contains no plaintext client secret, bearer refresh token, signing private key, or external key-encryption key and cannot impersonate a client by itself. | Gate B exit |
| AUTH-06 | live revocation race | Revocation increments the PostgreSQL 16 authorization epoch while an evidence request is in flight. The stale delegated request releases zero content after retrieval. | Gate B exit |
| AUTH-07 | signing-key rollover | New and bounded-old verification keys overlap safely, old keys retire on schedule, durable replay state survives restart, and emergency revocation denies old and new sessions. | Gate B exit |
| AUTH-08 | sender-constrained token | DPoP method/URI, nonce, issuance-time, key-thumbprint, and replay mismatches fail closed; mTLS clients fail when the presented certificate does not match the token `cnf` binding. No flow downgrades to bearer-only access. | Gate B exit |

## Capacity, Readiness, And Failure

| ID | Scenario | Expected future proof | Gate |
| --- | --- | --- | --- |
| OPS-01 | concurrent clients | Hermes, Codex, and Claude issue simultaneous synthetic searches without starvation, cross-scope leakage, or unbounded process and connection growth. | Gate B exit |
| OPS-02 | bounded overload | Overload produces controlled retryable busy or rate-limit responses within deadlines rather than cascading failures. | Gate B exit |
| OPS-03 | cold model | Evidence readiness stays false while the model is cold or being replaced, so evidence tools are not advertised or accepted. Independently healthy memory-only trusted search remains available. | Gate B exit |
| OPS-04 | provider outage | The client receives a retryable cited-source gap and trace ID, not invented or uncited content. | Gate B exit |
| OPS-05 | audit outage | Reads or mutations requiring durable audit fail closed without releasing protected content. | Gate B exit |
| OPS-06 | cancellation | Client disconnect or cancellation retires request work and does not leak child processes, database sessions, or release authority. | Gate B exit |
| OPS-07 | privacy-safe observability | Metrics identify stage latency, busy state, failures, freshness, and backup age without query or evidence content. | Gate B exit |

## Database And Recovery

| ID | Scenario | Expected future proof | Gate |
| --- | --- | --- | --- |
| DB-01 | conditional exact versions | Memory-only mode runs on approved PostgreSQL 16 without a provider or model service. Evidence mode additionally requires approved PostgreSQL 18 and the isolated model service. | Gate B exit |
| DB-02 | identity separation | Runtime, migrator, backup, and restore identities are distinct and least privileged for both stores. | Gate B exit |
| DB-03 | combined restore | An isolated combined restore preserves owner, namespace, source version, digest, candidate provenance, trusted-memory status, deletion state, and audit continuity. | Gate B exit |
| DB-04 | deleted evidence resurrection | Restoring an older evidence backup does not make deleted or unauthorized evidence actively retrievable. | Gate B exit |
| DB-05 | cross-store mismatch | Mismatched backup epochs fail readiness and require reconciliation before traffic. | Gate B exit |
| DB-06 | sole grant authority | Provider-local source ACL metadata can remove evidence but cannot grant owner, namespace, capability, classification, or destination access beyond the PostgreSQL 16 policy decision. | Gate B exit |
| DB-07 | recovery objectives | Isolated restore proves PostgreSQL 16 RPO at most five minutes/RTO at most one hour, PostgreSQL 18 RPO at most fifteen minutes/RTO at most four hours, and zero active-policy RPO for revocation/deletion through the synchronous independent journal. Journal outage fails mutation and readiness closed. | Gate B exit |

## Model-Service Identity

| ID | Scenario | Expected future proof | Gate |
| --- | --- | --- | --- |
| MODEL-01 | allowed cross-UID peer | Socket-group membership permits only a connection attempt. The provider validates the actual approved model-service UID and complete instance handshake before sending inference input. | Gate B exit |
| MODEL-02 | denied local peer | Same-host processes outside the approved identity fail peer authorization. | Gate B exit |
| MODEL-03 | credential absence | Model process has no Source Wire verifier, policy database, or evidence database credential. | Gate B exit |
| MODEL-04 | containment | Network, process, memory, core-dump, parent-death, and model-revision controls remain fail closed. | Gate B exit |
| MODEL-05 | stale same-UID process | A stale provider process running under the approved UID but holding an old boot epoch or nonce fails the instance handshake before inference input. | Gate B exit |
| MODEL-06 | stale or impersonated model service | The provider rejects a stale or impersonated same-UID model-service instance whose instance ID, model revision, boot epoch, nonce, or one-use channel binding does not match the supervisor grant. | Gate B exit |

## Approval Gates

| Gate | Approval needed | Evidence required before approval |
| --- | --- | --- |
| Gate A | Architecture definition | Accepted ADR, matrix, contract alignment, synthetic marker check. |
| Gate B entry | Synthetic-only implementation | Reviewed implementation slices, threat model, dependency review, a tests-first plan, a mutation plan, and exact owner approval. |
| Gate B exit | Implementation acceptance | Every Gate B exit scenario passes using synthetic identities and evidence, with no deployment or private data. |
| Gate C | Operated synthetic pilot | Gate B exit evidence plus target-host operation, sustained capacity/readiness observation, restore, rollback, and pilot approval. |
| Gate D | Low-risk data | Approved source inventory, classification, connector lifecycle, deletion SLA, retention, and privacy review. |
| Gate E | Private production | Security review, incident plan, cloud-destination policy, backup/restore drill, SLOs, owner approval. |
| Gate F | Team access | Signed user/workspace/channel identity, offboarding, cross-user isolation, audit, and support policy. |

## Gate A Completion

Gate A is complete only when:

- ADR 0002 is accepted for architecture definition only;
- the hosted runtime threat, API, MCP, database, and deployment planning contracts carry the concrete V1 boundaries;
- `npm run runtime:global-owner-hosted-v1-architecture` passes;
- `npm run runtime:global-owner-hosted-v1-architecture:smoke` proves contradictory authority, missing matrix rows, wrong gate assignments, forbidden paths, and approval drift fail;
- `npm run runtime:global-owner-hosted-v1-architecture:scope` confirms the exact Gate A changed-path allowlist and no runtime or deployment artifact;
- documentation, safety, claims, and repository checks pass;
- independent security, consistency, and verification reviews report no blocker;
- no runtime, database, deployment, connector, credential, private-data, publishing, or production change is included.
