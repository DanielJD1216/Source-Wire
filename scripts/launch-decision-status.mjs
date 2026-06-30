import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release approval");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/share-for-review.md",
  "docs/license-approval-decision-record.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/license-decision-gate.md",
  "docs/world-share-readiness.md",
  "docs/publish-readiness.md",
  "docs/public-status.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md"
]) {
  await assertPathExists(requiredPath);
}

if (failures.length > 0) {
  console.error("failed launch decision status boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Launch Decision Status");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["LICENSE file", "present"],
  ["Source repo sharing", "ready"],
  ["Legal advice", "not provided"],
  ["Owner license approval", "captured"],
  ["License decision record", "implemented"],
  ["License implementation", "complete"],
  ["npm publishing", "blocked, not approved"],
  ["GitHub release", "blocked, not approved"],
  ["Hosted runtime", "blocked, not approved"],
  ["Code contributions", "blocked, not accepted"]
]);

printSection("Next Approval");
printList([
  "Use README.md and LICENSE for public source repo sharing.",
  "Open separate PRDs for npm publishing, GitHub release publishing, hosted runtime, and contribution acceptance."
]);

console.log("");
console.log("ok launch decision status ready");
console.log("ok apache 2 license implemented");
console.log("ok source repo sharing ready");
console.log("blocked npm publishing not approved");
console.log("blocked github release not approved");
console.log("blocked hosted runtime not approved");
console.log("blocked contributions not accepted");

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
