import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const decisionRecord = await readFile("docs/license-approval-decision-record.md", "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 before release approval");
assertEqual(packageJson.license, "UNLICENSED", "package license must remain UNLICENSED before owner approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathMissing("LICENSE", "LICENSE file must not exist before owner license approval");

for (const requiredPath of [
  "docs/license-approval-decision-record.md",
  "docs/license-decision-gate.md",
  "docs/owner-license-approval-packet.md",
  "docs/legal-review-question-packet.md",
  "docs/license-approval-rehearsal.md",
  "docs/apache-2-license-implementation-readiness.md",
  "docs/launch-decision-status.md"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "license_decision_status: pending",
  "approved_license: none",
  "approval_scope: none",
  "npm_publish_approval: blocked",
  "github_release_approval: blocked",
  "hosted_runtime_approval: blocked",
  "contribution_acceptance: blocked",
  "No license change is approved."
]) {
  if (!decisionRecord.includes(requiredText)) {
    failures.push(`decision record missing required text: ${requiredText}`);
  }
}

if (failures.length > 0) {
  console.error("failed license decision record boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire License Approval Decision Record");
printRows([
  ["Decision status", "pending"],
  ["Approved license", "none"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "not present"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Approval Needed");
printList([
  "Use docs/license-decision-gate.md to choose the license path.",
  "Use docs/legal-review-question-packet.md if legal review is needed first.",
  "Do not add a LICENSE file or change package metadata until a future owner-approved license implementation unit."
]);

console.log("");
console.log("ok license decision record ready");
console.log("blocked license decision pending");
console.log("blocked license implementation missing");

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
