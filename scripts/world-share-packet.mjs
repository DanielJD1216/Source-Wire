import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

for (const requiredPath of [
  "LICENSE",
  "README.md",
  "docs/public-status.md",
  "docs/share-for-review.md",
  "docs/world-share-final-preflight.md",
  "docs/world-share-kit.md",
  "docs/world-share-packet.md",
  "docs/world-share-readiness.md",
  "docs/owner-launch-checklist.md",
  "docs/reviewer-feedback-guide.md"
]) {
  await assertPathExists(requiredPath);
}

if (failures.length > 0) {
  console.error("failed world share packet boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire World Share Packet");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Source repo", "https://github.com/DanielJD1216/Source-Wire"],
  ["Share state", "ready for Apache-2.0 source-package review and reuse"],
  ["npm package", "published @source-wire/contracts@0.1.0"],
  ["GitHub release", "published v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Production runtime", "blocked"],
  ["Code contributions", "blocked"]
]);

printSection("One-Line Copy");
console.log("Source-Wire is an Apache-2.0 package of agent-first memory contracts and examples, published as @source-wire/contracts@0.1.0, with hosted runtime and production-use claims still blocked.");

printSection("Short Public Copy");
console.log("I opened Source-Wire for technical review.");
console.log("");
console.log("It is an Apache-2.0 package for agent-first memory systems: contracts, schemas, fixtures, examples, and readiness gates.");
console.log("");
console.log("Important boundary: it is version 0.1.0, published to npm, released on GitHub, undeployed, and not a hosted runtime.");
console.log("");
console.log("Repo: https://github.com/DanielJD1216/Source-Wire");
console.log("npm: https://www.npmjs.com/package/@source-wire/contracts");
console.log("Release: https://github.com/DanielJD1216/Source-Wire/releases/tag/v0.1.0");
console.log("Start here: docs/public-status.md");

printSection("First Reviewer Commands");
printList([
  "git clone https://github.com/DanielJD1216/Source-Wire.git",
  "cd Source-Wire",
  "npm install",
  "npm run readiness:report",
  "npm run publish:readiness"
]);

printSection("Owner Preflight Before Broad Sharing");
printList([
  "npm run world:share-final-preflight"
]);

printSection("Lighter Source-Package Preflight");
printList([
  "npm run world:share-preflight"
]);

printSection("Feedback Route");
printList([
  "Use GitHub issue templates for verification failures, docs or contract feedback, and boundary or safety concerns.",
  "Do not send secrets, private data, real user memory, real chat logs, client names, account IDs, local private paths, or production exports."
]);

printSection("Still Blocked");
printList([
  "branch governance enforcement",
  "hosted runtime",
  "production runtime use",
  "code contribution acceptance"
]);

console.log("");
console.log("ok world share packet ready");
console.log("ok public share copy current");
console.log("blocked production launch channels");

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
