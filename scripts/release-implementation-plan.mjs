import { readFile, stat } from "node:fs/promises";
import { assertNoBlockedReleaseCommands } from "./blocked-release-commands.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

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
  "Status: historical first-release runbook.",
  "Use version 0.1.0 for the first public release",
  "keep access public unless the owner explicitly approves a different package distribution path",
  "ok release implementation plan ready",
  "ok release execution completed",
  "package version remains `0.1.0`"
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
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Release tags", "v0.1.0 complete"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Action");
printList([
  "Treat docs/release-implementation-runbook.md as historical evidence for the first release.",
  "Use a future approved release unit before publishing a new npm version or matching GitHub release.",
  "Run npm run release:auth-preflight and npm run release:execution-preflight only before future release mutation.",
  "Do not publish a new npm version, create a new GitHub release, create a new tag, change package version, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release implementation plan ready");
console.log("ok release version target documented");
console.log("ok release execution completed");

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
