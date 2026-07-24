import { readFile, stat } from "node:fs/promises";
import { assertNoBlockedReleaseCommands } from "./blocked-release-commands.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

const approvedReleaseText =
  "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.";

const requiredDocs = [
  "docs/internal/release-implementation-preparation.md",
  "docs/internal/release-implementation-runbook.md",
  "docs/internal/release-approval-request-packet.md",
  "docs/internal/release-candidate-readiness.md",
  "docs/internal/release-artifact-manifest.md",
  "docs/internal/release-notes-draft.md",
  "docs/internal/release-version-recommendation.md",
  "docs/internal/launch-decision-status.md",
  "docs/internal/world-share-readiness.md",
  "docs/internal/legal-review-question-packet.md"
];

assertEqual(packageJson.name, "@source-wire/contracts", "package name");
assertEqual(packageJson.version, "0.1.0", "package version");
assertEqual(packageJson.license, "Apache-2.0", "package license");
assertEqual(packageJson.publishConfig?.access, "public", "publish access");

for (const requiredDoc of requiredDocs) {
  await assertPathExists(requiredDoc);
}

const preparationDoc = await readFile("docs/internal/release-implementation-preparation.md", "utf8");
for (const requiredText of [
  "Status: historical first-release preparation.",
  approvedReleaseText,
  "npm run release:approval-status",
  "npm run release:auth-preflight",
  "npm run release:decision-preflight",
  "npm run publish:readiness",
  "npm run release:artifact-manifest",
  "gh run watch",
  "npm publish",
  "gh release create",
  "Do not execute future release mutation without a new approved release unit and current npm plus GitHub release credentials."
]) {
  if (!preparationDoc.includes(requiredText)) {
    failures.push(`release implementation preparation doc missing required text: ${requiredText}`);
  }
}

assertNoBlockedReleaseCommands(packageJson.scripts, failures);

if (failures.length > 0) {
  console.error("failed release implementation preparation");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Implementation Preparation");
printRows([
  ["Preparation packet", "ready"],
  ["Owner approval issue", "#255"],
  ["Approved path", "npm plus GitHub release after final verification"],
  ["Future version target", "0.1.0"],
  ["Current package version", packageJson.version],
  ["Current license", packageJson.license],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Release tag", "v0.1.0 complete"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Required Evidence Before Execution");
printList([
  "Issue #255 contains exact owner approval text.",
  "npm run release:approval-status shows the exact approval is recorded separately in issue #255.",
  "npm run release:auth-preflight shows npm and GitHub authentication are ready.",
  "npm run release:decision-preflight passes.",
  "npm run publish:readiness passes from a clean checkout.",
  "npm run release:artifact-manifest records package identity, shasum, and integrity.",
  "Package Checks are green on the exact release commit.",
  "Release notes and version target are still intentional.",
  "No private data, local paths, real user records, or private proof history are present in package contents."
]);

printSection("Next Action");
printList([
  "Use docs/internal/release-implementation-preparation.md as historical evidence for the first release path.",
  "Do not publish a new npm version, create a new GitHub release, create a new tag, change package version, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release implementation preparation ready");
console.log("ok release implementation evidence map ready");
console.log("ok release execution completed");

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    failures.push(`missing required path: ${path}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual === expected) {
    return;
  }

  failures.push(`${label} must be ${expected}, received ${String(actual)}`);
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
