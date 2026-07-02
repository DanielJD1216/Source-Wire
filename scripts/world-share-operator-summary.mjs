import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const hostedRuntimePreparation = await readFile("docs/hosted-runtime-prd-preparation.md", "utf8");
const childIssueApprovalRequest = await readFile("docs/hosted-runtime-slice-approval-request.md", "utf8");
const ownerApprovalRecorder = await readFile("docs/owner-approval-recorder.md", "utf8");
const failures = [];

const hostedRuntimeApprovalText = "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit.";
const hostedRuntimeChildIssuePublicationTarget = "hosted-runtime-child-issue-publication";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

for (const requiredPath of [
  "LICENSE",
  "README.md",
  "docs/public-status.md",
  "docs/world-share-packet.md",
  "docs/world-share-final-preflight.md",
  "docs/world-share-post-share-monitor.md",
  "docs/launch-decision-status.md",
  "docs/hosted-runtime-prd-preparation.md",
  "docs/hosted-runtime-prd-execution-packet.md",
  "docs/hosted-runtime-child-issue-publication-preflight.md",
  "docs/hosted-runtime-slice-approval-request.md",
  "docs/owner-approval-recorder.md"
]) {
  await assertPathExists(requiredPath);
}

if (!hostedRuntimePreparation.includes(hostedRuntimeApprovalText)) {
  failures.push("hosted runtime PRD preparation must retain exact owner approval text");
}

if (!childIssueApprovalRequest.includes("Approved for a future Source-Wire hosted runtime child issue publication unit")) {
  failures.push("hosted runtime child issue publication approval text must remain documented");
}

if (!ownerApprovalRecorder.includes(hostedRuntimeChildIssuePublicationTarget)) {
  failures.push("owner approval recorder must document the hosted runtime child issue publication target");
}

if (failures.length > 0) {
  console.error("failed world share operator summary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire World Share Operator Summary");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Source repo", "ready for public review and reuse"],
  ["npm package", "published @source-wire/contracts@0.1.0"],
  ["GitHub release", "published v0.1.0"],
  ["Hosted runtime PRD", "approved and documented"],
  ["Hosted runtime child issues", "blocked until separate owner approval"],
  ["Hosted runtime implementation", "blocked"],
  ["Production runtime", "blocked"],
  ["Code contributions", "blocked"]
]);

printSection("What You Can Safely Do Now");
printList([
  "Share the repo README, LICENSE, docs/public-status.md, and docs/world-share-packet.md.",
  "Tell reviewers to install @source-wire/contracts@0.1.0 or inspect GitHub release v0.1.0.",
  "Ask for technical review through the issue templates, without accepting pull requests.",
  "Run npm run world:share-final-preflight before broad sharing.",
  "Run npm run world:post-share-monitor after public sharing starts."
]);

printSection("Do Not Open Yet");
printList([
  "Do not publish a new npm package version.",
  "Do not create a new GitHub release or tag.",
  "Do not deploy services.",
  "Do not publish hosted runtime child issues without exact separate owner approval.",
  "Do not implement an API server, MCP server runtime, database migrations, live connectors, Mission Control UI, or hosted runtime behavior.",
  "Do not accept code contributions or pull requests.",
  "Do not add real user data, private memory, client data, local paths, account IDs, emails, domains, tokens, screenshots, or production exports."
]);

printSection("Next Approval Path");
printList([
  "If you want the hosted runtime PRD child issues published, use the exact approval text in docs/hosted-runtime-slice-approval-request.md.",
  "Dry-run the guarded recorder with npm run owner:record-approval -- --target hosted-runtime-child-issue-publication.",
  "If you want hosted runtime implementation later, open a separate implementation unit after child issues exist and the PRD gates are green.",
  "If you want code contributions later, open a separate contribution-acceptance implementation unit."
]);

console.log("");
console.log("ok world share operator summary ready");
console.log("ok current share actions summarized");
console.log("ok hosted runtime PRD approval retained");
console.log("blocked hosted runtime child issue publication pending owner approval");
console.log("blocked production launch channels");

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

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
