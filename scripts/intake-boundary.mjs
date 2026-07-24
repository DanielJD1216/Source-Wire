import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public");

const intakeFiles = [
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md",
  ".github/ISSUE_TEMPLATE/docs-contract-feedback.yml",
  ".github/ISSUE_TEMPLATE/verification-failure.yml",
  ".github/ISSUE_TEMPLATE/boundary-safety-concern.yml",
  "docs/guides/reviewer-feedback-guide.md",
  "docs/reference/repository-metadata.md",
  "docs/status/public-status.md"
];

for (const file of intakeFiles) {
  await assertPathExists(file);
}

const scannedTexts = new Map();
for (const file of intakeFiles) {
  scannedTexts.set(file, await readFile(file, "utf8"));
}

for (const file of [
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md",
  ".github/ISSUE_TEMPLATE/docs-contract-feedback.yml"
]) {
  const text = scannedTexts.get(file) ?? "";
  if (/\bUNLICENSED\b/.test(text)) {
    failures.push(`${file} still contains stale UNLICENSED wording`);
  }
}

const contributing = scannedTexts.get("CONTRIBUTING.md") ?? "";
const support = scannedTexts.get("SUPPORT.md") ?? "";
const security = scannedTexts.get("SECURITY.md") ?? "";

for (const [label, text, requiredText] of [
  ["CONTRIBUTING.md", contributing, "Source-Wire is Apache-2.0 licensed as a source package."],
  ["CONTRIBUTING.md", contributing, "code contributions are not accepted"],
  ["CONTRIBUTING.md", contributing, "ok license Apache-2.0"],
  ["SUPPORT.md", support, "Apache-2.0 licensed as a source package"],
  ["SECURITY.md", security, "Apache-2.0 licensed as a source package"],
  ["SECURITY.md", security, "Security reporting does not approve:"],
  ["SECURITY.md", security, "code contribution acceptance"],
  ["SECURITY.md", security, "contribution enforcement or maintainer workflow changes"]
]) {
  if (!text.includes(requiredText)) {
    failures.push(`${label} missing required intake boundary text: ${requiredText}`);
  }
}

const claimLines = [...scannedTexts.values()]
  .flatMap((text) => text.split(/\r?\n/u))
  .filter((line) => !isExplicitBoundaryLine(line))
  .join("\n");
for (const unsafePattern of [
  /\bcode\s+contributions\s+are\s+accepted\b/i,
  /\bopen\s+for\s+contributions\b/i,
  /\bcontributions\s+are\s+open\b/i
]) {
  if (unsafePattern.test(claimLines)) {
    failures.push(`public intake surfaces contain unsafe claim matching ${unsafePattern}`);
  }
}

if (failures.length > 0) {
  console.error("failed public intake boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Public Intake Boundary");
printRows([
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Source reuse", "allowed under Apache-2.0"],
  ["Feedback issues", "structured and allowed"],
  ["Code contributions", "blocked"],
  ["npm publishing", "published"],
  ["GitHub release", "published"],
  ["Hosted runtime", "blocked"]
]);

console.log("");
console.log("ok public intake boundary ready");
console.log("ok apache 2 intake wording current");
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
  return /\b(?:not|no|blocked|do not|does not|without|unsafe|avoid|must not|cannot|currently|until|before)\b/i.test(line);
}
