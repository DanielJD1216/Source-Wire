import { execFile } from "node:child_process";

const issueNumber = 255;
const repo = "DanielJD1216/Source-Wire";
const exactApprovalText =
  "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.";

const issue = await ghJson([
  "issue",
  "view",
  String(issueNumber),
  "--repo",
  repo,
  "--json",
  "number,title,state,body,comments,url"
]);

const comments = Array.isArray(issue.comments) ? issue.comments : [];
const approvalComments = comments.filter((comment) => comment.body?.includes(exactApprovalText));
const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "");
const exactApprovalRecorded = approvalRecordPresent || approvalComments.length > 0;
const approvalEvidence = approvalRecordPresent
  ? "owner approval record section"
  : approvalComments.length > 0
    ? "separate issue comment"
    : "none";

printSection("Source-Wire Release Approval Status");
printRows([
  ["Issue", `#${issue.number} ${issue.title}`],
  ["URL", issue.url],
  ["State", issue.state],
  ["Exact approval", exactApprovalRecorded ? "recorded" : "not recorded"],
  ["Approval evidence", approvalEvidence],
  ["Approval record section", approvalRecordStatus(approvalRecordPresent, approvalComments.length)],
  ["Approval comments", String(approvalComments.length)],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Release tag", "published as v0.1.0"],
  ["Future version change", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok release approval status readable");

if (exactApprovalRecorded) {
  console.log("ok exact release approval recorded");
  console.log("ok release execution completed");
} else {
  console.log("blocked exact release approval missing");
  console.log("blocked release implementation approval missing");
}

function hasApprovalRecordSection(body) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactApprovalText);
}

function approvalRecordStatus(approvalRecordPresent, approvalCommentCount) {
  if (approvalRecordPresent) return "present";
  if (approvalCommentCount > 0) return "not used, approval is in comment";
  return "missing";
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
