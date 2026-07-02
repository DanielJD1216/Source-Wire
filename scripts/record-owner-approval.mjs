import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";

const approvalTargets = [
  {
    target: "release-implementation",
    issue: 255,
    label: "First public release path",
    approvalName: "release implementation",
    allowClosedIssue: false,
    requiresApprovalRecordSection: false,
    exactApprovalText:
      "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms."
  },
  {
    target: "branch-governance-implementation",
    issue: 256,
    label: "Branch governance path",
    approvalName: "branch governance implementation",
    allowClosedIssue: false,
    requiresApprovalRecordSection: false,
    exactApprovalText:
      "Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions."
  },
  {
    target: "hosted-runtime-prd",
    issue: 257,
    label: "Hosted runtime PRD path",
    approvalName: "hosted runtime PRD",
    allowClosedIssue: false,
    requiresApprovalRecordSection: false,
    exactApprovalText:
      "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit."
  },
  {
    target: "hosted-runtime-child-issue-publication",
    issue: 257,
    label: "Hosted runtime child issue publication path",
    approvalName: "hosted runtime child issue publication",
    allowClosedIssue: true,
    requiresApprovalRecordSection: true,
    exactApprovalText:
      "Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked."
  },
  {
    target: "contribution-terms-prd",
    issue: 258,
    label: "Contribution terms path",
    approvalName: "contribution terms PRD",
    allowClosedIssue: false,
    requiresApprovalRecordSection: false,
    exactApprovalText:
      "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit."
  }
];

const args = parseArgs(process.argv.slice(2));
const target = approvalTargets.find((approvalTarget) => {
  if (args.target) return approvalTarget.target === args.target;
  return approvalTarget.issue === args.issue;
});

printSection("Source-Wire Owner Approval Recorder");
console.log("This owner-side command records an exact approval comment only when --write is supplied.");
console.log("Default mode is non-mutating.");
console.log("It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

if (!target) {
  printRows([
    ["Mode", args.write ? "write requested" : "dry run"],
    ["Requested target", args.target || "not provided"],
    ["Requested issue", args.issue ? `#${args.issue}` : "not provided"],
    ["Known targets", approvalTargets.map((approvalTarget) => approvalTarget.target).join(", ")]
  ]);
  console.log("");
  console.log("ok owner approval recorder ready");
  console.log("blocked approval recording requires known --target or --issue");
  process.exit(args.write ? 1 : 0);
}

const issue = await ghJson([
  "issue",
  "view",
  String(target.issue),
  "--repo",
  repo,
  "--json",
  "number,title,state,body,comments,url"
]);
const comments = Array.isArray(issue.comments) ? issue.comments : [];
const approvalComments = comments.filter((comment) => {
  const body = comment.body ?? "";
  if (target.requiresApprovalRecordSection) {
    return hasApprovalRecordSection(body, target.exactApprovalText);
  }
  return body.includes(target.exactApprovalText);
});
const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "", target.exactApprovalText);
const exactApprovalRecorded = approvalRecordPresent || approvalComments.length > 0;

printRows([
  ["Mode", args.write ? "write requested" : "dry run"],
  ["Issue", `#${issue.number} ${issue.title}`],
  ["URL", issue.url],
  ["State", issue.state],
  ["Target", target.target],
  ["Decision", target.label],
  ["Exact approval", exactApprovalRecorded ? "already recorded" : "not recorded"],
  ["Approval record section", approvalRecordStatus(approvalRecordPresent, approvalComments.length)],
  ["Approval comments", String(approvalComments.length)]
]);

if (exactApprovalRecorded) {
  console.log("");
  console.log("ok owner approval recorder ready");
  console.log(`ok exact ${target.approvalName} approval already recorded`);
  console.log("blocked execution still requires focused implementation unit");
  process.exit(0);
}

if (issue.state !== "OPEN" && !target.allowClosedIssue) {
  console.error("");
  console.error(`failed owner approval recorder: issue #${target.issue} must be OPEN`);
  process.exit(1);
}

if (!args.write) {
  printSection("Dry Run Next Command");
  console.log(`npm run owner:record-approval -- --target ${target.target} --write --confirm-exact "${target.exactApprovalText}"`);
  console.log("");
  console.log("ok owner approval recorder ready");
  console.log("blocked approval recording requires --write");
  process.exit(0);
}

if (args.confirmExact !== target.exactApprovalText) {
  console.error("");
  console.error("failed owner approval recorder: --confirm-exact must match the exact approval text");
  console.error(`Expected: ${target.exactApprovalText}`);
  process.exit(1);
}

const body = `## Owner Approval Record

${target.exactApprovalText}

This approval record does not itself publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.`;

const commentUrl = await ghText([
  "issue",
  "comment",
  String(target.issue),
  "--repo",
  repo,
  "--body",
  body
]);

console.log("");
console.log("ok owner approval recorder ready");
console.log(`ok exact ${target.approvalName} approval recorded`);
console.log(commentUrl.trim());
console.log("blocked execution still requires focused implementation unit");

function hasApprovalRecordSection(body, exactApprovalText) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactApprovalText);
}

function approvalRecordStatus(approvalRecordPresent, approvalCommentCount) {
  if (approvalRecordPresent) return "present";
  if (approvalCommentCount > 0) return "not used, approval is in comment";
  return "missing";
}

function parseArgs(argv) {
  const parsed = {
    issue: null,
    target: "",
    write: false,
    confirmExact: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--issue") {
      parsed.issue = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--target") {
      parsed.target = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--write") {
      parsed.write = true;
    } else if (arg === "--confirm-exact") {
      parsed.confirmExact = argv[index + 1] ?? "";
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

  return parsed;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run owner:record-approval");
  console.log("  npm run owner:record-approval -- --issue 255");
  console.log("  npm run owner:record-approval -- --target hosted-runtime-child-issue-publication");
  console.log("  npm run owner:record-approval -- --target hosted-runtime-child-issue-publication --write --confirm-exact \"<exact approval text>\"");
}

function ghJson(args) {
  return ghText(args).then((stdout) => {
    try {
      return JSON.parse(stdout);
    } catch (parseError) {
      throw new Error(`Unable to parse gh JSON: ${parseError.message}`);
    }
  });
}

function ghText(args) {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`gh ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      resolve(stdout);
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
