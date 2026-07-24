import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverEntry = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/mcp/server.js"
);

test("real MCP client discovers exactly the candidate proposal tool", async () => {
  const client = new Client(
    { name: "source-wire-alpha1-test", version: "0.0.0" },
    { capabilities: {} }
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    env: {
      PATH: process.env.PATH ?? "",
      SOURCE_WIRE_API_URL: "http://127.0.0.1:4318",
      SOURCE_WIRE_MCP_TOKEN: "synthetic-harness-token"
    },
    stderr: "pipe"
  });
  try {
    await client.connect(transport);
    const result = await client.listTools();
    assert.deepEqual(
      result.tools.map((tool) => tool.name),
      ["propose_memory_candidate"]
    );
  } finally {
    await client.close();
  }
});
