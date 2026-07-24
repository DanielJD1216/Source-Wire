import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const docPath = "docs/internal/hosted-runtime-deployment-boundary-stop-conditions.md";
const doc = await readFile(docPath, "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  docPath,
  "docs/internal/hosted-runtime-threat-model-trust-boundary.md",
  "docs/internal/hosted-runtime-api-server-contract.md",
  "docs/internal/hosted-runtime-mcp-server-contract.md",
  "docs/internal/hosted-runtime-database-posture-data-lifecycle.md",
  "docs/internal/hosted-runtime-public-safe-fixture-verification-plan.md",
  "docs/internal/runtime-readiness-smoke.md",
  "docs/internal/runtime-proof-intake.md"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: PRD/planning only for issue `#264`. Deployment and hosted services remain blocked.",
  "Running software is not the same thing as Source-Wire hosting memory for people.",
  "Deployment Vocabulary",
  "Local Development Boundary",
  "Owner-Hosted Boundary",
  "Managed-Hosted Boundary",
  "Production Runtime Claims",
  "Deployment Stop Conditions",
  "Rollback And Recovery Expectations",
  "Required Gates Before Deployment Work",
  "No Hosted Service Created",
  "Deployment Non-Goals"
]) {
  assertIncludes(doc, requiredText, docPath);
}

for (const boundaryText of [
  "Local development run",
  "Owner-hosted runtime",
  "Managed-hosted runtime",
  "Production runtime use",
  "Deployment config",
  "Hosted service"
]) {
  assertIncludes(doc, boundaryText, `${docPath} deployment vocabulary`);
}

for (const requiredGate of [
  "npm run runtime:threat-model",
  "npm run runtime:api-contract",
  "npm run runtime:mcp-contract",
  "npm run runtime:database-posture",
  "npm run runtime:fixture-plan",
  "npm run runtime:deployment-boundary",
  "npm run runtime-readiness:smoke",
  "npm run runtime-proof-intake:smoke",
  "npm run safety:scan",
  "npm run claims:scan",
  "npm run owner:open-issues-status"
]) {
  assertIncludes(doc, requiredGate, `${docPath} required gate`);
}

for (const stopCondition of [
  "adds deployment config",
  "adds cloud provider config",
  "opens public network access",
  "requires real secrets",
  "requires a real database connection",
  "adds database migrations without a migration approval unit",
  "adds live connector sync",
  "imports real user data",
  "uses real local paths in public examples",
  "lets MCP bypass API policy",
  "lets source evidence become trusted memory automatically",
  "claims production readiness",
  "creates a hosted service"
]) {
  assertIncludes(doc, stopCondition, `${docPath} stop condition`);
}

for (const blockedText of [
  "hosted runtime implementation",
  "API server implementation",
  "MCP server runtime implementation",
  "database migrations",
  "PostgreSQL setup",
  "pgvector setup",
  "deployment config",
  "Docker deployment config",
  "cloud infrastructure config",
  "managed hosting",
  "production runtime use",
  "live connectors",
  "local filesystem crawling",
  "Mission Control UI",
  "real user data",
  "client data",
  "trusted Memory Record auto-promotion",
  "npm publishing",
  "GitHub release creation",
  "tags",
  "code contribution acceptance"
]) {
  assertIncludes(doc, blockedText, `${docPath} blocked boundary`);
}

if (failures.length > 0) {
  console.error("failed hosted runtime deployment boundary and stop conditions");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime Deployment Boundary And Stop Conditions");
printRows([
  ["Issue", "#264"],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Planning artifact", docPath],
  ["Local development boundary", "defined"],
  ["Owner-hosted boundary", "defined"],
  ["Managed-hosted boundary", "deferred"],
  ["Production runtime claims", "blocked"],
  ["Deployment config", "blocked"],
  ["Hosted service", "not created"]
]);

console.log("");
console.log("ok hosted runtime deployment boundary ready");
console.log("ok local owner-hosted managed-hosted boundaries separated");
console.log("ok production runtime claims blocked");
console.log("ok deployment stop conditions documented");
console.log("blocked deployment");

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
