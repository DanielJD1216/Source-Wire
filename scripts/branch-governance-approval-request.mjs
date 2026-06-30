import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

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
  "blocked branch protection approval missing",
  "blocked repository ruleset approval missing",
  "This packet does not enable branch protection, create repository rulesets, publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions."
]) {
  assertIncludes(approvalPacket, requiredText, "branch governance approval packet");
}

for (const requiredText of [
  "Branch protection: not enabled",
  "Repository rulesets: none",
  "npm run repository:live-branch"
]) {
  assertIncludes(repositoryMetadata, requiredText, "repository metadata branch governance state");
}

for (const requiredText of [
  "blocked branch protection not enabled",
  "blocked repository rulesets not enabled",
  "Branch protection or repository rulesets should be handled in a separate owner-approved governance unit"
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
  ["Branch protection", "blocked, approval missing"],
  ["Repository rulesets", "blocked, approval missing"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Owner Decision Options");
printList([
  "Approve minimal branch protection later.",
  "Approve repository ruleset governance later.",
  "Keep owner-direct maintenance for now.",
  "Request governance review first."
]);

console.log("");
console.log("ok branch governance approval request ready");
console.log("blocked branch protection approval missing");
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
