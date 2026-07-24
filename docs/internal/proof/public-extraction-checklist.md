# Public Extraction Checklist

Use this checklist before adding public docs, fixtures, or implementation examples to Source-Wire.

## Data Class

- [ ] Every example is fake, synthetic, or explicitly approved redacted data.
- [ ] Synthetic fixtures are preferred over redacted private material.
- [ ] No real personal, business, client, financial, health, family, location, email, chat, browser, or source payload data is included.

## Private Artifact Check

- [ ] No private proof docs are copied.
- [ ] No screenshots or binary proof artifacts are copied.
- [ ] No real Memory Records or Sources are copied.
- [ ] No audit logs, agent runs, retrieval traces, or candidate queues are copied.
- [ ] No database values, dumps, seeds, private migrations, or connection strings are copied.

## Identifier Check

- [ ] No real tokens or API keys.
- [ ] No real local machine paths.
- [ ] No real domains or emails.
- [ ] No account IDs.
- [ ] No client names.
- [ ] No owner-specific project history.

## Architecture Boundary

- [ ] Imported source text remains source evidence, not trusted memory.
- [ ] Trusted memory requires explicit approval.
- [ ] MCP tools preserve namespace boundaries.
- [ ] Source maintenance is explicit, not surprise behavior on normal reads.
- [ ] Stale source evidence is marked.

## Review

- [ ] Run whitespace checks.
- [ ] Run a public-safety scanner or targeted privacy search.
- [ ] Human reviewer approves the exact file list or commit range.
- [ ] Proof records what changed and what stayed excluded.
