import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted");

const requiredPaths = [
  ".github/pull_request_template.md",
  "CONTRIBUTING.md",
  "docs/repository-metadata.md",
  "docs/public-status.md"
];

for (const file of requiredPaths) {
  await assertPathExists(file);
}

const template = await readFile(".github/pull_request_template.md", "utf8");
const contributing = await readFile("CONTRIBUTING.md", "utf8");
const repositoryMetadata = await readFile("docs/repository-metadata.md", "utf8");

for (const [label, text, requiredText] of [
  ["pull request template", template, "code contributions are not accepted yet"],
  ["pull request template", template, "For public review feedback, use issues instead:"],
  ["pull request template", template, "I understand Source-Wire is not accepting public code contributions yet."],
  ["pull request template", template, "I did not include secrets, private data, local private paths, production exports, account IDs, client names, private screenshots, real source payloads, real chat logs, or real memory records."],
  ["pull request template", template, "I did not add npm publishing, GitHub release publishing, release tags, deployment, hosted runtime behavior, production runtime claims, or code contribution acceptance."],
  ["pull request template", template, "This pull request does not approve:"],
  ["pull request template", template, "npm publishing"],
  ["pull request template", template, "GitHub release publishing"],
  ["pull request template", template, "hosted runtime behavior"],
  ["pull request template", template, "production runtime claims"],
  ["CONTRIBUTING.md", contributing, "code contributions are not accepted"],
  ["repository metadata", repositoryMetadata, "not accepting code contributions"]
]) {
  if (!text.includes(requiredText)) {
    failures.push(`${label} missing required pull request boundary text: ${requiredText}`);
  }
}

const claimLines = template
  .split(/\r?\n/u)
  .filter((line) => !isExplicitBoundaryLine(line))
  .join("\n");

for (const unsafePattern of [
  /\bcode\s+contributions\s+are\s+accepted\b/i,
  /\bopen\s+for\s+contributions\b/i,
  /\bcontributions\s+are\s+open\b/i,
  /\bpublished\s+to\s+npm\b/i,
  /\breleased\s+on\s+GitHub\b/i,
  /\bproduction\s+ready\b/i
]) {
  if (unsafePattern.test(claimLines)) {
    failures.push(`pull request template contains unsafe claim matching ${unsafePattern}`);
  }
}

if (failures.length > 0) {
  console.error("failed pull request boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Pull Request Boundary");
printRows([
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Pull request template", "present"],
  ["Public code contributions", "blocked"],
  ["Feedback route", "issues"],
  ["Private data", "blocked"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"]
]);

console.log("");
console.log("ok pull request boundary ready");
console.log("ok code contribution pr blocked");
console.log("blocked private data in pull requests");

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
  return /\b(?:not|no|blocked|do not|does not|without|unsafe|avoid|must not|cannot|currently|until|before|disabled|unpublished|unreleased|undeployed)\b/i.test(line);
}
