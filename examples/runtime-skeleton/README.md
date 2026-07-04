# Synthetic Runtime Skeleton Example

This example runs the public-safe owner-hosted runtime skeleton smoke.

It proves:

- owner-hosted API policy requests are checked before returning synthetic context,
- MCP adapter requests route through the same API policy path,
- namespace and capability checks can deny unsafe requests,
- trusted-memory promotion is not automatic,
- owner or application-controlled approval is required for trusted-memory promotion.

Run it from the repository root:

Use Node.js 22 with npm. For complete setup details, read [Quickstart](../../docs/quickstart.md).

Install dependencies first:

```bash
npm install
```

```bash
npm run runtime:skeleton-smoke
```

This example is synthetic only. It does not start an API server, start an MCP server, connect a database, import private data, run live connectors, copy AGPLv3 code, copy private implementation code, deploy services, or publish npm.
