import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const expectedCheckRun = "Source-Wire package checks";
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

const repoApi = await ghJson(["api", `repos/${repo}`]);
const mainBranch = await ghJson(["api", `repos/${repo}/branches/main`]);
const rulesets = await ghJson(["api", `repos/${repo}/rulesets`]);
const remoteHead = (await run("git", ["rev-parse", "origin/main"])).trim();
const branchProtection = mainBranch.protected
  ? await ghJson(["api", `repos/${repo}/branches/main/protection`])
  : null;

assertEqual(repoApi.default_branch, "main", "live GitHub default branch must stay main");
assertEqual(repoApi.allow_forking, true, "live GitHub fork setting should stay enabled for source-package reuse");
assertEqual(mainBranch.name, "main", "live GitHub branch name must be main");
assertEqual(mainBranch.commit?.sha, remoteHead, "live GitHub main branch must match origin/main");

if (!Array.isArray(rulesets)) {
  failures.push("GitHub rulesets response must be an array");
}

const requiredContexts = branchProtection?.required_status_checks?.contexts ?? [];
if (mainBranch.protected && !requiredContexts.includes(expectedCheckRun)) {
  failures.push(`branch protection must require ${JSON.stringify(expectedCheckRun)}`);
}

if (mainBranch.protected && branchProtection?.allow_force_pushes?.enabled !== false) {
  failures.push("branch protection must keep force pushes disabled");
}

if (mainBranch.protected && branchProtection?.allow_deletions?.enabled !== false) {
  failures.push("branch protection must keep branch deletion disabled");
}

if (failures.length > 0) {
  console.error("failed live branch governance");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const activeRulesets = rulesets.filter((ruleset) => ruleset.enforcement !== "disabled");
const protectedState = mainBranch.protected ? "enabled" : "not enabled";
const rulesetState = activeRulesets.length > 0 ? `${activeRulesets.length} active` : "none";
const requiredCheckState = mainBranch.protected ? requiredContexts.join(", ") || "none" : "not enabled";
const branchProtectionMarker = mainBranch.protected
  ? "ok branch protection enabled"
  : "blocked branch protection not enabled";
const requiredCheckMarker = mainBranch.protected
  ? `ok branch protection requires ${expectedCheckRun}`
  : "blocked branch protection required check not enabled";
const rulesetMarker = activeRulesets.length > 0
  ? "ok repository rulesets active"
  : "blocked repository rulesets not enabled";

printSection("Source-Wire Live Branch Governance");
printRows([
  ["Repository", repo],
  ["Default branch", repoApi.default_branch],
  ["Main branch", mainBranch.name],
  ["Main branch SHA", mainBranch.commit.sha],
  ["Local origin/main SHA", remoteHead],
  ["Forking", repoApi.allow_forking ? "enabled" : "disabled"],
  ["Branch protection", protectedState],
  ["Required branch check", requiredCheckState],
  ["Active rulesets", rulesetState],
  ["Version", packageJson.version],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok live branch governance readable");
console.log("ok main branch matches origin");
console.log(branchProtectionMarker);
console.log(requiredCheckMarker);
console.log(rulesetMarker);

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

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  for (const [label, value] of rows) {
    console.log(`${label}: ${value}`);
  }
}
