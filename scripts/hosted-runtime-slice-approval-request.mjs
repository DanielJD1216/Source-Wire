import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

const exactApproval =
  "Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  "docs/hosted-runtime-prd.md",
  "docs/hosted-runtime-issue-slices.md",
  "docs/hosted-runtime-slice-approval-request.md",
  "docs/hosted-runtime-prd-decision-preflight.md",
  "docs/owner-open-issues-status.md"
]) {
  await assertPathExists(requiredPath);
}

const sliceMap = await readFile("docs/hosted-runtime-issue-slices.md", "utf8");
const approvalRequest = await readFile("docs/hosted-runtime-slice-approval-request.md", "utf8");

for (const requiredText of [
  "Status: draft issue slices. Implementation remains blocked.",
  "Slice 1: Hosted Runtime Threat Model And Trust Boundary",
  "Slice 2: API Server Runtime Contract",
  "Slice 3: MCP Server Runtime Contract",
  "Slice 4: Database Posture And Data Lifecycle",
  "Slice 5: Public-Safe Fixture And Verification Plan",
  "Slice 6: Deployment Boundary And Runtime Stop Conditions",
  "Still Blocked"
]) {
  assertIncludes(sliceMap, requiredText, "hosted runtime issue slices");
}

for (const requiredText of [
  "Status: approval request only.",
  exactApproval,
  "Do not publish child issues until the owner approves the exact approval text.",
  "Implementation remains blocked after child issues are published."
]) {
  assertIncludes(approvalRequest, requiredText, "hosted runtime slice approval request");
}

if (failures.length > 0) {
  console.error("failed hosted runtime slice approval request");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime Slice Approval Request");
printRows([
  ["Approval request", "ready"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Parent PRD", "docs/hosted-runtime-prd.md"],
  ["Slice map", "docs/hosted-runtime-issue-slices.md"],
  ["Child issue count", "6"],
  ["Implementation", "blocked"],
  ["Deployment", "blocked"],
  ["Real user data", "blocked"]
]);

printSection("Exact Approval Text");
console.log(exactApproval);

console.log("");
console.log("ok hosted runtime slice approval request ready");
console.log("ok hosted runtime child issue slice map ready");
console.log("blocked child issue publication pending owner approval");
console.log("blocked hosted runtime implementation");

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
  for (const [label, value] of rows) {
    console.log(`${label}: ${value}`);
  }
}
