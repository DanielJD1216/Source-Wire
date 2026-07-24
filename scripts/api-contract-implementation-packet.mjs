import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packetPath = "docs/internal/api-contract-implementation-packet.md";
const slicesPath = "docs/internal/api-contract-implementation-slices.md";
const packet = await readFile(packetPath, "utf8");
const slices = await readFile(slicesPath, "utf8");
const failures = [];

const exactApprovalText =
  "Approved for a future Source-Wire API contract implementation unit: build a public-safe synthetic API policy contract package and validation smoke tests for request envelopes, endpoint groups, capability checks, namespace resolution, denied results, citations and gaps, audit metadata, source maintenance, candidate review, trusted-memory approval boundaries, handoff and status evidence, and MCP-through-API policy routing. Use synthetic fixtures only. Do not add API server implementation, route handlers, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, runtime adapter implementation, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  packetPath,
  slicesPath,
  "docs/internal/hosted-runtime-api-server-contract.md",
  "docs/internal/hosted-runtime-threat-model-trust-boundary.md",
  "docs/internal/runtime-implementation-gate.md",
  "docs/internal/threat-model-implementation-packet.md",
  "docs/internal/runtime-skeleton-implementation-proof.md",
  "docs/internal/api-policy-contract-implementation-proof.md",
  "docs/internal/api-policy-contract-smoke.md",
  "examples/fixtures/api-contract/api-policy-contract-fixture-matrix.json",
  "examples/api-contract/api-policy-contract-smoke.mjs",
  "src/contracts/api-policy.ts",
  "docs/internal/owner-approval-record-packet.md",
  "scripts/record-owner-approval.mjs"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: implemented as a synthetic API policy contract package after exact owner approval.",
  "The next Source-Wire API-related unit should be a public-safe synthetic API policy contract package, not an API server.",
  "The approved synthetic API policy contract package is recorded in [API Policy Contract Implementation Proof](api-policy-contract-implementation-proof.md).",
  "npm run runtime:api-policy-smoke",
  exactApprovalText,
  "npm run runtime:api-implementation-packet",
  "npm run owner:record-approval -- --target api-contract-implementation",
  "What Approval Would Not Unlock"
]) {
  assertIncludes(packet, requiredText, packetPath);
}

for (const requiredText of [
  "Status: completed synthetic API policy contract slice map after exact owner approval.",
  "Slice 1: File Scope And Safety Guard",
  "Slice 2: Synthetic Request Envelope And Endpoint Group Contract",
  "Slice 3: Synthetic API Policy Fixture Matrix",
  "Slice 4: Smoke Test And Validation",
  "Slice 5: Docs, Proof, And Readiness",
  "npm run runtime:api-policy-smoke",
  "npm run runtime:api-implementation-packet",
  "Still Blocked After These Slices"
]) {
  assertIncludes(slices, requiredText, slicesPath);
}

for (const blockedText of [
  "API server implementation",
  "route handlers",
  "MCP server runtime implementation",
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

const ownerApprovalPacket = await readFile("docs/internal/owner-approval-record-packet.md", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
assertIncludes(ownerApprovalPacket, "api-contract-implementation", "owner approval packet target");
assertIncludes(ownerApprovalPacket, exactApprovalText, "owner approval packet exact approval");
assertIncludes(ownerApprovalRecorder, "api-contract-implementation", "owner approval recorder target");
assertIncludes(ownerApprovalRecorder, exactApprovalText, "owner approval recorder exact approval");

if (failures.length > 0) {
  console.error("failed API contract implementation packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire API Contract Implementation Packet");
printRows([
  ["Packet", packetPath],
  ["Slice map", slicesPath],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Implementation", "synthetic API policy contract package implemented after exact owner approval"],
  ["Runtime shape", "synthetic API policy contract only"],
  ["API server runtime", "blocked"],
  ["Route handlers", "blocked"],
  ["Real data", "blocked"]
]);

console.log("");
console.log("ok API contract implementation packet ready");
console.log("ok API contract implementation slices ready");
console.log("ok synthetic API policy contract implementation recorded");
console.log("blocked API server implementation");

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
