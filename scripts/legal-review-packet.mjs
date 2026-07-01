import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release execution");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while publishing is blocked");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/legal-review-question-packet.md",
  "docs/license-decision-gate.md",
  "docs/owner-license-approval-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/future-license-change-plan.md",
  "docs/world-share-readiness.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md"
]) {
  await assertPathExists(requiredPath);
}

if (failures.length > 0) {
  console.error("failed legal review packet boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Legal Review Packet");
printRows([
  ["Status", "question packet only"],
  ["Legal advice", "not provided"],
  ["Current license", packageJson.license],
  ["Current version", packageJson.version],
  ["LICENSE file", "present"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Code contributions", "blocked"]
]);

printSection("Review Topics");
printList([
  "license path: Apache-2.0, stay unlicensed, source-available, or legal review first",
  "commercial reuse: whether public users may reuse Source-Wire commercially",
  "contributor terms: whether and how code contributions can be accepted later",
  "support boundary: what public support is offered before and after licensing",
  "security reporting: what public security reports are in scope before runtime exists",
  "name and trademark: whether Source-Wire naming needs ownership or usage rules",
  "hosted runtime boundary: what rights apply to future hosted or managed memory services",
  "private data boundary: what examples, fixtures, and issue reports must never include"
]);

printSection("Next Action");
printList([
  "Read docs/legal-review-question-packet.md.",
  "Use Apache-2.0 for public source-package reuse.",
  "Route remaining contributor, support, hosted runtime, brand, and private-data questions before those channels open."
]);

console.log("");
console.log("ok legal review packet ready");
console.log("ok owner license approval recorded");

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
