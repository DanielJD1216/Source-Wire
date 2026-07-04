import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packetPath = "docs/runtime-skeleton-implementation-packet.md";
const slicesPath = "docs/runtime-skeleton-issue-slices.md";
const packet = await readFile(packetPath, "utf8");
const slices = await readFile(slicesPath, "utf8");
const failures = [];

const exactApprovalText =
  "Approved for a future Source-Wire owner-hosted runtime skeleton implementation unit: build a public-safe synthetic owner-hosted API policy route skeleton and MCP adapter skeleton using the private Unit 25 through Unit 30 proof trail as redacted evidence only. Use synthetic fixtures only. Do not copy private implementation code or AGPLv3 code. Do not add real user data, client data, database migrations, real database connections, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, or public contribution acceptance. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  packetPath,
  slicesPath,
  "docs/private-proof-runtime-extraction-readiness.md",
  "docs/runtime-implementation-gate.md",
  "docs/runtime-proof-intake.md",
  "docs/hosted-runtime-wrapper-proof-reconciliation.md",
  "docs/minimal-runtime-prd.md",
  "docs/runtime-skeleton-implementation-proof.md",
  "docs/runtime-skeleton-smoke.md",
  "docs/owner-approval-record-packet.md",
  "scripts/record-owner-approval.mjs"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: approved and implemented as a synthetic skeleton. Production runtime remains blocked.",
  "The next Source-Wire build unit should be a narrow owner-hosted runtime skeleton, not a full runtime.",
  exactApprovalText,
  "npm run runtime:skeleton-packet",
  "npm run runtime:extraction-readiness",
  "npm run owner:record-approval -- --target runtime-skeleton-implementation",
  "What Approval Would Not Unlock"
]) {
  assertIncludes(packet, requiredText, packetPath);
}

for (const requiredText of [
  "Status: implemented as a synthetic owner-hosted runtime skeleton. Production runtime remains blocked.",
  "Slice 1: File Scope And Public Safety Guard",
  "Slice 2: Synthetic Owner-Hosted API Policy Route Skeleton",
  "Slice 3: Synthetic MCP Adapter Skeleton",
  "Slice 4: Synthetic Fixture Matrix And Smoke Tests",
  "Slice 5: Docs, Proof, And Readiness",
  "npm run runtime:skeleton-packet",
  "npm run ci:check",
  "Still Blocked After These Slices"
]) {
  assertIncludes(slices, requiredText, slicesPath);
}

for (const blockedText of [
  "production API runtime",
  "production MCP runtime",
  "database schema or migrations",
  "PostgreSQL or pgvector connection code",
  "real database connection",
  "live connectors",
  "local folder crawling",
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

const ownerApprovalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
assertIncludes(ownerApprovalPacket, "runtime-skeleton-implementation", "owner approval packet target");
assertIncludes(ownerApprovalPacket, exactApprovalText, "owner approval packet exact approval");
assertIncludes(ownerApprovalRecorder, "runtime-skeleton-implementation", "owner approval recorder target");
assertIncludes(ownerApprovalRecorder, exactApprovalText, "owner approval recorder exact approval");

if (failures.length > 0) {
  console.error("failed runtime skeleton implementation packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Runtime Skeleton Implementation Packet");
printRows([
  ["Packet", packetPath],
  ["Slice map", slicesPath],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Implementation", "synthetic skeleton implemented after exact owner approval"],
  ["Runtime shape", "synthetic owner-hosted API policy route plus MCP adapter skeleton"],
  ["Real data", "blocked"],
  ["Deployment", "blocked"]
]);

console.log("");
console.log("ok runtime skeleton implementation packet ready");
console.log("ok runtime skeleton issue slices ready");
console.log("ok runtime skeleton synthetic implementation recorded");
console.log("blocked production runtime implementation");

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
