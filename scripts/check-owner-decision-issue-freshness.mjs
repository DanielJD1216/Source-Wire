import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";

const expectedIssues = [
  {
    number: 255,
    approvalName: "release implementation",
    exactApprovalText:
      "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.",
    command: "npm run release:decision-preflight",
    markers: [
      "Release implementation approval: recorded in issue comment",
      "Exact approval         : recorded",
      "ok exact release implementation approval recorded",
      "ok release decision preflight ready",
      "ok release execution completed",
      "ok npm package published @source-wire/contracts@0.1.0",
      "ok github release published v0.1.0"
    ]
  },
  {
    number: 256,
    approvalName: "branch governance implementation",
    exactApprovalText:
      "Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.",
    command: "npm run repository:branch-governance-preflight",
    markers: [
      "ok branch governance decision preflight ready",
      "ok branch governance execution packet current",
      "blocked branch governance implementation approval missing"
    ]
  },
  {
    number: 257,
    approvalName: "hosted runtime PRD",
    exactApprovalText:
      "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit.",
    command: "npm run runtime:prd-decision-preflight",
    markers: [
      "ok hosted runtime PRD decision preflight ready",
      "ok hosted runtime PRD execution packet current",
      "blocked hosted runtime PRD approval missing"
    ]
  },
  {
    number: 258,
    approvalName: "contribution terms PRD",
    exactApprovalText:
      "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit.",
    command: "npm run contribution:terms-decision-preflight",
    markers: [
      "ok contribution terms PRD decision preflight ready",
      "ok contribution terms PRD execution packet current",
      "blocked contribution terms PRD approval missing"
    ]
  }
];

const finalPreflightMarkers = [
  "ok world share final preflight ready",
  "ok world share preflight current",
  "ok release decision preflight current",
  "ok branch governance decision preflight current",
  "ok hosted runtime PRD decision preflight current",
  "ok contribution terms PRD decision preflight current",
  "ok reviewer labels current",
  "ok owner decision issue boundary current",
  "ok owner decision issue freshness current",
  "blocked production launch channels",
  "blocked owner approvals missing"
];

const failures = [];

const head = (await run("git", ["rev-parse", "HEAD"])).stdout.trim();
const originMain = (await run("git", ["rev-parse", "origin/main"])).stdout.trim();
if (head !== originMain) {
  failures.push(`local HEAD must match origin/main: ${head} != ${originMain}`);
}

const latestRun = await getLatestPackageChecksRun();
if (latestRun.headSha !== head) {
  failures.push(`latest Package Checks head SHA must match local HEAD: ${latestRun.headSha} != ${head}`);
}
if (latestRun.status !== "completed" || latestRun.conclusion !== "success") {
  failures.push(`latest Package Checks must be successful: ${JSON.stringify(latestRun)}`);
}

const issueResults = [];
for (const expectedIssue of expectedIssues) {
  const issue = await ghJson([
    "issue",
    "view",
    String(expectedIssue.number),
    "--repo",
    repo,
    "--json",
    "body,comments,title,state,url"
  ]);
  const body = issue.body ?? "";
  const comments = Array.isArray(issue.comments) ? issue.comments : [];
  const approvalComments = comments.filter((comment) => comment.body?.includes(expectedIssue.exactApprovalText));
  const approvalRecordPresent = hasApprovalRecordSection(body, expectedIssue.exactApprovalText);
  const exactApprovalRecorded = approvalRecordPresent || approvalComments.length > 0;
  const refreshCount = (body.match(/^## Latest Status Refresh$/gmu) ?? []).length;
  const currentSha = body.includes(head);
  const currentRun = body.includes(latestRun.url);
  const finalPreflight = finalPreflightMarkers.every((marker) => body.includes(marker));
  const issueCommand = body.includes(expectedIssue.command);
  const issueMarkers = expectedIssue.markers.every((marker) => body.includes(marker));
  const refreshBoundaryPresent = body.includes("This refresh does not record owner approval or approve blocked work.");

  if (refreshCount !== 1) {
    failures.push(`#${expectedIssue.number} must have exactly one Latest Status Refresh section, found ${refreshCount}`);
  }
  if (!currentSha) {
    failures.push(`#${expectedIssue.number} must reference current Source-Wire SHA ${head}`);
  }
  if (!currentRun) {
    failures.push(`#${expectedIssue.number} must reference current Package Checks run ${latestRun.url}`);
  }
  if (!finalPreflight) {
    failures.push(`#${expectedIssue.number} must include current final-preflight proof markers`);
  }
  if (!issueCommand) {
    failures.push(`#${expectedIssue.number} must include issue-specific command ${expectedIssue.command}`);
  }
  if (!issueMarkers) {
    failures.push(`#${expectedIssue.number} must include issue-specific gate proof markers`);
  }
  if (!refreshBoundaryPresent) {
    failures.push(`#${expectedIssue.number} must state the refresh does not record owner approval`);
  }

  issueResults.push({
    number: expectedIssue.number,
    approvalName: expectedIssue.approvalName,
    title: issue.title,
    state: issue.state,
    url: issue.url,
    refreshCount,
    currentSha,
    currentRun,
    finalPreflight,
    issueCommand,
    issueMarkers,
    exactApprovalRecorded,
    refreshBoundaryPresent
  });
}

if (failures.length > 0) {
  console.error("failed owner decision issue freshness");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Owner Decision Issue Freshness");
console.log("This owner-side check is read-only.");
console.log("It verifies public owner-decision issue bodies match current Source-Wire commit and latest green Package Checks.");
console.log("It does not edit issues, record owner approval, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");
printRows([
  ["Source-Wire SHA", head],
  ["Package Checks", `${latestRun.conclusion} ${latestRun.url}`]
]);

for (const result of issueResults) {
  printSection(`#${result.number} ${result.title}`);
  printRows([
    ["URL", result.url],
    ["State", result.state],
    ["Latest Status Refresh count", String(result.refreshCount)],
    ["Current SHA", result.currentSha ? "present" : "missing"],
    ["Current Package Checks run", result.currentRun ? "present" : "missing"],
    ["Final preflight proof", result.finalPreflight ? "present" : "missing"],
    ["Issue command", result.issueCommand ? "present" : "missing"],
    ["Issue gate proof", result.issueMarkers ? "present" : "missing"],
    ["Approval status", result.exactApprovalRecorded ? "recorded" : "not recorded"],
    ["Refresh boundary", result.refreshBoundaryPresent ? "does not record approval" : "missing"]
  ]);
}

printSection("Owner Decision Issue Freshness Result");
console.log("ok owner decision issue freshness ready");
console.log("ok owner decision issue bodies current");
console.log("blocked owner approvals or execution paths missing");

function hasApprovalRecordSection(body, exactApprovalText) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactApprovalText);
}

async function getLatestPackageChecksRun() {
  const runs = await ghJson([
    "run",
    "list",
    "--repo",
    repo,
    "--branch",
    "main",
    "--limit",
    "1",
    "--json",
    "headSha,status,conclusion,url"
  ]);
  const [runInfo] = runs;
  if (!runInfo) {
    throw new Error("latest Package Checks run is missing");
  }

  return runInfo;
}

function ghJson(args) {
  return run("gh", args, { maxBuffer: 1024 * 1024 * 20 }).then((result) => JSON.parse(result.stdout));
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd: process.cwd(),
        maxBuffer: options.maxBuffer ?? 1024 * 1024 * 10
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });
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
