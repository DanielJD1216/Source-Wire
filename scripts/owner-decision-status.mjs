import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";

const decisionIssues = [
  {
    number: 255,
    label: "First public release path",
    approvalName: "release implementation",
    exactApprovalText:
      "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms."
  },
  {
    number: 256,
    label: "Branch governance path",
    approvalName: "branch governance implementation",
    exactApprovalText:
      "Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions."
  },
  {
    number: 257,
    label: "Hosted runtime PRD path",
    approvalName: "hosted runtime PRD",
    exactApprovalText:
      "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit."
  },
  {
    number: 258,
    label: "Contribution terms path",
    approvalName: "contribution terms PRD",
    exactApprovalText:
      "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit."
  }
];

const results = [];

for (const decisionIssue of decisionIssues) {
  const issue = await ghJson([
    "issue",
    "view",
    String(decisionIssue.number),
    "--repo",
    repo,
    "--json",
    "number,title,state,body,comments,url"
  ]);
  const comments = Array.isArray(issue.comments) ? issue.comments : [];
  const approvalComments = comments.filter((comment) => comment.body?.includes(decisionIssue.exactApprovalText));
  const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "", decisionIssue.exactApprovalText);
  const exactApprovalRecorded = approvalRecordPresent || approvalComments.length > 0;
  const approvalEvidence = approvalRecordPresent
    ? "owner approval record section"
    : approvalComments.length > 0
      ? "separate issue comment"
      : "none";

  results.push({
    ...decisionIssue,
    issue,
    approvalComments,
    approvalRecordPresent,
    exactApprovalRecorded,
    approvalEvidence
  });
}

printSection("Source-Wire Owner Decision Status");
console.log("This owner-side status check is read-only.");
console.log("It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.");

for (const result of results) {
  printSection(`#${result.issue.number} ${result.label}`);
  printRows([
    ["Title", result.issue.title],
    ["URL", result.issue.url],
    ["State", result.issue.state],
    ["Exact approval", result.exactApprovalRecorded ? "recorded" : "not recorded"],
    ["Approval evidence", result.approvalEvidence],
    ["Approval record section", result.approvalRecordPresent ? "present" : "missing"],
    ["Approval comments", String(result.approvalComments.length)]
  ]);
}

const recorded = results.filter((result) => result.exactApprovalRecorded);
const missing = results.filter((result) => !result.exactApprovalRecorded);

printSection("Owner Decision Status Result");
console.log("ok owner decision status readable");

for (const result of recorded) {
  console.log(`ok exact ${result.approvalName} approval recorded`);
}

for (const result of missing) {
  console.log(`blocked ${result.approvalName} approval missing`);
}

if (missing.length > 0) {
  console.log("blocked owner decisions missing approval records");
} else {
  console.log("ok all tracked owner decision approvals recorded");
  console.log("blocked execution still requires focused implementation units");
}

function hasApprovalRecordSection(body, exactApprovalText) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactApprovalText);
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
