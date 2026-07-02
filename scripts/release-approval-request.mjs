import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const approvalPacket = await readFile("docs/release-approval-request-packet.md", "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.0.0 until release execution");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay restricted while npm publishing is blocked");

for (const requiredPath of [
  "LICENSE",
  "docs/release-approval-request-packet.md",
  "docs/release-candidate-readiness.md",
  "docs/release-decision.md",
  "docs/launch-decision-status.md",
  "docs/owner-launch-checklist.md"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: release approval request with recorded owner decision.",
  "Issue [#255](https://github.com/DanielJD1216/Source-Wire/issues/255) records the owner decision to use Option 1",
  "Release execution remains blocked until npm authentication is resolved and final release preflights pass.",
  "Current Recorded Decision",
  "Historical Owner Decision Options",
  "Option 1: Approve npm plus GitHub release implementation (recommended)",
  "Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version.",
  "keep production runtime claims blocked",
  "Option 2: Approve npm publishing only",
  "Option 3: Approve GitHub release only",
  "Option 4: Keep release publishing blocked",
  "Option 5: Request release review first",
  "This packet does not approve npm publishing"
]) {
  if (!approvalPacket.includes(requiredText)) {
    failures.push(`release approval request missing required text: ${requiredText}`);
  }
}

if (failures.length > 0) {
  console.error("failed release approval request boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Approval Request");
printRows([
  ["Approval request", "ready"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Version release", "blocked"]
]);

printSection("Recorded Owner Decision And Next Action");
printList([
  "Issue #255 records approval for npm plus GitHub release implementation.",
  "Resolve npm authentication before npm publishing or matching GitHub release creation.",
  "Run npm run release:auth-preflight and npm run release:execution-preflight.",
  "Keep hosted runtime, production runtime claims, and contribution acceptance blocked unless separate approval opens them."
]);

console.log("");
console.log("ok release approval request ready");
console.log("blocked npm publishing release execution not performed");
console.log("blocked github release execution not performed");
console.log("blocked version release execution not performed");

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
