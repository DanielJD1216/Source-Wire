import { readFile, stat } from "node:fs/promises";
import { assertNoBlockedReleaseCommands } from "./blocked-release-commands.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until approved release execution");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while release execution is blocked");

const requiredDocs = [
  "docs/release-implementation-runbook.md",
  "docs/release-publish-config-plan.md",
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
  "change `publishConfig.access` from `restricted` to `public`",
  "ok release implementation plan ready",
  "blocked release execution not performed",
  "package version remains `0.0.0`"
]) {
  if (!runbook.includes(requiredText)) {
    failures.push(`release implementation runbook missing required text: ${requiredText}`);
  }
}

assertNoBlockedReleaseCommands(packageJson.scripts, failures);

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
  "Run npm run release:auth-handoff before any release mutation.",
  "Resolve npm authentication before npm publishing or matching GitHub release creation.",
  "Then run npm run release:auth-preflight and npm run release:execution-preflight.",
  "Do not publish npm, create a GitHub release, create a tag, change package version, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release implementation plan ready");
console.log("ok release version target documented");
console.log("blocked release execution not performed");

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
