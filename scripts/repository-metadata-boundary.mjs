import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

const expectedDescription = "Apache-2.0 agent-memory contracts. npm v0.1.0, GitHub release v0.1.0, not hosted.";
const expectedHomepage = "https://github.com/DanielJD1216/Source-Wire/blob/main/docs/share-for-review.md";
const expectedTopics = [
  "agent-memory",
  "apache-2-0",
  "llm-memory",
  "mcp",
  "second-brain",
  "source-graph",
  "typescript"
];

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public");

for (const requiredPath of [
  "README.md",
  "LICENSE",
  "docs/repository-metadata.md",
  "docs/share-for-review.md",
  "docs/public-status.md"
]) {
  await assertPathExists(requiredPath);
}

const repositoryMetadata = await readFile("docs/repository-metadata.md", "utf8");
const readme = await readFile("README.md", "utf8");

for (const [label, text, requiredText] of [
  ["repository metadata", repositoryMetadata, expectedDescription],
  ["repository metadata", repositoryMetadata, expectedHomepage],
  ["repository metadata", repositoryMetadata, "Issues: enabled"],
  ["repository metadata", repositoryMetadata, "Projects: disabled"],
  ["repository metadata", repositoryMetadata, "Wiki: disabled"],
  ["repository metadata", repositoryMetadata, "Default branch: `main`"],
  ["repository metadata", repositoryMetadata, "License: Apache-2.0"],
  ["repository metadata", repositoryMetadata, "Visibility: public"],
  ["repository metadata", repositoryMetadata, "code contribution acceptance"],
  ["repository metadata", repositoryMetadata, "published to npm as `@source-wire/contracts@0.1.0`"],
  ["repository metadata", repositoryMetadata, "released on GitHub as `v0.1.0`"],
  ["repository metadata", repositoryMetadata, "hosted runtime backend"],
  ["README", readme, "[Repository Metadata](docs/repository-metadata.md)"]
]) {
  if (!text.includes(requiredText)) {
    failures.push(`${label} missing required metadata boundary text: ${requiredText}`);
  }
}

for (const topic of expectedTopics) {
  if (!repositoryMetadata.includes(`- \`${topic}\``)) {
    failures.push(`repository metadata missing expected topic: ${topic}`);
  }
}

const unsafeLines = repositoryMetadata
  .split(/\r?\n/u)
  .filter((line) => !isExplicitBoundaryLine(line))
  .join("\n");

for (const unsafePattern of [
  /\bUNLICENSED\b/,
  /\bhosted\s+runtime\s+is\s+available\b/i,
  /\bproduction\s+ready\b/i,
  /\bcode\s+contributions\s+are\s+accepted\b/i
]) {
  if (unsafePattern.test(unsafeLines)) {
    failures.push(`repository metadata contains unsafe claim matching ${unsafePattern}`);
  }
}

if (failures.length > 0) {
  console.error("failed repository metadata boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Repository Metadata Boundary");
printRows([
  ["Expected description", expectedDescription],
  ["Expected homepage", expectedHomepage],
  ["Expected topics", expectedTopics.join(", ")],
  ["Issues", "enabled"],
  ["Projects", "disabled"],
  ["Wiki", "disabled"],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["npm publishing", "published"],
  ["GitHub release", "published"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok repository metadata boundary ready");
console.log("ok github about wording current");
console.log("blocked hosted runtime not approved");

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
  return /\b(?:not|no|blocked|do not|does not|without|unsafe|avoid|must not|cannot|currently|until|before|disabled|unpublished|unreleased|undeployed|published|released)\b/i.test(line);
}
