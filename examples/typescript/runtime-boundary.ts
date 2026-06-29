import {
  SOURCE_WIRE_PACKAGE_VERSION,
  SOURCE_WIRE_RUNTIME_BOUNDARY
} from "@source-wire/contracts";

import type { SourceWireRuntimeBoundary } from "@source-wire/contracts";

export const runtimeBoundary: SourceWireRuntimeBoundary = SOURCE_WIRE_RUNTIME_BOUNDARY;

export const packageSummary = {
  version: SOURCE_WIRE_PACKAGE_VERSION,
  packageKind: runtimeBoundary.packageKind,
  contractsOnly: runtimeBoundary.runtimeIncluded === false,
  hasDatabaseRuntime: runtimeBoundary.databaseIncluded,
  hasMemoryEngineRuntime: runtimeBoundary.memoryEngineIncluded,
  hasMissionControlRuntime: runtimeBoundary.missionControlIncluded
};
