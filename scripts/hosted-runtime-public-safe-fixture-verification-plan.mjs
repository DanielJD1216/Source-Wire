import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const docPath = "docs/internal/hosted-runtime-public-safe-fixture-verification-plan.md";
const doc = await readFile(docPath, "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  docPath,
  "docs/internal/public-safe-fixture-implementation-proof.md",
  "docs/internal/public-safe-fixture-smoke.md",
  "docs/internal/hosted-runtime-threat-model-trust-boundary.md",
  "docs/internal/hosted-runtime-api-server-contract.md",
  "docs/internal/hosted-runtime-mcp-server-contract.md",
  "docs/internal/hosted-runtime-database-posture-data-lifecycle.md",
  "docs/internal/runtime-readiness-smoke.md",
  "docs/internal/runtime-proof-intake.md"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: accepted PRD/planning artifact for issue `#263`. The approved synthetic hosted-runtime fixture package is implemented.",
  "The approved synthetic fixture implementation is recorded in [Public-Safe Fixture Implementation Proof](public-safe-fixture-implementation-proof.md).",
  "Runtime behavior must be testable before it touches private memory.",
  "Fixture Safety Rules",
  "Required Fixture Categories",
  "Minimum Fixture Scenarios",
  "Verification Gates",
  "Minimum owner-side live gates before implementation approval",
  "Runtime Implementation Entry Packet",
  "No-Go Conditions",
  "Fixture Non-Goals",
  "All runtime proof fixtures are synthetic.",
  "No real owner, client, account, token, path, database, export, screenshot, or production data was used."
]) {
  assertIncludes(doc, requiredText, docPath);
}

for (const fixtureCategory of [
  "Owner",
  "Caller",
  "Namespace",
  "Source connection",
  "Source evidence",
  "Candidate memory",
  "Trusted memory",
  "Approval and rejection",
  "Denied access",
  "Gaps and stale evidence",
  "MCP calls",
  "Audit events",
  "Runtime adapter result"
]) {
  assertIncludes(doc, fixtureCategory, `${docPath} fixture category`);
}

for (const gate of [
  "npm run runtime-readiness:smoke",
  "npm run runtime-proof-intake:smoke",
  "npm run safety:scan",
  "npm run claims:scan",
  "npm run docs:links",
  "npm run docs:anchors",
  "npm run docs:command-setup",
  "npm run validate:fixtures",
  "npm test",
  "npm run build",
  "npm run owner:open-issues-status",
  "Package Checks"
]) {
  assertIncludes(doc, gate, `${docPath} verification gate`);
}

for (const forbiddenFixtureText of [
  "real user data",
  "private owner data",
  "client data",
  "real local paths",
  "account IDs",
  "emails",
  "domains",
  "tokens",
  "credentials",
  "database connection strings",
  "screenshots",
  "production exports"
]) {
  assertIncludes(doc, forbiddenFixtureText, `${docPath} forbidden fixture data`);
}

for (const blockedText of [
  "additional fixture implementation beyond the approved synthetic hosted-runtime fixture package",
  "seed data",
  "database schema files",
  "database migrations",
  "database connection code",
  "API server implementation",
  "MCP server runtime implementation",
  "runtime adapter implementation",
  "live connector implementation",
  "local filesystem crawling",
  "Mission Control UI",
  "managed hosting",
  "deployment",
  "production runtime use",
  "real user data",
  "trusted Memory Record auto-promotion",
  "npm publishing",
  "GitHub release creation",
  "tags",
  "code contribution acceptance"
]) {
  assertIncludes(doc, blockedText, `${docPath} blocked boundary`);
}

if (failures.length > 0) {
  console.error("failed hosted runtime public-safe fixture verification plan");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime Public-Safe Fixture And Verification Plan");
printRows([
  ["Issue", "#263"],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Planning artifact", docPath],
  ["Fixture implementation", "approved synthetic hosted-runtime fixture package implemented"],
  ["Fixture data posture", "synthetic only"],
  ["Denied cases", "required"],
  ["Runtime readiness gate", "required"],
  ["Runtime proof intake gate", "required"],
  ["Public safety scan", "required"],
  ["Claim boundary scan", "required"],
  ["Real user data", "blocked"]
]);

console.log("");
console.log("ok hosted runtime public-safe fixture verification plan ready");
console.log("ok synthetic fixture categories documented");
console.log("ok denied access and stale evidence fixture scenarios documented");
console.log("ok runtime verification gates documented");
console.log("ok synthetic fixture implementation proof recorded");

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
