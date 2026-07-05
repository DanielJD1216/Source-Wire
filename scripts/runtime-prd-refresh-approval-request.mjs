import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

const exactApproval =
  "Approved for a future Source-Wire owner-hosted runtime PRD refresh unit: refresh the public owner-hosted runtime PRD and wrapper-runtime gate using the Unit 33 runtime-readiness alignment baseline as redacted metadata only. Keep Source-Wire synthetic-only. Do not add production API runtime, MCP runtime, database migrations, real database connections, live connectors, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, private data, private implementation code, AGPLv3 code copying, or automatic trusted memory promotion. Keep Source-Wire-Memory-Engine separate. MCP must not bypass Source-Wire API policy.";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  "docs/runtime-prd-refresh-approval-request.md",
  "docs/runtime-prd-refresh-approval-status.md",
  "docs/owner-approval-record-packet.md",
  "scripts/record-owner-approval.mjs",
  "docs/private-proof-runtime-extraction-readiness.md",
  "docs/runtime-implementation-decision-gate.md",
  "docs/runtime-implementation-decision-proof.md",
  "docs/hosted-runtime-prd.md",
  "docs/runtime-proof-intake.md",
  "docs/runtime-readiness-fixture-matrix.md",
  "docs/daily-workflow-implementation-proof.md",
  "examples/fixtures/runtime-proof-intake/runtime-proof-intake-manifest.json",
  "examples/fixtures/runtime-readiness/runtime-readiness-fixture-matrix.json"
]) {
  await assertPathExists(requiredPath);
}

const approvalRequest = await readFile("docs/runtime-prd-refresh-approval-request.md", "utf8");
const approvalStatus = await readFile("docs/runtime-prd-refresh-approval-status.md", "utf8");
const ownerApprovalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
const extractionReadiness = await readFile("docs/private-proof-runtime-extraction-readiness.md", "utf8");
const decisionGate = await readFile("docs/runtime-implementation-decision-gate.md", "utf8");
const decisionProof = await readFile("docs/runtime-implementation-decision-proof.md", "utf8");
const hostedRuntimePrd = await readFile("docs/hosted-runtime-prd.md", "utf8");
const intake = JSON.parse(await readFile("examples/fixtures/runtime-proof-intake/runtime-proof-intake-manifest.json", "utf8"));

for (const requiredText of [
  "Status: approval request only. Runtime implementation remains blocked.",
  exactApproval,
  "Unit 33 alignment may be used as redacted metadata only.",
  "What Approval Would Unlock",
  "What Approval Would Not Unlock",
  "npm run runtime:prd-refresh-approval-request",
  "npm run runtime:prd-refresh-approval-status",
  "blocked production runtime implementation"
]) {
  assertIncludes(approvalRequest, requiredText, "runtime PRD refresh approval request");
}

for (const requiredText of [
  "Status: owner-side read-only approval status.",
  exactApproval,
  "ok runtime PRD refresh approval status readable",
  "blocked runtime PRD refresh approval missing",
  "blocked hosted runtime implementation"
]) {
  assertIncludes(approvalStatus, requiredText, "runtime PRD refresh approval status");
}

for (const requiredText of [
  "runtime-prd-refresh",
  exactApproval,
  "npm run runtime:prd-refresh-approval-status"
]) {
  assertIncludes(ownerApprovalPacket, requiredText, "owner approval packet runtime PRD refresh target");
}

for (const requiredText of [
  "runtime-prd-refresh",
  exactApproval
]) {
  assertIncludes(ownerApprovalRecorder, requiredText, "owner approval recorder runtime PRD refresh target");
}

for (const requiredText of [
  "private owner proof exists through Unit 33",
  "Private Unit 33 runtime-readiness alignment",
  "Approved for a future Source-Wire owner-hosted runtime PRD refresh unit",
  "Keep Source-Wire-Memory-Engine separate",
  "MCP must not bypass Source-Wire API policy"
]) {
  assertIncludes(extractionReadiness, requiredText, "private proof runtime extraction readiness");
}

for (const requiredText of [
  "Do not start public Source-Wire runtime implementation from the owner-hosted setup package, daily workflow fixtures, or Unit 33 runtime-readiness alignment alone.",
  "Refresh the public owner-hosted runtime PRD or wrapper-runtime gate using the Unit 33 baseline as redacted metadata only.",
  "npm run runtime:extraction-readiness"
]) {
  assertIncludes(decisionGate, requiredText, "runtime implementation decision gate");
}

for (const requiredText of [
  "Unit 33 redacted runtime-readiness alignment metadata",
  "Source-Wire may use the Unit 33 baseline only as redacted metadata.",
  "production API runtime",
  "automatic trusted memory promotion"
]) {
  assertIncludes(decisionProof, requiredText, "runtime implementation decision proof");
}

for (const requiredText of [
  "Unit 33 private runtime-readiness alignment is treated as redacted metadata only.",
  "npm run daily-workflow:smoke",
  "npm run runtime-readiness:smoke",
  "npm run runtime-proof-intake:smoke",
  "npm run runtime:extraction-readiness"
]) {
  assertIncludes(hostedRuntimePrd, requiredText, "hosted runtime PRD");
}

assertEqual(intake.fixtureSafety, "synthetic", "runtime proof intake fixture must stay synthetic");
assertEqual(intake.boundary?.proofMetadataOnly, true, "runtime proof intake must use proof metadata only");
assertEqual(intake.boundary?.rawPrivateContentIncluded, false, "runtime proof intake must exclude raw private content");
assertEqual(intake.boundary?.privateRepoPathIncluded, false, "runtime proof intake must exclude private repo paths");
assertEqual(intake.decision?.runtimePrdRefreshAllowed, true, "runtime PRD refresh must be allowed");
assertEqual(intake.decision?.runtimeImplementationAllowed, false, "runtime implementation must remain blocked");

assertNoForbiddenPublicSignals(approvalRequest);

if (failures.length > 0) {
  console.error("failed runtime PRD refresh approval request");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Runtime PRD Refresh Approval Request");
printRows([
  ["Approval request", "ready"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Unit 33 baseline", "redacted metadata only"],
  ["Source-Wire mode", "synthetic-only"],
  ["Production runtime", "blocked"],
  ["Real data", "blocked"],
  ["Deployment", "blocked"]
]);

printSection("Exact Approval Text");
console.log(exactApproval);

console.log("");
console.log("ok runtime PRD refresh approval request ready");
console.log("ok unit 33 redacted metadata boundary recorded");
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

function assertNoForbiddenPublicSignals(value) {
  const forbiddenSignals = [
    ["/", "Users", "/"].join(""),
    "Mobile Documents",
    "iCloud",
    "postgres://",
    "sk-",
    "ghp_",
    "npm_"
  ];

  for (const signal of forbiddenSignals) {
    if (value.includes(signal)) {
      failures.push(`approval request contains forbidden public-safety signal: ${signal}`);
    }
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
