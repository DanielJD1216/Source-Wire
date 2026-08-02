import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const branchName = "feat/gate-b-durable-memory-auth";
const gateScriptPath =
  "scripts/global-owner-hosted-runtime-v1-gate-b-memory-only.mjs";
const mcpDiscoveryTestPath =
  "apps/alpha1-runtime/tests/mcp-discovery.test.ts";
const mcpDiscoveryTestSha256 =
  "07cf0deba2fdbb38e34df5db27595f6addafbafcf0e32bdccace7673cc247882";
const runtimePaths = [
  "apps/alpha1-runtime/src/app.ts",
  "apps/alpha1-runtime/src/global-memory-access-plane.ts",
  "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/durable-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/index.ts",
  "apps/alpha1-runtime/src/local-cli/mcp-stdio.ts",
  "apps/alpha1-runtime/src/postgres-memory-only-authorization.ts",
  "apps/alpha1-runtime/src/runtime-composition.ts",
  "apps/alpha1-runtime/src/server.ts",
  "apps/alpha1-runtime/src/mcp/server.ts",
  "apps/alpha1-runtime/src/mcp/tool-profile.ts"
];
const reachableCompositionPaths = new Set([
  "apps/alpha1-runtime/src/app.ts",
  "apps/alpha1-runtime/src/global-memory-access-plane.ts",
  "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/index.ts",
  "apps/alpha1-runtime/src/local-cli/mcp-stdio.ts",
  "apps/alpha1-runtime/src/runtime-composition.ts",
  "apps/alpha1-runtime/src/server.ts",
  "apps/alpha1-runtime/src/mcp/server.ts",
  "apps/alpha1-runtime/src/mcp/tool-profile.ts"
]);
const memoryOnlyImplementationPaths = new Set([
  "apps/alpha1-runtime/src/global-memory-access-plane.ts",
  "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/durable-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/postgres-memory-only-authorization.ts",
  "apps/alpha1-runtime/src/mcp/server.ts",
  "apps/alpha1-runtime/src/mcp/tool-profile.ts"
]);
const gateTriggerPaths = new Set([
  gateScriptPath,
  "apps/alpha1-runtime/conformance/story2.ts",
  "apps/alpha1-runtime/conformance/story4.ts",
  "apps/alpha1-runtime/migrations/0007_gate_b_durable_memory_authorization.sql",
  "apps/alpha1-runtime/src/durable-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/global-memory-access-plane.ts",
  "apps/alpha1-runtime/src/global-memory-only-runtime.ts",
  "apps/alpha1-runtime/src/mcp/server.ts",
  "apps/alpha1-runtime/src/mcp/tool-profile.ts",
  "apps/alpha1-runtime/src/migration.ts",
  "apps/alpha1-runtime/src/postgres-memory-only-authorization.ts",
  "apps/alpha1-runtime/src/trusted-memory-search.ts",
  "apps/alpha1-runtime/tests/global-memory-access-plane.test.ts",
  "apps/alpha1-runtime/tests/postgres-memory-only-authorization.test.ts",
  "apps/alpha1-runtime/tests/mcp-tool-profile.test.ts",
  "apps/alpha1-runtime/tests/schema-compatibility.test.ts",
  "docs/internal/global-owner-hosted-runtime-v1-gate-b-memory-only.md"
]);
const allowedPaths = new Set([
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
  "apps/alpha1-runtime/src/postgres-memory-only-authorization.ts",
  "apps/alpha1-runtime/src/trusted-memory-search.ts",
  "apps/alpha1-runtime/tests/global-memory-access-plane.test.ts",
  "apps/alpha1-runtime/tests/mcp-discovery.test.ts",
  "apps/alpha1-runtime/tests/mcp-tool-profile.test.ts",
  "apps/alpha1-runtime/tests/postgres-memory-only-authorization.test.ts",
  "apps/alpha1-runtime/tests/schema-compatibility.test.ts",
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
const runtimeSources = new Map();
for (const path of runtimePaths) {
  runtimeSources.set(path, await readFile(path, "utf8"));
}
const mcpDiscoveryTestSource = await readFile(mcpDiscoveryTestPath, "utf8");

if (process.argv.includes("--self-test")) {
  const failures = [];
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
  ...validatePaths(collectChangedPaths()),
  ...validateRuntimeSources(runtimeSources),
  ...validateMcpDiscoveryTest(mcpDiscoveryTestSource)
];
finishOrFail(failures, "Gate B-M synthetic memory-only scope check");

console.log("");
console.log("Source-Wire Gate B-M Synthetic Memory-Only Scope");
console.log("------------------------------------------------");
console.log(`Issue        : #290`);
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
    if (
      reachableCompositionPaths.has(path) &&
      /(?:DurableMemoryOnlyRuntime|PostgresMemoryOnlyAuthorizationAuthority|durable-memory-only-runtime|postgres-memory-only-authorization)/u.test(
        source
      )
    ) {
      failures.push(
        `${path} composes the synthetic-only durable authority into a reachable runtime`
      );
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
  return failures;
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
  return normalized.some((path) => gateTriggerPaths.has(path)) ? normalized : [];
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
