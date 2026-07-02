import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

for (const requiredPath of [
  "docs/branch-governance-execution-packet.md",
  "docs/branch-governance-implementation-plan.md",
  "docs/branch-governance-approval-request.md",
  "docs/branch-governance-decision-preflight.md",
  "docs/repository-metadata.md",
  "docs/publish-readiness.md",
  "docs/ci-checks.md",
  "docs/owner-launch-checklist.md"
]) {
  await assertPathExists(requiredPath);
}

const executionPacket = await readFile("docs/branch-governance-execution-packet.md", "utf8");
const implementationPlan = await readFile("docs/branch-governance-implementation-plan.md", "utf8");
const approvalPacket = await readFile("docs/branch-governance-approval-request.md", "utf8");

for (const requiredText of [
  "Status: execution packet only.",
  "This packet does not enable branch protection, create repository rulesets, publish a new npm version, create a new GitHub release, create tags, deploy services, accept code contributions, add hosted runtime behavior, or approve production runtime use.",
  "Required Owner Approval",
  "Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green.",
  "Pre-Execution Checks",
  "Minimal Branch Protection Settings",
  "Package Checks / Source-Wire package checks",
  "Include administrators | disabled, to preserve owner emergency access",
  "Repository rulesets | disabled for this first governance step",
  "Future Verification",
  "Rollback",
  "ok branch governance implementation approval recorded"
]) {
  assertIncludes(executionPacket, requiredText, "branch governance execution packet");
}

for (const requiredText of [
  "Recommended first implementation path: Option A",
  "Required Post-Change Verification",
  "Rollback Plan"
]) {
  assertIncludes(implementationPlan, requiredText, "branch governance implementation plan");
}

for (const requiredText of [
  "Option 1: Approve minimal branch protection",
  "ok branch protection approval recorded",
  "blocked repository ruleset approval missing"
]) {
  assertIncludes(approvalPacket, requiredText, "branch governance approval packet");
}

if (failures.length > 0) {
  console.error("failed branch governance execution packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Branch Governance Execution Packet");
printRows([
  ["Execution packet", "ready"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Target branch", "main"],
  ["Recommended path", "minimal branch protection first"],
  ["Required check", "Package Checks / Source-Wire package checks"],
  ["Force pushes", "blocked by branch protection"],
  ["Branch deletion", "blocked by branch protection"],
  ["Repository rulesets", "deferred"],
  ["Owner approval", "recorded"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Implementation Boundary");
printList([
  "Issue #256 records exact owner approval for the minimal branch-protection path.",
  "Do not publish a new npm version, create a new GitHub release, create tags, deploy services, add hosted runtime behavior, or accept code contributions from this packet.",
  "Run live branch, world status, and publish readiness verification after any settings change."
]);

console.log("");
console.log("ok branch governance execution packet ready");
console.log("ok minimal branch protection settings documented");
console.log("ok branch governance implementation approval recorded");

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

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
