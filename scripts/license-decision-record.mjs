import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const decisionRecord = await readFile("docs/license-approval-decision-record.md", "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

await assertPathExists("LICENSE");

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
  "license_decision_status: implemented",
  "approved_license: Apache-2.0",
  "approval_scope: source_package_license_only",
  "first_npm_publish_approval: recorded_in_issue_255",
  "first_github_release_approval: recorded_in_issue_255",
  "future_release_mutation_approval: blocked",
  "hosted_runtime_approval: blocked",
  "contribution_acceptance: blocked",
  "Apache-2.0 license implementation is approved and complete."
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
  ["Decision status", "implemented"],
  ["Approved license", "Apache-2.0"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "present"],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Remaining Execution And Approvals");
printList([
  "Release path approval is recorded in #255.",
  "Use a future approved release unit before publishing a new npm version or creating a new GitHub release.",
  "Contribution terms are defined; keep code contribution acceptance blocked until a separate implementation unit opens it.",
  "Hosted runtime PRD work is approved; implementation still needs a separate approved unit."
]);

console.log("");
console.log("ok license decision record ready");
console.log("ok license decision captured");
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
