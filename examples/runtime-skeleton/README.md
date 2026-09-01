# Synthetic Runtime Skeleton Example

This example runs the public-safe owner-hosted runtime skeleton smoke.

It proves:

- owner-hosted API policy requests are checked before returning synthetic context,
- MCP adapter requests route through the same API policy path,
- namespace and capability checks can deny unsafe requests,
- an authenticated owner may submit one exact-key, bounded synthetic `capture_context` envelope,
- Context Inbox state retains owner-scoped provenance, digests, citations, and freshness without retaining the submitted source body,
- capture denials before authorization and owner/namespace state validation return a fresh empty state and never echo supplied or foreign trusted state,
- exact request and source-revision replays are idempotent while conflicting replays fail closed,
- a separate `read_source_evidence` check performs deterministic metadata-token relevance filtering, selects the current retained revision per source record, and releases only bounded captured metadata, citations, and a scoped freshness cutoff,
- trusted-memory promotion is not automatic,
- owner or application-controlled approval is required for trusted-memory promotion.

Run it from the repository root:

Use Node.js 22 with npm. For complete setup details, read [Quickstart](../../docs/getting-started/quickstart.md).

Install dependencies first:

```bash
npm install
```

```bash
npm run runtime:skeleton-smoke
npm run build && node examples/runtime-skeleton/context-inbox-smoke.mjs
```

The Context Inbox smoke uses immutable caller-supplied in-memory state. It creates no pending candidate or trusted memory and does not modify the existing Alpha MCP profiles.

`npm run runtime:skeleton-smoke` also runs the versioned, offline [Context Quality Eval v0](../../docs/reference/context-quality-eval-v0.md) corpus and its isolated mutation self-test. The evaluator asserts exact evidence sets, provenance, freshness, isolation, source-body exclusion, replay behavior, lifecycle separation, and adversarial fail-closed behavior without model calls or network access.

This example is synthetic only. It does not start an API server, start an MCP server, connect a database, retain submitted source bodies, import private data, run live connectors, copy AGPLv3 code, copy private implementation code, deploy services, or publish npm.
