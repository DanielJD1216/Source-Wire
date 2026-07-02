# Memory Engine Baseline BYO Self-Hosted Setup Path

Status: Slice 4 local setup-path packet complete. Runtime implementation remains blocked.

Date: 2026-07-02

## Scope

This document defines the future setup path for a nontechnical owner who wants to run Source-Wire with their own infrastructure.

It answers:

- what the owner brings,
- what Source-Wire should eventually provide,
- which setup paths are different,
- what Mission Control must make understandable,
- what remains out of scope.

This is a planning and boundary document only.

It does not add:

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

- [Product Direction](product-direction.md)
- [Runtime Boundary](runtime-boundary.md)
- [Owner-Hosted API Plus MCP Boundary Contract](contracts/owner-hosted-api-mcp-boundary-contract.md)
- [Memory Engine Baseline Runtime Capability Audit](memory-engine-baseline-runtime-capability-audit.md)
- [Memory Engine Baseline License Path Decision Packet](memory-engine-baseline-license-path-decision-packet.md)
- [Memory Engine Baseline API And MCP Wrapper Boundary](memory-engine-baseline-api-mcp-wrapper-boundary.md)

## Core Setup Decision

Source-Wire's public product direction is:

```text
The owner runs their own memory system.
The owner brings their own device or server.
The owner brings their own database.
The owner brings their own model/API keys.
The owner connects their own sources.
The owner connects their own agent harnesses.
Source-Wire does not host the owner's memory by default.
```

Plain English:

```text
Source-Wire should become the wiring kit and control surface.
The owner owns the machine, the storage, the keys, and the memory.
```

## Owner-Brings Checklist

A future self-hosted Source-Wire owner should expect to bring:

| Owner brings | Plain English meaning | First setup requirement |
| --- | --- | --- |
| Device or server | Somewhere the Source-Wire runtime can run. | Laptop, desktop, home server, cloud VM, or similar. |
| PostgreSQL-compatible database | The place memories, sources, audit events, and search indexes live. | A reachable Postgres database, later likely with pgvector. |
| Model or API keys | The model access needed for embeddings, reranking, summarizing, and context assembly. | Owner-provided keys or local model config. |
| Source data | The notes, exports, folders, chats, files, or connector payloads the owner wants indexed. | Explicit owner-selected imports or sync connections. |
| Agent harnesses | The apps or coding agents that call Source-Wire through MCP or API. | Claude Code, Codex, local agents, or other MCP-capable tools. |
| Owner review time | Human approval for trusted memory. | Review candidates before they become trusted memory. |

The setup should not assume Source-Wire has access to the owner's whole computer.

The owner should explicitly choose sources.

## Four Setup Paths

These paths should stay separate because their risks are different.

### Path 1: Local Device

Example:

```text
Owner laptop
  -> Source-Wire runtime
  -> local or remote Postgres
  -> local MCP client
```

Best for:

- one person,
- local experimentation,
- private proof,
- low setup cost.

Owner needs:

- a computer that can stay on while agents use memory,
- local runtime process,
- database connection,
- model/API keys,
- MCP client config.

Main tradeoff:

- simplest to understand,
- less reliable if the laptop sleeps, restarts, or changes networks.

Mission Control must show:

- runtime running or stopped,
- database reachable or not,
- connected harnesses,
- last source update,
- failed imports or denied actions.

### Path 2: Local Network Server

Example:

```text
Home or office server
  -> Source-Wire runtime
  -> local network Postgres or managed Postgres
  -> owner devices and agent harnesses
```

Best for:

- one owner with multiple devices,
- small internal team,
- owner who wants memory available while the laptop is off.

Owner needs:

- a machine that stays on,
- local network access rules,
- database connection,
- token management for each harness,
- backup plan.

Main tradeoff:

- more reliable than a laptop,
- networking and security get harder.

Mission Control must show:

- local network access status,
- token list by harness,
- namespace access per harness,
- backup status when implemented,
- audit trail for allowed and denied calls.

### Path 3: Cloud VM

Example:

```text
Owner cloud VM
  -> Source-Wire runtime
  -> owner-managed or managed Postgres
  -> MCP-capable agents over secure connection
```

Best for:

- always-on use,
- cross-device access,
- advanced owners,
- future small business use.

Owner needs:

- cloud account,
- server instance,
- secure domain or tunnel,
- firewall rules,
- database connection,
- secret storage,
- update path,
- backup path.

Main tradeoff:

- most flexible,
- more operational responsibility and possible cloud cost.

Mission Control must show:

- public/private access status,
- active runtime version,
- database health,
- token scope,
- recent denied calls,
- storage growth,
- update warnings.

### Path 4: Managed Database With Owner Runtime

Example:

```text
Owner laptop/server/VM
  -> Source-Wire runtime
  -> Neon, Supabase, RDS, or other PostgreSQL-compatible database
  -> MCP-capable agents
```

Best for:

- owners who do not want to run Postgres themselves,
- people who accept a database-provider account,
- future easier onboarding.

Owner needs:

- database provider account,
- connection string,
- database credentials,
- extension support if vector search needs pgvector,
- backup/export understanding,
- cost awareness.

Main tradeoff:

- easier than self-running Postgres,
- private data sits with the owner's database provider.

Mission Control must show:

- database provider label,
- connection health,
- extension readiness,
- storage and query warning states,
- backup/export guidance when implemented.

## PostgreSQL-Compatible Database Requirements

Plain English:

```text
The database is the memory warehouse.
It stores source records, trusted memories, candidates, citations, namespaces, tokens, and audit events.
```

Future Source-Wire should require a database that can support:

- tables for sources, source segments, edges, memory records, candidates, namespaces, harness tokens, and audits,
- transactions so approvals and audit events succeed or fail together,
- indexes for normal lookup,
- vector search support when semantic retrieval is enabled,
- backups and restore,
- migration history,
- owner-controlled credentials.

PostgreSQL-compatible means:

- standard Postgres behavior is expected,
- managed Postgres providers may work,
- pgvector or equivalent vector support may be required for semantic search,
- exact provider support must be verified during runtime implementation.

Source-Wire should not hide database ownership from the owner.

The owner should always know:

- where the database lives,
- who hosts it,
- which runtime can access it,
- which harnesses can reach memory through the API,
- how to revoke access.

## Owner-Supplied Model And API Key Requirements

Plain English:

```text
Models help turn source text into searchable memory context.
The owner supplies the keys or local model config.
```

Future runtime may need model access for:

- embeddings,
- semantic search,
- query decomposition,
- reranking,
- summarization,
- candidate preparation,
- answer/context assembly.

The setup path should support at least:

- hosted API model keys,
- local model endpoint config,
- separate embedding and reasoning model settings,
- explicit cost warnings,
- key validation without exposing secrets,
- key rotation.

Mission Control should never print raw API keys after save.

It should show:

- model provider label,
- model role: embedding, reranking, summarization, reasoning,
- health check result,
- last failure,
- missing-key warning.

## Source Connection Expectations

Sources are not trusted memory by default.

Future setup should treat sources as evidence that can be searched, cited, and used to prepare candidates.

Owner-selected source paths may include:

- Markdown vaults,
- chat exports,
- project folders,
- handoff files,
- document exports,
- connector payloads,
- custom source adapters.

The setup path should require explicit source choice.

It should not crawl the whole device by default.

For every source, Mission Control should eventually show:

- source name,
- source type,
- location label safe for the owner,
- sensitivity label,
- namespace,
- last synced time,
- changed/stale/failed state,
- skipped files or unsupported formats,
- whether candidate preparation is enabled,
- `noAutoPromotion` status.

## MCP Harness Connection Expectations

MCP is how agent harnesses talk to Source-Wire.

Examples of harnesses:

- Claude Code,
- Codex,
- local agent runners,
- future MCP-capable apps.

The expected path is:

```text
Agent harness
  -> MCP tool
  -> Source-Wire owner-hosted API
  -> policy check
  -> runtime adapter if needed
  -> cited response
```

The setup path should help the owner:

- create a token per harness,
- name the harness in plain English,
- choose allowed namespaces,
- choose allowed capabilities,
- copy the MCP config,
- test the connection,
- revoke the harness later.

Default agent harness tokens should allow:

- search trusted memory,
- search source evidence,
- assemble context,
- maintain explicitly approved sources if enabled.

Default agent harness tokens should not allow:

- approve trusted memory,
- delete trusted memory,
- bypass namespace policy,
- read all namespaces by accident,
- access raw database credentials.

## Minimum Nontechnical Mission Control Needs

Mission Control should be the owner-facing control room.

It should avoid developer language where possible.

Minimum future screens:

| Screen | Owner question it answers |
| --- | --- |
| Setup checklist | What is still missing before memory works? |
| Runtime status | Is my memory system running? |
| Database status | Is my memory warehouse connected and healthy? |
| Model/key status | Are the model pieces connected without exposing secrets? |
| Harnesses | Which agents can call my memory? |
| Sources | What have I connected, and is it fresh? |
| Review queue | What should become trusted memory? |
| Namespaces | Which projects or clients are separated? |
| Audit trail | Who or what touched memory recently? |
| Safety warnings | What is blocked, stale, denied, or risky? |

Minimum future owner actions:

- start setup,
- connect database,
- test database,
- add model key or local model endpoint,
- test model role,
- add source,
- sync source,
- review skipped/stale/failed source items,
- create harness token,
- test MCP connection,
- revoke harness token,
- approve memory candidate,
- reject memory candidate,
- inspect audit event,
- export setup status.

The UI should say what happened and what to do next.

It should not require the owner to understand:

- pgvector internals,
- SQL migrations,
- MCP protocol details,
- embedding math,
- reranker architecture,
- AGPLv3 boundary mechanics,
- raw JSON payloads.

## Nontechnical Setup Flow

Future ideal flow:

```text
1. Choose setup path.
2. Connect database.
3. Add model/API keys or local model endpoint.
4. Create first namespace.
5. Add first source.
6. Run first source sync.
7. Create first harness token.
8. Connect one MCP-capable agent.
9. Run a memory search smoke test.
10. Review first candidate.
11. Approve or reject candidate.
12. Read setup health summary.
```

This flow should be restartable.

If setup fails at any step, Mission Control should show:

- what failed,
- why it likely failed,
- what data was affected,
- whether anything private was sent,
- the next physical action.

## Cost Boundary

Source-Wire-managed hosting remains out of scope.

Owners may still have costs from their own choices:

- cloud VM,
- managed database,
- hosted model APIs,
- storage,
- backups,
- domains,
- tunnels,
- monitoring.

Source-Wire docs should not imply the system is cost-free in every setup.

The accurate message is:

```text
Source-Wire should not charge you for hosted memory by default.
Your own infrastructure providers may charge you.
```

## Source-Wire-Managed Hosting Boundary

Source-Wire-managed hosting is not part of this path.

Out of scope:

- Jinni hosting other people's memory,
- Source-Wire cloud accounts for users,
- multi-tenant managed memory service,
- shared production database,
- central hosted MCP endpoint,
- support obligations for other owners' servers.

Future managed-hosted work would need a separate PRD, threat model, cost model, privacy model, legal review, support model, and explicit owner approval.

## Slice 4 Decision

Proceed to Slice 5 after this packet.

Default setup posture:

```text
BYO owner-hosted first.
Local device, local network server, cloud VM, and managed database paths stay separate.
Mission Control should make setup understandable to nontechnical owners.
Source-Wire-managed hosting remains out of scope.
```

Runtime implementation remains blocked.

## Still Blocked

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
