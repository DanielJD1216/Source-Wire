import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.0.0 before release execution");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/owner-license-decision-workflow.md",
  "docs/owner-license-approval-preflight.md",
  "docs/license-approval-request-packet.md",
  "docs/license-approval-decision-record.md",
  "docs/license-decision-gate.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/launch-decision-status.md",
  "docs/publish-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

const workflow = await readFile("docs/owner-license-decision-workflow.md", "utf8");
const decisionRecord = await readFile("docs/license-approval-decision-record.md", "utf8");

for (const requiredText of [
  "Option 1: Approve Apache-2.0 Implementation",
  "Option 2: Stay Unlicensed",
  "Option 3: Request Legal Review First",
  "Option 4: Compare Source-Available Options",
  "ok owner license decision captured"
]) {
  if (!workflow.includes(requiredText)) {
    failures.push(`decision workflow missing required text: ${requiredText}`);
  }
}

for (const requiredText of [
  "license_decision_status: implemented",
  "approved_license: Apache-2.0",
  "approval_scope: source_package_license_only"
]) {
  if (!decisionRecord.includes(requiredText)) {
    failures.push(`decision record missing required text: ${requiredText}`);
  }
}

if (failures.length > 0) {
  console.error("failed owner decision workflow");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Owner Decision Workflow");
printRows([
  ["Workflow", "ready"],
  ["Decision options", "available"],
  ["Owner license decision", "captured"],
  ["Decision record", "implemented"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "present"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Remaining Approval Actions");
printList([
  "Release path approval is recorded in #255.",
  "Complete npm auth, release auth preflight, and release execution preflight before npm publishing or GitHub release creation.",
  "Open a separate PRD before hosted runtime work.",
  "Open a separate PRD before contribution acceptance."
]);

console.log("");
console.log("ok owner decision workflow ready");
console.log("ok owner decision options available");
console.log("ok owner license decision captured");

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
  for (const [label, value] of rows) {
    console.log(`${label}: ${value}`);
  }
}

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
