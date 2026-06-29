/**
 * Source-Wire public contract package.
 *
 * Unit 23 intentionally exposes package shape before runtime behavior.
 * Runtime services, database migrations, live connectors, and memory-engine
 * integration are out of scope until a later public PRD opens them.
 */
export const SOURCE_WIRE_PACKAGE_VERSION = "0.0.0";

export type SourceWireRuntimeBoundary = {
  packageKind: "contract_skeleton";
  runtimeIncluded: false;
  databaseIncluded: false;
  memoryEngineIncluded: false;
  missionControlIncluded: false;
};

export const SOURCE_WIRE_RUNTIME_BOUNDARY: SourceWireRuntimeBoundary = {
  packageKind: "contract_skeleton",
  runtimeIncluded: false,
  databaseIncluded: false,
  memoryEngineIncluded: false,
  missionControlIncluded: false
};

export type * from "./contracts/fixtures.js";
export type * from "./contracts/mcp-tools.js";
export type * from "./contracts/second-brain.js";
export type * from "./contracts/source-connection.js";
export type * from "./contracts/source-graph.js";
export * from "./schemas.js";
