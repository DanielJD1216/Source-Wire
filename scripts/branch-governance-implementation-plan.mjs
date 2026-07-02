import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

for (const requiredPath of [
  "docs/branch-governance-implementation-plan.md",
  "docs/branch-governance-approval-request.md",
  "docs/branch-governance-decision-preflight.md",
  "docs/repository-metadata.md",
  "docs/publish-readiness.md",
  "docs/ci-checks.md",
  "docs/owner-launch-checklist.md"
]) {
  await assertPathExists(requiredPath);
}

const implementationPlan = await readFile("docs/branch-governance-implementation-plan.md", "utf8");
const approvalPacket = await readFile("docs/branch-governance-approval-request.md", "utf8");
const publishReadiness = await readFile("docs/publish-readiness.md", "utf8");
const ciChecks = await readFile("docs/ci-checks.md", "utf8");

for (const requiredText of [
  "Status: implementation plan only.",
  "This plan does not enable branch protection, create repository rulesets, publish a new npm version, create a new GitHub release, deploy services, add hosted runtime behavior, or accept code contributions.",
  "Option A: Minimal Branch Protection",
  "Option B: Repository Ruleset Governance",
  "Recommended first implementation path: Option A",
  "Rollback Plan",
  "Required Preflight",
  "npm run repository:branch-governance-preflight",
  "Required Post-Change Verification",
  "blocked branch governance implementation approval missing"
]) {
  assertIncludes(implementationPlan, requiredText, "branch governance implementation plan");
}

for (const requiredText of [
  "Option 1: Approve minimal branch protection",
  "Option 2: Approve repository ruleset governance",
  "blocked branch protection approval missing",
  "blocked repository ruleset approval missing"
]) {
  assertIncludes(approvalPacket, requiredText, "branch governance approval packet");
}

for (const requiredText of [
  "npm run repository:branch-governance-plan",
  "ok branch governance implementation plan ready",
  "ok branch governance recommended path documented",
  "blocked branch governance implementation approval missing"
]) {
  assertIncludes(publishReadiness, requiredText, "publish readiness branch governance plan");
  assertIncludes(ciChecks, requiredText, "ci checks branch governance plan");
}

if (failures.length > 0) {
  console.error("failed branch governance implementation plan");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Branch Governance Implementation Plan");
printRows([
  ["Implementation plan", "ready"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Recommended path", "minimal branch protection first"],
  ["Required check", "Package Checks"],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Future Implementation Boundaries");
printList([
  "Require current Package Checks to be green before changing branch governance.",
  "Prefer minimal branch protection before repository rulesets.",
  "Block force pushes and branch deletion.",
  "Keep owner emergency access documented.",
  "Verify live branch governance after any future settings change."
]);

console.log("");
console.log("ok branch governance implementation plan ready");
console.log("ok branch governance recommended path documented");
console.log("blocked branch governance implementation approval missing");

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

function assertIncludes(text, requiredText, reason) {
  if (!text.includes(requiredText)) {
    failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
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
