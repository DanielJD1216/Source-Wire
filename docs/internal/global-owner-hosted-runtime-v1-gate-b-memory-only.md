# Global Owner-Hosted Runtime V1 Gate B-M Memory-Only Slice

Use Node.js 22 with npm for local checks.

Status: Implemented for review as the first synthetic Gate B-M vertical slice

Date: 2026-08-01

Issue: `#288`

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

The implementation does not compose or invoke a KnowledgeProvider.

## Deterministic Proof

Run:

```bash
npm run runtime:gate-b-memory-only
npm run runtime:gate-b-memory-only:scope
npm run runtime:gate-b-memory-only:scope:smoke
npm run alpha1:test
```

The focused suite covers valid DPoP and mTLS synthetic calls, replay,
principal/adapter/client/session/audience/route substitution, stale authorization
and deletion epochs, revoked credential/session state, invalid clocks, payload
authority injection, namespace and capability denial, credential lifetime,
five-hop audience completeness, sender-proof precedence, the real default
protected-read receipt path, authorization-before-retrieval, and memory-only
tool discovery.

## Synthetic Limitations

This slice validates deterministic synthetic proof metadata. It does not yet
perform:

- signed OAuth/OIDC token or JOSE verification;
- cryptographic DPoP JWT verification;
- TLS or mTLS handshake and certificate-chain validation;
- durable PostgreSQL replay or session-revocation coordination;
- access-plane reauthorization after query and immediately before release;
- principal/client/session/destination/audience fields in the durable protected
  read receipt;
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

1. Cryptographically signed synthetic access and DPoP tokens with exact issuer,
   resource audience, client, subject, session, time, token ID, and `cnf`
   validation.
2. Disposable PostgreSQL 16 replay/session state and release-time
   reauthorization.
3. Expanded protected-read receipt binding and revocation-race proof.
4. Structured compact memory responses, gaps, truncation, and extraction
   budgets.
5. In-process Streamable HTTP MCP conformance without deployment.
6. PostgreSQL role, custody, journal, backup, and restore proofs.

Gate C operated testing remains a separate approval after Gate B-M exit.
