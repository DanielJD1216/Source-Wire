import assert from "node:assert/strict";
import test from "node:test";

import {
  assertToolAllowed,
  createProfileRestrictedMcpServer,
  readToolProfile
} from "../src/mcp/tool-profile.js";

test("resolves only the exact MCP tool profiles", () => {
  assert.equal(readToolProfile(undefined), "provider");
  assert.equal(readToolProfile("provider"), "provider");
  assert.equal(readToolProfile("memory_only"), "memory_only");
  assert.equal(readToolProfile("gate_b_memory_only"), "gate_b_memory_only");
  assert.throws(
    () => readToolProfile("memory-only"),
    /invalid_mcp_tool_profile/u
  );
});

test("Gate B memory-only runtime permits only trusted-memory registration", () => {
  assert.doesNotThrow(() =>
    assertToolAllowed("gate_b_memory_only", "search_trusted_memory")
  );
  for (const forbidden of [
    "get_source_evidence",
    "search_source_evidence",
    "propose_memory_candidate",
    "unknown_tool"
  ]) {
    assert.throws(
      () => assertToolAllowed("gate_b_memory_only", forbidden),
      /mcp_tool_not_allowed_for_profile/u
    );
  }
});

test("existing local memory-only runtime preserves proposal and search", () => {
  for (const allowed of [
    "propose_memory_candidate",
    "search_trusted_memory"
  ]) {
    assert.doesNotThrow(() => assertToolAllowed("memory_only", allowed));
  }
  for (const forbidden of [
    "get_source_evidence",
    "search_source_evidence",
    "unknown_tool"
  ]) {
    assert.throws(
      () => assertToolAllowed("memory_only", forbidden),
      /mcp_tool_not_allowed_for_profile/u
    );
  }
});

test("provider runtime permits exactly the existing four tools", () => {
  for (const allowed of [
    "get_source_evidence",
    "search_source_evidence",
    "propose_memory_candidate",
    "search_trusted_memory"
  ]) {
    assert.doesNotThrow(() => assertToolAllowed("provider", allowed));
  }
  assert.throws(
    () => assertToolAllowed("provider", "unknown_tool"),
    /mcp_tool_not_allowed_for_profile/u
  );
});

test("profile-restricted server hides the raw MCP instance and prototype", () => {
  const server = createProfileRestrictedMcpServer(
    { name: "source-wire-profile-test", version: "0.0.0" },
    { capabilities: { tools: {} } },
    "gate_b_memory_only"
  );
  assert.equal(Object.isFrozen(server), true);
  assert.equal(Object.getPrototypeOf(server), null);
  assert.equal(
    Reflect.get(Object.getPrototypeOf(server) ?? {}, "registerTool"),
    undefined
  );
  const register = server["registerTool"] as unknown as (
    name: string
  ) => unknown;
  assert.throws(
    () => register("get_source_evidence"),
    /mcp_tool_not_allowed_for_profile/u
  );
  assert.equal(
    Reflect.set(server, "registerTool", () => undefined),
    false
  );
});
