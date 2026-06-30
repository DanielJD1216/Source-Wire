import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/owner-launch-checklist.md",
  "docs/legal-review-question-packet.md",
  "docs/license-decision-gate.md",
  "docs/world-share-readiness.md",
  "docs/share-for-review.md",
  "docs/publish-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

if (failures.length > 0) {
  console.error("failed owner launch checklist boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Owner Launch Checklist");
printRows([
  ["Technical review", "ready"],
  ["Legal review packet", "ready"],
  ["Source package reuse", "ready under Apache-2.0"],
  ["Open-source license", "implemented"],
  ["npm publishing", "blocked, publish approval missing"],
  ["GitHub release", "blocked, release approval missing"],
  ["Hosted runtime", "blocked, runtime approval missing"],
  ["Code contributions", "blocked, contribution terms approval missing"]
]);

printSection("Current Guarded State");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["LICENSE file", "present"],
  ["Publish boundary", "npm publishing blocked, publishConfig.access restricted"]
]);

printSection("Approval Order");
printList([
  "1. Apache-2.0 source package reuse is approved and implemented.",
  "2. npm publishing needs a separate publish PRD.",
  "3. GitHub release publishing needs a separate release PRD.",
  "4. Hosted runtime work needs a separate runtime PRD.",
  "5. Code contribution acceptance needs explicit contribution terms."
]);

console.log("");
console.log("ok owner launch checklist ready");
console.log("blocked launch channels missing");

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
