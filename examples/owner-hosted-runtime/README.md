# Owner-Hosted Runtime Skeleton Example

This example runs the public-safe owner-hosted API server skeleton and MCP server skeleton in process against synthetic fixtures.

Use Node.js 22 with npm from the repository root. For complete setup details, read [Quickstart](../../docs/quickstart.md).

It proves:

- API requests route through Source-Wire API policy,
- MCP requests route through the API policy path,
- denied results stay structured,
- source evidence stays separate from trusted memory,
- candidate and source-maintenance paths do not create trusted memory automatically,
- trusted-memory approval stays owner or application controlled.

It does not start a network listener, connect a database, run live connectors, crawl folders, import a vault, deploy services, or use real data.

Run:

```bash
npm run runtime:owner-hosted-smoke
```
