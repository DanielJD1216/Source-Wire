import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

for (const requiredPath of [
  "docs/branch-governance-approval-request.md",
  "docs/repository-metadata.md",
  "docs/publish-readiness.md",
  "docs/ci-checks.md",
  "docs/owner-launch-checklist.md"
]) {
  await assertPathExists(requiredPath);
}

const approvalPacket = await readFile("docs/branch-governance-approval-request.md", "utf8");
const repositoryMetadata = await readFile("docs/repository-metadata.md", "utf8");
const publishReadiness = await readFile("docs/publish-readiness.md", "utf8");

for (const requiredText of [
  "Status: branch governance approval request only.",
  "Option 1: Approve minimal branch protection",
  "Option 2: Approve repository ruleset governance",
  "Option 3: Keep owner-direct maintenance for now",
  "Option 4: Request governance review first",
  "ok branch protection approval recorded",
  "blocked repository ruleset approval missing",
  "This packet does not enable branch protection, create repository rulesets, publish a new npm version, create a new GitHub release, deploy services, add hosted runtime behavior, or accept code contributions."
]) {
  assertIncludes(approvalPacket, requiredText, "branch governance approval packet");
}

for (const requiredText of [
  "Branch protection: enabled",
  "Repository rulesets: none",
  "npm run repository:live-branch"
]) {
  assertIncludes(repositoryMetadata, requiredText, "repository metadata branch governance state");
}

for (const requiredText of [
  "ok branch protection enabled",
  "blocked repository rulesets not enabled",
  "Repository rulesets remain deferred because minimal branch protection is enough for the current source-package sharing state."
]) {
  assertIncludes(publishReadiness, requiredText, "publish readiness branch governance boundary");
}

if (failures.length > 0) {
  console.error("failed branch governance approval request");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Branch Governance Approval Request");
printRows([
  ["Approval request", "ready"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Default branch", "main"],
  ["Branch protection", "approval recorded, implemented"],
  ["Repository rulesets", "blocked, approval missing"],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Owner Decision Options");
printList([
  "Minimal branch protection is already approved and implemented.",
  "Approve repository ruleset governance later.",
  "Keep repository rulesets disabled for now.",
  "Request governance review first."
]);

console.log("");
console.log("ok branch governance approval request ready");
console.log("ok branch protection approval recorded");
console.log("blocked repository ruleset approval missing");

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
