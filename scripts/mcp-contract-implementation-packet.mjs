import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packetPath = "docs/mcp-contract-implementation-packet.md";
const slicesPath = "docs/mcp-contract-implementation-slices.md";
const packet = await readFile(packetPath, "utf8");
const slices = await readFile(slicesPath, "utf8");
const failures = [];

const exactApprovalText =
  "Approved for a future Source-Wire MCP contract implementation unit: build a public-safe synthetic MCP adapter contract package and validation smoke tests for tool declarations, input validation, MCP-to-API envelopes, capability mapping, namespace forwarding, denied results, citation and gap preservation, audit metadata, source evidence search, trusted memory search, context assembly, candidate review, source maintenance, handoff and status evidence, and trusted-memory approval boundaries. Use synthetic fixtures only. Do not add MCP server runtime implementation, API server implementation, route handlers, database migrations, real database connections, PostgreSQL or pgvector setup, runtime adapter implementation, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  packetPath,
  slicesPath,
  "docs/hosted-runtime-mcp-server-contract.md",
  "docs/hosted-runtime-api-server-contract.md",
  "docs/hosted-runtime-threat-model-trust-boundary.md",
  "docs/runtime-implementation-gate.md",
  "docs/api-contract-implementation-packet.md",
  "docs/threat-model-implementation-packet.md",
  "docs/runtime-skeleton-implementation-proof.md",
  "docs/owner-approval-record-packet.md",
  "scripts/record-owner-approval.mjs"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: approval packet only. Implementation is blocked until exact owner approval is recorded.",
  "The next Source-Wire MCP-related unit should be a public-safe synthetic MCP adapter contract package, not an MCP server runtime.",
  exactApprovalText,
  "npm run runtime:mcp-implementation-packet",
  "npm run owner:record-approval -- --target mcp-contract-implementation",
  "What Approval Would Not Unlock"
]) {
  assertIncludes(packet, requiredText, packetPath);
}

for (const requiredText of [
  "Status: implementation slice map only. Implementation is blocked until exact owner approval is recorded.",
  "Slice 1: File Scope And Safety Guard",
  "Slice 2: Synthetic Tool Declaration And Input Contract",
  "Slice 3: Synthetic MCP-To-API Policy Fixture Matrix",
  "Slice 4: Smoke Test And Validation",
  "Slice 5: Docs, Proof, And Readiness",
  "npm run runtime:mcp-implementation-packet",
  "Still Blocked After These Slices"
]) {
  assertIncludes(slices, requiredText, slicesPath);
}

for (const blockedText of [
  "MCP server runtime implementation",
  "API server implementation",
  "route handlers",
  "database migrations",
  "real database connections",
  "PostgreSQL setup",
  "pgvector setup",
  "runtime adapter implementation",
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

const ownerApprovalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
assertIncludes(ownerApprovalPacket, "mcp-contract-implementation", "owner approval packet target");
assertIncludes(ownerApprovalPacket, exactApprovalText, "owner approval packet exact approval");
assertIncludes(ownerApprovalRecorder, "mcp-contract-implementation", "owner approval recorder target");
assertIncludes(ownerApprovalRecorder, exactApprovalText, "owner approval recorder exact approval");

if (failures.length > 0) {
  console.error("failed MCP contract implementation packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire MCP Contract Implementation Packet");
printRows([
  ["Packet", packetPath],
  ["Slice map", slicesPath],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Implementation", "blocked pending exact owner approval"],
  ["Runtime shape", "synthetic MCP adapter contract only"],
  ["MCP server runtime", "blocked"],
  ["API bypass", "blocked"],
  ["Real data", "blocked"]
]);

console.log("");
console.log("ok MCP contract implementation packet ready");
console.log("ok MCP contract implementation slices ready");
console.log("blocked MCP contract implementation pending owner approval");
console.log("blocked MCP server runtime implementation");

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
