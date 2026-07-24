import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

const handoffDoc = await readFile("docs/internal/release-auth-handoff.md", "utf8");
const authPreflightDoc = await readFile("docs/internal/release-auth-preflight.md", "utf8");
const executionPreflightDoc = await readFile("docs/internal/release-execution-preflight.md", "utf8");

for (const requiredText of [
  "Status: owner-side future-release npm authentication handoff only.",
  "npm login --registry=https://registry.npmjs.org/",
  "npm whoami",
  "npm run release:auth-preflight",
  "npm run release:execution-preflight",
  "Do not run `npm publish` from this handoff.",
  "blocked future release auth owner action required"
]) {
  if (!handoffDoc.includes(requiredText)) {
    failures.push(`release auth handoff doc missing required text: ${requiredText}`);
  }
}

for (const [label, text, requiredText] of [
  ["release auth preflight doc", authPreflightDoc, "blocked release publish credentials missing"],
  ["release execution preflight doc", executionPreflightDoc, "ok release publish credentials ready"]
]) {
  if (!text.includes(requiredText)) {
    failures.push(`${label} missing required text: ${requiredText}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`failed ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Release Auth Handoff");
console.log("This owner-side handoff is read-only.");
console.log("It documents the exact npm authentication step required before future release mutation.");
console.log("It does not authenticate npm, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Owner action", "future release npm authentication required before mutation"],
  ["npm publish", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Owner Actions");
printList([
  "For any future package version, run npm login --registry=https://registry.npmjs.org/ in an owner-controlled terminal.",
  "Run npm whoami and confirm the expected npm account before future release mutation.",
  "Run npm run release:auth-preflight before future release mutation.",
  "Run npm run release:execution-preflight before future release mutation.",
  "Stop before publishing a new npm version, creating a new GitHub release, creating a tag, or changing package version unless a future release execution unit is active."
]);

console.log("");
console.log("ok release auth handoff ready");
console.log("ok npm authentication owner steps documented");
console.log("blocked future release auth owner action required");

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    failures.push(`${message}: expected ${expected}, received ${actual}`);
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
