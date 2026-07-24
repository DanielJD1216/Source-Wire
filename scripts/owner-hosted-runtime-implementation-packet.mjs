import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packetPath = "docs/internal/owner-hosted-runtime-implementation-packet.md";
const slicesPath = "docs/internal/owner-hosted-runtime-implementation-slices.md";
const packet = await readFile(packetPath, "utf8");
const slices = await readFile(slicesPath, "utf8");
const ownerApprovalPacket = await readFile("docs/internal/owner-approval-record-packet.md", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
const failures = [];

const exactApprovalText =
  "Approved for a future Source-Wire owner-hosted runtime implementation unit: build a narrow public-safe owner-hosted API server runtime skeleton and MCP server runtime skeleton around the existing Source-Wire policy contracts and synthetic fixtures. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, live connectors, local folder crawling, whole-vault import, Mission Control UI, deployment config, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, AGPLv3 code copying, or Source-Wire-Memory-Engine code merge. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled. Automatic trusted memory promotion remains blocked.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  packetPath,
  slicesPath,
  "docs/internal/owner-hosted-runtime-implementation-proof.md",
  "docs/internal/owner-hosted-runtime-smoke.md",
  "docs/internal/runtime-implementation-gate.md",
  "src/owner-hosted-runtime/index.ts",
  "examples/owner-hosted-runtime/owner-hosted-runtime-smoke.mjs",
  "examples/fixtures/owner-hosted-runtime/owner-hosted-runtime-fixture-matrix.json",
  "docs/internal/runtime-skeleton-implementation-proof.md",
  "docs/internal/api-contract-implementation-packet.md",
  "docs/internal/mcp-contract-implementation-packet.md",
  "docs/internal/public-safe-fixture-implementation-packet.md",
  "docs/internal/runtime-prd-refresh-proof.md",
  "docs/internal/owner-approval-record-packet.md",
  "scripts/record-owner-approval.mjs",
  "scripts/owner-approval-packet.mjs"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: implemented as a public-safe synthetic owner-hosted API server runtime skeleton and MCP server runtime skeleton. Production runtime remains blocked.",
  "narrow public-safe owner-hosted API server runtime skeleton plus MCP server runtime skeleton",
  exactApprovalText,
  "https://github.com/DanielJD1216/Source-Wire/issues/257#issuecomment-4900872957",
  "npm run runtime:owner-hosted-implementation-packet",
  "npm run runtime:owner-hosted-smoke",
  "npm run owner:record-approval -- --target owner-hosted-runtime-implementation",
  "What Approval Does Not Unlock"
]) {
  assertIncludes(packet, requiredText, packetPath);
}

for (const requiredText of [
  "Status: implemented as a public-safe synthetic owner-hosted API server runtime skeleton and MCP server runtime skeleton. Production runtime remains blocked.",
  "Slice 1: File Scope And Runtime Claim Guard",
  "Slice 2: API Server Runtime Skeleton",
  "Slice 3: MCP Server Runtime Skeleton",
  "Slice 4: Synthetic Fixtures And Smoke Tests",
  "Slice 5: Docs, Proof, And Readiness",
  "Status: complete.",
  "Still Blocked After These Slices"
]) {
  assertIncludes(slices, requiredText, slicesPath);
}

for (const blockedText of [
  "production API runtime",
  "production MCP runtime",
  "database migrations",
  "real database connections",
  "PostgreSQL setup",
  "pgvector setup",
  "live connectors",
  "local folder crawling",
  "whole-vault import",
  "Mission Control UI",
  "deployment config",
  "managed hosting",
  "npm publishing",
  "GitHub release creation",
  "package version changes",
  "public contribution acceptance",
  "Source-Wire-Memory-Engine code merge",
  "AGPLv3 code copying",
  "private implementation code copying",
  "real user data",
  "client data",
  "automatic trusted memory promotion"
]) {
  assertIncludes(packet, blockedText, `${packetPath} blocked boundary`);
  assertIncludes(slices, blockedText, `${slicesPath} blocked boundary`);
}

assertIncludes(ownerApprovalPacket, "owner-hosted-runtime-implementation", "owner approval packet target");
assertIncludes(ownerApprovalPacket, exactApprovalText, "owner approval packet exact approval");
assertIncludes(ownerApprovalRecorder, "owner-hosted-runtime-implementation", "owner approval recorder target");
assertIncludes(ownerApprovalRecorder, exactApprovalText, "owner approval recorder exact approval");

if (failures.length > 0) {
  console.error("failed owner-hosted runtime implementation packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Owner-Hosted Runtime Implementation Packet");
printRows([
  ["Packet", packetPath],
  ["Slice map", slicesPath],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Implementation", "implemented as public-safe synthetic owner-hosted skeleton"],
  ["Runtime shape", "narrow in-process API server skeleton plus MCP server skeleton"],
  ["Synthetic fixtures", "required"],
  ["Real data", "blocked"],
  ["Deployment", "blocked"]
]);

console.log("");
console.log("ok owner-hosted runtime implementation packet ready");
console.log("ok owner-hosted runtime implementation slices ready");
console.log("ok owner-hosted runtime implementation proof ready");
console.log("ok owner-hosted runtime smoke ready");
console.log("ok exact owner-hosted runtime approval text available");
console.log("blocked production runtime, real data, database, connector, deployment, and auto-promotion work");

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
