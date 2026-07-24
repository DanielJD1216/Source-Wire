import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const expectedCheckRun = "Source-Wire package checks";
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];
const rulesetApprovalText =
  "Approved for a future Source-Wire repository ruleset implementation unit: create a repository ruleset for main after current Package Checks are green. Require Package Checks before updates, block force pushes, block branch deletion, document bypass policy, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public");

for (const requiredPath of [
  "docs/internal/repository-ruleset-governance-preflight.md",
  "docs/internal/branch-governance-approval-request.md",
  "docs/internal/branch-governance-implementation-plan.md",
  "docs/internal/branch-governance-execution-packet.md",
  "docs/reference/repository-metadata.md",
  "docs/internal/owner-launch-checklist.md"
]) {
  await assertPathExists(requiredPath);
}

const preflightDoc = await readFile("docs/internal/repository-ruleset-governance-preflight.md", "utf8");
const approvalRequest = await readFile("docs/internal/branch-governance-approval-request.md", "utf8");
const implementationPlan = await readFile("docs/internal/branch-governance-implementation-plan.md", "utf8");

for (const [documentName, text] of [
  ["repository ruleset governance preflight", preflightDoc],
  ["branch governance approval request", approvalRequest],
  ["branch governance implementation plan", implementationPlan]
]) {
  assertIncludes(text, rulesetApprovalText, documentName);
}

for (const requiredText of [
  "Status: owner-side read-only preflight.",
  "blocked repository ruleset approval missing",
  "blocked repository ruleset implementation",
  "This preflight does not create repository rulesets, enable repository rulesets, publish npm, create a GitHub release, create tags, deploy services, accept code contributions, add hosted runtime behavior, or approve production runtime use."
]) {
  assertIncludes(preflightDoc, requiredText, "repository ruleset governance preflight");
}

const repoApi = await ghJson(["api", `repos/${repo}`]);
const mainBranch = await ghJson(["api", `repos/${repo}/branches/main`]);
const branchProtection = mainBranch.protected
  ? await ghJson(["api", `repos/${repo}/branches/main/protection`])
  : null;
const rulesets = await ghJson(["api", `repos/${repo}/rulesets`]);
const latestRun = await ghJson([
  "api",
  `repos/${repo}/actions/workflows/package-checks.yml/runs?per_page=1`
]);
const remoteHead = (await run("git", ["rev-parse", "origin/main"])).trim();

assertEqual(repoApi.default_branch, "main", "default branch must stay main");
assertEqual(mainBranch.name, "main", "main branch must be readable");
assertEqual(mainBranch.commit?.sha, remoteHead, "live main branch must match origin/main");

if (!mainBranch.protected) {
  failures.push("minimal branch protection must remain enabled before any ruleset governance decision");
}

const requiredContexts = branchProtection?.required_status_checks?.contexts ?? [];
if (!requiredContexts.includes(expectedCheckRun)) {
  failures.push(`branch protection must require ${JSON.stringify(expectedCheckRun)} before ruleset governance`);
}

if (branchProtection?.allow_force_pushes?.enabled !== false) {
  failures.push("branch protection must keep force pushes disabled");
}

if (branchProtection?.allow_deletions?.enabled !== false) {
  failures.push("branch protection must keep branch deletion disabled");
}

if (!Array.isArray(rulesets)) {
  failures.push("GitHub rulesets response must be an array");
}

const activeRulesets = Array.isArray(rulesets)
  ? rulesets.filter((ruleset) => ruleset.enforcement !== "disabled")
  : [];
if (activeRulesets.length > 0) {
  failures.push("repository rulesets must stay inactive until exact owner approval opens a ruleset implementation unit");
}

const [runInfo] = latestRun.workflow_runs ?? [];
if (!runInfo) {
  failures.push("latest Package Checks run is missing");
} else {
  assertEqual(runInfo.name, "Package Checks", "latest workflow name must be Package Checks");
  assertEqual(runInfo.status, "completed", "latest Package Checks run must be completed");
  assertEqual(runInfo.conclusion, "success", "latest Package Checks run must be successful");
  assertEqual(runInfo.head_sha, remoteHead, "latest Package Checks run must match origin/main");
}

if (failures.length > 0) {
  console.error("failed repository ruleset governance preflight");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Repository Ruleset Governance Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It does not create repository rulesets, enable repository rulesets, publish npm, create a GitHub release, create tags, deploy services, accept code contributions, add hosted runtime behavior, or approve production runtime use.");
printRows([
  ["Repository", repo],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Default branch", repoApi.default_branch],
  ["origin/main SHA", remoteHead],
  ["Latest Package Checks", `${runInfo.conclusion} ${runInfo.html_url}`],
  ["Branch protection", "enabled"],
  ["Required branch check", expectedCheckRun],
  ["Active rulesets", "none"],
  ["Ruleset approval", "missing"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok repository ruleset governance preflight ready");
console.log("ok minimal branch protection current");
console.log("ok Package Checks current");
console.log("blocked repository ruleset approval missing");
console.log("blocked repository ruleset implementation");

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    failures.push(`missing required path: ${path}`);
  }
}

function ghJson(args) {
  return run("gh", args).then((stdout) => JSON.parse(stdout));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      resolve(stdout);
    });
  });
}

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(text, requiredText, reason) {
  if (!text.includes(requiredText)) {
    failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
  }
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
