import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packetPath = "docs/internal/database-posture-implementation-packet.md";
const slicesPath = "docs/internal/database-posture-implementation-slices.md";
const packet = await readFile(packetPath, "utf8");
const slices = await readFile(slicesPath, "utf8");
const failures = [];

const exactApprovalText =
  "Approved for a future Source-Wire database posture implementation unit: build a public-safe synthetic database posture package that defines data-class contracts, lifecycle state fixtures, namespace isolation fixtures, deletion/retention fixtures, backup/restore risk fixtures, and validation/smoke checks. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  packetPath,
  slicesPath,
  "docs/internal/database-posture-implementation-proof.md",
  "docs/internal/database-posture-smoke.md",
  "docs/internal/hosted-runtime-database-posture-data-lifecycle.md",
  "docs/internal/runtime-implementation-gate.md",
  "docs/internal/runtime-skeleton-implementation-proof.md",
  "docs/internal/owner-approval-record-packet.md",
  "examples/database-posture/database-posture-smoke.mjs",
  "examples/database-posture/README.md",
  "examples/fixtures/database-posture/database-posture-fixture-matrix.json",
  "examples/fixtures/database-posture/README.md",
  "scripts/record-owner-approval.mjs",
  "src/contracts/database-posture.ts"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: implemented as a synthetic database posture package after exact owner approval.",
  "The Source-Wire build unit is now a synthetic database posture package, not database migrations.",
  "The approved synthetic database posture package is recorded in [Database Posture Implementation Proof](database-posture-implementation-proof.md).",
  exactApprovalText,
  "npm run runtime:database-implementation-packet",
  "npm run runtime:database-posture-smoke",
  "npm run owner:record-approval -- --target database-posture-implementation",
  "What Approval Would Not Unlock"
]) {
  assertIncludes(packet, requiredText, packetPath);
}

for (const requiredText of [
  "Status: completed synthetic database posture slice map after exact owner approval.",
  "Slice 1: File Scope And Safety Guard",
  "Slice 2: Synthetic Data-Class And Lifecycle Contract",
  "Slice 3: Namespace, Retention, Deletion, Backup, And Restore Fixtures",
  "Slice 4: Smoke Test And Validation",
  "Slice 5: Docs, Proof, And Readiness",
  "npm run runtime:database-implementation-packet",
  "npm run runtime:database-posture-smoke",
  "Still Blocked After These Slices"
]) {
  assertIncludes(slices, requiredText, slicesPath);
}

for (const blockedText of [
  "database migrations",
  "real database connections",
  "PostgreSQL setup",
  "pgvector setup",
  "production API runtime",
  "production MCP runtime",
  "live connectors",
  "Mission Control UI",
  "deployment",
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

const ownerApprovalPacket = await readFile("docs/internal/owner-approval-record-packet.md", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
assertIncludes(ownerApprovalPacket, "database-posture-implementation", "owner approval packet target");
assertIncludes(ownerApprovalPacket, exactApprovalText, "owner approval packet exact approval");
assertIncludes(ownerApprovalRecorder, "database-posture-implementation", "owner approval recorder target");
assertIncludes(ownerApprovalRecorder, exactApprovalText, "owner approval recorder exact approval");

if (failures.length > 0) {
  console.error("failed database posture implementation packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Database Posture Implementation Packet");
printRows([
  ["Packet", packetPath],
  ["Slice map", slicesPath],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Implementation", "synthetic database posture package implemented after exact owner approval"],
  ["Runtime shape", "synthetic data-class and lifecycle posture only"],
  ["Migrations", "blocked"],
  ["Real database connections", "blocked"],
  ["Real data", "blocked"]
]);

console.log("");
console.log("ok synthetic database posture implementation recorded");
console.log("ok database posture implementation slices complete");
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
