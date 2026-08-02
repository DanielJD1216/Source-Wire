import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import ts from "typescript";

const branchName = "feat/gate-b-offline-jose-dpop";
const gateScriptPath =
  "scripts/global-owner-hosted-runtime-v1-gate-b-memory-only.mjs";
const runtimePackagePath = "apps/alpha1-runtime/package.json";
const approvedRootPackageScriptsSha256 =
  "9d0f65210f71886d183d7694f3bfc682fc307fccd0343b950e1c205ea59ec65a";
const approvedRuntimePackageScriptsSha256 =
  "caa37c8a0b7564cc3a84de07ded891c244a4693569123d68b758539e885f7b57";
const mcpDiscoveryTestPath =
  "apps/alpha1-runtime/tests/mcp-discovery.test.ts";
const mcpDiscoveryTestSha256 =
  "07cf0deba2fdbb38e34df5db27595f6addafbafcf0e32bdccace7673cc247882";
const runtimeSourceRoot = "apps/alpha1-runtime/src";
const processCreationSource =
  "apps/alpha1-runtime/src/local-cli/mcp-stdio.ts";
const packageModuleSpecifier =
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:\/[A-Za-z0-9._-]+)*$/u;
const forbiddenProcessCreationModules = new Set([
  "child_process",
  "node:child_process",
  "cluster",
  "node:cluster",
  "worker_threads",
  "node:worker_threads"
]);
const approvedNodeRuntimeModules = new Set([
  "node:crypto",
  "node:fs/promises",
  "node:net",
  "node:path",
  "node:stream",
  "node:url",
  "node:util"
]);
const protectedDurableModules = new Set([
  "apps/alpha1-runtime/src/durable-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/offline-jose-dpop.ts",
  "apps/alpha1-runtime/src/postgres-memory-only-authorization.ts"
]);
const runtimeEntryPaths = new Set([
  "apps/alpha1-runtime/src/app.ts",
  "apps/alpha1-runtime/src/global-memory-access-plane.ts",
  "apps/alpha1-runtime/src/initialize.ts",
  "apps/alpha1-runtime/src/index.ts",
  "apps/alpha1-runtime/src/cli/local.ts",
  "apps/alpha1-runtime/src/cli/operator.ts",
  "apps/alpha1-runtime/src/cli/owner.ts",
  "apps/alpha1-runtime/src/local-cli/runner.ts",
  "apps/alpha1-runtime/src/local-cli/mcp-stdio.ts",
  "apps/alpha1-runtime/src/mcp/server.ts",
  "apps/alpha1-runtime/src/server.ts",
  "apps/alpha1-runtime/src/knowledge-provider/synthetic-provider.ts",
  "apps/alpha1-runtime/src/knowledge-provider/replaceable-synthetic-adapter.ts"
]);
const memoryOnlyImplementationPaths = new Set([
  "apps/alpha1-runtime/src/global-memory-access-plane.ts",
  "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/durable-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/offline-jose-dpop.ts",
  "apps/alpha1-runtime/src/postgres-memory-only-authorization.ts",
  "apps/alpha1-runtime/src/mcp/server.ts",
  "apps/alpha1-runtime/src/mcp/tool-profile.ts"
]);
const gateTriggerPaths = new Set([
  gateScriptPath,
  runtimePackagePath,
  "package.json",
  ".github/workflows/package-checks.yml",
  "apps/alpha1-runtime/conformance/story2.ts",
  "apps/alpha1-runtime/conformance/story4.ts",
  "apps/alpha1-runtime/migrations/0007_gate_b_durable_memory_authorization.sql",
  "apps/alpha1-runtime/src/durable-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/global-memory-access-plane.ts",
  "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/mcp/server.ts",
  "apps/alpha1-runtime/src/mcp/tool-profile.ts",
  "apps/alpha1-runtime/src/migration.ts",
  "apps/alpha1-runtime/src/offline-jose-dpop.ts",
  "apps/alpha1-runtime/src/postgres-memory-only-authorization.ts",
  "apps/alpha1-runtime/src/strict-json.ts",
  "apps/alpha1-runtime/src/trusted-memory-search.ts",
  "apps/alpha1-runtime/tests/global-memory-access-plane.test.ts",
  "apps/alpha1-runtime/tests/offline-jose-dpop.test.ts",
  "apps/alpha1-runtime/tests/postgres-memory-only-authorization.test.ts",
  "apps/alpha1-runtime/tests/mcp-tool-profile.test.ts",
  "apps/alpha1-runtime/tests/schema-compatibility.test.ts",
  "apps/alpha1-runtime/tests/strict-json.test.ts",
  "docs/internal/global-owner-hosted-runtime-v1-gate-b-memory-only.md"
]);
const allowedPaths = new Set([
  ".github/workflows/package-checks.yml",
  "apps/alpha1-runtime/README.md",
  "apps/alpha1-runtime/SECURITY.md",
  "apps/alpha1-runtime/package.json",
  "apps/alpha1-runtime/conformance/story2.ts",
  "apps/alpha1-runtime/conformance/story4.ts",
  "apps/alpha1-runtime/migrations/0007_gate_b_durable_memory_authorization.sql",
  "apps/alpha1-runtime/src/config.ts",
  "apps/alpha1-runtime/src/durable-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/global-memory-access-plane.ts",
  "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/migration.ts",
  "apps/alpha1-runtime/src/offline-jose-dpop.ts",
  "apps/alpha1-runtime/src/postgres-memory-only-authorization.ts",
  "apps/alpha1-runtime/src/strict-json.ts",
  "apps/alpha1-runtime/src/trusted-memory-search.ts",
  "apps/alpha1-runtime/tests/global-memory-access-plane.test.ts",
  "apps/alpha1-runtime/tests/mcp-discovery.test.ts",
  "apps/alpha1-runtime/tests/mcp-tool-profile.test.ts",
  "apps/alpha1-runtime/tests/offline-jose-dpop.test.ts",
  "apps/alpha1-runtime/tests/postgres-memory-only-authorization.test.ts",
  "apps/alpha1-runtime/tests/schema-compatibility.test.ts",
  "apps/alpha1-runtime/tests/strict-json.test.ts",
  "docs/guides/publish-readiness.md",
  "docs/internal/README.md",
  "docs/internal/global-owner-hosted-runtime-v1-gate-b-memory-only.md",
  "docs/reference/ci-checks.md",
  "package.json",
  gateScriptPath,
  "scripts/global-owner-hosted-runtime-v1-architecture.mjs",
  "scripts/owner-open-issues-status.mjs"
]);

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const runtimePackageJson = JSON.parse(await readFile(runtimePackagePath, "utf8"));
const runtimeSources = new Map();
for (const sourcePath of await listTypeScriptSources(runtimeSourceRoot)) {
  runtimeSources.set(sourcePath, await readFile(sourcePath, "utf8"));
}
const mcpDiscoveryTestSource = await readFile(mcpDiscoveryTestPath, "utf8");

if (process.argv.includes("--self-test")) {
  const failures = [];
  const baselineFailures = validateRuntimeSources(runtimeSources);
  if (baselineFailures.length > 0) {
    console.error("failed Gate B-M memory-only mutation smoke");
    console.error("- unmutated runtime baseline must pass before mutation checks");
    for (const failure of baselineFailures) console.error(`- ${failure}`);
    process.exit(1);
  }
  if (validatePaths(["apps/alpha1-runtime/src/global-memory-access-plane.ts"]).length > 0) {
    failures.push("allowed Gate B-M runtime path unexpectedly failed");
  }
  if (validatePaths(["apps/alpha1-runtime/src/knowledge-provider-host.ts"]).length === 0) {
    failures.push("evidence/provider path unexpectedly passed");
  }
  if (validatePaths(["deploy/gate-b-memory-only.yaml"]).length === 0) {
    failures.push("deployment path unexpectedly passed");
  }
  const mutated = new Map(runtimeSources);
  mutated.set(
    "apps/alpha1-runtime/src/global-memory-access-plane.ts",
    `${mutated.get("apps/alpha1-runtime/src/global-memory-access-plane.ts")}\nimport "./knowledge-provider-host.js";\n`
  );
  if (validateRuntimeSources(mutated).length === 0) {
    failures.push("evidence/provider import mutation unexpectedly passed");
  }
  const durableCompositionMutation = new Map(runtimeSources);
  durableCompositionMutation.set(
    "apps/alpha1-runtime/src/mcp/server.ts",
    `${durableCompositionMutation.get("apps/alpha1-runtime/src/mcp/server.ts")}\nimport { DurableMemoryOnlyRuntime } from "../durable-memory-only-runtime.js";\n`
  );
  if (validateRuntimeSources(durableCompositionMutation).length === 0) {
    failures.push("reachable durable-runtime composition mutation unexpectedly passed");
  }
  const disconnectedSourceMutation = new Map(runtimeSources);
  disconnectedSourceMutation.set(
    "apps/alpha1-runtime/src/gate-b-disconnected-helper.ts",
    'export { DurableMemoryOnlyRuntime } from "./durable-memory-only-runtime.js";\n'
  );
  if (validateRuntimeSources(disconnectedSourceMutation).length === 0) {
    failures.push("disconnected durable-runtime source mutation unexpectedly passed");
  }
  for (const path of [
    "apps/alpha1-runtime/src/global-memory-access-plane.ts",
    "apps/alpha1-runtime/src/server.ts"
  ]) {
    const mutation = new Map(runtimeSources);
    mutation.set(
      path,
      `${mutation.get(path)}\nexport { DurableMemoryOnlyRuntime } from "./durable-memory-only-runtime.js";\n`
    );
    if (validateRuntimeSources(mutation).length === 0) {
      failures.push(`durable-runtime composition mutation unexpectedly passed for ${path}`);
    }
  }
  const cliCompositionMutation = new Map(runtimeSources);
  cliCompositionMutation.set(
    "apps/alpha1-runtime/src/cli/operator.ts",
    `${cliCompositionMutation.get("apps/alpha1-runtime/src/cli/operator.ts")}\nimport { DurableMemoryOnlyRuntime } from "../durable-memory-only-runtime.js";\n`
  );
  if (validateRuntimeSources(cliCompositionMutation).length === 0) {
    failures.push("direct CLI durable-runtime mutation unexpectedly passed");
  }
  const intermediaryMutation = new Map(runtimeSources);
  intermediaryMutation.set(
    "apps/alpha1-runtime/src/gate-b-hidden-helper.ts",
    'export { DurableMemoryOnlyRuntime } from "./durable-memory-only-runtime.js";\n'
  );
  intermediaryMutation.set(
    "apps/alpha1-runtime/src/app.ts",
    `${intermediaryMutation.get("apps/alpha1-runtime/src/app.ts")}\nimport "./gate-b-hidden-helper.js";\n`
  );
  if (validateRuntimeSources(intermediaryMutation).length === 0) {
    failures.push("intermediary durable-runtime mutation unexpectedly passed");
  }
  const reexportMutation = new Map(runtimeSources);
  reexportMutation.set(
    "apps/alpha1-runtime/src/gate-b-reexport.ts",
    'export * from "./postgres-memory-only-authorization.js";\n'
  );
  reexportMutation.set(
    "apps/alpha1-runtime/src/server.ts",
    `${reexportMutation.get("apps/alpha1-runtime/src/server.ts")}\nexport * from "./gate-b-reexport.js";\n`
  );
  if (validateRuntimeSources(reexportMutation).length === 0) {
    failures.push("durable-authority re-export mutation unexpectedly passed");
  }
  const dynamicImportMutation = new Map(runtimeSources);
  dynamicImportMutation.set(
    "apps/alpha1-runtime/src/cli/operator.ts",
    `${dynamicImportMutation.get("apps/alpha1-runtime/src/cli/operator.ts")}\nvoid import("../postgres-memory-only-authorization.js");\n`
  );
  if (validateRuntimeSources(dynamicImportMutation).length === 0) {
    failures.push("dynamic durable-authority import mutation unexpectedly passed");
  }
  const evalImportMutation = new Map(runtimeSources);
  evalImportMutation.set(
    "apps/alpha1-runtime/src/app.ts",
    `${evalImportMutation.get("apps/alpha1-runtime/src/app.ts")}\nvoid eval('import("./postgres-memory-only-authorization.js")');\n`
  );
  if (validateRuntimeSources(evalImportMutation).length === 0) {
    failures.push("eval-wrapped durable-authority mutation unexpectedly passed");
  }
  const createRequireMutation = new Map(runtimeSources);
  createRequireMutation.set(
    "apps/alpha1-runtime/src/app.ts",
    `${createRequireMutation.get("apps/alpha1-runtime/src/app.ts")}\nimport { createRequire } from "node:module";\ncreateRequire(import.meta.url)("./postgres-memory-only-authorization.js");\n`
  );
  if (validateRuntimeSources(createRequireMutation).length === 0) {
    failures.push("createRequire durable-authority mutation unexpectedly passed");
  }
  const importEqualsMutation = new Map(runtimeSources);
  importEqualsMutation.set(
    "apps/alpha1-runtime/src/app.ts",
    `${importEqualsMutation.get("apps/alpha1-runtime/src/app.ts")}\nimport hidden = require("./postgres-memory-only-authorization.js");\nvoid hidden;\n`
  );
  if (validateRuntimeSources(importEqualsMutation).length === 0) {
    failures.push("TypeScript import-equals durable-authority mutation unexpectedly passed");
  }
  for (const [label, source] of [
    [
      "aliased Function",
      'const Loader = Function; void Loader(\'return import("./postgres-memory-only-authorization.js")\')();'
    ],
    [
      "computed global eval",
      'void globalThis["ev" + "al"](\'import("./postgres-memory-only-authorization.js")\');'
    ],
    [
      "aliased module createRequire",
      'import moduleApi from "node:module"; const cr = moduleApi["create" + "Require"]; cr(import.meta.url)("./postgres-memory-only-authorization.js");'
    ]
  ]) {
    const mutation = new Map(runtimeSources);
    mutation.set(
      "apps/alpha1-runtime/src/app.ts",
      `${mutation.get("apps/alpha1-runtime/src/app.ts")}\n${source}\n`
    );
    if (validateRuntimeSources(mutation).length === 0) {
      failures.push(`${label} durable-authority mutation unexpectedly passed`);
    }
  }
  const typeOnlyMutation = new Map(runtimeSources);
  typeOnlyMutation.set(
    "apps/alpha1-runtime/src/app.ts",
    `${typeOnlyMutation.get("apps/alpha1-runtime/src/app.ts")}\nimport type { DurableMemoryOnlyRuntime } from "./durable-memory-only-runtime.js";\n`
  );
  if (validateRuntimeSources(typeOnlyMutation).length > 0) {
    failures.push("type-only durable-runtime import unexpectedly failed");
  }
  const unresolvedImportMutation = new Map(runtimeSources);
  unresolvedImportMutation.set(
    "apps/alpha1-runtime/src/app.ts",
    `${unresolvedImportMutation.get("apps/alpha1-runtime/src/app.ts")}\nimport "./missing-local-helper.js";\n`
  );
  if (validateRuntimeSources(unresolvedImportMutation).length === 0) {
    failures.push("unresolved local import mutation unexpectedly passed");
  }
  if (
    selectApplicablePaths(["apps/alpha1-runtime/src/cli/operator.ts"]).length ===
    0
  ) {
    failures.push("runtime source-tree change unexpectedly bypassed Gate B scope");
  }
  const packageExportMutation = structuredClone(runtimePackageJson);
  packageExportMutation.exports["./forbidden-durable-authority"] = {
    import: "./dist/src/postgres-memory-only-authorization.js"
  };
  if (
    validateRuntimePackageEntrypoints(
      packageExportMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("package-export durable-authority mutation unexpectedly passed");
  }
  const packageExportArrayMutation = structuredClone(runtimePackageJson);
  packageExportArrayMutation.exports["./forbidden-durable-array"] = [
    "./dist/src/durable-memory-only-runtime.js"
  ];
  if (
    validateRuntimePackageEntrypoints(
      packageExportArrayMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("array package-export durable-runtime mutation unexpectedly passed");
  }
  const packageLegacyMainMutation = structuredClone(runtimePackageJson);
  delete packageLegacyMainMutation.exports;
  packageLegacyMainMutation.main =
    "./dist/src/postgres-memory-only-authorization.js";
  if (
    validateRuntimePackageEntrypoints(
      packageLegacyMainMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("legacy package main durable-authority mutation unexpectedly passed");
  }
  const packageQuotedScriptMutation = structuredClone(runtimePackageJson);
  packageQuotedScriptMutation.scripts["forbidden:quoted"] =
    'node "./dist/src/postgres-memory-only-authorization.js"';
  if (
    validateRuntimePackageEntrypoints(
      packageQuotedScriptMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("quoted package-script durable-authority mutation unexpectedly passed");
  }
  const packageTokenConcatenationMutation = structuredClone(runtimePackageJson);
  packageTokenConcatenationMutation.scripts["forbidden:token-concatenation"] =
    "node dist/src/postgres-memory-only-'authorization.js'";
  if (
    validateRuntimePackageEntrypoints(
      packageTokenConcatenationMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("token-concatenated runtime package script unexpectedly passed");
  }
  const packageGlobMutation = structuredClone(runtimePackageJson);
  packageGlobMutation.scripts["forbidden:glob"] =
    "node dist/sr?/postgres-memory-only-authorization.js";
  if (
    validateRuntimePackageEntrypoints(packageGlobMutation, runtimeSources)
      .length === 0
  ) {
    failures.push("glob-expanded runtime package script unexpectedly passed");
  }
  for (const command of [
    "eval 'node dist/sr?/postgres-memory-only-authorization.js'",
    "sh -c 'node dist/sr?/postgres-memory-only-authorization.js'"
  ]) {
    const mutation = structuredClone(runtimePackageJson);
    mutation.scripts["forbidden:shell-reparse"] = command;
    if (validateRuntimePackageEntrypoints(mutation, runtimeSources).length === 0) {
      failures.push(`reparsed runtime package script unexpectedly passed: ${command}`);
    }
  }
  const packageOptionScriptMutation = structuredClone(runtimePackageJson);
  packageOptionScriptMutation.scripts["forbidden:node-options"] =
    "node --require ./hook.cjs dist/src/postgres-memory-only-authorization.js&&true";
  if (
    validateRuntimePackageEntrypoints(
      packageOptionScriptMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("node-option package-script durable-authority mutation unexpectedly passed");
  }
  const packageDataLoaderMutation = structuredClone(runtimePackageJson);
  packageDataLoaderMutation.scripts["forbidden:data-loader"] =
    'node --import "data:text/javascript,export default 1" dist/src/server.js';
  if (
    validateRuntimePackageEntrypoints(
      packageDataLoaderMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("Node data-loader package-script mutation unexpectedly passed");
  }
  const packageImportsMutation = structuredClone(runtimePackageJson);
  packageImportsMutation.imports = {
    "#forbidden-durable-authority":
      "./dist/src/postgres-memory-only-authorization.js"
  };
  if (
    validateRuntimePackageEntrypoints(
      packageImportsMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("package imports durable-authority mutation unexpectedly passed");
  }
  const rootPackageScriptMutation = structuredClone(packageJson);
  rootPackageScriptMutation.scripts["forbidden:runtime-root"] =
    'node "./apps/alpha1-runtime/dist/src/postgres-memory-only-authorization.js"';
  if (
    validateRootRuntimeEntrypoints(rootPackageScriptMutation, runtimeSources)
      .length === 0
  ) {
    failures.push("root package-script durable-authority mutation unexpectedly passed");
  }
  const rootTokenConcatenationMutation = structuredClone(packageJson);
  rootTokenConcatenationMutation.scripts["forbidden:token-concatenation"] =
    "node apps/alpha1-runtime/dist/src/durable-memory-only-'runtime.js'";
  if (
    validateRootRuntimeEntrypoints(
      rootTokenConcatenationMutation,
      runtimeSources
    ).length === 0
  ) {
    failures.push("token-concatenated root package script unexpectedly passed");
  }
  const rootGlobMutation = structuredClone(packageJson);
  rootGlobMutation.scripts["forbidden:glob"] =
    "node apps/alpha1-runtime/dist/sr?/postgres-memory-only-authorization.js";
  if (
    validateRootRuntimeEntrypoints(rootGlobMutation, runtimeSources).length === 0
  ) {
    failures.push("glob-expanded root package script unexpectedly passed");
  }
  const rootEvalGlobMutation = structuredClone(packageJson);
  rootEvalGlobMutation.scripts["forbidden:eval-glob"] =
    "eval 'node a?ps/alpha1-runtime/dist/src/postgres-memory-only-authorization.js'";
  if (
    validateRootRuntimeEntrypoints(rootEvalGlobMutation, runtimeSources).length === 0
  ) {
    failures.push("reparsed root package script unexpectedly passed");
  }
  for (const command of [
    "cd apps/alpha1-runtime && node dist/src/postgres-memory-only-authorization.js",
    "cd 'apps/alpha1-runtime' && node dist/src/postgres-memory-only-authorization.js",
    'R=apps/alpha1-runtime; node "$R/dist/src/postgres-memory-only-authorization.js"',
    'node -e \'import("./apps/alpha1-runtime/dist/src/postgres-memory-only-authorization.js")\'',
    "n'o'de --import 'data:text/javascript,export default 1' apps/alpha1-runtime/dist/src/server.js",
    "node apps/alpha1-runtime/dist/src/postgres-memory-only-\\\nauthorization.js"
  ]) {
    const mutation = structuredClone(packageJson);
    mutation.scripts["forbidden:runtime-root-indirect"] = command;
    if (validateRootRuntimeEntrypoints(mutation, runtimeSources).length === 0) {
      failures.push(`indirect root runtime script unexpectedly passed: ${command}`);
    }
  }
  const directBuiltinLoaderMutation = new Map(runtimeSources);
  directBuiltinLoaderMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `${directBuiltinLoaderMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nconst loaderModule = process.getBuiltinModule("node:module");\nloaderModule["create" + "Require"](import.meta.url)("./durable-memory-only-runtime.js");\n`
  );
  if (validateRuntimeSources(directBuiltinLoaderMutation).length === 0) {
    failures.push("process.getBuiltinModule durable-authority mutation unexpectedly passed");
  }
  const computedBuiltinLoaderMutation = new Map(runtimeSources);
  computedBuiltinLoaderMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `${computedBuiltinLoaderMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nprocess["get" + "BuiltinModule"]("node:module");\n`
  );
  if (validateRuntimeSources(computedBuiltinLoaderMutation).length === 0) {
    failures.push("computed getBuiltinModule mutation unexpectedly passed");
  }
  const wrappedLoaderMutation = new Map(runtimeSources);
  wrappedLoaderMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `${wrappedLoaderMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nconst wrappedLoaderModule = (process as any)[("get" + "BuiltinModule")]("node:module");\n(wrappedLoaderModule as any)[("create" + "Require")](import.meta.url)("./durable-memory-only-runtime.js");\n`
  );
  if (validateRuntimeSources(wrappedLoaderMutation).length === 0) {
    failures.push("wrapped computed loader mutation unexpectedly passed");
  }
  const destructuredLoaderMutation = new Map(runtimeSources);
  destructuredLoaderMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `${destructuredLoaderMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nconst { [("get" + "BuiltinModule")]: loadBuiltinModule } = process as any;\nvoid loadBuiltinModule;\n`
  );
  if (validateRuntimeSources(destructuredLoaderMutation).length === 0) {
    failures.push("computed destructured loader mutation unexpectedly passed");
  }
  const reflectiveLoaderMutation = new Map(runtimeSources);
  reflectiveLoaderMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `${reflectiveLoaderMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nconst reflectiveBuiltinLoader = Reflect.get(process, "get" + "BuiltinModule");\nvoid reflectiveBuiltinLoader;\n`
  );
  if (validateRuntimeSources(reflectiveLoaderMutation).length === 0) {
    failures.push("reflective loader mutation unexpectedly passed");
  }
  const constructorLoaderMutation = new Map(runtimeSources);
  constructorLoaderMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `${constructorLoaderMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nconst constructorLoader = Buffer.constructor as unknown as (body: string) => () => Promise<unknown>;\nvoid constructorLoader('return import("./postgres-memory-only-authorization.js")')();\n`
  );
  if (validateRuntimeSources(constructorLoaderMutation).length === 0) {
    failures.push("constructor runtime-loader mutation unexpectedly passed");
  }
  for (const [label, expression] of [
    ["computed constructor", 'Buffer["con" + "structor"]'],
    ["reflective constructor", 'Reflect.get(Buffer, "constructor")'],
    [
      "prototype constructor",
      "Object.getPrototypeOf(Buffer).constructor"
    ],
    [
      "descriptor prototype constructor",
      'Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Buffer), "con" + "structor")?.value'
    ]
  ]) {
    const mutation = new Map(runtimeSources);
    mutation.set(
      "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
      `${mutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nconst dynamicConstructor = ${expression};\nvoid dynamicConstructor;\n`
    );
    if (validateRuntimeSources(mutation).length === 0) {
      failures.push(`${label} runtime-loader mutation unexpectedly passed`);
    }
  }
  const processAliasMutation = new Map(runtimeSources);
  processAliasMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `${processAliasMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nconst processAlias = process;\nvoid processAlias;\n`
  );
  if (validateRuntimeSources(processAliasMutation).length === 0) {
    failures.push("process capability alias mutation unexpectedly passed");
  }
  const processImportMutation = new Map(runtimeSources);
  processImportMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `import processCapability from "node:process";\n${processImportMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nvoid processCapability;\n`
  );
  if (validateRuntimeSources(processImportMutation).length === 0) {
    failures.push("node:process import mutation unexpectedly passed");
  }
  const dataUrlImportMutation = new Map(runtimeSources);
  dataUrlImportMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `${dataUrlImportMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nvoid import("data:text/javascript,export default 1");\n`
  );
  if (validateRuntimeSources(dataUrlImportMutation).length === 0) {
    failures.push("data-URL dynamic-import mutation unexpectedly passed");
  }
  for (const [label, specifier] of [
    ["data URL", "data:text/javascript,export default 1"],
    ["file URL", "file:///tmp/postgres-memory-only-authorization.js"],
    ["absolute path", "/tmp/postgres-memory-only-authorization.js"]
  ]) {
    const mutation = new Map(runtimeSources);
    mutation.set(
      "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
      `import "${specifier}";\n${mutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}`
    );
    if (validateRuntimeSources(mutation).length === 0) {
      failures.push(`static ${label} import mutation unexpectedly passed`);
    }
  }
  const childProcessImportMutation = new Map(runtimeSources);
  childProcessImportMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `import { spawn } from "node:child_process";\n${childProcessImportMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nvoid spawn;\n`
  );
  if (validateRuntimeSources(childProcessImportMutation).length === 0) {
    failures.push("unauthorized child-process import mutation unexpectedly passed");
  }
  const workerImportMutation = new Map(runtimeSources);
  workerImportMutation.set(
    "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
    `import { Worker } from "node:worker_threads";\n${workerImportMutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nvoid Worker;\n`
  );
  if (validateRuntimeSources(workerImportMutation).length === 0) {
    failures.push("worker-thread import mutation unexpectedly passed");
  }
  for (const specifier of ["node:inspector", "inspector"]) {
    const mutation = new Map(runtimeSources);
    mutation.set(
      "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
      `import * as inspectorCapability from "${specifier}";\n${mutation.get("apps/alpha1-runtime/src/global-memory-only-runtime.ts")}\nvoid inspectorCapability;\n`
    );
    if (validateRuntimeSources(mutation).length === 0) {
      failures.push(`unapproved Node capability mutation unexpectedly passed: ${specifier}`);
    }
  }
  const childEntrypointMutation = new Map(runtimeSources);
  childEntrypointMutation.set(
    processCreationSource,
    childEntrypointMutation
      .get(processCreationSource)
      .replace(
        'new URL("../server.js", import.meta.url)',
        'new URL("../postgres-memory-only-authorization.js", import.meta.url)'
      )
  );
  if (validateRuntimeSources(childEntrypointMutation).length === 0) {
    failures.push("protected child entrypoint mutation unexpectedly passed");
  }
  const spawnAliasMutation = new Map(runtimeSources);
  spawnAliasMutation.set(
    processCreationSource,
    `${spawnAliasMutation.get(processCreationSource)}\nconst spawnAlias = spawn;\nvoid spawnAlias;\n`
  );
  if (validateRuntimeSources(spawnAliasMutation).length === 0) {
    failures.push("spawn alias mutation unexpectedly passed");
  }
  const childLoaderEnvironmentMutation = new Map(runtimeSources);
  childLoaderEnvironmentMutation.set(
    processCreationSource,
    `${childLoaderEnvironmentMutation.get(processCreationSource)}\nconst childLoaderEnvironment = "NODE_OPTIONS";\nvoid childLoaderEnvironment;\n`
  );
  if (validateRuntimeSources(childLoaderEnvironmentMutation).length === 0) {
    failures.push("child loader environment mutation unexpectedly passed");
  }
  const mcpMutation = new Map(runtimeSources);
  mcpMutation.set(
    "apps/alpha1-runtime/src/mcp/server.ts",
    mcpMutation
      .get("apps/alpha1-runtime/src/mcp/server.ts")
      .replace(
        'if (toolProfile === "provider") {',
        'if (toolProfile === "provider") {}\n\n  if (true) {'
      )
  );
  if (validateRuntimeSources(mcpMutation).length === 0) {
    failures.push("unconditional MCP evidence-tool mutation unexpectedly passed");
  }
  const proposalNarrowingMutation = new Map(runtimeSources);
  proposalNarrowingMutation.set(
    "apps/alpha1-runtime/src/mcp/server.ts",
    proposalNarrowingMutation
      .get("apps/alpha1-runtime/src/mcp/server.ts")
      .replace(
        'if (toolProfile !== "gate_b_memory_only") {',
        'if (toolProfile === "provider") {'
      )
  );
  if (validateRuntimeSources(proposalNarrowingMutation).length === 0) {
    failures.push("provider-only MCP proposal mutation unexpectedly passed");
  }
  const bracketMutation = new Map(runtimeSources);
  bracketMutation.set(
    "apps/alpha1-runtime/src/mcp/server.ts",
    `${bracketMutation.get("apps/alpha1-runtime/src/mcp/server.ts")}\nserver["registerTool"]("get_source_evidence", {}, async () => ({}));\n`
  );
  if (validateRuntimeSources(bracketMutation).length === 0) {
    failures.push("bracket MCP evidence-tool mutation unexpectedly passed");
  }
  const prototypeMutation = new Map(runtimeSources);
  prototypeMutation.set(
    "apps/alpha1-runtime/src/mcp/server.ts",
    `${prototypeMutation.get("apps/alpha1-runtime/src/mcp/server.ts")}\nReflect.get(Object.getPrototypeOf(server), "registerTool");\n`
  );
  if (validateRuntimeSources(prototypeMutation).length === 0) {
    failures.push("MCP prototype-reflection mutation unexpectedly passed");
  }
  const profileMutation = new Map(runtimeSources);
  profileMutation.set(
    "apps/alpha1-runtime/src/mcp/tool-profile.ts",
    profileMutation
      .get("apps/alpha1-runtime/src/mcp/tool-profile.ts")
      .replace(
        'gate_b_memory_only: Object.freeze(["search_trusted_memory"])',
        'gate_b_memory_only: Object.freeze(["get_source_evidence", "search_trusted_memory"])'
      )
  );
  if (validateRuntimeSources(profileMutation).length === 0) {
    failures.push("memory-only runtime allowlist expansion unexpectedly passed");
  }
  if (
    validateMcpDiscoveryTest(
      mcpDiscoveryTestSource.replace('["search_trusted_memory"]', "[]")
    ).length === 0
  ) {
    failures.push("weakened memory-only discovery assertion unexpectedly passed");
  }
  const combinedMutationPaths = selectApplicablePaths([
    "deploy/production.yaml",
    "apps/alpha1-runtime/src/global-memory-access-plane.ts"
  ]);
  if (validatePaths(combinedMutationPaths).length === 0) {
    failures.push("dirty allowed path unexpectedly hid committed deployment path");
  }
  finishOrFail(failures, "Gate B-M memory-only mutation smoke");
  console.log("ok Gate B-M memory-only mutation smoke");
  console.log("ok evidence, deployment, private-data, and unrelated paths rejected");
  process.exit(0);
}

const failures = [
  ...validatePackageScripts(packageJson),
  ...validateRootRuntimeEntrypoints(packageJson, runtimeSources),
  ...validateRuntimePackageEntrypoints(runtimePackageJson, runtimeSources),
  ...validatePaths(collectChangedPaths()),
  ...validateRuntimeSources(runtimeSources),
  ...validateMcpDiscoveryTest(mcpDiscoveryTestSource)
];
finishOrFail(failures, "Gate B-M synthetic memory-only scope check");

console.log("");
console.log("Source-Wire Gate B-M Synthetic Memory-Only Scope");
console.log("------------------------------------------------");
console.log(`Issue        : #292`);
console.log(`Branch       : ${branchName}`);
console.log(`Allowed paths: ${allowedPaths.size}`);
console.log("Evidence mode: blocked");
console.log("Deployment   : blocked");
console.log("Private data : blocked");
console.log("Production   : blocked");
console.log("");
console.log("ok Gate B-M changed-path allowlist");
console.log("ok Gate B-M runtime source excludes evidence and network runtime imports");

function validatePackageScripts(pkg) {
  const failures = [];
  const expected = {
    "runtime:gate-b-memory-only":
      "npm run test:gate-b-memory-only --workspace @source-wire/local-runtime",
    "runtime:gate-b-memory-only:scope": `node ${gateScriptPath}`,
    "runtime:gate-b-memory-only:scope:smoke": `node ${gateScriptPath} --self-test`
  };
  for (const [name, command] of Object.entries(expected)) {
    if (pkg.scripts?.[name] !== command) {
      failures.push(`package script ${name} must equal ${JSON.stringify(command)}`);
    }
    if (!pkg.scripts?.["ci:check"]?.includes(`npm run ${name}`)) {
      failures.push(`ci:check must execute npm run ${name}`);
    }
  }
  return failures;
}

function validatePaths(paths) {
  const failures = [];
  for (const path of paths) {
    if (!allowedPaths.has(path)) {
      failures.push(`Gate B-M forbids changed path: ${path}`);
    }
    if (
      /(?:^|\/)(?:deploy|deployment|infra|infrastructure|terraform|helm|k8s|docker-compose|Dockerfile)(?:\/|\.|$)/iu.test(
        path
      )
    ) {
      failures.push(`Gate B-M forbids deployment path: ${path}`);
    }
    if (
      /(?:^|\/)(?:\.env|secrets?|private|credentials?|[^/]+\.(?:pem|key))(?:\/|\.|$)/iu.test(
        path
      )
    ) {
      failures.push(`Gate B-M forbids private or credential artifact: ${path}`);
    }
  }
  return failures;
}

async function listTypeScriptSources(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const entryPath = path.posix.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptSources(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function validateRootRuntimeEntrypoints(pkg, sources) {
  const failures = [];
  if (jsonSha256(pkg.scripts ?? {}) !== approvedRootPackageScriptsSha256) {
    failures.push("package.json scripts must equal the approved script map");
  }
  const entryPaths = new Set();
  for (const [scriptName, command] of Object.entries(pkg.scripts ?? {})) {
    if (typeof command !== "string") continue;
    failures.push(
      ...validateScriptIndirection(command, `package.json scripts.${scriptName}`)
    );
    for (const target of collectScriptRuntimeTargets(
      command,
      "apps/alpha1-runtime/dist/src/"
    )) {
      const normalized = target.replace(/^\.\//u, "");
      const sourcePath = normalized
        .replace(
          /^apps\/alpha1-runtime\/dist\/src\//u,
          "apps/alpha1-runtime/src/"
        )
        .replace(/\.js$/u, ".ts");
      if (!sources.has(sourcePath)) {
        failures.push(
          `package.json scripts.${scriptName} has missing TypeScript entrypoint: ${sourcePath}`
        );
        continue;
      }
      entryPaths.add(sourcePath);
    }
  }
  failures.push(...validateDurableReachability(sources, entryPaths));
  return failures;
}

function validateRuntimePackageEntrypoints(pkg, sources) {
  const failures = [];
  if (jsonSha256(pkg.scripts ?? {}) !== approvedRuntimePackageScriptsSha256) {
    failures.push(`${runtimePackagePath} scripts must equal the approved script map`);
  }
  const approvedExports = {
    ".": {
      types: "./dist/src/index.d.ts",
      import: "./dist/src/index.js"
    },
    "./synthetic-provider": {
      types: "./dist/src/knowledge-provider/synthetic-provider.d.ts",
      import: "./dist/src/knowledge-provider/synthetic-provider.js"
    },
    "./replaceable-synthetic-provider": {
      types:
        "./dist/src/knowledge-provider/replaceable-synthetic-adapter.d.ts",
      import:
        "./dist/src/knowledge-provider/replaceable-synthetic-adapter.js"
    }
  };
  if (JSON.stringify(pkg.exports) !== JSON.stringify(approvedExports)) {
    failures.push(`${runtimePackagePath} exports must equal the approved surface`);
  }
  const declaredTargets = [];
  for (const field of ["main", "module"]) {
    if (pkg[field] === undefined) continue;
    if (typeof pkg[field] !== "string") {
      failures.push(`${runtimePackagePath} ${field} must be a string entrypoint`);
    } else {
      declaredTargets.push({ label: field, target: pkg[field] });
    }
  }
  collectManifestStringLeaves(pkg.bin, "bin", declaredTargets);
  collectManifestStringLeaves(pkg.exports, "exports", declaredTargets);
  collectManifestStringLeaves(pkg.imports, "imports", declaredTargets);
  for (const [scriptName, command] of Object.entries(pkg.scripts ?? {})) {
    if (typeof command !== "string") continue;
    failures.push(
      ...validateScriptIndirection(
        command,
        `${runtimePackagePath} scripts.${scriptName}`
      )
    );
    for (const target of collectScriptRuntimeTargets(command, "dist/src/")) {
      declaredTargets.push({
        label: `scripts.${scriptName}`,
        target
      });
    }
  }

  const entryPaths = new Set();
  for (const declaration of declaredTargets) {
    if (declaration.target.endsWith(".d.ts")) continue;
    const normalized = declaration.target.replace(/^\.\//u, "");
    if (!/^dist\/src\/.+\.js$/u.test(normalized)) {
      failures.push(
        `${runtimePackagePath} ${declaration.label} must resolve inside dist/src: ${declaration.target}`
      );
      continue;
    }
    const sourcePath = path.posix.join(
      runtimeSourceRoot,
      normalized.slice("dist/src/".length).replace(/\.js$/u, ".ts")
    );
    if (!sources.has(sourcePath)) {
      failures.push(
        `${runtimePackagePath} ${declaration.label} has missing TypeScript entrypoint: ${sourcePath}`
      );
      continue;
    }
    entryPaths.add(sourcePath);
  }
  failures.push(...validateDurableReachability(sources, entryPaths));
  return failures;
}

function validateScriptIndirection(command, label) {
  const failures = [];
  const canonical = canonicalizeShellCommand(command);
  if (canonical.ambiguous) {
    failures.push(`${label} contains ambiguous shell quoting or escaping`);
  }
  const isApprovedCompiledTestGlob =
    label === `${runtimePackagePath} scripts.test` &&
    canonical.normalized ===
      "npm run build && node --test dist/tests/*.test.js";
  if (
    canonical.hasUnquotedPathExpansion &&
    !isApprovedCompiledTestGlob
  ) {
    failures.push(`${label} may not use shell pathname expansion`);
  }
  const normalized = canonical.normalized;
  if (/\bcd\s+(?:\.\/)?apps\/alpha1-runtime(?:\s|$)/u.test(normalized)) {
    failures.push(`${label} may not change into the runtime working directory`);
  }
  if (/\$\(|`/u.test(normalized)) {
    failures.push(`${label} may not use command substitution`);
  }
  if (/(?:^|[\s;&|()])eval(?:$|[\s;&|()])/u.test(normalized)) {
    failures.push(`${label} may not use shell eval`);
  }
  if (
    normalized.split(/[;&|()]/u).some(
      (segment) =>
        /(?:^|\s)(?:\/(?:usr\/)?bin\/)?(?:ba|da|z|k)?sh(?:\s|$)/u.test(
          segment
        ) && /(?:^|\s)-[A-Za-z]*c[A-Za-z]*(?:\s|$)/u.test(segment)
    )
  ) {
    failures.push(`${label} may not invoke a shell command string`);
  }
  if (/\$(?:\{?[A-Za-z_])/u.test(normalized)) {
    failures.push(`${label} may not use shell-variable expansion`);
  }
  if (
    /\bnode\b/u.test(normalized) &&
    /(?:^|\s)(?:-e|-p|--eval|--print)(?:=|\s|$)/u.test(normalized)
  ) {
    failures.push(`${label} may not use Node eval or print mode`);
  }
  if (
    /\bnode\b/u.test(normalized) &&
    /(?:^|\s)(?:-r|--require|--import|--loader|--experimental-loader)(?:=|\s|$)/u.test(
      normalized
    )
  ) {
    failures.push(`${label} may not use Node preload or loader options`);
  }
  if (/\bNODE_(?:OPTIONS|PATH)\s*=/u.test(normalized)) {
    failures.push(`${label} may not set Node loader environment`);
  }
  if (
    /\bnode\b/u.test(normalized) &&
    (/[<>]\(/u.test(normalized) ||
      /(?:^|\s)--input-type(?:=|\s|$)/u.test(normalized) ||
      /(?:^|\s)node\s+-?(?:\s|$)/u.test(normalized))
  ) {
    failures.push(`${label} may not execute Node code from shell input`);
  }
  return failures;
}

function collectScriptRuntimeTargets(command, prefix) {
  const normalizedCommand = canonicalizeShellCommand(command).normalized;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const pattern = new RegExp(
    `(?:^|[\\s"'=;|&()])((?:\\./)?${escapedPrefix}[^\\s"'=;|&()]+\\.js)(?=$|[\\s"'=;|&()])`,
    "gu"
  );
  return [...normalizedCommand.matchAll(pattern)].map((match) => match[1]);
}

function canonicalizeShellCommand(command) {
  let normalized = "";
  let quote;
  let ambiguous = false;
  let hasUnquotedPathExpansion = false;
  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    if (quote === "'") {
      if (character === "'") quote = undefined;
      else normalized += character;
      continue;
    }
    if (quote === '"') {
      if (character === '"') {
        quote = undefined;
      } else if (character === "\\") {
        const next = command[index + 1];
        if (next === "\n") {
          index += 1;
        } else if (next === "\r" && command[index + 2] === "\n") {
          index += 2;
        } else if (next && ['$', '`', '"', "\\"].includes(next)) {
          index += 1;
          normalized += next;
        } else {
          ambiguous = true;
          normalized += character;
        }
      } else {
        normalized += character;
      }
      continue;
    }
    if ("*?[{~".includes(character)) {
      hasUnquotedPathExpansion = true;
    }
    if (character === "'" || character === '"') {
      quote = character;
    } else if (character === "\\") {
      const next = command[index + 1];
      if (next === "\n") {
        index += 1;
      } else if (next === "\r" && command[index + 2] === "\n") {
        index += 2;
      } else if (next) {
        index += 1;
        normalized += next;
      } else {
        ambiguous = true;
      }
    } else {
      normalized += character;
    }
  }
  if (quote) ambiguous = true;
  return { ambiguous, hasUnquotedPathExpansion, normalized };
}

function jsonSha256(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function collectManifestStringLeaves(value, label, output) {
  if (typeof value === "string") {
    output.push({ label, target: value });
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((nested, index) =>
      collectManifestStringLeaves(nested, `${label}[${index}]`, output)
    );
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    collectManifestStringLeaves(nested, `${label}.${key}`, output);
  }
}

function validateRuntimeSources(sources) {
  const failures = [];
  const forbiddenEverywhere = [
    [/@hono\/node-server/iu, "network server dependency"],
    [/\bserve\s*\(/u, "network listener"],
    [/PostgreSQL\s*18/iu, "PostgreSQL 18 dependency"],
    [/model service/iu, "model-service dependency"]
  ];
  const forbiddenMemoryRuntime = [
    [/(?:knowledge-provider|knowledge_provider)/iu, "KnowledgeProvider dependency"],
    [/(?:source-evidence|source_evidence)/iu, "source-evidence dependency"],
    [/\b(?:search_source_evidence|get_source_evidence)\b/u, "evidence tool"]
  ];
  for (const [path, source] of sources) {
    if (memoryOnlyImplementationPaths.has(path)) {
      for (const [pattern, label] of forbiddenEverywhere) {
        if (pattern.test(source)) {
          failures.push(`${path} contains forbidden ${label}`);
        }
      }
    }
    if (path === "apps/alpha1-runtime/src/mcp/server.ts") {
      failures.push(...validateMcpProfileBoundary(source));
      continue;
    }
    if (path === "apps/alpha1-runtime/src/mcp/tool-profile.ts") {
      failures.push(...validateMcpToolProfileGuard(source));
      continue;
    }
    if (memoryOnlyImplementationPaths.has(path)) {
      for (const [pattern, label] of forbiddenMemoryRuntime) {
        if (pattern.test(source)) {
          failures.push(`${path} contains forbidden ${label}`);
        }
      }
    }
  }
  const allNonProtectedRuntimeSources = new Set(
    [...sources.keys()].filter((sourcePath) => !protectedDurableModules.has(sourcePath))
  );
  failures.push(
    ...validateDurableReachability(sources, allNonProtectedRuntimeSources)
  );
  return failures;
}

function validateDurableReachability(sources, entryPaths = runtimeEntryPaths) {
  const failures = [];
  const graph = new Map();
  for (const [sourcePath, source] of sources) {
    const sourceFile = ts.createSourceFile(
      sourcePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
    if (sourceFile.parseDiagnostics.length > 0) {
      failures.push(`${sourcePath} must parse before reachability validation`);
      continue;
    }
    failures.push(
      ...validateRuntimeProcessCreationBoundary(sourcePath, sourceFile)
    );
    const imports = new Set();
    visitAst(sourceFile, (node) => {
      const computedLoaderPrimitive = runtimeLoaderPrimitiveName(node);
      if (computedLoaderPrimitive) {
        failures.push(
          `${sourcePath} contains forbidden runtime code-loading primitive: ${computedLoaderPrimitive}`
        );
      }
      if (
        ts.isIdentifier(node) &&
        node.text === "process" &&
        !isApprovedProcessCapabilityReference(node)
      ) {
        failures.push(
          `${sourcePath} contains unapproved process capability access`
        );
      }
      if (
        ts.isIdentifier(node) &&
        [
          "createRequire",
          "eval",
          "Function",
          "getBuiltinModule",
          "global",
          "globalThis",
          "require"
        ].includes(node.text)
      ) {
        failures.push(
          `${sourcePath} contains forbidden runtime code-loading primitive: ${node.text}`
        );
      }
      let specifier;
      let isDynamicImport = false;
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (isTypeOnlyModuleReference(node)) return;
        if (node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
          specifier = node.moduleSpecifier.text;
        }
      } else if (ts.isImportEqualsDeclaration(node)) {
        if (node.isTypeOnly) return;
        if (
          !ts.isExternalModuleReference(node.moduleReference) ||
          !node.moduleReference.expression ||
          !ts.isStringLiteralLike(node.moduleReference.expression)
        ) {
          failures.push(
            `${sourcePath} contains an unresolved TypeScript import-equals loader`
          );
          return;
        }
        specifier = node.moduleReference.expression.text;
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        isDynamicImport = true;
        const argument = node.arguments[0];
        if (!argument || !ts.isStringLiteralLike(argument)) {
          const isValidatedExternalProviderImport =
            sourcePath ===
              "apps/alpha1-runtime/src/local-cli/provider.ts" &&
            argument?.getText(sourceFile) === "config.module";
          if (!isValidatedExternalProviderImport) {
            failures.push(
              `${sourcePath} contains an unresolved dynamic import in a reachable source tree`
            );
          }
          return;
        }
        specifier = argument.text;
      }
      if (!specifier) return;
      if (
        [
          "module",
          "node:module",
          "process",
          "node:process",
          "vm",
          "node:vm"
        ].includes(specifier)
      ) {
        failures.push(
          `${sourcePath} imports forbidden runtime loader built-in: ${specifier}`
        );
        return;
      }
      if (forbiddenProcessCreationModules.has(specifier)) {
        const isApprovedChildProcessImport =
          !isDynamicImport &&
          sourcePath === processCreationSource &&
          ["child_process", "node:child_process"].includes(specifier);
        if (!isApprovedChildProcessImport) {
          failures.push(
            `${sourcePath} imports forbidden process-creation module: ${specifier}`
          );
        }
        return;
      }
      if (isDynamicImport && !specifier.startsWith(".")) {
        failures.push(
          `${sourcePath} contains forbidden non-local dynamic import: ${specifier}`
        );
        return;
      }
      if (!specifier.startsWith(".")) {
        const normalizedBuiltinSpecifier = specifier.startsWith("node:")
          ? specifier
          : builtinModules.includes(specifier)
            ? `node:${specifier}`
            : undefined;
        if (
          normalizedBuiltinSpecifier &&
          !approvedNodeRuntimeModules.has(normalizedBuiltinSpecifier)
        ) {
          failures.push(
            `${sourcePath} imports unapproved Node runtime capability: ${specifier}`
          );
        } else if (
          !normalizedBuiltinSpecifier &&
          !packageModuleSpecifier.test(specifier)
        ) {
          failures.push(
            `${sourcePath} contains forbidden URL or absolute module import: ${specifier}`
          );
        }
        return;
      }
      const resolved = resolveLocalTypeScriptImport(sourcePath, specifier, sources);
      if (!resolved) {
        failures.push(`${sourcePath} has unresolved local import: ${specifier}`);
        return;
      }
      imports.add(resolved);
    });
    graph.set(sourcePath, imports);
  }

  for (const entryPath of entryPaths) {
    if (!sources.has(entryPath)) {
      failures.push(`runtime reachability entrypoint is missing: ${entryPath}`);
      continue;
    }
    const pending = [[entryPath, [entryPath]]];
    const visited = new Set();
    while (pending.length > 0) {
      const [current, chain] = pending.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      if (protectedDurableModules.has(current)) {
        failures.push(
          `${entryPath} reaches synthetic-only durable authority: ${chain.join(" -> ")}`
        );
        continue;
      }
      for (const imported of graph.get(current) ?? []) {
        pending.push([imported, [...chain, imported]]);
      }
    }
  }
  return failures;
}

function validateRuntimeProcessCreationBoundary(sourcePath, sourceFile) {
  const failures = [];
  const forbiddenLoaderEnvironment = new Set(["NODE_OPTIONS", "NODE_PATH"]);
  let childProcessImports = 0;
  let spawnCalls = 0;
  const entryInitializers = new Map([
    ["API_ENTRY", []],
    ["MCP_ENTRY", []]
  ]);

  visitAst(sourceFile, (node) => {
    if (
      ts.isStringLiteralLike(node) &&
      forbiddenLoaderEnvironment.has(node.text)
    ) {
      failures.push(
        `${sourcePath} contains forbidden child loader environment: ${node.text}`
      );
    }
    if (sourcePath !== processCreationSource) return;

    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      ["child_process", "node:child_process"].includes(
        node.moduleSpecifier.text
      )
    ) {
      childProcessImports += 1;
      const clause = node.importClause;
      const bindings = clause?.namedBindings;
      const runtimeImports =
        bindings && ts.isNamedImports(bindings)
          ? bindings.elements.filter((element) => !element.isTypeOnly)
          : [];
      if (
        !clause ||
        clause.name ||
        !bindings ||
        !ts.isNamedImports(bindings) ||
        runtimeImports.length !== 1 ||
        runtimeImports[0]?.name.text !== "spawn" ||
        runtimeImports[0]?.propertyName
      ) {
        failures.push(
          `${sourcePath} must import only the child-process spawn capability at runtime`
        );
      }
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      entryInitializers.has(node.name.text)
    ) {
      entryInitializers.get(node.name.text).push(
        node.initializer?.getText(sourceFile) ?? ""
      );
    }

    if (ts.isIdentifier(node) && node.text === "spawn") {
      const parent = node.parent;
      const isImportName =
        ts.isImportSpecifier(parent) && parent.name === node;
      const isDirectCall =
        ts.isCallExpression(parent) && parent.expression === node;
      if (!isImportName && !isDirectCall) {
        failures.push(`${sourcePath} must not alias the spawn capability`);
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "spawn"
    ) {
      spawnCalls += 1;
      const executable = node.arguments[0];
      const argumentVector = node.arguments[1];
      const entry =
        argumentVector &&
        ts.isArrayLiteralExpression(argumentVector) &&
        argumentVector.elements.length === 1 &&
        ts.isIdentifier(argumentVector.elements[0])
          ? argumentVector.elements[0].text
          : undefined;
      if (
        executable?.getText(sourceFile) !== "process.execPath" ||
        !["API_ENTRY", "MCP_ENTRY"].includes(entry ?? "")
      ) {
        failures.push(
          `${sourcePath} contains a child process outside the fixed API/MCP entrypoints`
        );
      }
    }
  });

  if (sourcePath === processCreationSource) {
    if (childProcessImports !== 1) {
      failures.push(`${sourcePath} must have exactly one child-process import`);
    }
    const expectedEntries = new Map([
      [
        "API_ENTRY",
        'fileURLToPath(new URL("../server.js", import.meta.url))'
      ],
      [
        "MCP_ENTRY",
        'fileURLToPath(new URL("../mcp/server.js", import.meta.url))'
      ]
    ]);
    for (const [name, expected] of expectedEntries) {
      const observed = entryInitializers.get(name);
      if (observed.length !== 1 || observed[0] !== expected) {
        failures.push(`${sourcePath} has an invalid ${name} child entrypoint`);
      }
    }
    if (spawnCalls !== 2) {
      failures.push(`${sourcePath} must contain exactly two fixed child launches`);
    }
  }
  return failures;
}

function isApprovedProcessCapabilityReference(node) {
  const allowed = new Set([
    "argv",
    "env",
    "execPath",
    "exit",
    "exitCode",
    "once",
    "removeListener",
    "send",
    "stderr",
    "stdin",
    "stdout"
  ]);
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
    return allowed.has(parent.name.text);
  }
  if (
    ts.isElementAccessExpression(parent) &&
    parent.expression === node &&
    parent.argumentExpression
  ) {
    const propertyName = evaluateStaticString(parent.argumentExpression);
    return propertyName !== undefined && allowed.has(propertyName);
  }
  return false;
}

function runtimeLoaderPrimitiveName(node) {
  const forbidden = new Set([
    "constructor",
    "createRequire",
    "eval",
    "Function",
    "getBuiltinModule",
    "globalThis",
    "require"
  ]);
  const expression = unwrapStaticExpression(node);
  const staticPrimitive = evaluateStaticString(expression);
  if (staticPrimitive && forbidden.has(staticPrimitive)) {
    return staticPrimitive;
  }
  if (
    ts.isPropertyAccessExpression(expression) &&
    forbidden.has(expression.name.text)
  ) {
    return expression.name.text;
  }
  if (
    ts.isElementAccessExpression(expression) &&
    expression.argumentExpression
  ) {
    const propertyName = evaluateStaticString(expression.argumentExpression);
    if (propertyName && forbidden.has(propertyName)) return propertyName;
  }
  if (ts.isBindingElement(expression) && expression.propertyName) {
    const propertyName = evaluateStaticPropertyName(expression.propertyName);
    if (propertyName && forbidden.has(propertyName)) return propertyName;
  }
  if (ts.isCallExpression(expression) && isReflectGet(expression.expression)) {
    const propertyName = expression.arguments[1]
      ? evaluateStaticString(expression.arguments[1])
      : undefined;
    if (propertyName && forbidden.has(propertyName)) return propertyName;
  }
  return undefined;
}

function isReflectGet(node) {
  const expression = unwrapStaticExpression(node);
  if (ts.isPropertyAccessExpression(expression)) {
    const receiver = unwrapStaticExpression(expression.expression);
    return (
      ts.isIdentifier(receiver) &&
      receiver.text === "Reflect" &&
      expression.name.text === "get"
    );
  }
  if (
    ts.isElementAccessExpression(expression) &&
    expression.argumentExpression
  ) {
    const receiver = unwrapStaticExpression(expression.expression);
    return (
      ts.isIdentifier(receiver) &&
      receiver.text === "Reflect" &&
      evaluateStaticString(expression.argumentExpression) === "get"
    );
  }
  return false;
}

function evaluateStaticPropertyName(node) {
  const propertyName = unwrapStaticExpression(node);
  if (ts.isIdentifier(propertyName) || ts.isStringLiteralLike(propertyName)) {
    return propertyName.text;
  }
  if (ts.isComputedPropertyName(propertyName)) {
    return evaluateStaticString(propertyName.expression);
  }
  return undefined;
}

function unwrapStaticExpression(node) {
  let expression = node;
  while (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isNonNullExpression(expression) ||
    ts.isSatisfiesExpression(expression)
  ) {
    expression = expression.expression;
  }
  return expression;
}

function evaluateStaticString(node) {
  const expression = unwrapStaticExpression(node);
  if (ts.isStringLiteralLike(expression)) return expression.text;
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = evaluateStaticString(expression.left);
    const right = evaluateStaticString(expression.right);
    if (left !== undefined && right !== undefined) return `${left}${right}`;
  }
  return undefined;
}

function isTypeOnlyModuleReference(node) {
  if (ts.isExportDeclaration(node)) {
    if (node.isTypeOnly) return true;
    return (
      node.exportClause &&
      ts.isNamedExports(node.exportClause) &&
      node.exportClause.elements.length > 0 &&
      node.exportClause.elements.every((element) => element.isTypeOnly)
    );
  }
  const clause = node.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  return (
    !clause.name &&
    clause.namedBindings &&
    ts.isNamedImports(clause.namedBindings) &&
    clause.namedBindings.elements.length > 0 &&
    clause.namedBindings.elements.every((element) => element.isTypeOnly)
  );
}

function resolveLocalTypeScriptImport(importer, specifier, sources) {
  const joined = path.posix.normalize(
    path.posix.join(path.posix.dirname(importer), specifier)
  );
  const candidates = joined.endsWith(".js")
    ? [`${joined.slice(0, -3)}.ts`]
    : joined.endsWith(".ts")
      ? [joined]
      : [`${joined}.ts`, path.posix.join(joined, "index.ts")];
  return candidates.find((candidate) => sources.has(candidate));
}

function validateMcpProfileBoundary(source) {
  const path = "apps/alpha1-runtime/src/mcp/server.ts";
  const failures = [];
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    return [`${path} must parse before MCP profile validation`];
  }

  const expectedProviderOnly = new Set([
    "get_source_evidence",
    "search_source_evidence"
  ]);
  const expectedNonGateB = new Set(["propose_memory_candidate"]);
  const expectedUnconditional = new Set(["search_trusted_memory"]);
  const registrations = [];
  const indirectRegisterToolReferences = [];
  let guardInstallEnd = -1;
  visitAst(sourceFile, (node) => {
    if (isRegisterToolAccess(node) && !isDirectCallExpression(node.parent, node)) {
      indirectRegisterToolReferences.push(node.getStart(sourceFile));
    }
    if (!ts.isCallExpression(node)) return;
    if (
      ts.isIdentifier(node.expression) &&
      node.expression.text === "createProfileRestrictedMcpServer"
    ) {
      guardInstallEnd = node.end;
      return;
    }
    const expression = node.expression;
    if (
      !(
        ts.isPropertyAccessExpression(expression) &&
        expression.name.text === "registerTool"
      ) &&
      !(
        ts.isElementAccessExpression(expression) &&
        expression.argumentExpression &&
        ts.isStringLiteralLike(expression.argumentExpression) &&
        expression.argumentExpression.text === "registerTool"
      )
    ) {
      return;
    }
    const name = node.arguments[0];
    registrations.push({
      name: name && ts.isStringLiteralLike(name) ? name.text : undefined,
      gateBExcluded: isInsideNonGateBGuard(node, sourceFile),
      providerProtected: isInsideProviderGuard(node, sourceFile),
      start: node.getStart(sourceFile)
    });
  });

  const names = registrations.map((registration) => registration.name);
  const expectedNames = [
    ...expectedProviderOnly,
    ...expectedNonGateB,
    ...expectedUnconditional
  ];
  if (
    guardInstallEnd < 0 ||
    /\bMcpServer\b/u.test(source) ||
    /Object\.getPrototypeOf|Reflect\.get/u.test(source) ||
    indirectRegisterToolReferences.length > 0 ||
    registrations.some((registration) => registration.start < guardInstallEnd) ||
    registrations.length !== expectedNames.length ||
    expectedNames.some(
      (name) => names.filter((candidate) => candidate === name).length !== 1
    ) ||
    registrations.some((registration) => registration.name === undefined) ||
    registrations.some(
      (registration) =>
        registration.name !== undefined &&
        !expectedProviderOnly.has(registration.name) &&
        !expectedNonGateB.has(registration.name) &&
        !expectedUnconditional.has(registration.name)
    ) ||
    registrations.some(
      (registration) =>
        registration.name !== undefined &&
        expectedProviderOnly.has(registration.name) &&
        !registration.providerProtected
    ) ||
    registrations.some(
      (registration) =>
        registration.name !== undefined &&
        expectedNonGateB.has(registration.name) &&
        (!registration.gateBExcluded || registration.providerProtected)
    ) ||
    registrations.some(
      (registration) =>
        registration.name !== undefined &&
        expectedUnconditional.has(registration.name) &&
        (registration.providerProtected || registration.gateBExcluded)
    )
  ) {
    failures.push(
      `${path} must register two provider-only evidence tools, one non-Gate-B proposal tool, and one unconditional trusted-memory tool`
    );
  }
  return failures;
}

function isRegisterToolAccess(node) {
  return (
    (ts.isPropertyAccessExpression(node) && node.name.text === "registerTool") ||
    (ts.isElementAccessExpression(node) &&
      node.argumentExpression &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      node.argumentExpression.text === "registerTool")
  );
}

function isDirectCallExpression(parent, node) {
  return ts.isCallExpression(parent) && parent.expression === node;
}

function validateMcpToolProfileGuard(source) {
  const path = "apps/alpha1-runtime/src/mcp/tool-profile.ts";
  const requiredFragments = [
    'gate_b_memory_only: Object.freeze(["search_trusted_memory"])',
    'if (value === "memory_only") return "memory_only";',
    'if (value === "gate_b_memory_only") return "gate_b_memory_only";',
    "export function createProfileRestrictedMcpServer(",
    "assertToolAllowed(profile, name);",
    "Object.assign(Object.create(null) as object",
    "return Object.freeze(facade);"
  ];
  return requiredFragments.every((fragment) => source.includes(fragment))
    ? []
    : [`${path} must retain the immutable exact runtime profile guard`];
}

function isInsideProviderGuard(node, sourceFile) {
  const nodeStart = node.getStart(sourceFile);
  let parent = node.parent;
  while (parent) {
    if (
      ts.isIfStatement(parent) &&
      isProviderCondition(parent.expression) &&
      nodeStart >= parent.thenStatement.getStart(sourceFile) &&
      node.end <= parent.thenStatement.end
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function isInsideNonGateBGuard(node, sourceFile) {
  const nodeStart = node.getStart(sourceFile);
  let parent = node.parent;
  while (parent) {
    if (
      ts.isIfStatement(parent) &&
      isNonGateBCondition(parent.expression) &&
      nodeStart >= parent.thenStatement.getStart(sourceFile) &&
      node.end <= parent.thenStatement.end
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function isNonGateBCondition(expression) {
  return (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken &&
    ts.isIdentifier(expression.left) &&
    expression.left.text === "toolProfile" &&
    ts.isStringLiteralLike(expression.right) &&
    expression.right.text === "gate_b_memory_only"
  );
}

function isProviderCondition(expression) {
  if (
    !ts.isBinaryExpression(expression) ||
    expression.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken
  ) {
    return false;
  }
  return (
    (ts.isIdentifier(expression.left) &&
      expression.left.text === "toolProfile" &&
      ts.isStringLiteralLike(expression.right) &&
      expression.right.text === "provider") ||
    (ts.isStringLiteralLike(expression.left) &&
      expression.left.text === "provider" &&
      ts.isIdentifier(expression.right) &&
      expression.right.text === "toolProfile")
  );
}

function validateMcpDiscoveryTest(source) {
  const sourceFile = ts.createSourceFile(
    mcpDiscoveryTestPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const digest = createHash("sha256").update(source, "utf8").digest("hex");
  if (sourceFile.parseDiagnostics.length > 0 || digest !== mcpDiscoveryTestSha256) {
    return [`${mcpDiscoveryTestPath} must parse`];
  }
  let callback;
  visitAst(sourceFile, (node) => {
    if (
      callback !== undefined ||
      !ts.isCallExpression(node) ||
      !ts.isIdentifier(node.expression) ||
      node.expression.text !== "test" ||
      !node.arguments[0] ||
      !ts.isStringLiteralLike(node.arguments[0]) ||
      node.arguments[0].text !==
        "memory-only profile discovers only trusted-memory search"
    ) {
      return;
    }
    callback = node.arguments[1];
  });
  if (!callback) {
    return [`${mcpDiscoveryTestPath} must retain the memory-only discovery test`];
  }

  let selectsMemoryOnly = false;
  let assertsExactTool = false;
  visitAst(callback, (node) => {
    if (
      ts.isStringLiteralLike(node) &&
      node.text === "gate_b_memory_only"
    ) {
      selectsMemoryOnly = true;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "assert" &&
      node.expression.name.text === "deepEqual" &&
      node.arguments[1] &&
      ts.isArrayLiteralExpression(node.arguments[1]) &&
      node.arguments[1].elements.length === 1 &&
      ts.isStringLiteralLike(node.arguments[1].elements[0]) &&
      node.arguments[1].elements[0].text === "search_trusted_memory"
    ) {
      assertsExactTool = true;
    }
  });
  return selectsMemoryOnly && assertsExactTool
    ? []
    : [
        `${mcpDiscoveryTestPath} must select memory_only and assert exactly search_trusted_memory`
      ];
}

function visitAst(node, visitor) {
  visitor(node);
  node.forEachChild((child) => visitAst(child, visitor));
}

function collectChangedPaths() {
  const changed = new Set();
  for (const args of [
    ["diff", "--cached", "--name-only"],
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"]
  ]) {
    for (const path of splitPaths(runGit(args))) changed.add(path);
  }

  const eventDiff = collectGitHubDiff();
  if (eventDiff !== null) {
    for (const path of eventDiff) changed.add(path);
  } else {
    const base = safeGit(["rev-parse", "origin/main"]);
    if (!base) throw new Error("Gate B-M scope check requires origin/main");
    for (const path of splitPaths(runGit(["diff", "--name-only", `${base}..HEAD`]))) {
      changed.add(path);
    }
  }
  return selectApplicablePaths([...changed]);
}

function selectApplicablePaths(paths) {
  const normalized = [...new Set(paths)].sort();
  return normalized.some(
    (candidate) =>
      gateTriggerPaths.has(candidate) ||
      candidate.startsWith(`${runtimeSourceRoot}/`)
  )
    ? normalized
    : [];
}

function collectGitHubDiff() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return null;
  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  if (event.pull_request) {
    const base = requireCommit(event.pull_request.base?.sha, "PR base");
    const head = requireCommit(event.pull_request.head?.sha, "PR head");
    return splitPaths(runGit(["diff", "--name-only", `${base}..${head}`]));
  }
  if (typeof event.ref !== "string" || !event.ref.startsWith("refs/heads/")) {
    return null;
  }
  const head = requireCommit(event.after, "push head");
  if (safeGit(["rev-parse", "HEAD"]) !== head) {
    throw new Error("Gate B-M push head does not match checkout");
  }
  let base = event.before;
  if (typeof base === "string" && /^0+$/u.test(base)) {
    base = resolveInitialPushBase(event, head);
  }
  base = requireCommit(base, "push base");
  return splitPaths(runGit(["diff", "--name-only", `${base}..${head}`]));
}

function resolveInitialPushBase(event, head) {
  const defaultBranch = event.repository?.default_branch ?? "main";
  try {
    execFileSync("git", ["check-ref-format", "--branch", defaultBranch], {
      stdio: "ignore"
    });
  } catch {
    throw new Error("Gate B-M default branch is invalid");
  }
  if (safeGit(["rev-parse", "--is-shallow-repository"]) === "true") {
    execFileSync("git", ["fetch", "--no-tags", "--unshallow", "origin"], {
      stdio: "ignore"
    });
  }
  const remoteBase = `refs/remotes/origin/${defaultBranch}`;
  execFileSync(
    "git",
    [
      "fetch",
      "--no-tags",
      "origin",
      `+refs/heads/${defaultBranch}:${remoteBase}`
    ],
    { stdio: "ignore" }
  );
  const base = safeGit(["merge-base", head, remoteBase]);
  if (!base) throw new Error("Gate B-M initial push has no default-branch merge base");
  return base;
}

function requireCommit(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{40,64}$/iu.test(value)) {
    throw new Error(`Gate B-M ${label} SHA is invalid`);
  }
  try {
    execFileSync("git", ["cat-file", "-e", `${value}^{commit}`], {
      stdio: "ignore"
    });
  } catch {
    execFileSync("git", ["fetch", "--no-tags", "--depth=1", "origin", value], {
      stdio: "ignore"
    });
  }
  return value;
}

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function safeGit(args) {
  try {
    return runGit(args).trim();
  } catch {
    return "";
  }
}

function splitPaths(output) {
  return [...new Set(output.split("\n").map((value) => value.trim()).filter(Boolean))].sort();
}

function finishOrFail(failures, title) {
  if (failures.length === 0) return;
  console.error(`failed ${title}`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
