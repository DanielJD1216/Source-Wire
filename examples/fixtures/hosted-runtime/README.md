# Hosted Runtime Fixture Matrix

This folder contains synthetic hosted-runtime fixture data for Source-Wire.

Use Node.js 22 with npm from the repository root. For the complete local setup path, read the [Quickstart](../../../docs/getting-started/quickstart.md).

It is not a database seed, production export, connector dump, screenshot, private proof packet, or owner memory import.

The fixture matrix covers:

- caller identity,
- namespace access,
- source evidence,
- memory candidates,
- trusted memory,
- denied cases,
- audit metadata,
- MCP-through-API policy routing,
- no automatic trusted memory promotion.

Run:

```bash
npm run runtime:fixture-smoke
```
