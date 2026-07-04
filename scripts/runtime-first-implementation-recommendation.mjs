import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packetPath = "docs/threat-model-implementation-packet.md";
const slicesPath = "docs/threat-model-implementation-slices.md";
const statusPath = "docs/runtime-implementation-approval-status.md";
const ownerApprovalPacketPath = "docs/owner-approval-record-packet.md";
const recorderPath = "scripts/record-owner-approval.mjs";
const packet = await readFile(packetPath, "utf8");
const slices = await readFile(slicesPath, "utf8");
const ownerApprovalPacket = await readFile(ownerApprovalPacketPath, "utf8");
const recorder = await readFile(recorderPath, "utf8");
const failures = [];

const target = "threat-model-implementation";
const issue = "#259";
const exactApprovalText =
  "Approved for a future Source-Wire threat model implementation unit: build a public-safe synthetic trust-boundary package and validation smoke tests for unauthorized callers, cross-namespace access, source-to-memory separation, prompt-injection handling, secrets handling, audit gaps, backup and restore risk, deployment misconfiguration, MCP bypass prevention, and owner/application-controlled trusted memory approval. Use synthetic fixtures only. Do not add API server implementation, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  packetPath,
  slicesPath,
  statusPath,
  ownerApprovalPacketPath,
  recorderPath,
  "docs/runtime-implementation-gate.md",
  "docs/hosted-runtime-threat-model-trust-boundary.md"
]) {
  await assertPathExists(requiredPath);
}

for (const [text, label] of [
  [packet, packetPath],
  [ownerApprovalPacket, ownerApprovalPacketPath],
  [recorder, recorderPath]
]) {
  assertIncludes(text, target, `${label} target`);
  assertIncludes(text, exactApprovalText, `${label} exact approval text`);
}

assertIncludes(slices, target, `${slicesPath} target`);

for (const requiredText of [
  "Status: approval packet only. Implementation is blocked until exact owner approval is recorded.",
  "synthetic threat cases",
  "no API server runtime",
  "no MCP server runtime",
  "no database connection",
  "What Approval Would Not Unlock"
]) {
  assertIncludes(packet, requiredText, `${packetPath} first implementation boundary`);
}

for (const requiredText of [
  "Slice 1: File Scope And Safety Guard",
  "Slice 2: Synthetic Trust-Boundary Contract",
  "Slice 3: Synthetic Threat Matrix Fixtures",
  "Slice 4: Smoke Test And Validation",
  "Slice 5: Docs, Proof, And Readiness",
  "Still Blocked After These Slices"
]) {
  assertIncludes(slices, requiredText, `${slicesPath} implementation slice readiness`);
}

if (failures.length > 0) {
  console.error("failed runtime first implementation recommendation");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire First Runtime Implementation Recommendation");
console.log("This recommendation is read-only.");
console.log("It does not record owner approval, implement hosted runtime behavior, add API server runtime, add MCP server runtime, add database migrations, connect to a database, deploy services, publish npm, create a GitHub release, accept code contributions, add real user data, or approve production runtime use.");
printRows([
  ["Recommended first gate", `${issue} ${target}`],
  ["Why first", "threat and trust boundaries define what every later API, MCP, database, fixture, and deployment slice must fail closed against"],
  ["Packet", packetPath],
  ["Slice map", slicesPath],
  ["Status check", "npm run runtime:implementation-approval-status"],
  ["Approval recorder dry run", `npm run owner:record-approval -- --target ${target}`],
  ["Implementation", "blocked pending exact owner approval"]
]);

printSection("Exact Approval Text");
console.log(exactApprovalText);

printSection("Recommended Next Command");
console.log(`npm run owner:record-approval -- --target ${target} --write --confirm-exact "${exactApprovalText}"`);

printSection("Runtime First Implementation Recommendation Result");
console.log("ok runtime first implementation recommendation ready");
console.log("ok recommended first runtime implementation gate #259");
console.log("blocked exact threat-model-implementation approval missing");
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
