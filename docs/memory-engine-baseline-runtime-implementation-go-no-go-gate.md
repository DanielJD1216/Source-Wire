# Memory Engine Baseline Runtime Implementation Go/No-Go Gate

Status: Slice 6 local go/no-go gate complete. Runtime implementation remains blocked until exact owner approval.

Date: 2026-07-02

## Scope

This document summarizes the Memory Engine Baseline Audit slices and decides the next recommended path.

It answers whether Source-Wire should proceed toward runtime implementation now, and under what limits.

This is a planning and decision document only.

It does not:

- deploy services,
- publish npm,
- create a GitHub release,
- accept code contributions,
- add real user data,
- add API server runtime,
- add MCP server runtime,
- add database migrations,
- copy memory-engine code,
- add Mission Control UI,
- add live connectors.

## Inputs

- [Memory Engine Baseline Runtime Capability Audit](memory-engine-baseline-runtime-capability-audit.md)
- [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md)
- [Memory Engine Baseline API And MCP Wrapper Boundary](memory-engine-baseline-api-mcp-wrapper-boundary.md)
- [Memory Engine Baseline BYO Self-Hosted Setup Path](memory-engine-baseline-byo-self-hosted-setup-path.md)
- [Memory Engine Baseline Public-Safe Fixtures And Verification Gates](memory-engine-baseline-public-safe-fixtures-and-verification-gates.md)
- [Memory Engine Baseline Audit Diagram Pack](diagrams/memory-engine-baseline-audit/README.md)

## Direct Decision

Go for the next planning-to-implementation unit only if the owner explicitly approves a narrow wrapper path.

No-go for direct runtime merge, copied memory-engine code, production runtime use, managed-hosted operation, or real data.

Recommended next path:

```text
WRAP
```

Plain English:

```text
Use Source-Wire-Memory-Engine as a separate runtime candidate behind a Source-Wire policy wrapper.
Do not merge it.
Do not copy it.
Do not let MCP bypass Source-Wire API policy.
Do not turn source imports into trusted memory automatically.
```

## Baseline Fit Summary

`Source-Wire-Memory-Engine` is a useful runtime reference.

It already has:

- FastAPI memory API,
- MCP endpoint,
- memory save/search/list/delete flows,
- PostgreSQL plus pgvector posture,
- namespace primitive,
- OpenAI-compatible embeddings and chat model use,
- query decomposition and reranking,
- PostgreSQL cache,
- React/Vite memory management UI,
- Docker Compose local path,
- backend and frontend test inventory.

It does not fit Source-Wire as-is.

Main gaps:

- AGPLv3 license boundary,
- no Source-Wire owner auth,
- no harness-token capability model,
- MCP can directly save and delete memory,
- no Source Graph model,
- no Source Connection model,
- no source evidence versus trusted memory boundary,
- no candidate review boundary,
- no `second-brain.v1` response shape,
- no Source-Wire citation/gap/denied-result/audit contract,
- UI is memory management, not nontechnical Mission Control.

Baseline conclusion:

```text
Useful reference runtime, not direct Source-Wire runtime code.
```

## License Path Summary

Source-Wire is Apache-2.0.

`Source-Wire-Memory-Engine` is AGPLv3 with a commercial-license posture.

Default license decision:

```text
Keep Source-Wire Apache-2.0.
Keep Source-Wire-Memory-Engine separate.
Do not copy AGPLv3 code into Source-Wire.
Use the engine as a reference or separate runtime candidate.
Use clean-room Apache-2.0 code for future Source-Wire runtime work unless legal review approves another path.
```

License conclusion:

```text
Wrapper architecture is acceptable as an architecture direction.
It is not legal proof.
Legal review is still needed before bundling, distributing, or managed-hosting any AGPLv3 runtime path.
```

## API And MCP Wrapper Summary

Required runtime shape:

```text
Agent harness
  -> MCP tool
  -> Source-Wire owner-hosted API policy boundary
  -> Source-Wire policy checks
  -> optional separate runtime adapter
  -> Source-Wire-shaped response
```

The API owns:

- owner identity,
- harness token validation,
- capability checks,
- namespace authorization,
- sensitivity filtering,
- source policy,
- trusted-memory policy,
- audit writes,
- response shaping.

MCP owns:

- agent ergonomics,
- explicit tool calls,
- passing caller context,
- preserving citations, gaps, denied counts, and namespace metadata.

MCP must not directly call:

- memory engine save,
- memory engine delete,
- database,
- source filesystem,
- trusted memory promotion,
- cross-namespace search without API policy.

Wrapper conclusion:

```text
MCP is the doorway.
Source-Wire API is the guard.
The memory engine is machinery behind the guard.
```

## BYO Self-Hosted Setup Summary

Source-Wire's public product direction remains BYO owner-hosted.

Adopters bring:

- device or server,
- PostgreSQL-compatible database,
- model/API keys,
- source data,
- MCP-capable agent harnesses,
- owner review time.

Setup paths stay separate:

- local device,
- local network server,
- cloud VM,
- managed database with owner runtime.

Mission Control must eventually make this understandable to nontechnical owners.

Minimum Mission Control needs:

- setup checklist,
- runtime status,
- database status,
- model/key status,
- harness access,
- source health,
- review queue,
- namespaces,
- audit trail,
- safety warnings.

Setup conclusion:

```text
Owner-hosted first.
Source-Wire-managed hosting remains out of scope.
```

## Public-Safe Fixture And Verification Summary

Future runtime work must be proven with synthetic fixtures.

Required fixture categories include:

- owner,
- namespace,
- harness caller,
- source connection,
- source evidence,
- trusted memory,
- candidates,
- approval and rejection,
- denied access,
- gaps and stale evidence,
- MCP calls,
- audit events,
- runtime adapter result.

Fixtures must not include:

- real user data,
- client data,
- private paths,
- tokens,
- account IDs,
- emails,
- domains,
- screenshots,
- production exports.

Minimum verification posture:

- package checks,
- fixture validation,
- schema export proof,
- CLI smoke,
- runtime boundary smoke,
- docs link checks,
- public safety scan,
- public claim-boundary scan,
- README entrypoint smoke,
- diagram render proof when boundaries change.

Fixture conclusion:

```text
Synthetic proof first.
Runtime code second.
```

## Remaining Blockers

Runtime implementation remains blocked by:

- exact owner approval for the next implementation unit,
- legal uncertainty around AGPLv3 runtime integration and distribution,
- no approved runtime PRD for the wrapper implementation,
- no approved database migration scope,
- no approved API server implementation scope,
- no approved MCP server implementation scope,
- no approved Mission Control implementation scope,
- no approved fixture implementation scope for runtime behavior,
- no public contribution acceptance terms for runtime code,
- no decision to use AGPLv3 runtime, commercial license, or clean-room rewrite.

## Next Recommended Path

Choose:

```text
WRAP
```

Meaning:

- keep `Source-Wire-Memory-Engine` separate,
- build a narrow Source-Wire owner-hosted API policy wrapper,
- build MCP tools only as adapters to that API,
- call the separate runtime only through a runtime adapter,
- use synthetic fixtures,
- keep no-auto-promotion,
- keep owner-controlled trusted memory approval,
- keep Source-Wire-managed hosting out of scope.

Do not choose direct `keep separate only` as the next path because it would stall product progress.

Do not choose `rewrite` yet because the wrapper path can prove the policy boundary faster.

Do not choose `defer` unless the owner does not want any runtime work next.

## Exact Owner Approval Needed Before Implementation

Before any runtime implementation starts, owner approval should say:

```text
Approved for a future Source-Wire wrapper runtime implementation unit:
build a narrow owner-hosted API policy wrapper and MCP adapter path around a separate runtime candidate.
Keep Source-Wire-Memory-Engine separate.
Do not copy AGPLv3 code into Source-Wire.
Use synthetic fixtures only.
Do not add real user data.
Do not deploy services.
Do not publish npm.
Do not create a GitHub release.
Do not accept code contributions.
Do not add managed-hosted behavior.
Trusted memory promotion must remain owner or application controlled.
MCP must not bypass Source-Wire API policy.
```

If the owner wants a clean-room runtime instead, approval should explicitly say `rewrite`, not `wrap`.

If the owner wants to use AGPLv3 code inside the Source-Wire repo, approval must wait for legal review.

## Go Conditions

Runtime wrapper implementation may begin later only when all are true:

- owner gives exact implementation approval,
- implementation scope is limited to owner-hosted wrapper behavior,
- Source-Wire-Memory-Engine stays separate,
- no AGPLv3 code is copied into Source-Wire,
- synthetic fixture scope is approved,
- policy wrapper is designed before MCP tools,
- MCP bypass is forbidden,
- no-auto-promotion is preserved,
- public safety and claim-boundary gates are required,
- no deployment or release mutation is included.

## No-Go Conditions

Do not start implementation if any are true:

- owner approval is vague,
- implementation would copy AGPLv3 code into Source-Wire,
- implementation exposes memory-engine MCP tools directly to agents,
- implementation allows agent approval of trusted memory by default,
- implementation requires real user or client data,
- implementation requires production connectors,
- implementation requires deployment,
- implementation implies Source-Wire hosts other people's memory,
- implementation publishes npm or creates a GitHub release,
- implementation accepts public code contributions,
- implementation skips public-safe fixtures,
- implementation skips safety or claim-boundary checks.

## Final Gate Verdict

Current verdict:

```text
CONDITIONAL GO FOR A FUTURE WRAPPER IMPLEMENTATION UNIT.
NO-GO FOR DIRECT RUNTIME MERGE, COPY, DEPLOYMENT, PRODUCTION USE, MANAGED HOSTING, REAL DATA, OR RELEASE MUTATION.
```

Short version:

```text
Proceed later with WRAP, not merge.
```

## Still Blocked

- runtime implementation until exact owner approval,
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
