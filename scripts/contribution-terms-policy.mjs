import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");

const requiredPaths = [
  "docs/contribution-terms-prd.md",
  "docs/contribution-policy.md",
  "docs/contribution-terms-prd-preparation.md",
  "docs/contribution-terms-prd-execution-packet.md",
  "docs/contribution-terms-prd-decision-preflight.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md",
  ".github/pull_request_template.md"
];

for (const path of requiredPaths) {
  await assertPathExists(path);
}

const texts = new Map();
for (const path of requiredPaths) {
  texts.set(path, await readFile(path, "utf8"));
}

const prd = texts.get("docs/contribution-terms-prd.md") ?? "";
const policy = texts.get("docs/contribution-policy.md") ?? "";
const contributing = texts.get("CONTRIBUTING.md") ?? "";
const pullRequestTemplate = texts.get(".github/pull_request_template.md") ?? "";

for (const [label, text, requiredText] of [
  ["contribution terms PRD", prd, "Status: PRD complete, contribution acceptance still blocked."],
  ["contribution terms PRD", prd, "Current posture: Source-Wire does not accept public code contributions yet."],
  ["contribution terms PRD", prd, "prefer DCO over CLA"],
  ["contribution terms PRD", prd, "Private-data exclusion"],
  ["contribution terms PRD", prd, "License compatibility"],
  ["contribution terms PRD", prd, "Code contribution acceptance is still blocked."],
  ["contribution policy", policy, "Public code contributions are not accepted yet."],
  ["contribution policy", policy, "preferred path is DCO-based contribution, not CLA-based contribution"],
  ["contribution policy", policy, "Private-Data Exclusion"],
  ["contribution policy", policy, "Maintainer Review Policy"],
  ["contribution policy", policy, "Security Report Scope"],
  ["contribution policy", policy, "License Compatibility"],
  ["contribution policy", policy, "Code contribution acceptance remains blocked."],
  ["CONTRIBUTING.md", contributing, "Future contribution terms PRD work is approved"],
  ["pull request template", pullRequestTemplate, "Source-Wire is Apache-2.0 licensed as a source package, but code contributions are not accepted yet."]
]) {
  assertIncludes(text, requiredText, label);
}

const unsafeClaimText = [prd, policy, contributing, pullRequestTemplate]
  .flatMap((text) => text.split(/\r?\n/u))
  .filter((line) => !isExplicitBoundaryLine(line))
  .join("\n");

for (const unsafePattern of [
  /\bcode\s+contributions\s+are\s+accepted\b/i,
  /\bopen\s+for\s+contributions\b/i,
  /\bcontributions\s+are\s+open\b/i,
  /\bDCO\s+enforcement\s+is\s+enabled\b/i,
  /\bCLA\s+enforcement\s+is\s+enabled\b/i
]) {
  if (unsafePattern.test(unsafeClaimText)) {
    failures.push(`contribution terms docs contain unsafe claim matching ${unsafePattern}`);
  }
}

if (failures.length > 0) {
  console.error("failed contribution terms policy");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Contribution Terms Policy");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Contribution terms PRD", "defined"],
  ["Future posture", "DCO-preferred"],
  ["CLA enforcement", "blocked"],
  ["DCO enforcement", "blocked"],
  ["Code contribution acceptance", "blocked"],
  ["Feedback route", "structured issues"]
]);

console.log("");
console.log("ok contribution terms PRD defined");
console.log("ok contribution policy boundary current");
console.log("blocked code contribution acceptance");

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
    failures.push(`${reason} missing required text: ${requiredText}`);
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

function isExplicitBoundaryLine(line) {
  return /\b(?:not|no|blocked|do not|does not|without|unsafe|avoid|must not|cannot|currently|until|before|later|future|if|would|should|requires|require)\b/i.test(line);
}
