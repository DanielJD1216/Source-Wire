import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release approval");
assertEqual(packageJson.license, "UNLICENSED", "package license must remain UNLICENSED until owner license approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathMissing("LICENSE", "LICENSE file must not exist before owner license approval");

for (const requiredPath of [
  "docs/public-status.md",
  "docs/share-for-review.md",
  "docs/license-decision-gate.md",
  "docs/owner-license-approval-packet.md",
  "docs/apache-2-license-implementation-readiness.md",
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
  ["Broad reuse", "blocked until license approval"],
  ["Open-source release", "blocked until license implementation"],
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
  ["LICENSE file", "not present"],
  ["Publish boundary", "npm publishing blocked, publishConfig.access restricted"]
]);

printSection("Next Approval Needed");
printList([
  "To share for technical review, use docs/share-for-review.md.",
  "To share for broad public reuse, first approve and implement a license path from docs/license-decision-gate.md.",
  "To publish npm, open a separate publish PRD after licensing is approved.",
  "To add hosted runtime behavior, open a separate runtime PRD after the runtime gate is approved."
]);

console.log("");
console.log("ok world share technical review ready");
console.log("blocked world share broad reuse");

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
