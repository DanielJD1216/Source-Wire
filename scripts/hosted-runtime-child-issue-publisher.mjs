import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const parentIssueNumber = 257;
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const args = parseArgs(process.argv.slice(2));
const fixtureState = buildFixtureState(args.fixture);
const failures = [];
const createdIssues = [];

const exactApproval =
  "Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.";

const sharedBlockedList = [
  "hosted runtime implementation",
  "API server implementation",
  "MCP server runtime implementation",
  "database migrations",
  "deployment",
  "production runtime use",
  "real user data",
  "code contribution acceptance",
  "npm publishing",
  "GitHub release creation",
  "tags"
];

const issues = [
  {
    order: 1,
    title: "Hosted Runtime Threat Model And Trust Boundary",
    type: "HITL",
    blockedBy: "none",
    labels: ["boundary", "safety", "docs"],
    userStories: "1, 2, 3, 4, 5, 6, 7, 15, 20",
    goal: "Define runtime threats, separate owner-hosted and managed-hosted risk, keep trusted memory approval owner or application controlled, and define fail-closed namespace and permission behavior.",
    acceptance: [
      "Threat model covers unauthorized callers, cross-namespace reads, source-to-memory confusion, prompt injection, secrets, audit gaps, backups, deployment misconfiguration, and MCP bypass.",
      "Owner-hosted first posture is explicit.",
      "Managed-hosted remains deferred.",
      "No implementation is added."
    ]
  },
  {
    order: 2,
    title: "API Server Runtime Contract",
    type: "AFK after Slice 1",
    blockedBy: "Slice 1",
    labels: ["contracts", "boundary", "docs"],
    userStories: "3, 4, 5, 6, 7, 11, 13, 16",
    goal: "Define API server endpoints, authorization model, namespace model, audit metadata, and non-goals.",
    acceptance: [
      "API operations are grouped by read, search, source maintenance, candidate creation, trusted-memory approval, and audit.",
      "Every operation states required caller identity, namespace, action, and permission.",
      "Denied behavior fails closed without leaking content.",
      "No server code or deployment config is added."
    ]
  },
  {
    order: 3,
    title: "MCP Server Runtime Contract",
    type: "AFK after Slice 1",
    blockedBy: "Slice 1",
    labels: ["contracts", "boundary", "docs"],
    userStories: "8, 9, 10, 12",
    goal: "Define MCP tool names, input and output boundaries, permissions, citation behavior, denied-result behavior, and API-bypass prohibition.",
    acceptance: [
      "MCP tools call the API policy boundary.",
      "Tool outputs preserve citations, gaps, denied counts, and audit-friendly metadata.",
      "Mutation-like tools require explicit authority.",
      "No MCP server runtime code is added."
    ]
  },
  {
    order: 4,
    title: "Database Posture And Data Lifecycle",
    type: "HITL",
    blockedBy: "Slice 1 and Slice 2",
    labels: ["boundary", "safety", "docs"],
    userStories: "1, 4, 6, 13, 15, 20",
    goal: "Define storage posture before migrations, document PostgreSQL or alternative storage boundaries, and define tenant isolation, retention, backup, restore, deletion, and audit requirements.",
    acceptance: [
      "Database posture is explicit.",
      "Migrations remain blocked.",
      "Real user data remains blocked.",
      "Backup and restore risk is documented.",
      "Data lifecycle is tied to namespace and owner control."
    ]
  },
  {
    order: 5,
    title: "Public-Safe Fixture And Verification Plan",
    type: "AFK after Slices 1, 2, and 3",
    blockedBy: "Slice 1, Slice 2, Slice 3",
    labels: ["verification", "safety", "docs"],
    userStories: "14, 16, 18, 19",
    goal: "Define synthetic fixtures and verification gates for later implementation.",
    acceptance: [
      "Fixtures use synthetic callers, namespaces, sources, candidates, trusted memory, and denied cases.",
      "Fixtures contain no real user data, private owner data, local paths, account IDs, emails, domains, tokens, screenshots, client data, or production exports.",
      "Verification includes readiness, safety, claim boundary, docs, and owner-side live gates.",
      "No fixture implementation is added unless a later implementation unit approves it."
    ]
  },
  {
    order: 6,
    title: "Deployment Boundary And Runtime Stop Conditions",
    type: "HITL",
    blockedBy: "Slices 1, 2, 3, and 4",
    labels: ["boundary", "safety", "docs"],
    userStories: "1, 2, 16, 18, 20",
    goal: "Define what deployment would mean later without deploying anything now.",
    acceptance: [
      "Local, owner-hosted, and managed-hosted boundaries are separated.",
      "Production runtime claims remain blocked.",
      "Deployment config remains blocked.",
      "Rollback and stop conditions are explicit.",
      "No hosted service is created."
    ]
  }
];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  "docs/hosted-runtime-prd.md",
  "docs/hosted-runtime-issue-slices.md",
  "docs/hosted-runtime-slice-approval-request.md",
  "docs/hosted-runtime-child-issue-publication-packet.md"
]) {
  await assertPathExists(requiredPath);
}

const sliceMap = await readFile("docs/hosted-runtime-issue-slices.md", "utf8");
const approvalRequest = await readFile("docs/hosted-runtime-slice-approval-request.md", "utf8");
const publicationPacket = await readFile("docs/hosted-runtime-child-issue-publication-packet.md", "utf8");

assertIncludes(approvalRequest, exactApproval, "hosted runtime slice approval request");
assertIncludes(publicationPacket, exactApproval, "hosted runtime child issue publication packet");

for (const issue of issues) {
  assertIncludes(sliceMap, `Slice ${issue.order}: ${issue.title}`, "hosted runtime issue slices");
  assertIncludes(publicationPacket, `### Issue ${issue.order}: ${issue.title}`, "hosted runtime child issue publication packet");
  const body = buildIssueBody(issue);
  assertIncludes(body, "Status: PRD/planning issue only.", `${issue.title} generated body`);
  assertIncludes(body, "No implementation is approved by this issue.", `${issue.title} generated body`);
  for (const blockedItem of sharedBlockedList) {
    assertIncludes(body, blockedItem, `${issue.title} generated body blocked boundary`);
  }
}

if (failures.length > 0) {
  console.error("failed hosted runtime child issue publisher");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime Child Issue Publisher");
console.log("Default mode is read-only.");
console.log("Write mode requires --write, the exact --confirm-exact approval text, and recorded approval on parent issue #257.");
console.log("It does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.");
if (fixtureState) {
  console.log(`Fixture mode: ${args.fixture}. No GitHub API calls are made for approval status.`);
}
printRows([
  ["Repository", repo],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Parent issue", "#257"],
  ["Child issue count", String(issues.length)],
  ["Mode", args.write ? "write" : "dry run"],
  ["Implementation", "blocked"],
  ["Deployment", "blocked"],
  ["Real user data", "blocked"]
]);

printSection("Issue Payloads");
for (const issue of issues) {
  console.log(`${issue.order}. ${issue.title}`);
  console.log(`   labels: ${issue.labels.join(", ")}`);
  console.log(`   type: ${issue.type}`);
  console.log(`   blocked by: ${issue.blockedBy}`);
}

if (!args.write) {
  printSection("Dry Run Next Command");
  console.log(`npm run runtime:child-issue-publish -- --write --confirm-exact "${exactApproval}"`);
  console.log("");
  console.log("ok hosted runtime child issue publisher ready");
  console.log("ok hosted runtime issue payloads validated");
  console.log("blocked child issue publication requires --write");
  console.log("blocked hosted runtime implementation");
  process.exit(0);
}

if (args.confirmExact !== exactApproval) {
  console.error("failed hosted runtime child issue publisher: --confirm-exact must match the exact approval text");
  process.exit(1);
}

const approvalStatus = await getChildIssuePublicationApprovalStatus();
if (!approvalStatus.recorded) {
  console.error("failed hosted runtime child issue publisher: exact child issue publication approval is not recorded on parent issue #257");
  console.error(`parent issue: #${approvalStatus.issue.number} ${approvalStatus.issue.title}`);
  console.error(`url: ${approvalStatus.issue.url}`);
  console.error("blocked child issue publication approval missing");
  console.error("blocked hosted runtime implementation");
  process.exit(1);
}

const existingOpenIssues = await ghJson([
  "issue",
  "list",
  "--repo",
  repo,
  "--state",
  "open",
  "--limit",
  "100",
  "--json",
  "number,title,url"
]);
const existingTitles = new Set(existingOpenIssues.map((issue) => issue.title));
const duplicateTitles = issues.filter((issue) => existingTitles.has(issue.title));
if (duplicateTitles.length > 0) {
  console.error("failed hosted runtime child issue publisher: matching open child issue titles already exist");
  for (const issue of duplicateTitles) {
    console.error(`- ${issue.title}`);
  }
  process.exit(1);
}

for (const issue of issues) {
  const url = await ghIssueCreate(issue);
  createdIssues.push({ ...issue, url });
}

printSection("Created Issues");
for (const issue of createdIssues) {
  console.log(`#${issue.order} ${issue.title}`);
  console.log(`URL: ${issue.url}`);
}

console.log("");
console.log("ok hosted runtime child issue publisher ready");
console.log("ok hosted runtime child issues published");
console.log("blocked hosted runtime implementation");

function buildIssueBody(issue) {
  return `Parent: #257

Status: PRD/planning issue only.

Type: ${issue.type}

Blocked by: ${issue.blockedBy}

User stories covered: ${issue.userStories}

## Goal

${issue.goal}

## Acceptance Criteria

${issue.acceptance.map((item) => `- ${item}`).join("\n")}

## Shared Boundary

No implementation is approved by this issue.

${sharedBlockedList.map((item) => `- ${item}`).join("\n")}

## Source Docs

- docs/hosted-runtime-prd.md
- docs/hosted-runtime-issue-slices.md
- docs/hosted-runtime-child-issue-publication-packet.md
`;
}

async function ghIssueCreate(issue) {
  const ghArgs = [
    "issue",
    "create",
    "--repo",
    repo,
    "--title",
    issue.title,
    "--body",
    buildIssueBody(issue)
  ];

  for (const label of issue.labels) {
    ghArgs.push("--label", label);
  }

  return (await execGh(ghArgs)).trim();
}

function ghJson(ghArgs) {
  return execGh(ghArgs).then((stdout) => JSON.parse(stdout));
}

async function getChildIssuePublicationApprovalStatus() {
  if (fixtureState) {
    return fixtureState.approvalStatus;
  }

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
  const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "", exactApproval);
  const approvalCommentPresent = comments.some((comment) => hasApprovalRecordSection(comment.body ?? "", exactApproval));
  return {
    issue,
    recorded: approvalRecordPresent || approvalCommentPresent
  };
}

function hasApprovalRecordSection(body, exactApprovalTextToFind) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactApprovalTextToFind);
}

function buildFixtureState(fixture) {
  if (!fixture) return null;

  if (fixture !== "approval-missing") {
    throw new Error(`unknown fixture: ${fixture}`);
  }

  return {
    approvalStatus: {
      issue: {
        number: parentIssueNumber,
        title: "Owner decision: open hosted runtime PRD path",
        url: "https://example.invalid/source-wire/issues/257"
      },
      recorded: false
    }
  };
}

function execGh(ghArgs) {
  return new Promise((resolve, reject) => {
    execFile("gh", ghArgs, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`gh ${ghArgs.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      resolve(stdout);
    });
  });
}

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    failures.push(`missing required path: ${path}`);
  }
}

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(text, requiredText, reason) {
  if (!text.includes(requiredText)) {
    failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
  }
}

function parseArgs(rawArgs) {
  const parsed = {
    write: false,
    confirmExact: "",
    fixture: null
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--write") {
      parsed.write = true;
    } else if (arg === "--confirm-exact") {
      parsed.confirmExact = rawArgs[index + 1] ?? "";
      index += 1;
    } else if (arg === "--fixture") {
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

  return parsed;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run runtime:child-issue-publish");
  console.log("  npm run runtime:child-issue-publish -- --write --confirm-exact \"<exact approval text>\"");
  console.log("  npm run runtime:child-issue-publish -- --fixture approval-missing --write --confirm-exact \"<exact approval text>\"");
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
