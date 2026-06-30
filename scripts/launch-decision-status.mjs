import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release approval");
assertEqual(packageJson.license, "UNLICENSED", "package license must remain UNLICENSED until owner approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathMissing("LICENSE", "LICENSE file must not exist before owner license approval");

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
  ["LICENSE file", "not present"],
  ["Technical review sharing", "ready"],
  ["Legal approval", "blocked, not granted"],
  ["Owner launch approval", "blocked, missing"],
  ["License decision record", "pending"],
  ["License implementation", "blocked, missing"],
  ["npm publishing", "blocked, not approved"],
  ["GitHub release", "blocked, not approved"],
  ["Hosted runtime", "blocked, not approved"],
  ["Code contributions", "blocked, not accepted"]
]);

printSection("Next Approval");
printList([
  "Use docs/share-for-review.md for technical review sharing.",
  "Use docs/legal-review-question-packet.md for legal or owner review.",
  "Use docs/license-decision-gate.md before any license implementation.",
  "Open separate PRDs for npm publishing, GitHub release publishing, hosted runtime, and contribution acceptance."
]);

console.log("");
console.log("ok launch decision status ready");
console.log("ok technical review sharing ready");
console.log("blocked legal approval not granted");
console.log("blocked owner launch approval missing");
console.log("blocked license implementation missing");
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

async function assertPathMissing(path, reason) {
  try {
    await stat(path);
    failures.push(reason);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    failures.push(`could not inspect ${path}`);
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
