import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";

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
    number: 258,
    title: "Owner decision: define contribution terms before accepting code",
    approvalName: "contribution terms PRD",
    exactApprovalText:
      "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit."
  }
];

const expectedOpenIssues = [
  {
    number: 257,
    title: "Owner decision: open hosted runtime PRD path",
    approvalName: "hosted runtime PRD",
    exactApprovalText:
      "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit."
  }
];

const issues = await ghJson([
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
const actualByNumber = new Map(issues.map((issue) => [issue.number, issue]));
const failures = [];
const completedIssueStates = [];
const trackedIssueStates = [];

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

for (const expectedIssue of expectedOpenIssues) {
  const actualIssue = actualByNumber.get(expectedIssue.number);
  if (!actualIssue) {
    failures.push(`missing open owner decision issue #${expectedIssue.number}: ${expectedIssue.title}`);
    continue;
  }

  if (actualIssue.title !== expectedIssue.title) {
    failures.push(`unexpected title for #${expectedIssue.number}: expected "${expectedIssue.title}", received "${actualIssue.title}"`);
  }

  const issue = await ghJson([
    "issue",
    "view",
    String(expectedIssue.number),
    "--repo",
    repo,
    "--json",
    "body,comments"
  ]);
  const comments = Array.isArray(issue.comments) ? issue.comments : [];
  const approvalComments = comments.filter((comment) => comment.body?.includes(expectedIssue.exactApprovalText));
  const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "", expectedIssue.exactApprovalText);

  trackedIssueStates.push({
    ...expectedIssue,
    exactApprovalRecorded: approvalRecordPresent || approvalComments.length > 0
  });
}

for (const actualIssue of issues) {
  if (!expectedByNumber.has(actualIssue.number)) {
    failures.push(`unexpected open issue #${actualIssue.number}: ${actualIssue.title}`);
  }
}

printSection("Source-Wire Owner Open Issues Status");
console.log("This owner-side status check is read-only.");
console.log("It verifies that the public open issue surface is limited to unresolved owner-decision gates.");
console.log("It does not close issues, create issues, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.");

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

console.log("ok only unresolved owner decision issues open");

for (const issue of trackedIssueStates) {
  if (issue.exactApprovalRecorded) {
    console.log(`ok #${issue.number} ${issue.approvalName} approval recorded while issue remains open`);
  } else {
    console.log(`blocked #${issue.number} ${issue.approvalName} approval missing`);
  }
}

if (trackedIssueStates.some((issue) => !issue.exactApprovalRecorded)) {
  console.log("blocked owner decisions missing approval records");
} else {
  console.log("ok all open owner decision approvals recorded");
}

console.log("blocked unresolved owner decision issues remain open");

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

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}
