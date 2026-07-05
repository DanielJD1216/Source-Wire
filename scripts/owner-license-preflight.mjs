import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/owner-license-approval-preflight.md",
  "docs/license-approval-request-packet.md",
  "docs/license-approval-decision-record.md",
  "docs/license-decision-gate.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/launch-decision-status.md",
  "docs/publish-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

const decisionRecord = await readFile("docs/license-approval-decision-record.md", "utf8");
const approvalRequest = await readFile("docs/license-approval-request-packet.md", "utf8");

for (const requiredText of [
  "license_decision_status: implemented",
  "approved_license: Apache-2.0",
  "approval_scope: source_package_license_only"
]) {
  if (!decisionRecord.includes(requiredText)) {
    failures.push(`decision record missing required text: ${requiredText}`);
  }
}

for (const requiredText of [
  "Option 1: Approve Apache-2.0 Implementation",
  "Option 2: Stay Unlicensed",
  "Option 3: Request Legal Review First",
  "Option 4: Compare Source-Available Options"
]) {
  if (!approvalRequest.includes(requiredText)) {
    failures.push(`approval request missing required text: ${requiredText}`);
  }
}

if (failures.length > 0) {
  console.error("failed owner license approval preflight");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Owner License Approval Preflight");
printRows([
  ["Preflight", "ready"],
  ["Approval package", "complete"],
  ["Owner license approval", "captured"],
  ["Decision record", "implemented"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "present"],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Owner Decision Options");
printList([
  "Apache-2.0 implementation is complete.",
  "Release path approval is recorded in #255.",
  "Use a future approved release unit before publishing a new npm version or creating a new GitHub release.",
  "Contribution terms are defined; keep code contribution acceptance blocked until a separate implementation unit opens it.",
  "Hosted runtime PRD is approved and documented.",
  "Hosted runtime child issue publication is approved and the six PRD/planning issues are published as #259 through #264.",
  "Runtime PRD refresh approval is recorded and the refreshed public PRD/gate proof is available.",
  "Run npm run runtime:prd-refresh-proof to verify the refreshed PRD and wrapper-runtime gate.",
  "Run npm run runtime:prd-refresh-approval-status to verify the exact approval remains recorded.",
  "Hosted runtime implementation still needs a separate approved unit."
]);

console.log("");
console.log("ok owner license approval preflight ready");
console.log("ok owner approval package complete");
console.log("ok owner license approval captured");

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
