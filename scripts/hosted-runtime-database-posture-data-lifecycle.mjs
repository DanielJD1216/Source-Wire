import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const docPath = "docs/internal/hosted-runtime-database-posture-data-lifecycle.md";
const doc = await readFile(docPath, "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  docPath,
  "docs/internal/hosted-runtime-threat-model-trust-boundary.md",
  "docs/internal/hosted-runtime-api-server-contract.md",
  "docs/internal/hosted-runtime-mcp-server-contract.md"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: PRD/planning only for issue `#262`. Database migrations remain blocked.",
  "owner-hosted PostgreSQL-compatible database",
  "owner brings and pays for the database",
  "Source-Wire does not host the memory database by default",
  "Data Classes",
  "Namespace And Tenant Isolation",
  "Lifecycle States",
  "Retention And Deletion Posture",
  "Backup And Restore Risk",
  "Migration Posture",
  "Migrations remain blocked in this issue.",
  "Public-Safe Fixture Rule",
  "Audit Requirements",
  "Database Non-Goals",
  "no database implementation is added"
]) {
  assertIncludes(doc, requiredText, docPath);
}

for (const dataClass of [
  "Source evidence",
  "Candidate memory",
  "Trusted Memory Record",
  "Audit event",
  "Embedding/vector",
  "Cache",
  "Backup/export"
]) {
  assertIncludes(doc, dataClass, `${docPath} data class`);
}

for (const blockedText of [
  "database migrations",
  "database connection code",
  "PostgreSQL installation",
  "pgvector installation",
  "schema files",
  "seed data",
  "API server implementation",
  "MCP server runtime implementation",
  "runtime adapter implementation",
  "live connectors",
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
  console.error("failed hosted runtime database posture and data lifecycle");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime Database Posture And Data Lifecycle");
printRows([
  ["Issue", "#262"],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Planning artifact", docPath],
  ["Storage posture", "owner-hosted PostgreSQL-compatible first"],
  ["Namespace isolation", "defined"],
  ["Lifecycle states", "defined"],
  ["Backup/restore risk", "documented"],
  ["Retention/deletion posture", "defined"],
  ["Database migrations", "blocked"],
  ["Database connection code", "blocked"],
  ["Deployment", "blocked"],
  ["Real user data", "blocked"]
]);

console.log("");
console.log("ok hosted runtime database posture data lifecycle ready");
console.log("ok owner-hosted database posture documented");
console.log("ok owner namespace lifecycle boundaries documented");
console.log("ok backup restore risk documented");
console.log("ok migration boundary blocked");
console.log("blocked database migrations");

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
