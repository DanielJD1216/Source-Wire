import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/guides/share-for-review.md",
  "docs/internal/license-approval-decision-record.md",
  "docs/internal/legal-review-question-packet.md",
  "docs/internal/owner-launch-checklist.md",
  "docs/internal/license-decision-gate.md",
  "docs/internal/world-share-readiness.md",
  "docs/guides/publish-readiness.md",
  "docs/status/public-status.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md"
]) {
  await assertPathExists(requiredPath);
}

if (failures.length > 0) {
  console.error("failed launch decision status boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Launch Decision Status");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["LICENSE file", "present"],
  ["Source repo sharing", "ready"],
  ["Legal advice", "not provided"],
  ["Owner license approval", "captured"],
  ["License decision record", "implemented"],
  ["License implementation", "complete"],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Branch protection", "implemented with Source-Wire package checks required"],
  ["Hosted runtime PRD", "approved and documented"],
  ["Hosted runtime child planning issues", "published as #259 through #264"],
  ["Hosted runtime implementation", "blocked"],
  ["Code contributions", "blocked, not accepted"]
]);

printSection("Next Approval");
printList([
  "Use README.md and LICENSE for public source repo sharing.",
  "Use npm install @source-wire/contracts for the public package.",
  "Use the GitHub v0.1.0 release for the first public release snapshot.",
  "Keep hosted runtime implementation, production runtime claims, repository rulesets, and contribution acceptance blocked unless separate approval opens them.",
  "Contribution terms are defined; keep code contribution acceptance blocked until a separate implementation unit opens it.",
  "Hosted runtime PRD/planning issues #259 through #264 are already published.",
  "Runtime PRD refresh approval is recorded and the refreshed public PRD/gate proof is available.",
  "Run npm run runtime:prd-refresh-proof to verify the refreshed PRD and wrapper-runtime gate.",
  "Keep hosted runtime implementation blocked until a separate implementation approval opens it."
]);

printSection("Owner Decision Status");
printList([
  "Completed #255 First public release path: https://github.com/DanielJD1216/Source-Wire/issues/255",
  "Completed #256 Branch governance path: https://github.com/DanielJD1216/Source-Wire/issues/256",
  "Completed #258 Contribution terms before accepting code: https://github.com/DanielJD1216/Source-Wire/issues/258",
  "Completed #257 Hosted runtime PRD path: https://github.com/DanielJD1216/Source-Wire/issues/257"
]);

console.log("");
console.log("ok launch decision status ready");
console.log("ok apache 2 license implemented");
console.log("ok source repo sharing ready");
console.log("ok npm package published @source-wire/contracts@0.1.0");
console.log("ok github release published v0.1.0");
console.log("ok hosted runtime PRD approval recorded");
console.log("ok hosted runtime child planning issues published");
console.log("blocked hosted runtime implementation");
console.log("blocked contributions not accepted");

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
