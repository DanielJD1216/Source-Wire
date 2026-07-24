import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const docPath = "docs/internal/hosted-runtime-api-server-contract.md";
const doc = await readFile(docPath, "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

await assertPathExists(docPath);
await assertPathExists("docs/internal/hosted-runtime-threat-model-trust-boundary.md");

for (const requiredText of [
  "Status: PRD/planning only for issue `#260`. API server implementation remains blocked.",
  "owner-hosted API boundary",
  "caller authentication",
  "owner and namespace resolution",
  "action authorization",
  "capability checks",
  "source evidence policy",
  "trusted-memory approval policy",
  "Required Request Envelope",
  "`caller.id`",
  "`namespaceId`",
  "`requiredCapability`",
  "Capability Model",
  "`read_trusted_memory`",
  "`read_source_evidence`",
  "`assemble_context`",
  "`import_or_maintain_sources`",
  "`prepare_candidates`",
  "`approve_trusted_memory`",
  "Endpoint Groups",
  "Read And Search",
  "Source Maintenance",
  "Candidate Creation And Review",
  "Trusted-Memory Approval",
  "Handoff And Status Evidence",
  "Audit",
  "Denied Result Contract",
  "Denied behavior must fail closed without leaking content.",
  "Every request must resolve exactly one namespace before content access.",
  "Source evidence",
  "Trusted memory",
  "API Non-Goals",
  "no server implementation is added"
]) {
  assertIncludes(doc, requiredText, docPath);
}

for (const blockedText of [
  "API server implementation",
  "route handlers",
  "database migrations",
  "MCP server runtime implementation",
  "runtime adapter implementation",
  "live connectors",
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
  console.error("failed hosted runtime API server contract");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime API Server Contract");
printRows([
  ["Issue", "#260"],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Planning artifact", docPath],
  ["Runtime posture", "owner-hosted first"],
  ["API policy boundary", "defined"],
  ["Endpoint groups", "defined"],
  ["Capability model", "defined"],
  ["Denied result", "fail-closed"],
  ["API server implementation", "blocked"],
  ["Database migrations", "blocked"],
  ["Deployment", "blocked"],
  ["Real user data", "blocked"]
]);

console.log("");
console.log("ok hosted runtime API server contract ready");
console.log("ok endpoint groups documented");
console.log("ok caller namespace action capability envelope documented");
console.log("ok fail-closed denied-result behavior documented");
console.log("ok audit metadata documented");
console.log("blocked API server implementation");

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
