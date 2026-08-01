import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";

const packagePath = "package.json";
const gateABranchName = "docs/global-owner-hosted-runtime-v1";
const adrPath = "docs/adr/0002-global-owner-hosted-runtime-v1.md";
const matrixPath = "docs/internal/global-owner-hosted-runtime-v1-acceptance-matrix.md";
const apiPath = "docs/internal/hosted-runtime-api-server-contract.md";
const mcpPath = "docs/internal/hosted-runtime-mcp-server-contract.md";
const databasePath = "docs/internal/hosted-runtime-database-posture-data-lifecycle.md";
const deploymentPath = "docs/internal/hosted-runtime-deployment-boundary-stop-conditions.md";
const threatPath = "docs/internal/hosted-runtime-threat-model-trust-boundary.md";

const requiredDocPaths = [
  adrPath,
  matrixPath,
  apiPath,
  mcpPath,
  databasePath,
  deploymentPath,
  threatPath
];

const gateAAllowedPaths = new Set([
  "docs/README.md",
  "docs/adr/0002-global-owner-hosted-runtime-v1.md",
  "docs/guides/publish-readiness.md",
  "docs/internal/global-owner-hosted-runtime-v1-acceptance-matrix.md",
  "docs/internal/hosted-runtime-api-server-contract.md",
  "docs/internal/hosted-runtime-database-posture-data-lifecycle.md",
  "docs/internal/hosted-runtime-deployment-boundary-stop-conditions.md",
  "docs/internal/hosted-runtime-mcp-server-contract.md",
  "docs/internal/hosted-runtime-threat-model-trust-boundary.md",
  "docs/internal/README.md",
  "docs/internal/owner-open-issues-status.md",
  "docs/reference/ci-checks.md",
  "package.json",
  "scripts/global-owner-hosted-runtime-v1-architecture.mjs",
  "scripts/owner-open-issues-status.mjs"
]);

const gateFIds = new Set(["ID-06", "ID-07", "AUTH-04"]);
const requiredMatrixIds = [
  ...rangeIds("ID", 10),
  ...rangeIds("DATA", 7),
  ...rangeIds("CIT", 8),
  ...rangeIds("TOOL", 9),
  ...rangeIds("AUTH", 8),
  ...rangeIds("OPS", 7),
  ...rangeIds("DB", 7),
  ...rangeIds("MODEL", 6)
];

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
for (const path of requiredDocPaths) {
  await assertPathExists(path);
}
const docs = await readAvailableDocs(requiredDocPaths);

if (process.argv.includes("--scope")) {
  const changedPaths = collectChangedPaths();
  const failures = validateScope(changedPaths);
  const scopeCounts = countScopeClasses(changedPaths);
  finishOrFail(failures, "Global Owner-Hosted Runtime V1 Gate A scope check");
  printSection("Source-Wire Global Owner-Hosted Runtime V1 Gate A Scope");
  printRows([
    ["Changed paths", String(changedPaths.length)],
    ["Allowed paths", String(gateAAllowedPaths.size)],
    ["Runtime paths", String(scopeCounts.runtime)],
    ["Deployment paths", String(scopeCounts.deployment)],
    ["Private artifacts", String(scopeCounts.privateArtifacts)]
  ]);
  console.log("");
  console.log("ok Gate A changed-path allowlist");
  process.exit(0);
}

const baselineFailures = validateArchitecture(packageJson, docs);
if (process.argv.includes("--self-test")) {
  if (baselineFailures.length > 0) {
    finishOrFail(baselineFailures, "Global Owner-Hosted Runtime V1 baseline before mutation smoke");
  }
  const smokeFailures = runMutationSmoke(packageJson, docs);
  finishOrFail(smokeFailures, "Global Owner-Hosted Runtime V1 mutation smoke");
  printSection("Source-Wire Global Owner-Hosted Runtime V1 Mutation Smoke");
  printRows([
    ["Contradictory authority", "rejected"],
    ["Missing matrix row", "rejected"],
    ["Wrong gate assignment", "rejected"],
    ["Forbidden runtime path", "rejected"],
    ["Clean CI manifest", "validated"],
    ["Deployment approval drift", "rejected"]
  ]);
  console.log("");
  console.log("ok Global Owner-Hosted Runtime V1 negative and mutation smoke");
  process.exit(0);
}

finishOrFail(baselineFailures, "Global Owner-Hosted Runtime V1 architecture gate");

printSection("Source-Wire Global Owner-Hosted Runtime V1 Architecture Gate");
printRows([
  ["Issue", "#286"],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Architecture", adrPath],
  ["Acceptance rows", String(requiredMatrixIds.length)],
  ["Tenant posture", "single owner/tenant"],
  ["Memory topology", "mandatory PostgreSQL 16"],
  ["Evidence topology", "conditional PostgreSQL 18 and model service"],
  ["Grant authority", "PostgreSQL 16 policy"],
  ["Destination", "transport-derived immutable multi-hop chain"],
  ["Deployment", "blocked"],
  ["Private data", "blocked"]
]);
console.log("");
console.log("ok Global Owner-Hosted Runtime V1 architecture defined");
console.log("ok identity, destination, replay, revocation, and prompt-safety boundaries defined");
console.log("ok all acceptance rows and approval-gate assignments validated");
console.log("ok Gate B through Gate F remain separately blocked");
console.log("blocked remote runtime implementation");
console.log("blocked deployment and private data");

function validateArchitecture(pkg, sourceDocs) {
  const failures = [];
  const adr = sourceDocs.get(adrPath) ?? "";
  const matrix = sourceDocs.get(matrixPath) ?? "";
  const api = sourceDocs.get(apiPath) ?? "";
  const mcp = sourceDocs.get(mcpPath) ?? "";
  const database = sourceDocs.get(databasePath) ?? "";
  const deployment = sourceDocs.get(deploymentPath) ?? "";
  const threat = sourceDocs.get(threatPath) ?? "";
  const allDocs = [...sourceDocs.values()].join("\n");

  assertEqual(pkg.name, "@source-wire/contracts", "package name must remain @source-wire/contracts", failures);
  assertEqual(pkg.version, "0.2.0", "package version must remain 0.2.0", failures);
  assertEqual(pkg.license, "Apache-2.0", "package license must remain Apache-2.0", failures);
  assertEqual(
    pkg.scripts?.["runtime:global-owner-hosted-v1-architecture"],
    "node scripts/global-owner-hosted-runtime-v1-architecture.mjs",
    "package scripts must expose the exact architecture gate command",
    failures
  );
  assertEqual(
    pkg.scripts?.["runtime:global-owner-hosted-v1-architecture:smoke"],
    "node scripts/global-owner-hosted-runtime-v1-architecture.mjs --self-test",
    "package scripts must expose the exact mutation smoke command",
    failures
  );
  assertEqual(
    pkg.scripts?.["runtime:global-owner-hosted-v1-architecture:scope"],
    "node scripts/global-owner-hosted-runtime-v1-architecture.mjs --scope",
    "package scripts must expose the exact Gate A scope command",
    failures
  );
  for (const requiredCommand of [
    "npm run runtime:global-owner-hosted-v1-architecture",
    "npm run runtime:global-owner-hosted-v1-architecture:smoke",
    "npm run runtime:global-owner-hosted-v1-architecture:scope"
  ]) {
    if (!pkg.scripts?.["ci:check"]?.includes(requiredCommand)) {
      failures.push(`ci:check must execute ${requiredCommand}`);
    }
  }

  requireAll(adr, adrPath, [
    "# ADR 0002: Global Owner-Hosted Runtime V1",
    "Status: Accepted for architecture definition only",
    "Issue: `#286`",
    "single DOO MADE owner/tenant",
    "private-network authenticated Streamable HTTP MCP",
    "Model-supplied selectors never grant authority",
    "immutable destination tuple",
    "multi-hop audience chain",
    "PostgreSQL 16",
    "sole grant authority",
    "PostgreSQL 18",
    "required only when the optional KnowledgeProvider",
    "memory-only deployment remains valid",
    "authorization and deletion epochs",
    "epoch-and-tombstone journal",
    "RPO at most five minutes",
    "RTO at most four hours",
    "one-use, short-lived instance nonce",
    "stale same-UID process",
    "instructionAuthority: none",
    "contentTaint: untrusted_source",
    "access-plane approval service",
    "one-use redemption state",
    "stable citation receipt ID, never the expiring hydration handle",
    "knowledge-provider.query-features.v1",
    "memory-only discovery advertises only `search_trusted_memory`",
    "Gate B implementation exit proof",
    "a tests-first plan, a mutation plan",
    "Bearer-only access",
    "tokens are not accepted",
    "DPoP proof-of-possession",
    "certificate binding",
    "remote runtime implementation remains blocked",
    "deployment remains blocked",
    "private evidence remains blocked",
    "production activation remains blocked",
    "team access remains blocked",
    "managed hosting remains blocked"
  ], failures);

  requireAll(api, apiPath, [
    "Authentication-Derived Authorization Context",
    "immutable destination tuple",
    "complete multi-hop audience chain",
    "Bearer-only access tokens fail before policy evaluation",
    "copied valid token without its bound key or certificate",
    "one-use opaque citation handle",
    "atomically redeems",
    "PostgreSQL 16 policy is the sole grant authority",
    "epoch-and-tombstone journal",
    "immutable server-side record binds provider, source, segment, source version",
    "receipt resolution never recreates an expired or redeemed handle",
    "derived from server-side receipt and",
    "authorizationEpoch",
    "audienceChainDigest"
  ], failures);

  requireAll(mcp, mcpPath, [
    "Transport-Derived Fields",
    "sender-constrained DPoP or mTLS proof binding",
    "MCP tool arguments must not supply grants",
    "knowledge-provider.query-features.v1",
    "one-use opaque citation handle",
    "### `get_source_evidence`",
    "exactly one short-lived opaque hydration handle",
    "### `propose_memory_candidate`",
    "stable citation receipt IDs, never expiring hydration handles",
    "mutation authorization bound to principal, client",
    "access-plane approval service",
    "Memory-only discovery advertises only `search_trusted_memory`",
    "Discovery is readiness-sensitive",
    "approval remains outside MCP"
  ], failures);

  requireAll(database, databasePath, [
    "one mandatory policy/memory store and one conditional",
    "PostgreSQL 16",
    "sole grant authority",
    "PostgreSQL 18",
    "required only when evidence mode is enabled",
    "provider-local source ACL metadata",
    "zero active-policy RPO",
    "epoch-and-tombstone journal",
    "cross-store backup-epoch mismatch"
  ], failures);

  requireAll(threat, threatPath, [
    "immutable",
    "audience hop",
    "sole grant authority",
    "contentTaint: untrusted_source",
    "sender constraint",
    "bearer-only",
    "Destination substitution",
    "Split-brain revocation",
    "Citation replay",
    "Stale same-UID model peer"
  ], failures);

  requireAll(deployment, deploymentPath, [
    "Gate A: architecture definition",
    "Gate B: implementation",
    "Gate C: synthetic pilot",
    "Gate D: low-risk data",
    "Gate E: private production",
    "Gate F: team access",
    "Remote MCP implementation remains blocked"
  ], failures);

  validateMatrix(matrix, failures);

  const forbiddenClaims = [
    /PostgreSQL 17\/18/i,
    /model-supplied selectors grant authority/i,
    /client-supplied authority is accepted/i,
    /tool payloads? (?:may|can) (?:supply|grant|override) authority/i,
    /destination (?:tuple|identity) (?:may|can) come from (?:the )?(?:client|model|tool payload)/i,
    /(?:client|model|tool payload)[^\n]{0,80}\b(?:may|can|is allowed to)\b[^\n]{0,80}\b(?:authorize|choose|supply|grant|override|assert)\b[^\n]{0,80}\b(?:access|identity|principal|namespace|capability|destination|audience|scope|authority)\b/i,
    /(?:^|\n)(?:this ADR|Gate A|issue #286)\s+(?:authorizes|approves|permits)\s+(?:the\s+)?(?:remote\s+)?(?:runtime implementation|runtime code|deployment|private evidence|production activation|team access|managed hosting)(?:\.|\n|$)/i,
    /(?:^|\n)(?:remote runtime|runtime implementation|deployment|private evidence|production activation|team access|managed hosting)[^\n]{0,40}\b(?:may proceed|is (?:now )?authorized|is (?:now )?permitted|is (?:now )?allowed|has approval)\b/i,
    /(?:^|\n)remote runtime implementation is approved(?:\.|\n|$)/i,
    /(?:^|\n)deployment is approved(?:\.|\n|$)/i,
    /(?:^|\n)private evidence is approved(?:\.|\n|$)/i,
    /(?:^|\n)production activation is approved(?:\.|\n|$)/i,
    /(?:^|\n)managed hosting is approved(?:\.|\n|$)/i
  ];
  for (const pattern of forbiddenClaims) {
    if (pattern.test(allDocs)) {
      failures.push(`architecture documents contain forbidden contradictory claim: ${pattern}`);
    }
  }

  return failures;
}

function validateMatrix(matrix, failures) {
  const rows = new Map();
  for (const line of matrix.split("\n")) {
    if (!/^\| (?:ID|DATA|CIT|TOOL|AUTH|OPS|DB|MODEL)-\d+ \|/.test(line)) {
      continue;
    }
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 4) {
      failures.push(`${matrixPath}: malformed acceptance row ${JSON.stringify(line)}`);
      continue;
    }
    const [id, scenario, expectedProof, gate] = cells;
    if (rows.has(id)) {
      failures.push(`${matrixPath}: duplicate acceptance ID ${id}`);
    }
    rows.set(id, { scenario, expectedProof, gate });
  }

  for (const id of requiredMatrixIds) {
    const row = rows.get(id);
    if (!row) {
      failures.push(`${matrixPath}: missing required acceptance ID ${id}`);
      continue;
    }
    if (!row.scenario || !row.expectedProof) {
      failures.push(`${matrixPath}: ${id} requires scenario and expected proof`);
    }
    const expectedGate = gateFIds.has(id) ? "Gate F" : "Gate B exit";
    if (row.gate !== expectedGate) {
      failures.push(`${matrixPath}: ${id} must be assigned to ${expectedGate}, received ${row.gate}`);
    }
  }
  for (const id of rows.keys()) {
    if (!requiredMatrixIds.includes(id)) {
      failures.push(`${matrixPath}: unreviewed acceptance ID ${id}`);
    }
  }
  if (rows.size !== requiredMatrixIds.length) {
    failures.push(`${matrixPath}: expected exactly ${requiredMatrixIds.length} acceptance rows, received ${rows.size}`);
  }

  requireAll(matrix, matrixPath, [
    "Gate B entry",
    "Gate B exit",
    "Gate C",
    "npm run runtime:global-owner-hosted-v1-architecture:smoke",
    "npm run runtime:global-owner-hosted-v1-architecture:scope",
    "independent security, consistency, and verification reviews report no blocker"
  ], failures);
}

function runMutationSmoke(pkg, sourceDocs) {
  const failures = [];
  const expectArchitectureFailure = (label, mutate) => {
    const mutated = new Map(sourceDocs);
    mutate(mutated);
    if (validateArchitecture(pkg, mutated).length === 0) {
      failures.push(`${label}: mutated architecture unexpectedly passed`);
    }
  };

  expectArchitectureFailure("contradictory authority", (mutated) => {
    mutated.set(adrPath, `${mutated.get(adrPath)}\nModel-supplied selectors grant authority.\n`);
  });
  expectArchitectureFailure("paraphrased contradictory authority", (mutated) => {
    mutated.set(adrPath, `${mutated.get(adrPath)}\nThe model may authorize access by choosing namespace and destination selectors.\n`);
  });
  expectArchitectureFailure("missing matrix row", (mutated) => {
    mutated.set(matrixPath, mutated.get(matrixPath).replace(/^\| MODEL-05 .*\n/m, ""));
  });
  expectArchitectureFailure("wrong gate assignment", (mutated) => {
    mutated.set(matrixPath, mutated.get(matrixPath).replace(
      /^(\| DB-07 .* \|) Gate B exit \|$/m,
      "$1 Gate C |"
    ));
  });
  expectArchitectureFailure("deployment approval drift", (mutated) => {
    mutated.set(deploymentPath, `${mutated.get(deploymentPath)}\nDeployment is approved.\n`);
  });
  expectArchitectureFailure("paraphrased deployment approval drift", (mutated) => {
    mutated.set(deploymentPath, `${mutated.get(deploymentPath)}\nDeployment is now authorized.\n`);
  });

  if (validateScope(["docs/adr/0002-global-owner-hosted-runtime-v1.md"]).length !== 0) {
    failures.push("allowed documentation path unexpectedly failed scope validation");
  }
  if (validateScope([]).length !== 0) {
    failures.push("clean-checkout Gate A manifest unexpectedly failed scope validation");
  }
  if (validateScope(["src/hosted-runtime.ts"]).length === 0) {
    failures.push("forbidden runtime path unexpectedly passed scope validation");
  }
  if (validateScope(["deploy/global-owner-hosted.yaml"]).length === 0) {
    failures.push("forbidden deployment path unexpectedly passed scope validation");
  }

  return failures;
}

function validateScope(paths) {
  const failures = [];
  if (paths.length === 0) {
    for (const path of gateAAllowedPaths) {
      try {
        execFileSync("git", ["ls-files", "--error-unmatch", path], {
          encoding: "utf8",
          stdio: "pipe"
        });
      } catch {
        failures.push(`Gate A clean-checkout manifest path is not tracked: ${path}`);
      }
    }
    return failures;
  }
  for (const path of paths) {
    if (!gateAAllowedPaths.has(path)) {
      failures.push(`Gate A forbids changed path: ${path}`);
    }
  }
  return failures;
}

function countScopeClasses(paths) {
  return {
    runtime: paths.filter((path) => /^(?:apps|src|packages)\//i.test(path)).length,
    deployment: paths.filter((path) => /(?:^|\/)(?:deploy|deployment|infra|infrastructure|terraform|helm|k8s|docker-compose|Dockerfile)(?:\/|\.|$)/i.test(path)).length,
    privateArtifacts: paths.filter((path) => /(?:^|\/)(?:\.env|secrets?|private|credentials?|[^/]+\.(?:pem|key))(?:\/|\.|$)/i.test(path)).length
  };
}

function collectChangedPaths() {
  const commands = [
    ["diff", "--cached", "--name-only"],
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"]
  ];
  const paths = new Set();
  for (const args of commands) {
    const output = execFileSync("git", args, { encoding: "utf8" });
    for (const path of output.split("\n").map((value) => value.trim()).filter(Boolean)) {
      paths.add(path);
    }
  }
  if (paths.size > 0) {
    return [...paths].sort();
  }

  const githubDiff = collectGitHubGateADiff();
  if (githubDiff !== null) {
    return githubDiff;
  }

  const branch = safeGit(["branch", "--show-current"]);
  if (branch === gateABranchName) {
    const base = safeGit(["rev-parse", "origin/main"]);
    if (!base) {
      throw new Error("Gate A clean branch requires origin/main for scope validation");
    }
    return splitPaths(execFileSync("git", ["diff", "--name-only", `${base}..HEAD`], {
      encoding: "utf8"
    }));
  }

  return [];
}

function collectGitHubGateADiff() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return null;

  let event;
  try {
    event = JSON.parse(readFileSync(eventPath, "utf8"));
  } catch (error) {
    throw new Error(`Gate A cannot read GitHub event payload: ${error.message}`);
  }

  const pullRequest = event.pull_request;
  if (pullRequest?.head?.ref === gateABranchName) {
    const baseSha = pullRequest.base?.sha;
    const headSha = pullRequest.head?.sha;
    validateGitHubCommit("base", baseSha);
    validateGitHubCommit("head", headSha);

    return splitPaths(execFileSync("git", ["diff", "--name-only", `${baseSha}..${headSha}`], {
      encoding: "utf8"
    }));
  }

  if (event.ref !== `refs/heads/${gateABranchName}`) {
    return null;
  }

  const headSha = event.after;
  validateGitHubCommit("push head", headSha);
  const checkedOutHead = safeGit(["rev-parse", "HEAD"]);
  if (checkedOutHead !== headSha) {
    throw new Error("Gate A GitHub push head does not match the checked-out commit");
  }

  let baseSha = event.before;
  if (typeof baseSha === "string" && /^0+$/.test(baseSha)) {
    const parents = safeGit(["show", "-s", "--format=%P", headSha])
      .split(/\s+/)
      .filter(Boolean);
    if (parents.length !== 1) {
      throw new Error("Gate A initial branch push requires exactly one parent commit");
    }
    [baseSha] = parents;
  }
  validateGitHubCommit("push base", baseSha);

  return splitPaths(execFileSync("git", ["diff", "--name-only", `${baseSha}..${headSha}`], {
    encoding: "utf8"
  }));
}

function validateGitHubCommit(label, sha) {
  if (typeof sha !== "string" || !/^[a-f0-9]{40,64}$/i.test(sha)) {
    throw new Error(`Gate A GitHub ${label} SHA is missing or invalid`);
  }
  ensureGitCommit(sha);
}

function ensureGitCommit(sha) {
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
  } catch {
    execFileSync("git", ["fetch", "--no-tags", "--depth=1", "origin", sha], {
      stdio: "ignore"
    });
  }
}

function safeGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function splitPaths(output) {
  return [...new Set(output.split("\n").map((value) => value.trim()).filter(Boolean))].sort();
}

async function readAvailableDocs(paths) {
  const result = new Map();
  for (const path of paths) {
    try {
      result.set(path, await readFile(path, "utf8"));
    } catch {
      result.set(path, "");
    }
  }
  return result;
}

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    console.error(`missing required path: ${path}`);
    process.exit(1);
  }
}

function rangeIds(prefix, count) {
  return Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, "0")}`);
}

function requireAll(text, reason, requiredTexts, failures) {
  for (const requiredText of requiredTexts) {
    if (!text.includes(requiredText)) {
      failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
    }
  }
}

function assertEqual(actual, expected, reason, failures) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function finishOrFail(failures, title) {
  if (failures.length === 0) {
    return;
  }
  console.error(`failed ${title}`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}: ${value}`);
  }
}
