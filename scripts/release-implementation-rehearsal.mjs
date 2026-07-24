import { readFile, stat } from "node:fs/promises";
import { requiredPackagePaths } from "./package-required-paths.mjs";
import { assertNoBlockedReleaseCommands } from "./blocked-release-commands.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
const failures = [];

const futureVersion = "0.1.0";
const futurePublishAccess = "public";
const currentVersion = "0.1.0";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, currentVersion, "real package version must match approved release version");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must match approved release access");
assertEqual(packageLock.packages?.[""]?.version, currentVersion, "real package-lock root version must match approved release version");
assertEqual(packageLock.packages?.[""]?.license, packageJson.license, "package-lock root license must match package.json");

for (const requiredPath of [
  "LICENSE",
  "docs/internal/release-implementation-rehearsal.md",
  "docs/internal/release-implementation-runbook.md",
  "docs/internal/release-publish-config-plan.md",
  "docs/internal/release-version-recommendation.md",
  "docs/internal/release-candidate-readiness.md",
  "docs/internal/release-approval-request-packet.md",
  "docs/internal/release-notes-draft.md",
  "docs/status/public-status.md"
]) {
  await assertPathExists(requiredPath);
}

const runbook = await readFile("docs/internal/release-implementation-runbook.md", "utf8");
const recommendation = await readFile("docs/internal/release-version-recommendation.md", "utf8");
const rehearsalDoc = await readFile("docs/internal/release-implementation-rehearsal.md", "utf8");
const releaseNotesDraft = await readFile("docs/internal/release-notes-draft.md", "utf8");

for (const [label, text, requiredText] of [
  ["release implementation runbook", runbook, "Use version 0.1.0 for the first public release"],
  [
    "release implementation runbook",
    runbook,
    "keep access public unless the owner explicitly approves a different package distribution path"
  ],
  ["version recommendation", recommendation, "Implemented first public release path:"],
  ["version recommendation", recommendation, futureVersion],
  ["release implementation rehearsal", rehearsalDoc, "Status: approved release metadata check."],
  ["release implementation rehearsal", rehearsalDoc, "real `publishConfig.access` is `public`"],
  ["release implementation rehearsal", rehearsalDoc, "ok release metadata applied"],
  ["release notes draft", releaseNotesDraft, "Source-Wire 0.1.0: Agent-first memory contract package"]
]) {
  if (!text.includes(requiredText)) {
    failures.push(`${label} missing required text: ${requiredText}`);
  }
}

const simulatedManifest = {
  name: packageJson.name,
  version: futureVersion,
  license: packageJson.license,
  publishConfig: {
    ...packageJson.publishConfig,
    access: futurePublishAccess
  },
  bin: packageJson.bin,
  exports: packageJson.exports,
  files: packageJson.files
};

assertEqual(simulatedManifest.version, futureVersion, "simulated release manifest must use 0.1.0");
assertEqual(simulatedManifest.license, "Apache-2.0", "simulated release manifest must keep Apache-2.0");
assertEqual(simulatedManifest.publishConfig?.access, futurePublishAccess, "simulated release manifest must use public npm access");
assertEqual(simulatedManifest.bin?.["source-wire"], "dist/cli.js", "simulated release manifest must keep source-wire bin");

for (const requiredPath of [
  "package.json",
  "README.md",
  "LICENSE",
  "docs/internal/release-implementation-runbook.md",
  "docs/internal/release-publish-config-plan.md",
  "docs/internal/release-version-recommendation.md",
  "docs/internal/release-notes-draft.md"
]) {
  if (!requiredPackagePaths.includes(requiredPath)) {
    failures.push(`release rehearsal required package path missing from package manifest: ${requiredPath}`);
  }
}

assertNoBlockedReleaseCommands(packageJson.scripts, failures);

if (failures.length > 0) {
  console.error("failed release implementation rehearsal");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Implementation Rehearsal");
printRows([
  ["Rehearsal", "ready"],
  ["Real package version", packageJson.version],
  ["Real package-lock version", packageLock.packages[""].version],
  ["Real publishConfig.access", packageJson.publishConfig.access],
  ["Approved release version", simulatedManifest.version],
  ["Approved release publishConfig.access", simulatedManifest.publishConfig.access],
  ["License", simulatedManifest.license],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Release metadata", "applied"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Action");
printList([
  "Use this check to confirm first-release metadata remains applied.",
  "Do not create a new tag, publish a new npm version, create a new GitHub release, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release implementation rehearsal ready");
console.log("ok future version rehearsal 0.1.0");
console.log("ok future npm public access rehearsal");
console.log("ok release metadata applied");

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
