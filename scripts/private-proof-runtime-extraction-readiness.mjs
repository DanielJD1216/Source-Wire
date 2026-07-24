import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const docPath = "docs/internal/private-proof-runtime-extraction-readiness.md";
const intakePath = "examples/fixtures/runtime-proof-intake/runtime-proof-intake-manifest.json";
const readinessPath = "examples/fixtures/runtime-readiness/runtime-readiness-fixture-matrix.json";
const doc = await readFile(docPath, "utf8");
const intake = JSON.parse(await readFile(intakePath, "utf8"));
const readiness = JSON.parse(await readFile(readinessPath, "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");

for (const requiredPath of [
  docPath,
  intakePath,
  readinessPath,
  "docs/internal/daily-workflow-implementation-proof.md",
  "docs/internal/daily-workflow-synthetic-smoke.md",
  "docs/internal/runtime-proof-intake.md",
  "docs/internal/runtime-readiness-fixture-matrix.md",
  "docs/internal/hosted-runtime-wrapper-proof-reconciliation.md",
  "docs/internal/runtime-implementation-gate.md",
  "docs/internal/minimal-runtime-prd.md"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: public-safe extraction readiness checkpoint. Runtime PRD refresh is approved and recorded; runtime implementation remains blocked.",
  "private owner proof exists through Unit 33",
  "Source-Wire daily workflow and runtime-readiness synthetic contracts are recorded",
  "production runtime still needs separate approval",
  "Private Unit 25 real owner packet smoke",
  "Private Unit 26 owner-hosted runtime boundary",
  "Private Unit 27 owner-hosted setup UX",
  "Private Unit 28 daily workflow proof",
  "Private Unit 29 extraction PRD",
  "Private Unit 31 daily workflow alignment",
  "Private Unit 32 dependency posture",
  "Private Unit 33 runtime-readiness alignment",
  "metadata only",
  "Future extraction must follow this order",
  "private behavior observed",
  "public requirement written",
  "synthetic fixture added",
  "public smoke added",
  "clean Apache-2.0 implementation written",
  "npm run runtime:extraction-readiness",
  "npm run daily-workflow:smoke",
  "npm run runtime-readiness:smoke",
  "npm run runtime-proof-intake:smoke",
  "Approved for a future Source-Wire owner-hosted runtime skeleton implementation unit"
]) {
  assertIncludes(doc, requiredText, docPath);
}

for (const requiredText of [
  "Approved for a future Source-Wire owner-hosted runtime PRD refresh unit",
  "Unit 33 runtime-readiness alignment baseline",
  "Keep Source-Wire synthetic-only",
  "Keep Source-Wire-Memory-Engine separate",
  "MCP must not bypass Source-Wire API policy"
]) {
  assertIncludes(doc, requiredText, `${docPath} PRD refresh approval shape`);
}

for (const blockedText of [
  "production API runtime",
  "production MCP runtime",
  "database schema or migrations",
  "PostgreSQL or pgvector connection code",
  "real source imports",
  "live connectors",
  "local folder crawling",
  "Mission Control UI",
  "deployment",
  "managed hosting",
  "npm publishing",
  "GitHub release creation",
  "public contribution acceptance",
  "Source-Wire-Memory-Engine code merge",
  "AGPLv3 code copying",
  "private implementation code copying",
  "real user data",
  "client data",
  "automatic trusted memory promotion"
]) {
  assertIncludes(doc, blockedText, `${docPath} blocked boundary`);
}

assertEqual(intake.fixtureSafety, "synthetic", "intake fixture must stay synthetic");
assertEqual(intake.boundary.proofMetadataOnly, true, "intake must use proof metadata only");
assertEqual(intake.boundary.redactedProofOnly, true, "intake must use redacted proof only");
assertEqual(intake.boundary.privateRepoPathIncluded, false, "intake must exclude private repo paths");
assertEqual(intake.boundary.rawPrivateContentIncluded, false, "intake must exclude raw private content");
assertEqual(intake.boundary.realUserDataIncluded, false, "intake must exclude real user data");
assertEqual(intake.boundary.clientDataIncluded, false, "intake must exclude client data");
assertEqual(intake.boundary.privateImplementationCodeCopied, false, "intake must exclude private implementation code");
assertEqual(intake.boundary.agplCodeCopied, false, "intake must exclude AGPLv3 code");
assertEqual(intake.boundary.runtimeImplementationIncluded, false, "intake must not include runtime implementation");
assertEqual(intake.decision.runtimePrdRefreshAllowed, true, "runtime PRD refresh should be allowed");
assertEqual(intake.decision.runtimeImplementationAllowed, false, "runtime implementation must remain blocked");

for (const caseId of [
  "private_daily_workflow_proof_ready",
  "api_policy_contract_ready",
  "mcp_policy_bypass_blocked",
  "database_posture_unapproved_blocked",
  "source_update_safety_ready",
  "memory_engine_license_boundary_ready",
  "release_mutation_blocked"
]) {
  assertTruthy(readiness.cases.some((candidate) => candidate.caseId === caseId), `readiness case exists: ${caseId}`);
  assertTruthy(
    intake.proofs.some((proof) => proof.satisfiesReadinessCase === caseId && proof.noPrivateData === true),
    `proof intake exists for readiness case: ${caseId}`
  );
}

assertNoForbiddenPublicSignals(doc);

if (failures.length > 0) {
  console.error("failed private proof runtime extraction readiness");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Private Proof Runtime Extraction Readiness");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Readiness artifact", docPath],
  ["Private proof handling", "redacted metadata only"],
  ["Private proof baseline", "Unit 33 alignment metadata"],
  ["Daily workflow", "synthetic implementation recorded"],
  ["Runtime readiness", "synthetic implementation recorded"],
  ["Production runtime", "blocked pending separate approval"],
  ["Real data", "blocked"],
  ["Deployment", "blocked"]
]);

console.log("");
console.log("ok private proof metadata only");
console.log("ok unit 33 runtime readiness baseline recorded");
console.log("ok daily workflow synthetic implementation recorded");
console.log("ok runtime readiness synthetic implementation recorded");
console.log("blocked production runtime implementation");
console.log("ok private proof runtime extraction readiness");

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

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    failures.push(`${label} must include ${JSON.stringify(needle)}`);
  }
}

function assertTruthy(value, reason) {
  if (!value) {
    failures.push(reason);
  }
}

function assertNoForbiddenPublicSignals(value) {
  const forbiddenSignals = [
    ["/", "Users", "/"].join(""),
    "Mobile Documents",
    "iCloud",
    "postgres://",
    "sk-"
  ];

  for (const signal of forbiddenSignals) {
    if (value.includes(signal)) {
      failures.push(`doc contains forbidden public-safety signal: ${signal}`);
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
