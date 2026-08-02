# Global Owner-Hosted Runtime V1 Gate B-M Memory-Only Slice

Use Node.js 22 with npm for local checks.

Status: Synthetic process-local and durable PostgreSQL slices merged; offline
signed-token and DPoP verification slice implemented for review

Date: 2026-08-02

Issues: `#288`, `#290`, `#292`

Parent architecture: ADR 0002 and issue `#286`

## Approval Boundary

Daniel approved synthetic-only implementation of the memory-only slice after
Gate A merged. Deployment, private data, evidence mode, live connectors, and
production activation remain unapproved.

This implementation is not full Gate B exit. The Gate A acceptance matrix also
contains evidence, PostgreSQL 18, model isolation, citation, recovery, and later
operation scenarios that this memory-only slice intentionally does not satisfy.

## Implemented Vertical Slice

The local-runtime source tree now includes:

- `SyntheticMemoryOnlyAccessPlane`, which intersects a synthetic server policy
  snapshot with transport-derived principal, adapter, client, session, credential
  audience, namespace, capability, authorization and deletion epochs,
  destination tuple, complete audience chain, and sender binding;
- DPoP metadata checks for key thumbprint, method, URI, nonce, issuance time,
  and bounded one-process replay ID consumption;
- synthetic mTLS certificate-thumbprint binding;
- exact 15-minute maximum credential lifetime enforcement;
- active credential and session state enforcement;
- rejection of authority-bearing payload fields before retrieval;
- `SyntheticMemoryOnlyRuntime`, which authorizes before invoking the existing
  protected trusted-memory executor;
- internal `gate_b_memory_only` MCP discovery that exposes only
  `search_trusted_memory` while preserving the existing local `memory_only`
  proposal-plus-search contract;
- a frozen null-prototype runtime capability facade that hides the raw MCP
  server and enforces the exact selected-profile registration allowlist;
- preservation of the existing provider and local memory-only discovery
  behavior outside the Gate B profile.
- schema version 7 with EXECUTE-only PostgreSQL functions for durable clients,
  sessions, namespace/capability grants, sender-key-wide duplicate replay
  denial, a 4,096-entry per-session replay bound, and release-time
  authorization locks;
- `PostgresMemoryOnlyAuthorizationAuthority`, which derives the actor and
  immutable release context from one database decision and stores no raw proof
  replay ID, sender thumbprint, or DPoP nonce, bounds pool acquisition and every
  transaction query to at most two seconds, releases clients acquired after the
  deadline, and destroys clients whose transaction state becomes uncertain;
- `DurableMemoryOnlyRuntime`, which keeps authorization before retrieval and
  performs the current session, credential, sender, nonce, method, URI,
  destination, audience, grant, and epoch recheck in the same transaction as
  protected-read receipt consumption;
- a disconnected `verifyOfflineMemoryOnlyRequest` boundary that verifies
  compact Ed25519 access tokens and DPoP proofs offline, uses a bounded injected
  issuer key set with exact `kid` selection, rejects ambiguous JOSE algorithms
  and private sender JWKs, computes the RFC 7638 sender thumbprint, enforces
  exact issuer, audience, principal, client, session, method, URI, nonce, and
  bounded NumericDate claims, and emits only the existing frozen durable
  transport context;
- recursive strict-JSON duplicate-name rejection for every nested JOSE object;
- one generic external `credential_invalid` denial surface without token,
  signature, key, or claim detail.

The implementation does not compose or invoke a KnowledgeProvider.

## Deterministic Proof

Run:

```bash
npm run runtime:gate-b-memory-only
npm run runtime:gate-b-memory-only:scope
npm run runtime:gate-b-memory-only:scope:smoke
npm run alpha1:test
npm run alpha1:conformance:story2
```

The focused suite covers valid signed access-token and DPoP pairs, bad
signatures, unknown keys, unsupported algorithms, token expiry and lifetime,
future and stale proofs, private sender JWKs, sender-confirmation mismatch,
nested duplicate JSON fields, exact request-binding substitutions, generic safe
denials, valid DPoP and mTLS synthetic calls, replay,
principal/adapter/client/session/audience/route substitution, stale authorization
and deletion epochs, revoked credential/session state, invalid clocks, payload
authority injection, namespace and capability denial, credential lifetime,
five-hop audience completeness, sender-proof precedence, durable two-pool
replay races, cross-session sender replay denial, pool teardown and recreation,
capacity exhaustion, saturated-pool and stalled-query deadlines, bounded
transaction cleanup with uncertain-client destruction, committed
credential-revocation races before retrieval, complete initial and release
binding substitutions, durable denial permutations, release-path outage,
post-retrieval committed revocation, unconsumed denied receipts, result clearing,
serialized-buffer zeroing, the real default protected-read receipt path,
authorization-before-retrieval, and memory-only tool discovery.

## Synthetic Limitations

This slice validates deterministic synthetic credentials offline. It does not
yet perform:

- OAuth/OIDC discovery, authorization-code flows, introspection, or remote JWKS
  retrieval and rotation;
- TLS or mTLS handshake and certificate-chain validation;
- reachable transport composition feeding signed input into the durable adapter;
- a dedicated expanded protected-read receipt schema containing every Gate B
  authorization field (the current durable runtime uses a frozen release
  context and atomically rechecks it with the existing receipt consumption);
- principal/client/namespace/destination extraction budgets;
- structured empty-memory gap and truthful truncation output;
- Streamable HTTP MCP or stdio parity testing for the Global V1 handler;
- PostgreSQL 16 role, journal, backup, or restore proofs for Global V1.

Those controls are required before Gate B-M exit can be claimed.

## Explicit Exclusions

This change does not add or authorize:

- `search_source_evidence` or `get_source_evidence` in memory-only discovery;
- evidence mode, PostgreSQL 18, model service, or model IPC;
- candidate proposal, approval, correction, revocation, export, or database
  administration through the memory-only MCP surface;
- a network listener, TLS, proxy, DNS, container, infrastructure, or deployment
  configuration;
- real identities, credentials, certificates, memory, evidence, or private data;
- Slack, Hermes, Codex, Claude, or other live client activation;
- package publication, release, managed hosting, or production activation.

## Next Gate B-M Slices

1. Expanded protected-read receipt columns and response-write integration beyond
   the current deterministic pre-consumption revocation proof.
2. Structured compact memory responses, gaps, truncation, and extraction
   budgets.
3. In-process Streamable HTTP MCP conformance without deployment, including
   bounded static issuer-key lifecycle and signed-request composition.
4. PostgreSQL role, custody, journal, backup, and restore proofs.

Gate C operated testing remains a separate approval after Gate B-M exit.
