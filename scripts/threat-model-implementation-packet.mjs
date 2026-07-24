import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packetPath = "docs/internal/threat-model-implementation-packet.md";
const slicesPath = "docs/internal/threat-model-implementation-slices.md";
const packet = await readFile(packetPath, "utf8");
const slices = await readFile(slicesPath, "utf8");
const failures = [];

const exactApprovalText =
  "Approved for a future Source-Wire threat model implementation unit: build a public-safe synthetic trust-boundary package and validation smoke tests for unauthorized callers, cross-namespace access, source-to-memory separation, prompt-injection handling, secrets handling, audit gaps, backup and restore risk, deployment misconfiguration, MCP bypass prevention, and owner/application-controlled trusted memory approval. Use synthetic fixtures only. Do not add API server implementation, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  packetPath,
  slicesPath,
  "docs/internal/runtime-threat-boundary-implementation-proof.md",
  "docs/internal/runtime-threat-boundary-smoke.md",
  "docs/internal/hosted-runtime-threat-model-trust-boundary.md",
  "docs/internal/runtime-implementation-gate.md",
  "docs/internal/runtime-skeleton-implementation-proof.md",
  "docs/internal/database-posture-implementation-packet.md",
  "docs/internal/public-safe-fixture-implementation-packet.md",
  "docs/internal/deployment-boundary-implementation-packet.md",
  "docs/internal/owner-approval-record-packet.md",
  "scripts/record-owner-approval.mjs"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: implemented as a synthetic trust-boundary package after exact owner approval.",
  "Source-Wire now has a public-safe synthetic threat model package, not a production runtime.",
  exactApprovalText,
  "npm run runtime:threat-boundary-smoke",
  "npm run runtime:threat-implementation-packet",
  "npm run owner:record-approval -- --target threat-model-implementation",
  "What Approval Would Not Unlock"
]) {
  assertIncludes(packet, requiredText, packetPath);
}

for (const requiredText of [
  "Status: implementation slice map completed after exact owner approval.",
  "Slice 1: File Scope And Safety Guard",
  "Slice 2: Synthetic Trust-Boundary Contract",
  "Slice 3: Synthetic Threat Matrix Fixtures",
  "Slice 4: Smoke Test And Validation",
  "Slice 5: Docs, Proof, And Readiness",
  "npm run runtime:threat-boundary-smoke",
  "npm run runtime:threat-implementation-packet",
  "Still Blocked After These Slices"
]) {
  assertIncludes(slices, requiredText, slicesPath);
}

for (const blockedText of [
  "API server implementation",
  "MCP server runtime implementation",
  "database migrations",
  "real database connections",
  "PostgreSQL setup",
  "pgvector setup",
  "live connectors",
  "Mission Control UI",
  "deployment config",
  "cloud provider config",
  "Docker or container deployment config for runtime services",
  "hosted services",
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

const ownerApprovalPacket = await readFile("docs/internal/owner-approval-record-packet.md", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
assertIncludes(ownerApprovalPacket, "threat-model-implementation", "owner approval packet target");
assertIncludes(ownerApprovalPacket, exactApprovalText, "owner approval packet exact approval");
assertIncludes(ownerApprovalRecorder, "threat-model-implementation", "owner approval recorder target");
assertIncludes(ownerApprovalRecorder, exactApprovalText, "owner approval recorder exact approval");

if (failures.length > 0) {
  console.error("failed threat model implementation packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Threat Model Implementation Packet");
printRows([
  ["Packet", packetPath],
  ["Slice map", slicesPath],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Implementation", "synthetic trust-boundary package implemented after exact owner approval"],
  ["Runtime shape", "synthetic trust-boundary package only"],
  ["API server runtime", "blocked"],
  ["MCP server runtime", "blocked"],
  ["Real data", "blocked"]
]);

console.log("");
console.log("ok threat model implementation packet ready");
console.log("ok threat model implementation slices ready");
console.log("ok synthetic threat-boundary implementation recorded");
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
