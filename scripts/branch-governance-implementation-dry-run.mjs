import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const owner = "DanielJD1216";
const repoName = "Source-Wire";
const targetBranch = "main";
const expectedCheckRun = "Source-Wire package checks";
const branchGovernanceIssue = 256;
const exactApprovalText =
  "Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

const remoteHead = (await run("git", ["rev-parse", "origin/main"])).trim();
const repoApi = await ghJson(["api", `repos/${repo}`]);
const mainBranch = await ghJson(["api", `repos/${repo}/branches/${targetBranch}`]);
const checkRuns = await ghJson(["api", `repos/${repo}/commits/${remoteHead}/check-runs`]);
const issue = await ghJson([
  "issue",
  "view",
  String(branchGovernanceIssue),
  "--repo",
  repo,
  "--json",
  "number,title,state,body,comments,url"
]);

assertEqual(repoApi.default_branch, targetBranch, "default branch must remain main");
assertEqual(mainBranch.name, targetBranch, "branch name must remain main");
assertEqual(mainBranch.commit?.sha, remoteHead, "live main branch must match origin/main");

const packageCheckRun = checkRuns.check_runs?.find((checkRun) => checkRun.name === expectedCheckRun);
if (!packageCheckRun) {
  failures.push(`latest origin/main must include check run ${JSON.stringify(expectedCheckRun)}`);
} else {
  assertEqual(packageCheckRun.status, "completed", "Package Checks status must be completed");
  assertEqual(packageCheckRun.conclusion, "success", "Package Checks conclusion must be success");
}

if (issue.number !== branchGovernanceIssue) {
  failures.push(`owner decision issue must be #${branchGovernanceIssue}`);
}

if (issue.state !== "OPEN") {
  failures.push(`owner decision issue #${branchGovernanceIssue} must stay open until execution is complete`);
}

const comments = Array.isArray(issue.comments) ? issue.comments : [];
const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "", exactApprovalText);
const approvalComments = comments.filter((comment) => comment.body?.includes(exactApprovalText));
const exactApprovalRecorded = approvalRecordPresent || approvalComments.length > 0;

const branchProtectionPayload = {
  required_status_checks: {
    strict: false,
    contexts: [expectedCheckRun]
  },
  enforce_admins: false,
  required_pull_request_reviews: null,
  restrictions: null,
  allow_force_pushes: false,
  allow_deletions: false,
  required_linear_history: false,
  required_conversation_resolution: false,
  lock_branch: false,
  allow_fork_syncing: true
};

if (failures.length > 0) {
  console.error("failed branch governance implementation dry run");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Branch Governance Implementation Dry Run");
console.log("This owner-side dry run is read-only.");
console.log("It does not enable branch protection, create repository rulesets, publish npm, create a GitHub release, create tags, deploy services, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");
printRows([
  ["Repository", repo],
  ["Target branch", targetBranch],
  ["origin/main", remoteHead],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Required check context", expectedCheckRun],
  ["Latest check status", `${packageCheckRun.status}/${packageCheckRun.conclusion}`],
  ["Current branch protection", mainBranch.protected ? "enabled" : "not enabled"],
  ["Owner approval issue", `#${issue.number} ${issue.title}`],
  ["Exact approval", exactApprovalRecorded ? "recorded" : "not recorded"],
  ["Approval comments", String(approvalComments.length)]
]);

printSection("Future Branch Protection Payload");
console.log(JSON.stringify(branchProtectionPayload, null, 2));

printSection("Future Reviewed API Shape");
console.log(`gh api --method PUT repos/${owner}/${repoName}/branches/${targetBranch}/protection --input <reviewed-payload.json>`);

printSection("Future Verification Commands");
console.log("npm run repository:live-branch");
console.log("npm run world:live-status");
console.log("npm run publish:readiness");

console.log("");
console.log("ok branch governance implementation dry run ready");
console.log("ok branch protection payload documented");
console.log(`ok required status check resolved ${expectedCheckRun}`);
if (exactApprovalRecorded) {
  console.log("ok branch governance implementation approval recorded");
  console.log("blocked live branch governance mutation still requires focused implementation step");
} else {
  console.log("blocked branch governance implementation approval missing");
}

function hasApprovalRecordSection(body, approvalText) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(approvalText);
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
