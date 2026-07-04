import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/owner-launch-checklist.md",
  "docs/legal-review-question-packet.md",
  "docs/license-decision-gate.md",
  "docs/branch-governance-approval-request.md",
  "docs/hosted-runtime-prd-decision-preflight.md",
  "docs/contribution-terms-prd-decision-preflight.md",
  "docs/release-auth-handoff.md",
  "docs/release-auth-preflight.md",
  "docs/release-execution-preflight.md",
  "docs/world-share-readiness.md",
  "docs/share-for-review.md",
  "docs/publish-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

if (failures.length > 0) {
  console.error("failed owner launch checklist boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Owner Launch Checklist");
printRows([
  ["Technical review", "ready"],
  ["Legal review packet", "ready"],
  ["Source package reuse", "ready under Apache-2.0"],
  ["Open-source license", "implemented"],
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Branch governance", "minimal branch protection implemented"],
  ["Hosted runtime PRD", "approved"],
  ["Hosted runtime implementation", "blocked"],
  ["Code contributions", "blocked, contribution terms PRD approved; acceptance not open"]
]);

printSection("Current Guarded State");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["LICENSE file", "present"],
  ["Publish boundary", "first release published, future package versions require a new approved release unit"]
]);

printSection("Approval Order");
printList([
  "1. Apache-2.0 source package reuse is approved and implemented.",
  "2. First npm publication and matching GitHub release are complete.",
  "3. Future package versions require a new approved release unit.",
  "4. Run npm run release:auth-preflight only before future release mutation.",
  "5. Run npm run release:execution-preflight only before future release mutation.",
  "6. Minimal branch protection is implemented; repository rulesets remain deferred.",
  "7. Run npm run contribution:terms-decision-preflight.",
  "8. Contribution terms PRD work is approved; code contribution acceptance still needs explicit contribution terms implementation.",
  "9. Run npm run runtime:child-issue-publication-packet.",
  "10. Hosted runtime child issue publication is approved and the six PRD/planning issues are published as #259 through #264.",
  "11. Use hosted runtime PRD/planning issues #259 through #264 for the next runtime planning sequence.",
  "12. Hosted runtime implementation still needs a separate approved unit."
]);

printSection("Recommended Next Owner Choice");
printList([
  "Keep the published first release at version 0.1.0.",
  "Use a future approved release unit before changing package version, npm dist-tags, or GitHub release assets.",
  "Keep contribution acceptance blocked until a separate implementation unit explicitly opens it.",
  "Use hosted runtime PRD/planning issues #259 through #264 for the next runtime planning sequence.",
  "Keep hosted runtime implementation, production runtime claims, and contribution acceptance blocked unless separate approval opens them."
]);

printSection("Owner Decision Status");
printList([
  "Completed #255 First public release path: https://github.com/DanielJD1216/Source-Wire/issues/255",
  "Completed #256 Branch governance path: https://github.com/DanielJD1216/Source-Wire/issues/256",
  "Completed #258 Contribution terms before accepting code: https://github.com/DanielJD1216/Source-Wire/issues/258",
  "Completed #257 Hosted runtime PRD path: https://github.com/DanielJD1216/Source-Wire/issues/257"
]);

console.log("");
console.log("ok owner launch checklist ready");
console.log("blocked launch channels missing");

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
