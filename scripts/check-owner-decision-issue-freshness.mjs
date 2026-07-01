import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";

const expectedIssues = [
  {
    number: 255,
    command: "npm run release:decision-preflight",
    markers: [
      "ok release decision preflight ready",
      "blocked release implementation approval missing"
    ]
  },
  {
    number: 256,
    command: "npm run repository:branch-governance-preflight",
    markers: [
      "ok branch governance decision preflight ready",
      "blocked branch governance implementation approval missing"
    ]
  },
  {
    number: 257,
    command: "npm run runtime:prd-decision-preflight",
    markers: [
      "ok hosted runtime PRD decision preflight ready",
      "blocked hosted runtime PRD approval missing"
    ]
  },
  {
    number: 258,
    command: "npm run contribution:terms-decision-preflight",
    markers: [
      "ok contribution terms PRD decision preflight ready",
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
    "body,title,state,url"
  ]);
  const body = issue.body ?? "";
  const refreshCount = (body.match(/^## Latest Status Refresh$/gmu) ?? []).length;
  const currentSha = body.includes(head);
  const currentRun = body.includes(latestRun.url);
  const finalPreflight = finalPreflightMarkers.every((marker) => body.includes(marker));
  const issueCommand = body.includes(expectedIssue.command);
  const issueMarkers = expectedIssue.markers.every((marker) => body.includes(marker));
  const approvalStillBlocked = body.includes("This refresh does not record owner approval or approve blocked work.");

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
  if (!approvalStillBlocked) {
    failures.push(`#${expectedIssue.number} must state the refresh does not record owner approval`);
  }

  issueResults.push({
    number: expectedIssue.number,
    title: issue.title,
    state: issue.state,
    url: issue.url,
    refreshCount,
    currentSha,
    currentRun,
    finalPreflight,
    issueCommand,
    issueMarkers,
    approvalStillBlocked
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
    ["Approval boundary", result.approvalStillBlocked ? "blocked" : "missing"]
  ]);
}

printSection("Owner Decision Issue Freshness Result");
console.log("ok owner decision issue freshness ready");
console.log("ok owner decision issue bodies current");
console.log("blocked owner approvals missing");

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
