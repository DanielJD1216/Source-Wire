import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

const historicalLicenseDocs = [
  "docs/internal/decision-prototypes/license-options.md",
  "docs/internal/decision-prototypes/license-evidence.md",
  "docs/internal/decision-prototypes/license-recommendation.md"
];

for (const file of [
  ...historicalLicenseDocs,
  "docs/internal/license-approval-request-packet.md",
  "docs/internal/license-decision-implementation-plan.md",
  "docs/internal/owner-license-decision-workflow.md",
  "docs/internal/owner-license-decision-intake.md",
  "docs/guides/publish-readiness.md"
]) {
  await assertPathExists(file);
}

for (const file of historicalLicenseDocs) {
  const text = await readFile(file, "utf8");
  for (const requiredText of [
    "Historical status: superseded.",
    "Apache-2.0 is now implemented",
    "This document is retained as decision history"
  ]) {
    if (!text.includes(requiredText)) {
      failures.push(`${file} missing superseded historical license notice: ${requiredText}`);
    }
  }
}

const recommendation = await readFile("docs/internal/decision-prototypes/license-recommendation.md", "utf8");
for (const requiredText of [
  "Current implemented license: Apache-2.0.",
  "The old recommendation below is not current guidance.",
  "Do not use this historical document to argue that Source-Wire is currently unlicensed."
]) {
  if (!recommendation.includes(requiredText)) {
    failures.push(`license recommendation missing current implementation warning: ${requiredText}`);
  }
}

const implementationPlan = await readFile("docs/internal/license-decision-implementation-plan.md", "utf8");
for (const requiredText of [
  "Path 2: Stay Unlicensed",
  "Status: historical option, not selected.",
  "Apache-2.0 implementation is complete."
]) {
  if (!implementationPlan.includes(requiredText)) {
    failures.push(`license implementation plan missing historical option boundary: ${requiredText}`);
  }
}

const publishReadiness = await readFile("docs/guides/publish-readiness.md", "utf8");
for (const requiredText of [
  "The command verifies that the owner license decision record exists, says implemented, and matches the Apache-2.0 source-package state.",
  "The command verifies that the already captured owner decision options are present and that Apache-2.0 implementation is complete.",
  "The command verifies that all four historical owner decision paths are mapped, stop conditions are present, and Apache-2.0 implementation is complete.",
  "It does not change the implemented Apache-2.0 license, change package metadata, publish npm, create a GitHub release, deploy services, start a runtime, connect to a database, or accept contributions."
]) {
  if (!publishReadiness.includes(requiredText)) {
    failures.push(`publish readiness missing current license-history wording: ${requiredText}`);
  }
}

const currentGuidanceTexts = [
  ["README.md", await readFile("README.md", "utf8")],
  ["docs/status/public-status.md", await readFile("docs/status/public-status.md", "utf8")],
  ["docs/guides/share-for-review.md", await readFile("docs/guides/share-for-review.md", "utf8")],
  ["docs/internal/world-share-readiness.md", await readFile("docs/internal/world-share-readiness.md", "utf8")],
  ["docs/guides/technical-reviewer-guide.md", await readFile("docs/guides/technical-reviewer-guide.md", "utf8")]
];

for (const [file, text] of currentGuidanceTexts) {
  if (/\bstay\s+`?UNLICENSED`?\b/i.test(text) || /\bshould\s+stay\s+`?UNLICENSED`?\b/i.test(text)) {
    failures.push(`${file} contains current-facing stay UNLICENSED wording`);
  }
}

if (failures.length > 0) {
  console.error("failed historical license boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Historical License Boundary");
printRows([
  ["Current license", packageJson.license],
  ["Version", packageJson.version],
  ["Historical decision docs", "superseded"],
  ["Old UNLICENSED recommendation", "retained only as history"],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok historical license boundary ready");
console.log("ok unlicensed recommendation superseded");
console.log("blocked license history launch approval");

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
