import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const docPath = "docs/internal/hosted-runtime-mcp-server-contract.md";
const doc = await readFile(docPath, "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

await assertPathExists(docPath);
await assertPathExists("docs/internal/hosted-runtime-api-server-contract.md");
await assertPathExists("docs/internal/hosted-runtime-threat-model-trust-boundary.md");

for (const requiredText of [
  "Status: PRD/planning only for issue `#261`. MCP server runtime implementation remains blocked.",
  "MCP server must call the owner-hosted API policy boundary",
  "MCP-To-API Envelope",
  "`toolName`",
  "`caller.id`",
  "`namespaceId`",
  "`requiredCapability`",
  "Proposed Tool Groups",
  "`search_trusted_memory`",
  "`search_source_evidence`",
  "`assemble_context`",
  "`use_2nd_brain`",
  "`maintain_source_connection`",
  "`list_memory_candidates`",
  "`approve_memory_candidate`",
  "`reject_memory_candidate`",
  "`read_handoff_evidence`",
  "`write_handoff_evidence`",
  "Required Output Metadata",
  "`citations`",
  "`gaps`",
  "`deniedCount`",
  "`audit`",
  "`noAutoPromotion`",
  "Forbidden Bypass Paths",
  "MCP tool -> database",
  "MCP tool -> runtime adapter",
  "MCP tool -> trusted memory promotion",
  "Mutation-like tools require explicit authority.",
  "MCP Non-Goals",
  "no MCP runtime implementation is added"
]) {
  assertIncludes(doc, requiredText, docPath);
}

for (const blockedText of [
  "MCP server runtime implementation",
  "API server implementation",
  "tool registration",
  "database migrations",
  "direct database access",
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
  console.error("failed hosted runtime MCP server contract");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime MCP Server Contract");
printRows([
  ["Issue", "#261"],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Planning artifact", docPath],
  ["MCP to API policy routing", "defined"],
  ["Tool groups", "defined"],
  ["Output metadata", "defined"],
  ["Mutation authority", "explicit"],
  ["API bypass", "forbidden"],
  ["MCP server runtime implementation", "blocked"],
  ["API server implementation", "blocked"],
  ["Database migrations", "blocked"],
  ["Deployment", "blocked"],
  ["Real user data", "blocked"]
]);

console.log("");
console.log("ok hosted runtime MCP server contract ready");
console.log("ok MCP tool groups documented");
console.log("ok MCP to API policy envelope documented");
console.log("ok citation gap denied-count audit metadata preservation documented");
console.log("ok mutation-like tools require explicit authority");
console.log("ok MCP API-bypass prohibition documented");
console.log("blocked MCP server runtime implementation");

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
