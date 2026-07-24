import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const issueNumber = 255;
const exactPatchApprovalText =
  "Approved for a future Source-Wire patch release implementation unit: publish a patch release that corrects the exported SOURCE_WIRE_PACKAGE_VERSION mismatch in the npm package. Use version 0.1.1 unless the implementation unit finds a blocking reason to choose a different explicit patch version. Create the matching GitHub release and tag only after final release-candidate verification. Keep hosted runtime behavior, production runtime claims, deployment, real user data, and code contribution acceptance blocked. Hosted runtime child planning issues are already published as #259 through #264 and must not be republished in this patch unit.";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

for (const requiredPath of [
  "docs/internal/release-patch-execution-preflight.md",
  "docs/internal/release-patch-approval-request.md",
  "docs/status/release-snapshot-boundary.md",
  "docs/internal/owner-approval-recorder.md",
  "src/index.ts",
  "scripts/consumer-smoke.mjs",
  "scripts/record-owner-approval.mjs"
]) {
  await assertPathExists(requiredPath);
}

const patchPreflightDoc = await readFile("docs/internal/release-patch-execution-preflight.md", "utf8");
const patchApprovalRequest = await readFile("docs/internal/release-patch-approval-request.md", "utf8");
const snapshotBoundary = await readFile("docs/status/release-snapshot-boundary.md", "utf8");
const sourceIndex = await readFile("src/index.ts", "utf8");
const consumerSmoke = await readFile("scripts/consumer-smoke.mjs", "utf8");
const approvalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 until a separately approved patch release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must remain public");

for (const requiredText of [
  "Status: owner-side patch release execution preflight only.",
  "This command is read-only.",
  "It does not publish npm, create a GitHub release, create tags, change package version, deploy services, implement hosted runtime behavior, republish hosted-runtime child planning issues, accept code contributions, add real user data, or approve production runtime use.",
  "npm run release:patch-execution-preflight",
  "blocked exact patch release approval missing",
  "blocked patch release mutation not approved"
]) {
  assertIncludes(patchPreflightDoc, requiredText, "release patch execution preflight doc");
}

assertIncludes(patchApprovalRequest, exactPatchApprovalText, "patch approval request exact approval text");
assertIncludes(snapshotBoundary, "npm artifact immutable at @source-wire/contracts@0.1.0", "release snapshot boundary immutable marker");
assertIncludes(sourceIndex, 'export const SOURCE_WIRE_PACKAGE_VERSION = "0.1.0";', "source version export");
assertIncludes(consumerSmoke, "SOURCE_WIRE_PACKAGE_VERSION", "consumer smoke source version guard");
assertIncludes(consumerSmoke, "parsedRuntime.version !== pack.version", "consumer smoke version equality guard");
assertIncludes(approvalRecorder, "patch-release-implementation", "owner approval recorder patch target");
assertIncludes(approvalRecorder, exactPatchApprovalText, "owner approval recorder patch exact approval text");

if (failures.length > 0) {
  console.error("failed release patch execution preflight");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const patchApprovalRecorded = await hasPatchApproval();

printSection("Source-Wire Patch Release Execution Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It does not publish npm, create a GitHub release, create tags, change package version, deploy services, implement hosted runtime behavior, republish hosted-runtime child planning issues, accept code contributions, add real user data, or approve production runtime use.");
printRows([
  ["Package", packageJson.name],
  ["Current version", packageJson.version],
  ["Likely patch version", "0.1.1"],
  ["Source export on main", "SOURCE_WIRE_PACKAGE_VERSION = 0.1.0"],
  ["Immutable npm artifact", "exports SOURCE_WIRE_PACKAGE_VERSION = 0.0.0"],
  ["Owner approval issue", `#${issueNumber}`],
  ["Patch approval", patchApprovalRecorded ? "recorded" : "not recorded"],
  ["Patch mutation", "blocked"]
]);

printSection("Patch Release Preflight Result");
console.log("ok release patch execution preflight ready");
console.log("ok patch source export fixed on main");
console.log("ok patch npm artifact mismatch disclosed");
console.log("ok patch approval recorder target ready");
if (patchApprovalRecorded) {
  console.log("ok exact patch release approval recorded");
} else {
  console.log("blocked exact patch release approval missing");
}
console.log("ok hosted runtime child planning issues already published");
console.log("blocked patch release mutation not approved");
console.log("blocked hosted runtime implementation");

async function hasPatchApproval() {
  const issue = await commandJson("gh", [
    "issue",
    "view",
    String(issueNumber),
    "--repo",
    repo,
    "--json",
    "body,comments"
  ]);
  const body = issue.body ?? "";
  const comments = Array.isArray(issue.comments) ? issue.comments : [];
  return hasApprovalRecordSection(body) || comments.some((comment) => comment.body?.includes(exactPatchApprovalText));
}

function hasApprovalRecordSection(body) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactPatchApprovalText);
}

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

function commandJson(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (parseError) {
        reject(new Error(`Unable to parse ${command} JSON: ${parseError.message}`));
      }
    });
  });
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
