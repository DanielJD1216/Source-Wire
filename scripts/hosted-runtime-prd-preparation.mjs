import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.0.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay restricted while npm publishing is blocked");

for (const requiredPath of [
  "docs/hosted-runtime-prd-preparation.md",
  "docs/public-runtime-decision.md",
  "docs/runtime-implementation-gate.md",
  "docs/runtime-boundary.md",
  "docs/contracts/owner-hosted-api-mcp-boundary-contract.md",
  "docs/minimal-runtime-prd.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-approval-record-packet.md"
]) {
  await assertPathExists(requiredPath);
}

const preparation = await readFile("docs/hosted-runtime-prd-preparation.md", "utf8");
const approvalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const publicRuntimeDecision = await readFile("docs/public-runtime-decision.md", "utf8");
const runtimeGate = await readFile("docs/runtime-implementation-gate.md", "utf8");

for (const requiredText of [
  "Status: future PRD preparation only.",
  "Issue `#257` must contain the exact owner approval text",
  "owner-hosted versus managed-hosted boundary",
  "no trusted Memory Record auto-promotion",
  "Stop before PRD implementation if:",
  "blocked hosted runtime PRD approval missing"
]) {
  assertIncludes(preparation, requiredText, "hosted runtime PRD preparation");
}

for (const requiredText of [
  "Approved for a future Source-Wire hosted runtime PRD unit",
  "Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit."
]) {
  assertIncludes(approvalPacket, requiredText, "owner approval packet hosted runtime approval text");
  assertIncludes(preparation, requiredText, "hosted runtime PRD preparation exact approval text");
}

for (const requiredText of [
  "Source-Wire should stay a contracts-only public package for now.",
  "Owner-hosted API boundary",
  "Before Source-Wire adds runtime code"
]) {
  assertIncludes(publicRuntimeDecision, requiredText, "public runtime decision");
}

for (const requiredText of [
  "Hosted runtime implementation remains blocked.",
  "real user data",
  "trusted Memory Record"
]) {
  assertIncludes(runtimeGate, requiredText, "runtime implementation gate");
}

if (failures.length > 0) {
  console.error("failed hosted runtime PRD preparation");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Hosted Runtime PRD Preparation");
printRows([
  ["Preparation packet", "ready"],
  ["Owner approval issue", "#257"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Hosted runtime implementation", "blocked"],
  ["API server runtime", "blocked"],
  ["MCP server runtime", "blocked"],
  ["Database migrations", "blocked"],
  ["Real user data", "blocked"]
]);

printSection("Required Evidence Before PRD");
printList([
  "Issue #257 contains exact owner approval text.",
  "Runtime boundary is owner-hosted versus managed-hosted explicit.",
  "Threat model and namespace isolation are required.",
  "Public-safe fixtures are required.",
  "Trusted memory auto-promotion remains blocked."
]);

console.log("");
console.log("ok hosted runtime PRD preparation ready");
console.log("ok hosted runtime PRD evidence map ready");
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
