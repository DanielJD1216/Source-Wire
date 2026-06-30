import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 before release approval");
assertEqual(packageJson.license, "UNLICENSED", "package license must remain UNLICENSED before owner approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathMissing("LICENSE", "LICENSE file must not exist before owner license approval");

for (const requiredPath of [
  "docs/owner-license-decision-intake.md",
  "docs/owner-license-decision-workflow.md",
  "docs/license-approval-request-packet.md",
  "docs/license-approval-decision-record.md",
  "docs/license-decision-implementation-plan.md",
  "docs/owner-license-approval-preflight.md",
  "docs/launch-decision-status.md",
  "docs/publish-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

const intake = await readFile("docs/owner-license-decision-intake.md", "utf8");
const decisionRecord = await readFile("docs/license-approval-decision-record.md", "utf8");

for (const requiredText of [
  "Status: owner decision intake only.",
  "Decision captured | no",
  "Selected option | none",
  "Option 1: Approve Apache-2.0 Implementation",
  "Option 2: Stay Unlicensed",
  "Option 3: Request Legal Review First",
  "Option 4: Compare Source-Available Options",
  "After the owner chooses exactly one option",
  "This intake does not allow:"
]) {
  if (!intake.includes(requiredText)) {
    failures.push(`decision intake missing required text: ${requiredText}`);
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
  console.error("failed owner decision intake");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Owner Decision Intake");
printRows([
  ["Decision intake", "ready"],
  ["Decision options", "available"],
  ["Owner decision", "not captured"],
  ["Decision record", "pending"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "not present"],
  ["Broad public reuse", "blocked"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Owner Action");
printList([
  "Run npm run owner:license-preflight.",
  "Read docs/owner-license-decision-intake.md.",
  "Choose exactly one decision option.",
  "Open the matching later implementation unit only after that choice."
]);

console.log("");
console.log("ok owner decision intake ready");
console.log("ok owner decision options available");
console.log("blocked owner decision not captured");

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
