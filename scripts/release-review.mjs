import { readFile, stat } from "node:fs/promises";
import { assertNoBlockedReleaseCommands } from "./blocked-release-commands.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until approved release execution");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

const requiredDocs = [
  "docs/release-review-packet.md",
  "docs/release-version-recommendation.md",
  "docs/release-notes-draft.md",
  "docs/release-approval-request-packet.md",
  "docs/release-candidate-readiness.md",
  "docs/release-decision.md",
  "docs/public-status.md",
  "docs/ci-checks.md"
];

for (const requiredPath of ["LICENSE", ...requiredDocs]) {
  await assertPathExists(requiredPath);
}

const reviewPacket = await readFile("docs/release-review-packet.md", "utf8");
const versionRecommendation = await readFile("docs/release-version-recommendation.md", "utf8");
const releaseNotesDraft = await readFile("docs/release-notes-draft.md", "utf8");

for (const [label, text, requiredText] of [
  ["release review packet", reviewPacket, "Status: release review only."],
  ["release review packet", reviewPacket, "npm registry state | `E404 Not Found` observed on 2026-06-30"],
  ["release review packet", reviewPacket, "Recorded release approval:"],
  ["version recommendation", versionRecommendation, "Recommended first public release path:"],
  ["version recommendation", versionRecommendation, "0.1.0"],
  ["release notes draft", releaseNotesDraft, "Source-Wire 0.1.0: Agent-first memory contract package"],
  ["release notes draft", releaseNotesDraft, "Do not publish this note until npm publishing is actually approved and completed."]
]) {
  if (!text.includes(requiredText)) {
    failures.push(`${label} missing required text: ${requiredText}`);
  }
}

assertNoBlockedReleaseCommands(packageJson.scripts, failures);

if (failures.length > 0) {
  console.error("failed release review packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Review");
printRows([
  ["Release review", "ready"],
  ["Decision inputs", "documented"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Current version", packageJson.version],
  ["Recommended future version", "0.1.0"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Action");
printList([
  "Run npm run release:execution-preflight before any release mutation.",
  "Resolve npm authentication before npm publishing or matching GitHub release creation.",
  "Do not publish npm, create a GitHub release, create a tag, change package version, deploy services, or accept code contributions from this check."
]);

console.log("");
console.log("ok release review packet ready");
console.log("ok release decision inputs documented");
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
