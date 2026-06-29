# Source Connection Contract

## Purpose

The Source Connection Contract describes an ongoing relationship with an external source.

A Source Connection is not just a one-time import. It records how a source can be synced, searched, refreshed, and reviewed over time.

## Core Fields

A Source Connection should track:

- connection ID,
- source class,
- display name,
- namespace or workspace boundary,
- sync mode,
- path privacy policy,
- latest sync status,
- imported count,
- changed count,
- stale count,
- skipped count,
- error count,
- candidate extraction policy.

## Path Privacy

Public examples must not expose real local paths.

Systems may store source identity internally, but public docs and agent responses should use safe labels, placeholder paths, or source IDs.

## Sync Result

A sync result should tell the owner or agent:

- what was imported,
- what changed,
- what became stale,
- what was skipped,
- what failed,
- whether pending review candidates were created.

## No Automatic Trusted Memory

Syncing a source can prepare evidence and candidates.

It must not automatically create trusted Memory Records.

Trusted memory requires explicit approval by the owner or an approved application workflow.

## Synthetic Fixture

See:

```text
examples/fixtures/chat-export/agent-session.jsonl
```

The fixture uses fictional provider IDs, fictional messages, and source-only evidence.
