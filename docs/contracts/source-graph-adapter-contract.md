# Source Graph Adapter Contract

## Purpose

The Source Graph Adapter Contract defines how any source system becomes a canonical graph of source evidence.

Examples of source systems:

- Markdown or Obsidian-style notes.
- Chat exports.
- Meeting notes.
- Documentation folders.
- Future connector exports.

The adapter does not create trusted memory by itself. It preserves source structure so an agent can cite, search, inspect, and prepare review candidates.

## Core Objects

### Source Collection

A Source Collection is a group of imported material from one source class.

Example:

```json
{
  "sourceClass": "markdown_vault",
  "collectionId": "atlas-demo-vault",
  "title": "Atlas Demo Workspace Vault"
}
```

### Source Item

A Source Item is one source-level object, such as one note, one chat thread, one document, or one page.

Required fields:

- stable source item ID,
- title,
- source class,
- source collection ID,
- sensitivity or visibility state,
- freshness state,
- source metadata.

### Source Segment

A Source Segment is a citeable part of a Source Item.

Examples:

- Markdown heading section.
- Chat message.
- Document paragraph.
- Meeting-note decision.

Segments make retrieval citeable without forcing the whole file into context.

### Source Edge

A Source Edge records a relationship between source objects.

Examples:

- note links to note,
- heading belongs to note,
- tag belongs to note,
- chat message belongs to thread,
- source item supersedes older item,
- source item is stale.

## Adapter Output Rules

An adapter should output:

- source collections,
- source items,
- source segments,
- source edges,
- import findings,
- skipped file reasons,
- stale or changed states,
- enough metadata to cite the original source safely.

## Trust Boundary

Source Graph output is source evidence only.

It should not automatically create trusted facts, decisions, rules, or personal memory.

Trusted memory should require a separate review or approval path.

## Synthetic Fixture

See:

```text
examples/fixtures/markdown-vault/
```

The fixture exercises folders, frontmatter, aliases, tags, headings, wikilinks, and note-to-note relationships.
