import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

for (const requiredPath of [
  "docs/contribution-terms-prd-execution-packet.md",
  "docs/contribution-terms-prd-preparation.md",
  "docs/contribution-terms-prd-decision-preflight.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md",
  "docs/reviewer-feedback-guide.md",
  "docs/legal-review-question-packet.md",
  ".github/pull_request_template.md"
]) {
  await assertPathExists(requiredPath);
}

const executionPacket = await readFile("docs/contribution-terms-prd-execution-packet.md", "utf8");
const preparation = await readFile("docs/contribution-terms-prd-preparation.md", "utf8");
const decisionPreflight = await readFile("docs/contribution-terms-prd-decision-preflight.md", "utf8");
const contributing = await readFile("CONTRIBUTING.md", "utf8");
const pullRequestTemplate = await readFile(".github/pull_request_template.md", "utf8");

for (const requiredText of [
  "Status: execution packet only.",
  "This packet does not accept code contributions, change contribution policy, add a CLA, add a DCO requirement, publish a new npm version, create a new GitHub release, create tags, deploy services, add hosted runtime behavior, enable branch governance, or approve production runtime use.",
  "Required Owner Approval",
  "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions",
  "Pre-Execution Checks",
  "Future PRD Scope",
  "DCO, CLA, or no-external-code policy",
  "Private-data exclusion",
  "Future Verification",
  "Stop Conditions",
  "blocked contribution terms PRD approval missing"
]) {
  assertIncludes(executionPacket, requiredText, "contribution terms PRD execution packet");
}

for (const requiredText of [
  "Status: future PRD preparation only.",
  "Issue `#258` must contain the exact owner approval text",
  "blocked contribution terms PRD approval missing"
]) {
  assertIncludes(preparation, requiredText, "contribution terms PRD preparation");
}

for (const requiredText of [
  "Status: contribution terms PRD decision preflight only.",
  "ok contribution terms PRD decision preflight ready",
  "blocked contribution terms PRD approval missing"
]) {
  assertIncludes(decisionPreflight, requiredText, "contribution terms PRD decision preflight");
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

if (failures.length > 0) {
  console.error("failed contribution terms PRD execution packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Contribution Terms PRD Execution Packet");
printRows([
  ["Execution packet", "ready"],
  ["Owner approval issue", "#258"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Code contribution acceptance", "blocked"],
  ["CLA or DCO enforcement", "blocked"],
  ["Public pull request acceptance", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Production runtime use", "blocked"]
]);

printSection("Future PRD Boundary");
printList([
  "Do not start the contribution terms PRD unit until issue #258 records exact owner approval.",
  "Do not accept code contributions, add CLA or DCO enforcement, change GitHub collaboration settings, or weaken private-data exclusion from this packet.",
  "Keep hosted runtime behavior, deployment, new releases, and production runtime claims blocked."
]);

console.log("");
console.log("ok contribution terms PRD execution packet ready");
console.log("ok contribution terms PRD execution scope documented");
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
