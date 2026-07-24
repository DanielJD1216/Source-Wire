import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const request = await readFile("docs/internal/release-patch-approval-request.md", "utf8");
const readme = await readFile("README.md", "utf8");
const sourceIndex = await readFile("src/index.ts", "utf8");
const consumerSmoke = await readFile("scripts/consumer-smoke.mjs", "utf8");
const ownerApprovalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 until a future approved patch release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must remain public");

for (const requiredPath of [
  "docs/internal/release-patch-approval-request.md",
  "docs/internal/release-approval-request-packet.md",
  "docs/internal/release-execution-preflight.md",
  "docs/status/release-snapshot-boundary.md",
  "README.md",
  "src/index.ts",
  "scripts/consumer-smoke.mjs",
  "scripts/record-owner-approval.mjs"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: patch release approval request only.",
  "This request does not publish npm, create a GitHub release, create a tag, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.",
  "the immutable npm `0.1.0` artifact exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0`",
  "latest `main` fixes the source export to `0.1.0`",
  "The likely patch version is `0.1.1`.",
  "Approved for a future Source-Wire patch release implementation unit",
  "Use version 0.1.1 unless the implementation unit finds a blocking reason to choose a different explicit patch version.",
  "Keep hosted runtime behavior, production runtime claims, deployment, real user data, and code contribution acceptance blocked. Hosted runtime child planning issues are already published as #259 through #264 and must not be republished in this patch unit.",
  "blocked patch release approval missing",
  "blocked npm artifact immutable at @source-wire/contracts@0.1.0"
]) {
  assertIncludes(request, requiredText, "release patch approval request");
}

assertIncludes(sourceIndex, 'export const SOURCE_WIRE_PACKAGE_VERSION = "0.1.0";', "source package version export");
assertIncludes(consumerSmoke, "SOURCE_WIRE_PACKAGE_VERSION", "consumer smoke version guard");
assertIncludes(consumerSmoke, "parsedRuntime.version !== pack.version", "consumer smoke version guard condition");
assertIncludes(consumerSmoke, "package root version export", "consumer smoke version guard failure");
assertIncludes(ownerApprovalRecorder, "patch-release-implementation", "owner approval recorder patch target");
assertIncludes(ownerApprovalRecorder, "Approved for a future Source-Wire patch release implementation unit", "owner approval recorder patch exact text");
assertIncludes(readme, "Known `v0.1.0` package issue", "README known package issue disclosure");
assertIncludes(readme, "Correcting the registry artifact requires a future owner-approved patch release.", "README patch release disclosure");

if (failures.length > 0) {
  console.error("failed release patch approval request");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Patch Release Approval Request");
printRows([
  ["Approval request", "ready"],
  ["Package", packageJson.name],
  ["Current version", packageJson.version],
  ["Likely patch version", "0.1.1"],
  ["Source export on main", "SOURCE_WIRE_PACKAGE_VERSION = 0.1.0"],
  ["Immutable npm artifact", "exports SOURCE_WIRE_PACKAGE_VERSION = 0.0.0"],
  ["Patch release implementation", "blocked pending owner approval"]
]);

printSection("Patch Release Boundary");
printList([
  "Latest main fixes the exported version mismatch and guards it in consumer smoke.",
  "The npm 0.1.0 artifact is immutable and remains disclosed as mismatched.",
  "Use the exact approval text in docs/internal/release-patch-approval-request.md before any future patch release.",
  "Hosted runtime child planning issues are already published as #259 through #264 and must not be republished in this patch unit.",
  "Keep hosted runtime behavior, deployment, real data, production runtime claims, and contribution acceptance blocked."
]);

console.log("");
console.log("ok release patch approval request ready");
console.log("ok exported version fix on main");
console.log("blocked patch release approval missing");
console.log("blocked npm artifact immutable at @source-wire/contracts@0.1.0");

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
  console.log("-".repeat(title.length));
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  for (const [label, value] of rows) {
    console.log(`${label}: ${value}`);
  }
}

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
