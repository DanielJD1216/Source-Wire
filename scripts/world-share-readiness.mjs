import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release approval");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner license approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/public-status.md",
  "docs/share-for-review.md",
  "docs/world-share-kit.md",
  "docs/license-decision-gate.md",
  "docs/owner-license-approval-packet.md",
  "docs/apache-2-license-implementation-readiness.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/world-share-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

if (failures.length > 0) {
  console.error("failed world share readiness boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire World-Share Readiness");
printRows([
  ["Technical review", "ready"],
  ["Source package reuse", "ready under Apache-2.0"],
  ["Open-source license", "implemented"],
  ["npm publishing", "blocked until publish PRD approval"],
  ["GitHub release", "blocked until release PRD approval"],
  ["Hosted runtime", "blocked until runtime PRD approval"],
  ["Code contributions", "blocked until contribution terms approval"]
]);

printSection("Current Package Boundary");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["LICENSE file", "present"],
  ["Publish boundary", "npm publishing blocked, publishConfig.access restricted"]
]);

printSection("Next Approval Needed");
printList([
  "To share the source repo publicly, point people to README.md and LICENSE.",
  "To publish npm, open a separate publish PRD.",
  "To add hosted runtime behavior, open a separate runtime PRD after the runtime gate is approved."
]);

console.log("");
console.log("ok world share open source ready");
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
  for (const [label, value] of rows) {
    console.log(`${label}: ${value}`);
  }
}

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
