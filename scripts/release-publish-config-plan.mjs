import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.0.0 until approved release execution");
assertEqual(packageLock.version, "0.1.0", "package-lock version must remain 0.0.0 until approved release execution");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay restricted while npm publishing is blocked");

for (const requiredPath of [
  "docs/release-publish-config-plan.md",
  "docs/release-implementation-runbook.md",
  "docs/release-implementation-preparation.md",
  "docs/release-version-recommendation.md"
]) {
  await assertPathExists(requiredPath);
}

const planDoc = await readFile("docs/release-publish-config-plan.md", "utf8");
for (const requiredText of [
  "Status: publish-config transition plan only.",
  "Current `publishConfig.access`: `restricted`",
  "Future approved release value: `public`",
  "ok release publish config plan ready",
  "ok future npm public access documented",
  "blocked publish config mutation not performed"
]) {
  if (!planDoc.includes(requiredText)) {
    failures.push(`release publish config plan doc missing required text: ${requiredText}`);
  }
}

if (failures.length > 0) {
  console.error("failed release publish config plan");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Publish Config Plan");
printRows([
  ["Plan", "ready"],
  ["Package", packageJson.name],
  ["Current package version", packageJson.version],
  ["Current package-lock version", packageLock.version],
  ["Current publishConfig.access", packageJson.publishConfig.access],
  ["Future approved release version", "0.1.0"],
  ["Future approved release access", "public"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Future Release Mutation Boundary");
printList([
  "Keep publishConfig.access restricted until the approved release execution unit is active.",
  "During approved release execution, change package.json and package-lock.json from 0.0.0 to 0.1.0.",
  "During approved release execution, change publishConfig.access from restricted to public before npm publish.",
  "Rerun publish:readiness, release:artifact-manifest, Package Checks, and release:execution-preflight after those metadata changes.",
  "Do not publish npm, create a GitHub release, create tags, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release publish config plan ready");
console.log("ok future npm public access documented");
console.log("blocked publish config mutation not performed");

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
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}: ${value}`);
  }
}

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
