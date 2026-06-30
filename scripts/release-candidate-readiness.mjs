import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release approval");
assertEqual(packageJson.private, false, "package private flag should stay false for package-shape checks");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

for (const requiredPath of [
  "LICENSE",
  "README.md",
  "docs/release-approval-request-packet.md",
  "docs/release-candidate-readiness.md",
  "docs/release-decision.md",
  "docs/publish-readiness.md",
  "docs/launch-decision-status.md",
  "docs/public-status.md",
  "docs/ci-checks.md"
]) {
  await assertPathExists(requiredPath);
}

for (const [scriptName, scriptValue] of Object.entries(packageJson.scripts ?? {})) {
  if (scriptName === "publish:readiness") {
    continue;
  }

  if (/\bnpm\s+publish\b/.test(scriptValue)) {
    failures.push(`script ${scriptName} includes npm publish`);
  }

  if (/\bgh\s+release\b/.test(scriptValue)) {
    failures.push(`script ${scriptName} includes gh release`);
  }

  if (/\b(?:vercel|netlify|wrangler|flyctl|railway)\s+(?:deploy|publish|up)\b/.test(scriptValue)) {
    failures.push(`script ${scriptName} includes service deployment`);
  }
}

if (failures.length > 0) {
  console.error("failed release candidate readiness boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Candidate Readiness");
printRows([
  ["Release candidate", "ready for owner decision"],
  ["Local package verification", "ready"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Action");
printList([
  "Ask the owner to choose a release path from docs/release-approval-request-packet.md.",
  "Do not publish npm, create a GitHub release, create a tag, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release candidate readiness ready");
console.log("ok local package verification ready");
console.log("blocked release implementation approval missing");

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

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
