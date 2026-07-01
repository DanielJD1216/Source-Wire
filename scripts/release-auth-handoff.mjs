import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 before approved release execution");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while release execution is blocked");

const handoffDoc = await readFile("docs/release-auth-handoff.md", "utf8");
const authPreflightDoc = await readFile("docs/release-auth-preflight.md", "utf8");
const executionPreflightDoc = await readFile("docs/release-execution-preflight.md", "utf8");

for (const requiredText of [
  "Status: owner-side npm authentication handoff only.",
  "npm login --registry=https://registry.npmjs.org/",
  "npm whoami",
  "npm run release:auth-preflight",
  "npm run release:execution-preflight",
  "Do not run `npm publish` from this handoff.",
  "blocked release auth owner action required"
]) {
  if (!handoffDoc.includes(requiredText)) {
    failures.push(`release auth handoff doc missing required text: ${requiredText}`);
  }
}

for (const [label, text, requiredText] of [
  ["release auth preflight doc", authPreflightDoc, "blocked release publish credentials missing"],
  ["release execution preflight doc", executionPreflightDoc, "blocked release publish credentials missing"]
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
console.log("It documents the exact npm authentication step required before approved release execution.");
console.log("It does not authenticate npm, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Owner action", "npm authentication required"],
  ["npm publish", "blocked until final release execution"],
  ["GitHub release", "blocked until final release execution"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Next Owner Actions");
printList([
  "Run npm login --registry=https://registry.npmjs.org/ in an owner-controlled terminal.",
  "Run npm whoami and confirm the expected npm account.",
  "Run npm run release:auth-preflight.",
  "Run npm run release:execution-preflight.",
  "Stop before npm publish, GitHub release creation, tag creation, or package version changes unless the final release execution unit is active."
]);

console.log("");
console.log("ok release auth handoff ready");
console.log("ok npm authentication owner steps documented");
console.log("blocked release auth owner action required");

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
