import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";
const args = parseArgs(process.argv.slice(2));

const completedDecisionIssues = [
  {
    number: 255,
    title: "Owner decision: approve first public release path",
    approvalName: "release implementation",
    exactApprovalText:
      "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms."
  },
  {
    number: 256,
    title: "Owner decision: approve branch governance path",
    approvalName: "branch governance implementation",
    exactApprovalText:
      "Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions."
  },
  {
    number: 257,
    title: "Owner decision: open hosted runtime PRD path",
    approvalName: "hosted runtime PRD",
    exactApprovalText:
      "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit."
  },
  {
    number: 258,
    title: "Owner decision: define contribution terms before accepting code",
    approvalName: "contribution terms PRD",
    exactApprovalText:
      "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit."
  }
];

const expectedOpenIssues = [];
const expectedHostedRuntimePlanningIssueTitles = [
  "Hosted Runtime Threat Model And Trust Boundary",
  "API Server Runtime Contract",
  "MCP Server Runtime Contract",
  "Database Posture And Data Lifecycle",
  "Public-Safe Fixture And Verification Plan",
  "Deployment Boundary And Runtime Stop Conditions"
];

const issues = args.fixture === "hosted-runtime-planning"
  ? expectedHostedRuntimePlanningIssueTitles.map((title, index) => ({
      number: 900 + index,
      title,
      state: "OPEN",
      url: `https://example.invalid/source-wire/planning/${index + 1}`
    }))
  : await ghJson([
      "issue",
      "list",
      "--repo",
      repo,
      "--state",
      "open",
      "--limit",
      "100",
      "--json",
      "number,title,state,url"
    ]);

const expectedByNumber = new Map(expectedOpenIssues.map((issue) => [issue.number, issue]));
const expectedPlanningTitleSet = new Set(expectedHostedRuntimePlanningIssueTitles);
const openPlanningIssues = issues.filter((issue) => expectedPlanningTitleSet.has(issue.title));
const unexpectedOpenIssues = issues.filter((issue) => !expectedPlanningTitleSet.has(issue.title));
const failures = [];
const completedIssueStates = [];

if (args.fixture === "hosted-runtime-planning") {
  for (const completedIssue of completedDecisionIssues) {
    completedIssueStates.push({
      ...completedIssue,
      issue: {
        state: "CLOSED",
        title: completedIssue.title,
        url: `https://example.invalid/source-wire/owner-decision/${completedIssue.number}`
      },
      exactApprovalRecorded: true
    });
  }
} else {
  for (const completedIssue of completedDecisionIssues) {
    const issue = await ghJson([
      "issue",
      "view",
      String(completedIssue.number),
      "--repo",
      repo,
      "--json",
      "body,comments,state,title,url"
    ]);
    const comments = Array.isArray(issue.comments) ? issue.comments : [];
    const approvalComments = comments.filter((comment) => comment.body?.includes(completedIssue.exactApprovalText));
    const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "", completedIssue.exactApprovalText);
    const exactApprovalRecorded = approvalRecordPresent || approvalComments.length > 0;

    if (issue.title !== completedIssue.title) {
      failures.push(`unexpected title for completed decision #${completedIssue.number}: expected "${completedIssue.title}", received "${issue.title}"`);
    }
    if (issue.state !== "CLOSED") {
      failures.push(`completed owner decision issue #${completedIssue.number} must be closed, received ${issue.state}`);
    }
    if (!exactApprovalRecorded) {
      failures.push(`completed owner decision issue #${completedIssue.number} must retain exact ${completedIssue.approvalName} approval evidence`);
    }

    completedIssueStates.push({
      ...completedIssue,
      issue,
      exactApprovalRecorded
    });
  }
}

for (const actualIssue of unexpectedOpenIssues) {
  if (!expectedByNumber.has(actualIssue.number)) {
    failures.push(`unexpected open issue #${actualIssue.number}: ${actualIssue.title}`);
  }
}

printSection("Source-Wire Owner Open Issues Status");
console.log("This owner-side status check is read-only.");
console.log("It verifies that the public open issue surface has no unresolved owner-decision gates.");
console.log("It does not close issues, create issues, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.");
if (args.fixture === "hosted-runtime-planning") {
  console.log("Fixture mode: hosted-runtime-planning. No GitHub API calls are made.");
}

printSection("Completed Owner Decisions");
for (const issue of completedIssueStates.toSorted((left, right) => left.number - right.number)) {
  console.log(`#${issue.number} ${issue.title}`);
  console.log(`State: ${issue.issue.state}`);
  console.log(`URL: ${issue.issue.url}`);
}

printSection("Open Issues");
if (issues.length === 0) {
  console.log("No open issues found.");
} else {
  for (const issue of issues.toSorted((left, right) => left.number - right.number)) {
    console.log(`#${issue.number} ${issue.title}`);
    console.log(`URL: ${issue.url}`);
  }
}

if (openPlanningIssues.length > 0) {
  printSection("Expected Hosted Runtime Planning Issues");
  for (const issue of openPlanningIssues.toSorted((left, right) => left.number - right.number)) {
    console.log(`#${issue.number} ${issue.title}`);
    console.log(`URL: ${issue.url}`);
  }
}

printSection("Owner Open Issues Result");
console.log("ok owner open issue boundary readable");

if (failures.length > 0) {
  for (const failure of failures) {
    console.log(`failed ${failure}`);
  }
  process.exit(1);
}

for (const issue of completedIssueStates) {
  console.log(`ok completed owner decision #${issue.number} closed`);
  console.log(`ok exact ${issue.approvalName} approval retained`);
}

console.log("ok no unresolved owner decision issues open");

if (openPlanningIssues.length > 0) {
  console.log("ok expected hosted runtime planning issues open");
}

console.log("ok all completed owner decision approvals retained");
if (openPlanningIssues.length === 0) {
  console.log("blocked hosted runtime child issue publication pending owner approval");
} else {
  console.log("blocked hosted runtime implementation");
}

function ghJson(args) {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`gh ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (parseError) {
        reject(new Error(`Unable to parse gh JSON: ${parseError.message}`));
      }
    });
  });
}

function hasApprovalRecordSection(body, exactApprovalText) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactApprovalText);
}

function parseArgs(rawArgs) {
  const parsed = {
    fixture: ""
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--fixture") {
      parsed.fixture = rawArgs[index + 1] ?? "";
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  if (parsed.fixture && parsed.fixture !== "hosted-runtime-planning") {
    console.error(`Unknown fixture: ${parsed.fixture}`);
    printUsage();
    process.exit(1);
  }

  return parsed;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run owner:open-issues-status");
  console.log("  npm run owner:open-issues-status -- --fixture hosted-runtime-planning");
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}
