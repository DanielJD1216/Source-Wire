import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

for (const requiredPath of [
  "docs/internal/hosted-runtime-prd-preparation.md",
  "docs/internal/public-runtime-decision.md",
  "docs/internal/runtime-implementation-gate.md",
  "docs/internal/runtime-readiness-smoke.md",
  "docs/internal/runtime-proof-intake.md",
  "docs/concepts/runtime-boundary.md",
  "docs/contracts/owner-hosted-api-mcp-boundary-contract.md",
  "docs/internal/minimal-runtime-prd.md",
  "docs/internal/legal-review-question-packet.md",
  "docs/internal/owner-approval-record-packet.md"
]) {
  await assertPathExists(requiredPath);
}

const preparation = await readFile("docs/internal/hosted-runtime-prd-preparation.md", "utf8");
const approvalPacket = await readFile("docs/internal/owner-approval-record-packet.md", "utf8");
const publicRuntimeDecision = await readFile("docs/internal/public-runtime-decision.md", "utf8");
const runtimeGate = await readFile("docs/internal/runtime-implementation-gate.md", "utf8");

for (const requiredText of [
  "Status: post-approval PRD evidence packet.",
  "Issue `#257` contains the exact owner approval text",
  "owner-hosted versus managed-hosted boundary",
  "no trusted Memory Record auto-promotion",
  "Stop before implementation if:",
  "ok runtime readiness gate current",
  "ok runtime proof intake gate current",
  "ok exact hosted runtime PRD approval recorded"
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
  "Before Source-Wire adds runtime code",
  "npm run runtime-proof-intake:smoke"
]) {
  assertIncludes(publicRuntimeDecision, requiredText, "public runtime decision");
}

for (const requiredText of [
  "Production runtime remains blocked.",
  "real user data",
  "trusted Memory Record",
  "npm run runtime-proof-intake:smoke"
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
  ["Evidence packet", "ready"],
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

printSection("Current PRD Evidence");
printList([
  "Issue #257 contains exact owner approval text.",
  "Hosted runtime PRD is approved and documented.",
  "Runtime PRD refresh approval is recorded and the refreshed PRD/gate proof is available.",
  "Hosted runtime child planning issues #259 through #264 are published.",
  "Runtime boundary is owner-hosted versus managed-hosted explicit.",
  "Threat model and namespace isolation are documented.",
  "Public-safe fixtures are required before implementation.",
  "Runtime readiness and runtime proof intake gates are required before future runtime work.",
  "Trusted memory auto-promotion remains blocked."
]);

console.log("");
console.log("ok hosted runtime PRD preparation ready");
console.log("ok hosted runtime PRD evidence map ready");
console.log("ok exact hosted runtime PRD approval recorded");

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
