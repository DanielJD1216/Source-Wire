import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

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
    ],
    sourceDocs: [
      "docs/hosted-runtime-threat-model-trust-boundary.md"
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
    ],
    sourceDocs: [
      "docs/hosted-runtime-api-server-contract.md"
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
    ],
    sourceDocs: [
      "docs/hosted-runtime-mcp-server-contract.md"
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
    ],
    sourceDocs: [
      "docs/hosted-runtime-database-posture-data-lifecycle.md"
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
      "Verification includes runtime readiness, runtime proof intake, safety, claim boundary, docs, and owner-side live gates.",
      "No fixture implementation is added unless a later implementation unit approves it."
    ],
    sourceDocs: [
      "docs/hosted-runtime-public-safe-fixture-verification-plan.md"
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
  "docs/hosted-runtime-child-issue-publication-packet.md",
  "docs/runtime-readiness-smoke.md",
  "docs/runtime-proof-intake.md"
]) {
  await assertPathExists(requiredPath);
}

const sliceMap = await readFile("docs/hosted-runtime-issue-slices.md", "utf8");
const approvalRequest = await readFile("docs/hosted-runtime-slice-approval-request.md", "utf8");
const publicationPacket = await readFile("docs/hosted-runtime-child-issue-publication-packet.md", "utf8");

assertIncludes(approvalRequest, exactApproval, "hosted runtime slice approval request");
assertIncludes(publicationPacket, exactApproval, "hosted runtime child issue publication packet");
assertIncludes(sliceMap, "npm run runtime-readiness:smoke", "hosted runtime issue slices");
assertIncludes(sliceMap, "npm run runtime-proof-intake:smoke", "hosted runtime issue slices");
assertIncludes(approvalRequest, "npm run runtime-readiness:smoke", "hosted runtime slice approval request");
assertIncludes(approvalRequest, "npm run runtime-proof-intake:smoke", "hosted runtime slice approval request");
assertIncludes(publicationPacket, "npm run runtime-readiness:smoke", "hosted runtime child issue publication packet");
assertIncludes(publicationPacket, "npm run runtime-proof-intake:smoke", "hosted runtime child issue publication packet");

for (const issue of issues) {
  assertIncludes(sliceMap, `Slice ${issue.order}: ${issue.title}`, "hosted runtime issue slices");
  assertIncludes(publicationPacket, `### Issue ${issue.order}: ${issue.title}`, "hosted runtime child issue publication packet");
  const body = buildIssueBody(issue);
  assertIncludes(body, "Status: PRD/planning issue only.", `${issue.title} generated body`);
  assertIncludes(body, "No implementation is approved by this issue.", `${issue.title} generated body`);
  for (const sourceDoc of issue.sourceDocs ?? []) {
    assertIncludes(body, sourceDoc, `${issue.title} generated body source doc`);
  }
  for (const blockedItem of sharedBlockedList) {
    assertIncludes(body, blockedItem, `${issue.title} generated body blocked boundary`);
  }
}

if (failures.length > 0) {
  console.error("failed hosted runtime child issue publication packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime Child Issue Publication Packet");
printRows([
  ["Publication packet", "ready"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Parent issue", "#257"],
  ["Child issue count", String(issues.length)],
  ["Write behavior", "none, read-only packet"],
  ["Implementation", "blocked"],
  ["Deployment", "blocked"],
  ["Real user data", "blocked"]
]);

printSection("Exact Approval Required Before Publication");
console.log(exactApproval);

printSection("Issue Payload Summary");
for (const issue of issues) {
  console.log(`${issue.order}. ${issue.title}`);
  console.log(`   labels: ${issue.labels.join(", ")}`);
  console.log(`   type: ${issue.type}`);
  console.log(`   blocked by: ${issue.blockedBy}`);
}

console.log("");
console.log("ok hosted runtime child issue publication packet ready");
console.log("ok hosted runtime issue payloads validated");
console.log("ok child issue publication approval text documented");
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

${issue.sourceDocs ? `## Planning Artifacts\n\n${issue.sourceDocs.map((item) => `- ${item}`).join("\n")}\n\n` : ""}## Still Blocked

No implementation is approved by this issue.

${sharedBlockedList.map((item) => `- ${item}`).join("\n")}
`;
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
