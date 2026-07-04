import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packetPath = "docs/deployment-boundary-implementation-packet.md";
const slicesPath = "docs/deployment-boundary-implementation-slices.md";
const packet = await readFile(packetPath, "utf8");
const slices = await readFile(slicesPath, "utf8");
const failures = [];

const exactApprovalText =
  "Approved for a future Source-Wire deployment boundary implementation unit: build a public-safe synthetic deployment readiness package and validation smoke tests for local development, owner-hosted runtime, managed-hosted deferral, stop conditions, rollback evidence, claim boundaries, and no-hosted-service proof. Use synthetic fixtures only. Do not add deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source-Wire must not imply it hosts memory for users. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  packetPath,
  slicesPath,
  "docs/hosted-runtime-deployment-boundary-stop-conditions.md",
  "docs/runtime-implementation-gate.md",
  "docs/public-safe-fixture-implementation-packet.md",
  "docs/database-posture-implementation-packet.md",
  "docs/owner-approval-record-packet.md",
  "scripts/record-owner-approval.mjs"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: approval packet only. Implementation is blocked until exact owner approval is recorded.",
  "The next Source-Wire deployment-related unit should be a synthetic deployment readiness boundary package, not deployment config.",
  exactApprovalText,
  "npm run runtime:deployment-implementation-packet",
  "npm run owner:record-approval -- --target deployment-boundary-implementation",
  "What Approval Would Not Unlock"
]) {
  assertIncludes(packet, requiredText, packetPath);
}

for (const requiredText of [
  "Status: implementation slice map only. Implementation is blocked until exact owner approval is recorded.",
  "Slice 1: File Scope And Safety Guard",
  "Slice 2: Synthetic Deployment Readiness Contract",
  "Slice 3: Synthetic Deployment Boundary Matrix",
  "Slice 4: Smoke Test And Validation",
  "Slice 5: Docs, Proof, And Readiness",
  "npm run runtime:deployment-implementation-packet",
  "Still Blocked After These Slices"
]) {
  assertIncludes(slices, requiredText, slicesPath);
}

for (const blockedText of [
  "deployment config",
  "cloud provider config",
  "Docker or container deployment config for runtime services",
  "hosted services",
  "managed hosting",
  "production runtime use",
  "database migrations",
  "real database connections",
  "PostgreSQL setup",
  "pgvector setup",
  "production API runtime",
  "production MCP runtime",
  "live connectors",
  "Mission Control UI",
  "npm publishing",
  "GitHub release creation",
  "package version changes",
  "public contribution acceptance",
  "Source-Wire-Memory-Engine code merge",
  "AGPLv3 code copying",
  "private implementation code copying",
  "real user data",
  "client data",
  "real local paths",
  "account IDs",
  "emails",
  "domains",
  "tokens",
  "screenshots",
  "production exports",
  "private proof content",
  "automatic trusted memory promotion"
]) {
  assertIncludes(packet, blockedText, `${packetPath} blocked boundary`);
  assertIncludes(slices, blockedText, `${slicesPath} blocked boundary`);
}

const ownerApprovalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
assertIncludes(ownerApprovalPacket, "deployment-boundary-implementation", "owner approval packet target");
assertIncludes(ownerApprovalPacket, exactApprovalText, "owner approval packet exact approval");
assertIncludes(ownerApprovalRecorder, "deployment-boundary-implementation", "owner approval recorder target");
assertIncludes(ownerApprovalRecorder, exactApprovalText, "owner approval recorder exact approval");

if (failures.length > 0) {
  console.error("failed deployment boundary implementation packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Deployment Boundary Implementation Packet");
printRows([
  ["Packet", packetPath],
  ["Slice map", slicesPath],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Implementation", "blocked pending exact owner approval"],
  ["Runtime shape", "synthetic deployment readiness boundary only"],
  ["Deployment config", "blocked"],
  ["Hosted service", "blocked"],
  ["Real data", "blocked"]
]);

console.log("");
console.log("ok deployment boundary implementation packet ready");
console.log("ok deployment boundary implementation slices ready");
console.log("blocked deployment boundary implementation pending owner approval");
console.log("blocked deployment config");

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
