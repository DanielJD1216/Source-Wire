# Owner-Hosted API Plus MCP Boundary Contract

Status: contract guidance only. No runtime implementation is included.

## Purpose

This contract defines the boundary for a future Source-Wire owner-hosted API plus MCP runtime.

It describes responsibilities and proof requirements before any public runtime code is added.

Source-Wire does not host user memory.

A future runtime must be deployed and controlled by the memory owner or by an application acting for that owner.

## Boundary Summary

```text
Owner-hosted API
  -> enforces auth, namespace, and policy boundaries
  -> exposes explicit source, memory, and context actions
  -> never implies Source-Wire hosts user memory

MCP runtime
  -> exposes agent-callable tools
  -> calls the owner-hosted API boundary
  -> preserves citations, permissions, and no-auto-promotion
```

The API boundary owns policy enforcement.

The MCP boundary exposes agent ergonomics.

Neither boundary should silently create trusted memory.

## API Responsibilities

A future owner-hosted API may be responsible for:

- authentication and token validation,
- namespace and owner scoping,
- source evidence read/write policies,
- source maintenance request handling,
- context assembly request handling,
- candidate creation for owner review,
- audit-friendly action records,
- cited response payloads.

The API should not:

- host user memory on Source-Wire-controlled infrastructure,
- assume access to the owner's local filesystem,
- crawl arbitrary local paths,
- approve trusted memory automatically,
- expose private implementation details,
- require real data for public examples.

## MCP Responsibilities

A future MCP runtime may be responsible for exposing tools such as:

- search trusted memory,
- search source evidence,
- maintain a source connection,
- assemble project context,
- answer through `/2nd-brain`,
- write or read handoff evidence.

The MCP runtime should:

- require explicit tool calls,
- preserve namespace boundaries,
- return citations where relevant,
- report stale or weak evidence,
- preserve `noAutoPromotion`,
- call the owner-hosted API rather than bypassing policy.

The MCP runtime should not:

- approve its own memory suggestions,
- mutate trusted memory without owner or application approval,
- hide source maintenance side effects,
- bypass permission checks,
- embed private tokens or local paths in public examples.

## Permission Expectations

Future runtime permissions should separate at least these capabilities:

| Capability | Example behavior | Trust level |
| --- | --- | --- |
| Read trusted memory | Search approved memory records. | Read-only trusted context. |
| Read source evidence | Search source-only segments. | Read-only evidence. |
| Import or maintain sources | Submit source payloads or sync results. | Mutates source state. |
| Prepare candidates | Create pending review candidates. | Review queue only. |
| Approve trusted memory | Promote candidate to trusted memory. | Owner or application controlled. |

Agent-callable tools should not receive approval capability by default.

## Namespace Expectations

Every future API or MCP action should carry an owner and namespace boundary.

Expected behavior:

- callers only see namespaces they are allowed to access,
- cross-client evidence is hidden unless explicitly allowed,
- omitted or denied evidence is counted without leaking content,
- citations never bypass namespace policy,
- audit records preserve who called what boundary.

## Source Evidence And Trusted Memory

This boundary must preserve:

```text
Source evidence is not trusted memory.
Trusted memory requires an owner or application approval path.
```

Source evidence may support answers, citations, and candidate suggestions.

Trusted memory must require an explicit approval path.

## Synthetic Proof Requirements

Before Source-Wire adds API or MCP runtime code, a future runtime PRD should include synthetic proof fixtures for:

- authorized read,
- unauthorized read,
- wrong-namespace denial,
- source evidence search with citations,
- source maintenance with `noAutoPromotion`,
- pending candidate creation without trusted memory promotion,
- trusted-memory approval through an owner or application-controlled path,
- audit-friendly result metadata,
- no real paths, tokens, domains, emails, account IDs, client names, or production exports.

These proofs should run without secrets.

Synthetic fixture examples live in:

- [Owner-hosted API plus MCP boundary fixture](../../examples/fixtures/owner-hosted-api-mcp-boundary/README.md)

## Public Example Requirements

Public runtime examples must use:

- synthetic owner IDs,
- synthetic namespace IDs,
- synthetic source IDs,
- synthetic citations,
- synthetic tokens or placeholders,
- fake project and client names,
- local-only examples that do not imply Source-Wire hosts memory.

Public examples must not include:

- real user data,
- real client data,
- real local file paths,
- real tokens,
- private repo history,
- private operational proofs,
- production exports.

## Non-Goals

This contract does not add:

- API server runtime,
- MCP server runtime,
- database migrations,
- PostgreSQL or pgvector setup,
- memory-engine integration,
- live connectors,
- Mission Control UI,
- npm publishing,
- GitHub release publishing,
- deployment,
- real user data,
- trusted Memory Record promotion,
- private implementation code.

## Related Docs

- [MCP Tool Behavior Contract](mcp-tool-behavior-contract.md)
- [Public Runtime Decision](../internal/public-runtime-decision.md)
- [Runtime Boundary](../concepts/runtime-boundary.md)
- [Architecture Map](../concepts/architecture-map.md)
