import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until approved release execution");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

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
  ["npm publishing", "blocked, release execution not performed"],
  ["GitHub release", "blocked, release execution not performed"],
  ["Branch governance", "blocked, branch governance approval missing"],
  ["Hosted runtime", "blocked, runtime approval missing"],
  ["Code contributions", "blocked, contribution terms approval missing"]
]);

printSection("Current Guarded State");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["LICENSE file", "present"],
  ["Publish boundary", "npm publishing blocked, publishConfig.access restricted"]
]);

printSection("Approval Order");
printList([
  "1. Apache-2.0 source package reuse is approved and implemented.",
  "2. Run npm run release:auth-handoff.",
  "3. Resolve npm authentication before npm publishing or matching GitHub release creation.",
  "4. Run npm run release:auth-preflight.",
  "5. Run npm run release:execution-preflight.",
  "6. Branch protection or repository rulesets need separate branch governance approval.",
  "7. Run npm run runtime:prd-decision-preflight.",
  "8. Hosted runtime work needs a separate runtime PRD.",
  "9. Run npm run contribution:terms-decision-preflight.",
  "10. Code contribution acceptance needs explicit contribution terms."
]);

printSection("Recommended Next Owner Choice");
printList([
  "Run npm run release:auth-handoff, authenticate npm, then rerun npm run release:auth-preflight and npm run release:execution-preflight.",
  "Use version 0.1.0 for the first public release unless final release execution verification finds a blocker.",
  "Keep hosted runtime, production runtime claims, and contribution acceptance blocked unless separate approval opens them."
]);

printSection("Owner Decision Issues");
printList([
  "#255 First public release path: https://github.com/DanielJD1216/Source-Wire/issues/255",
  "#256 Branch governance path: https://github.com/DanielJD1216/Source-Wire/issues/256",
  "#257 Hosted runtime PRD path: https://github.com/DanielJD1216/Source-Wire/issues/257",
  "#258 Contribution terms before accepting code: https://github.com/DanielJD1216/Source-Wire/issues/258"
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
