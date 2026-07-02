import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

for (const requiredPath of [
  "docs/hosted-runtime-prd-execution-packet.md",
  "docs/hosted-runtime-prd-preparation.md",
  "docs/hosted-runtime-prd-decision-preflight.md",
  "docs/public-runtime-decision.md",
  "docs/runtime-implementation-gate.md",
  "docs/runtime-boundary.md",
  "docs/minimal-runtime-prd.md",
  "docs/owner-launch-checklist.md"
]) {
  await assertPathExists(requiredPath);
}

const executionPacket = await readFile("docs/hosted-runtime-prd-execution-packet.md", "utf8");
const preparation = await readFile("docs/hosted-runtime-prd-preparation.md", "utf8");
const decisionPreflight = await readFile("docs/hosted-runtime-prd-decision-preflight.md", "utf8");

for (const requiredText of [
  "Status: execution packet only.",
  "This packet does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish a new npm version, create a new GitHub release, create tags, enable branch governance, accept code contributions, add real user data, or approve production runtime use.",
  "Required Owner Approval",
  "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary",
  "Pre-Execution Checks",
  "Future PRD Scope",
  "owner-hosted first, managed-hosted deferred unless explicitly approved",
  "no trusted Memory Record auto-promotion",
  "Future Verification",
  "Stop Conditions",
  "blocked hosted runtime PRD approval missing"
]) {
  assertIncludes(executionPacket, requiredText, "hosted runtime PRD execution packet");
}

for (const requiredText of [
  "Status: future PRD preparation only.",
  "Issue `#257` must contain the exact owner approval text",
  "blocked hosted runtime PRD approval missing"
]) {
  assertIncludes(preparation, requiredText, "hosted runtime PRD preparation");
}

for (const requiredText of [
  "Status: hosted runtime PRD decision preflight only.",
  "ok hosted runtime PRD decision preflight ready",
  "blocked hosted runtime PRD approval missing"
]) {
  assertIncludes(decisionPreflight, requiredText, "hosted runtime PRD decision preflight");
}

if (failures.length > 0) {
  console.error("failed hosted runtime PRD execution packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime PRD Execution Packet");
printRows([
  ["Execution packet", "ready"],
  ["Owner approval issue", "#257"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Runtime posture", "owner-hosted first, managed-hosted deferred"],
  ["API server runtime", "PRD only, implementation blocked"],
  ["MCP server runtime", "PRD only, implementation blocked"],
  ["Database migrations", "blocked"],
  ["Real user data", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Future PRD Boundary");
printList([
  "Do not start the hosted runtime PRD unit until issue #257 records exact owner approval.",
  "Do not add API server runtime, MCP server runtime, database migrations, deployment config, live connectors, or real user data from this packet.",
  "Keep trusted Memory Record auto-promotion, production runtime claims, and contribution acceptance blocked."
]);

console.log("");
console.log("ok hosted runtime PRD execution packet ready");
console.log("ok hosted runtime PRD execution scope documented");
console.log("blocked hosted runtime PRD approval missing");

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

function assertIncludes(text, requiredText, reason) {
  if (!text.includes(requiredText)) {
    failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
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

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
