import { readFile } from "node:fs/promises";
import { join } from "node:path";

const intakePath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "runtime-proof-intake",
  "runtime-proof-intake-manifest.json"
);
const readinessPath = join(
  process.cwd(),
  "examples",
  "fixtures",
  "runtime-readiness",
  "runtime-readiness-fixture-matrix.json"
);

const intake = JSON.parse(await readFile(intakePath, "utf8"));
const readiness = JSON.parse(await readFile(readinessPath, "utf8"));

const requiredReadinessCases = [
  "private_daily_workflow_proof_ready",
  "api_policy_contract_ready",
  "mcp_policy_bypass_blocked",
  "database_posture_unapproved_blocked",
  "source_update_safety_ready",
  "memory_engine_license_boundary_ready",
  "release_mutation_blocked"
];

assertEqual(intake.fixtureType, "source-wire-runtime-proof-intake-manifest", "intake", "fixtureType");
assertEqual(intake.fixtureSafety, "synthetic", "intake", "fixtureSafety");
assertEqual(intake.contractVersion, "source-wire-runtime-proof-intake.v1", "intake", "contractVersion");
assertBoundary(intake.boundary);
assertNoPrivateSignals(intake);

for (const caseId of requiredReadinessCases) {
  const readinessCase = readiness.cases.find((candidate) => candidate.caseId === caseId);
  assertTruthy(Boolean(readinessCase), caseId, "readiness case exists");

  const matchingProofs = intake.proofs.filter((proof) => proof.satisfiesReadinessCase === caseId);
  assertTruthy(matchingProofs.length > 0, caseId, "intake proof exists");

  for (const proof of matchingProofs) {
    assertEqual(proof.noPrivateData, true, proof.proofId, "noPrivateData");
    assertTruthy(proof.redactedEvidenceRef.startsWith("private-proof-baseline:redacted-"), proof.proofId, "redactedEvidenceRef");
    assertTruthy(["available", "blocked"].includes(proof.status), proof.proofId, "status");
  }
}

assertEqual(intake.decision.privateProofBaselineAccepted, true, "decision", "privateProofBaselineAccepted");
assertEqual(intake.decision.runtimePrdRefreshAllowed, true, "decision", "runtimePrdRefreshAllowed");
assertEqual(intake.decision.runtimeImplementationAllowed, false, "decision", "runtimeImplementationAllowed");
assertTruthy(intake.decision.allowedNextAction.length > 0, "decision", "allowedNextAction");

console.log("ok runtime proof intake manifest");
console.log("ok runtime proof intake redaction boundary");
console.log("ok runtime proof intake readiness alignment");
console.log("ok runtime proof intake keeps implementation blocked");
console.log("ok runtime proof intake smoke");

function assertBoundary(boundary) {
  assertEqual(boundary.fixtureSafety, "synthetic", "boundary", "fixtureSafety");
  assertEqual(boundary.proofMetadataOnly, true, "boundary", "proofMetadataOnly");
  assertEqual(boundary.redactedProofOnly, true, "boundary", "redactedProofOnly");
  assertEqual(boundary.privateRepoPathIncluded, false, "boundary", "privateRepoPathIncluded");
  assertEqual(boundary.rawPrivateContentIncluded, false, "boundary", "rawPrivateContentIncluded");
  assertEqual(boundary.realUserDataIncluded, false, "boundary", "realUserDataIncluded");
  assertEqual(boundary.clientDataIncluded, false, "boundary", "clientDataIncluded");
  assertEqual(boundary.tokenOrSecretIncluded, false, "boundary", "tokenOrSecretIncluded");
  assertEqual(boundary.privateImplementationCodeCopied, false, "boundary", "privateImplementationCodeCopied");
  assertEqual(boundary.agplCodeCopied, false, "boundary", "agplCodeCopied");
  assertEqual(boundary.runtimeImplementationIncluded, false, "boundary", "runtimeImplementationIncluded");
  assertEqual(boundary.databaseMigrationIncluded, false, "boundary", "databaseMigrationIncluded");
  assertEqual(boundary.deploymentIncluded, false, "boundary", "deploymentIncluded");
}

function assertNoPrivateSignals(value) {
  const serialized = JSON.stringify(value);
  const localHomePathPrefix = ["/", "Users", "/"].join("");
  const forbiddenPatterns = [
    localHomePathPrefix,
    "Mobile Documents",
    "iCloud",
    "@",
    "api_key",
    "token_",
    "sk-",
    "postgres://",
    "password",
    "secret"
  ];

  for (const pattern of forbiddenPatterns) {
    if (serialized.includes(pattern)) {
      throw new Error(`runtime proof intake contains forbidden public-safety signal: ${pattern}`);
    }
  }
}

function assertEqual(actual, expected, caseId, field) {
  if (actual !== expected) {
    throw new Error(`[${caseId}] ${field}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(value, caseId, field) {
  if (!value) {
    throw new Error(`[${caseId}] ${field}: expected truthy value`);
  }
}
