import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release implementation approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while release execution is blocked");

const requiredDocs = [
  "docs/release-implementation-runbook.md",
  "docs/release-review-packet.md",
  "docs/release-version-recommendation.md",
  "docs/release-notes-draft.md",
  "docs/release-approval-request-packet.md",
  "docs/release-candidate-readiness.md",
  "docs/publish-readiness.md",
  "docs/public-status.md"
];

for (const requiredPath of ["LICENSE", ...requiredDocs]) {
  await assertPathExists(requiredPath);
}

const runbook = await readFile("docs/release-implementation-runbook.md", "utf8");

for (const requiredText of [
  "Status: implementation runbook only.",
  "Use version 0.1.0 for the first public release",
  "ok release implementation plan ready",
  "blocked release execution approval missing",
  "package version remains `0.0.0`"
]) {
  if (!runbook.includes(requiredText)) {
    failures.push(`release implementation runbook missing required text: ${requiredText}`);
  }
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
  console.error("failed release implementation plan");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Implementation Plan");
printRows([
  ["Implementation runbook", "ready"],
  ["Recommended future version", "0.1.0"],
  ["Current package version", packageJson.version],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Release tags", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Action");
printList([
  "Get explicit owner approval before release execution.",
  "Do not publish npm, create a GitHub release, create a tag, change package version, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release implementation plan ready");
console.log("ok release version target documented");
console.log("blocked release execution approval missing");

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
