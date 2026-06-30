import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 before release approval");
assertEqual(packageJson.license, "UNLICENSED", "package license must remain UNLICENSED before owner approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathMissing("LICENSE", "LICENSE file must not exist before owner license approval");

for (const requiredPath of [
  "docs/license-decision-implementation-plan.md",
  "docs/owner-license-decision-workflow.md",
  "docs/owner-license-approval-preflight.md",
  "docs/license-approval-request-packet.md",
  "docs/license-approval-decision-record.md",
  "docs/license-decision-gate.md",
  "docs/apache-2-license-implementation-readiness.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/launch-decision-status.md",
  "docs/publish-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

const plan = await readFile("docs/license-decision-implementation-plan.md", "utf8");
const decisionRecord = await readFile("docs/license-approval-decision-record.md", "utf8");

for (const requiredText of [
  "Path 1: Apache-2.0 Implementation",
  "Path 2: Stay Unlicensed",
  "Path 3: Legal Review First",
  "Path 4: Compare Source-Available Options",
  "Stop Conditions",
  "blocked license implementation awaiting owner decision"
]) {
  if (!plan.includes(requiredText)) {
    failures.push(`implementation plan missing required text: ${requiredText}`);
  }
}

for (const requiredText of [
  "license_decision_status: pending",
  "approved_license: none",
  "approval_scope: none"
]) {
  if (!decisionRecord.includes(requiredText)) {
    failures.push(`decision record missing required text: ${requiredText}`);
  }
}

if (failures.length > 0) {
  console.error("failed license implementation plan");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire License Decision Implementation Plan");
printRows([
  ["Implementation plan", "ready"],
  ["Decision paths", "mapped"],
  ["License implementation", "awaiting owner decision"],
  ["Decision record", "pending"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "not present"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Mapped Decision Paths");
printList([
  "Apache-2.0 implementation.",
  "Stay UNLICENSED.",
  "Legal review first.",
  "Compare source-available options first."
]);

console.log("");
console.log("ok license implementation plan ready");
console.log("ok license decision paths mapped");
console.log("blocked license implementation awaiting owner decision");

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
