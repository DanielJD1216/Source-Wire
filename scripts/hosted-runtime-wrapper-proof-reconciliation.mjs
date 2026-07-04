import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const docPath = "docs/hosted-runtime-wrapper-proof-reconciliation.md";
const doc = await readFile(docPath, "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  docPath,
  "docs/hosted-runtime-threat-model-trust-boundary.md",
  "docs/hosted-runtime-api-server-contract.md",
  "docs/hosted-runtime-mcp-server-contract.md",
  "docs/hosted-runtime-database-posture-data-lifecycle.md",
  "docs/hosted-runtime-public-safe-fixture-verification-plan.md",
  "docs/hosted-runtime-deployment-boundary-stop-conditions.md",
  "docs/contracts/wrapper-runtime-policy-contract.md",
  "docs/memory-engine-wrapper-runtime-fixture-matrix.md",
  "docs/memory-engine-wrapper-runtime-api-policy-wrapper-smoke.md",
  "docs/memory-engine-wrapper-runtime-mcp-adapter-policy-routing-smoke.md",
  "docs/memory-engine-wrapper-runtime-separate-runtime-adapter-boundary-smoke.md",
  "docs/memory-engine-wrapper-runtime-proof-docs-stop-conditions.md",
  "examples/fixtures/wrapper-runtime/wrapper-runtime-fixture-matrix.json",
  "examples/wrapper-runtime/owner-hosted-api-policy-wrapper-smoke.mjs",
  "examples/wrapper-runtime/mcp-adapter-policy-routing-smoke.mjs",
  "examples/wrapper-runtime/separate-runtime-adapter-boundary-smoke.mjs"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: reconciliation checkpoint. Hosted runtime implementation remains blocked.",
  "Can the existing synthetic wrapper proof be treated as aligned with the hosted-runtime gates?",
  "Yes, as a synthetic proof only.",
  "No, not as a real owner-hosted runtime yet.",
  "Gate Mapping",
  "`#259` Threat model and trust boundary",
  "`#260` API server runtime contract",
  "`#261` MCP server runtime contract",
  "`#262` Database posture and data lifecycle",
  "`#263` Public-safe fixture and verification plan",
  "`#264` Deployment boundary and stop conditions",
  "npm run runtime:wrapper-reconciliation",
  "npm run wrapper-runtime:api-policy-smoke",
  "npm run wrapper-runtime:mcp-adapter-smoke",
  "npm run wrapper-runtime:runtime-adapter-smoke",
  "We have contracts and synthetic proof.",
  "We do not yet have a real owner-run Source-Wire memory service"
]) {
  assertIncludes(doc, requiredText, docPath);
}

for (const preservedBoundary of [
  "owner-hosted first posture",
  "no managed-hosted behavior",
  "no real user data",
  "no deployment",
  "no database migrations",
  "no direct `Source-Wire-Memory-Engine` merge",
  "no AGPLv3 code copying",
  "MCP routes through Source-Wire API policy",
  "source evidence stays separate from trusted memory",
  "trusted memory promotion remains owner or application controlled",
  "synthetic fixtures only"
]) {
  assertIncludes(doc, preservedBoundary, `${docPath} preserved boundary`);
}

for (const blockedText of [
  "production API runtime",
  "production MCP runtime",
  "database schema or migrations",
  "live source imports",
  "real source maintenance",
  "real trusted-memory approval flows",
  "Mission Control UI",
  "owner-hosted setup wizard",
  "Source-Wire-managed hosting",
  "managed-hosted behavior",
  "Docker packaging",
  "installer packaging",
  "`Source-Wire-Memory-Engine` integration",
  "direct runtime merge",
  "AGPLv3 code copying",
  "npm release mutation",
  "GitHub release mutation",
  "public contribution acceptance",
  "real user data",
  "client data",
  "deployment"
]) {
  assertIncludes(doc, blockedText, `${docPath} blocked boundary`);
}

if (failures.length > 0) {
  console.error("failed hosted runtime wrapper proof reconciliation");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime Wrapper Proof Reconciliation");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Reconciliation artifact", docPath],
  ["Hosted-runtime issues", "#259 through #264"],
  ["Wrapper proof status", "aligned synthetic proof only"],
  ["Real owner-hosted runtime", "not implemented"],
  ["Deployment", "blocked"],
  ["Real user data", "blocked"],
  ["Next gate", "owner-approved narrow runtime skeleton implementation"]
]);

console.log("");
console.log("ok hosted runtime wrapper reconciliation ready");
console.log("ok wrapper proof aligned to hosted runtime planning gates");
console.log("ok synthetic proof only boundary retained");
console.log("blocked real owner-hosted runtime implementation");

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
