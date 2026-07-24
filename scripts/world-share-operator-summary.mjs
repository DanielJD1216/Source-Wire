import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const hostedRuntimePreparation = await readFile("docs/internal/hosted-runtime-prd-preparation.md", "utf8");
const hostedRuntimePrd = await readFile("docs/internal/hosted-runtime-prd.md", "utf8");
const childIssueApprovalRequest = await readFile("docs/internal/hosted-runtime-slice-approval-request.md", "utf8");
const ownerApprovalRecorder = await readFile("docs/internal/owner-approval-recorder.md", "utf8");
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
  "docs/status/public-status.md",
  "docs/internal/world-share-packet.md",
  "docs/internal/world-share-final-preflight.md",
  "docs/internal/world-share-post-share-monitor.md",
  "docs/internal/launch-decision-status.md",
  "docs/internal/hosted-runtime-prd.md",
  "docs/internal/hosted-runtime-prd-preparation.md",
  "docs/internal/hosted-runtime-prd-execution-packet.md",
  "docs/internal/hosted-runtime-child-issue-publication-preflight.md",
  "docs/internal/hosted-runtime-slice-approval-request.md",
  "docs/internal/owner-approval-recorder.md"
]) {
  await assertPathExists(requiredPath);
}

if (!hostedRuntimePreparation.includes(hostedRuntimeApprovalText)) {
  failures.push("hosted runtime PRD preparation must retain exact owner approval text");
}

if (!hostedRuntimePrd.includes("Source-Wire does not host everyone else's memory by default.")) {
  failures.push("hosted runtime PRD must clarify that Source-Wire is not the default memory host");
}

if (!hostedRuntimePrd.includes("The owner brings and pays for their own PostgreSQL database or equivalent storage.")) {
  failures.push("hosted runtime PRD must clarify owner-side database cost responsibility");
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
  ["Runtime ownership", "owner-hosted first, not Source-Wire-hosted by default"],
  ["Hosted runtime child issues", "published as PRD/planning issues #259 through #264"],
  ["Hosted runtime implementation", "blocked"],
  ["Production runtime", "blocked"],
  ["Code contributions", "blocked"]
]);

printSection("What You Can Safely Do Now");
printList([
  "Share the repo README, LICENSE, docs/status/public-status.md, and docs/internal/world-share-packet.md.",
  "Tell reviewers to install @source-wire/contracts@0.1.0 or inspect GitHub release v0.1.0.",
  "Ask for technical review through the issue templates, without accepting pull requests.",
  "Run npm run world:share-final-preflight before broad sharing.",
  "Run npm run world:post-share-monitor after public sharing starts."
]);

printSection("Runtime Ownership Plain English");
printList([
  "Hosted runtime means the memory backend can run somewhere as software.",
  "The intended first posture is owner-hosted: each owner runs their own runtime.",
  "Each owner uses and pays for their own PostgreSQL database or equivalent storage.",
  "Source-Wire does not host everyone else's memory by default.",
  "Managed-hosted operation remains a separate later path."
]);

printSection("Do Not Open Yet");
printList([
  "Do not publish a new npm package version.",
  "Do not create a new GitHub release or tag.",
  "Do not deploy services.",
  "Do not implement an API server, MCP server runtime, database migrations, live connectors, Mission Control UI, or hosted runtime behavior.",
  "Do not accept code contributions or pull requests.",
  "Do not add real user data, private memory, client data, local paths, account IDs, emails, domains, tokens, screenshots, or production exports."
]);

printSection("Next Approval Path");
printList([
  "Hosted runtime PRD/planning issues #259 through #264 are already published.",
  "Runtime PRD refresh approval is recorded and the public PRD/gate refresh proof is available.",
  "Run npm run runtime:prd-refresh-proof to verify the refreshed PRD and wrapper-runtime gate.",
  "If you want hosted runtime implementation later, open a separate implementation unit for one narrow boundary at a time.",
  "If you want code contributions later, open a separate contribution-acceptance implementation unit."
]);

console.log("");
console.log("ok world share operator summary ready");
console.log("ok current share actions summarized");
console.log("ok hosted runtime PRD approval retained");
console.log("ok hosted runtime child planning issues published");
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
