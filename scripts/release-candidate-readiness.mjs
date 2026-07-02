import { readFile, stat } from "node:fs/promises";
import { assertNoBlockedReleaseCommands } from "./blocked-release-commands.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.0.0 until release execution");
assertEqual(packageJson.private, false, "package private flag should stay false for package-shape checks");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay restricted while npm publishing is blocked");

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

assertNoBlockedReleaseCommands(packageJson.scripts, failures);

if (failures.length > 0) {
  console.error("failed release candidate readiness boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Candidate Readiness");
printRows([
  ["Release candidate", "ready for approved release execution preflight"],
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
  "Run npm run release:auth-handoff before any release mutation.",
  "Resolve npm authentication before npm publishing or matching GitHub release creation.",
  "Then run npm run release:auth-preflight and npm run release:execution-preflight.",
  "Keep hosted runtime, production runtime claims, and contribution acceptance blocked unless separate approval opens them.",
  "Do not publish npm, create a GitHub release, create a tag, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release candidate readiness ready");
console.log("ok local package verification ready");
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
