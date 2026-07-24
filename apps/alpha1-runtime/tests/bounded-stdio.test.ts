import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import { BoundedStdioInput } from "../src/mcp/bounded-stdio.js";

test("bounded stdio accepts a frame at the exact byte limit", async () => {
  const input = new BoundedStdioInput(8);
  let output = "";
  input.on("data", (chunk: Buffer) => {
    output += chunk.toString("utf8");
  });
  input.end(Buffer.from("1234567\n", "utf8"));
  await once(input, "end");
  assert.equal(output, "1234567\n");
});

test("bounded stdio rejects a frame before forwarding bytes beyond the limit", async () => {
  const input = new BoundedStdioInput(8);
  input.on("data", () => undefined);
  input.write(Buffer.from("12345678", "utf8"));
  const errorPromise = once(input, "error");
  input.write(Buffer.from("9", "utf8"));
  const [error] = await errorPromise;
  assert.equal((error as Error).message, "stdio_frame_too_large");
});
