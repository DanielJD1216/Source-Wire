import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  "docs/hosted-runtime-prd-acceptance-matrix.md",
  "docs/hosted-runtime-prd.md",
  "docs/hosted-runtime-prd-execution-packet.md",
  "docs/hosted-runtime-prd-decision-preflight.md",
  "docs/hosted-runtime-child-issue-publication-preflight.md",
  "docs/hosted-runtime-issue-slices.md",
  "docs/runtime-readiness-smoke.md",
  "docs/runtime-proof-intake.md",
  "docs/runtime-boundary.md",
  "docs/public-runtime-decision.md",
  "docs/first-time-visitor-share-readiness-audit.md",
  "docs/legal-review-question-packet.md",
  "docs/public-status.md",
  "docs/contracts/owner-hosted-api-mcp-boundary-contract.md"
]) {
  await assertPathExists(requiredPath);
}

const matrix = await readFile("docs/hosted-runtime-prd-acceptance-matrix.md", "utf8");
const prd = await readFile("docs/hosted-runtime-prd.md", "utf8");
const executionPacket = await readFile("docs/hosted-runtime-prd-execution-packet.md", "utf8");
const decisionPreflight = await readFile("docs/hosted-runtime-prd-decision-preflight.md", "utf8");

for (const requiredText of [
  "Status: PRD acceptance matrix only. Hosted runtime implementation remains blocked.",
  "This matrix does not implement hosted runtime behavior",
  "scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements",
  "| Scope |",
  "| Threat model |",
  "| Owner-hosted versus managed-hosted boundary |",
  "| API server runtime |",
  "| MCP server runtime |",
  "| Database posture |",
  "| Deployment boundary |",
  "| Public-safe fixtures |",
  "| Verification gates |",
  "| No-private-data requirements |",
  "npm run runtime:prd-acceptance-matrix",
  "npm run runtime-readiness:smoke",
  "npm run runtime-proof-intake:smoke",
  "blocked hosted runtime implementation",
  "Minimum Evidence Before Implementation",
  "Stop Conditions"
]) {
  assertIncludes(matrix, requiredText, "hosted runtime PRD acceptance matrix");
}

for (const requiredText of [
  "Status: PRD only. Hosted runtime implementation remains blocked.",
  "owner-hosted versus managed-hosted boundary",
  "API server boundary",
  "MCP server runtime",
  "database posture",
  "deployment boundary",
  "public-safe fixtures",
  "Verification Gates",
  "runtime-proof-intake",
  "no-private-data rules"
]) {
  assertIncludes(prd, requiredText, "hosted runtime PRD");
}

for (const requiredText of [
  "Status: historical execution packet and current boundary check.",
  "Approved PRD Scope",
  "Stop Conditions",
  "Still Blocked"
]) {
  assertIncludes(executionPacket, requiredText, "hosted runtime PRD execution packet");
}

for (const requiredText of [
  "ok hosted runtime PRD decision preflight ready",
  "ok runtime readiness gate current",
  "ok runtime proof intake gate current",
  "ok exact hosted runtime PRD approval recorded",
  "hosted runtime implementation"
]) {
  assertIncludes(decisionPreflight, requiredText, "hosted runtime PRD decision preflight");
}

if (failures.length > 0) {
  console.error("failed hosted runtime PRD acceptance matrix");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime PRD Acceptance Matrix");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Scope", "mapped"],
  ["Threat model", "mapped"],
  ["Owner-hosted boundary", "mapped"],
  ["Managed-hosted boundary", "deferred"],
  ["API server runtime", "PRD only"],
  ["MCP server runtime", "PRD only"],
  ["Database posture", "mapped"],
  ["Deployment boundary", "mapped"],
  ["Public-safe fixtures", "synthetic only"],
  ["No-private-data rule", "retained"]
]);

printSection("Runtime Boundary");
printList([
  "This command verifies PRD evidence only.",
  "It does not publish hosted-runtime child issues.",
  "It does not implement hosted runtime behavior.",
  "It does not add API server runtime, MCP server runtime, database migrations, deployment config, or real user data."
]);

console.log("");
console.log("ok hosted runtime PRD acceptance matrix ready");
console.log("ok hosted runtime PRD clauses mapped");
console.log("ok hosted runtime PRD stop conditions retained");
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
