import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";
const parentIssueNumber = 257;
const exactApprovalText =
  "Approved for a future Source-Wire owner-hosted runtime PRD refresh unit: refresh the public owner-hosted runtime PRD and wrapper-runtime gate using the Unit 33 runtime-readiness alignment baseline as redacted metadata only. Keep Source-Wire synthetic-only. Do not add production API runtime, MCP runtime, database migrations, real database connections, live connectors, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, private data, private implementation code, AGPLv3 code copying, or automatic trusted memory promotion. Keep Source-Wire-Memory-Engine separate. MCP must not bypass Source-Wire API policy.";

const issue = await ghJson([
  "issue",
  "view",
  String(parentIssueNumber),
  "--repo",
  repo,
  "--json",
  "number,title,state,body,comments,url"
]);

const comments = Array.isArray(issue.comments) ? issue.comments : [];
const approvalComments = comments.filter((comment) => hasApprovalRecordSection(comment.body ?? "", exactApprovalText));
const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "", exactApprovalText);
const exactApprovalRecorded = approvalRecordPresent || approvalComments.length > 0;
const approvalEvidence = approvalRecordPresent
  ? "owner approval record section"
  : approvalComments.length > 0
    ? "separate issue comment"
    : "none";

printSection("Source-Wire Runtime PRD Refresh Approval Status");
console.log("This owner-side status check is read-only.");
console.log("It checks whether the exact runtime PRD refresh approval is separately recorded.");
console.log("It does not refresh the PRD, implement hosted runtime behavior, add API server runtime, add MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, copy private code, copy AGPLv3 code, or approve production runtime use.");
printRows([
  ["Parent issue", `#${issue.number} ${issue.title}`],
  ["URL", issue.url],
  ["State", issue.state],
  ["Exact approval", exactApprovalRecorded ? "recorded" : "not recorded"],
  ["Approval evidence", approvalEvidence],
  ["Approval record section", approvalRecordStatus(approvalRecordPresent, approvalComments.length)],
  ["Approval comments", String(approvalComments.length)]
]);

printSection("Runtime PRD Refresh Approval Status Result");
console.log("ok runtime PRD refresh approval status readable");

if (exactApprovalRecorded) {
  console.log("ok exact runtime PRD refresh approval recorded");
  console.log("blocked hosted runtime implementation");
} else {
  console.log("blocked runtime PRD refresh approval missing");
  console.log("blocked hosted runtime implementation");
}

function hasApprovalRecordSection(body, exactApprovalTextToFind) {
  const marker = "## Owner Approval Record";
  const markerIndex = body.indexOf(marker);
  if (markerIndex === -1) {
    return false;
  }

  const sectionStart = markerIndex + marker.length;
  const nextSectionIndex = body.indexOf("\n## ", sectionStart);
  const section = nextSectionIndex === -1 ? body.slice(markerIndex) : body.slice(markerIndex, nextSectionIndex);
  return section.includes(exactApprovalTextToFind);
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
