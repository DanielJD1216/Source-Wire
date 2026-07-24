import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const docPath = "docs/internal/hosted-runtime-threat-model-trust-boundary.md";
const doc = await readFile(docPath, "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

await assertPathExists(docPath);

for (const requiredText of [
  "Status: PRD/planning only for issue `#259`. Runtime implementation remains blocked.",
  "Owner-hosted first",
  "Source-Wire does not host everyone else's memory by default.",
  "Managed-hosted operation remains deferred",
  "API policy boundary",
  "Namespace boundary",
  "Source-to-memory boundary",
  "Approval boundary",
  "MCP must not become a second policy engine.",
  "cross-namespace reads and writes fail closed",
  "Source evidence is cited evidence only. It is not trusted memory by default.",
  "Agents cannot promote trusted memory by default.",
  "unauthorized callers",
  "Prompt injection in source",
  "Deployment misconfiguration",
  "MCP bypass",
  "No implementation is added."
]) {
  assertIncludes(doc, requiredText, docPath);
}

for (const blockedText of [
  "runtime implementation",
  "API server implementation",
  "MCP server runtime implementation",
  "database migrations",
  "deployment config",
  "production runtime claims",
  "real user data",
  "code contribution acceptance",
  "npm publishing",
  "GitHub release creation",
  "tags"
]) {
  assertIncludes(doc, blockedText, `${docPath} blocked boundary`);
}

if (failures.length > 0) {
  console.error("failed hosted runtime threat model trust boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime Threat Model And Trust Boundary");
printRows([
  ["Issue", "#259"],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Planning artifact", docPath],
  ["Runtime posture", "owner-hosted first"],
  ["Managed-hosted", "deferred"],
  ["API server implementation", "blocked"],
  ["MCP server runtime implementation", "blocked"],
  ["Database migrations", "blocked"],
  ["Deployment", "blocked"],
  ["Real user data", "blocked"]
]);

console.log("");
console.log("ok hosted runtime threat model trust boundary ready");
console.log("ok owner-hosted first posture documented");
console.log("ok managed-hosted deferred");
console.log("ok fail-closed namespace and permission behavior documented");
console.log("ok source evidence versus trusted memory boundary documented");
console.log("ok MCP API-policy bypass prohibition documented");
console.log("blocked hosted runtime implementation");

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

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    failures.push(`${label} must include ${JSON.stringify(needle)}`);
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
