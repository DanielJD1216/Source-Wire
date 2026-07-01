import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const requestPacket = await readFile("docs/license-approval-request-packet.md", "utf8");
const decisionRecord = await readFile("docs/license-approval-decision-record.md", "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 before release execution");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/license-approval-request-packet.md",
  "docs/license-approval-decision-record.md",
  "docs/license-decision-gate.md",
  "docs/owner-license-approval-packet.md",
  "docs/legal-review-question-packet.md",
  "docs/apache-2-license-implementation-readiness.md",
  "docs/launch-decision-status.md"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: owner approval request only.",
  "Option 1: Approve Apache-2.0 Implementation",
  "Approved and implemented: Apache-2.0",
  "Option 2: Stay Unlicensed",
  "Option 3: Request Legal Review First",
  "Option 4: Compare Source-Available Options",
  "This packet does not approve a license change"
]) {
  if (!requestPacket.includes(requiredText)) {
    failures.push(`approval request missing required text: ${requiredText}`);
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
  console.error("failed license approval request boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire License Approval Request");
printRows([
  ["Approval request", "complete"],
  ["Owner license approval", "captured"],
  ["Decision record", "implemented"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "present"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Historical Owner Decision Options");
printList([
  "Option 1 was selected: Apache-2.0 implementation is complete.",
  "Option 2 was not selected: stay unlicensed.",
  "Option 3 was not selected: request legal review first.",
  "Option 4 was not selected: compare source-available options first."
]);

console.log("");
console.log("ok license approval request ready");
console.log("ok owner license approval captured");
console.log("ok license implementation complete");

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
