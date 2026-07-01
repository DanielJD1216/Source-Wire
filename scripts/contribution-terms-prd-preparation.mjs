import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

for (const requiredPath of [
  "docs/contribution-terms-prd-preparation.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md",
  "docs/reviewer-feedback-guide.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-approval-record-packet.md",
  ".github/pull_request_template.md"
]) {
  await assertPathExists(requiredPath);
}

const preparation = await readFile("docs/contribution-terms-prd-preparation.md", "utf8");
const approvalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const contributing = await readFile("CONTRIBUTING.md", "utf8");
const pullRequestTemplate = await readFile(".github/pull_request_template.md", "utf8");
const legalPacket = await readFile("docs/legal-review-question-packet.md", "utf8");

for (const requiredText of [
  "Status: future PRD preparation only.",
  "Issue `#258` must contain the exact owner approval text",
  "DCO, CLA, or no-external-code posture",
  "private-data exclusion rules",
  "Stop before PRD implementation if:",
  "blocked contribution terms PRD approval missing"
]) {
  assertIncludes(preparation, requiredText, "contribution terms PRD preparation");
}

for (const requiredText of [
  "Approved for a future Source-Wire contribution terms PRD unit",
  "Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit."
]) {
  assertIncludes(approvalPacket, requiredText, "owner approval packet contribution terms approval text");
  assertIncludes(preparation, requiredText, "contribution terms PRD preparation exact approval text");
}

for (const requiredText of [
  "code contributions are not accepted",
  "Structured review feedback is welcome"
]) {
  assertIncludes(contributing, requiredText, "contributing boundary");
}

for (const requiredText of [
  "Source-Wire is Apache-2.0 licensed as a source package, but code contributions are not accepted yet.",
  "I understand Source-Wire is not accepting public code contributions yet."
]) {
  assertIncludes(pullRequestTemplate, requiredText, "pull request contribution boundary");
}

for (const requiredText of [
  "Contributor Terms",
  "developer certificate of origin",
  "contribution policy"
]) {
  assertIncludes(legalPacket, requiredText, "legal review contribution questions");
}

if (failures.length > 0) {
  console.error("failed contribution terms PRD preparation");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Contribution Terms PRD Preparation");
printRows([
  ["Preparation packet", "ready"],
  ["Owner approval issue", "#258"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Code contribution acceptance", "blocked"],
  ["CLA or DCO enforcement", "blocked"],
  ["Public pull request acceptance", "blocked"],
  ["Hosted runtime", "blocked"],
  ["npm publishing", "blocked"]
]);

printSection("Required Evidence Before PRD");
printList([
  "Issue #258 contains exact owner approval text.",
  "DCO, CLA, or no-external-code posture is selected.",
  "Private-data exclusion rules are explicit.",
  "Maintainer review policy is explicit.",
  "Issue feedback remains separate from code contribution acceptance."
]);

console.log("");
console.log("ok contribution terms PRD preparation ready");
console.log("ok contribution terms evidence map ready");
console.log("blocked contribution terms PRD approval missing");

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
