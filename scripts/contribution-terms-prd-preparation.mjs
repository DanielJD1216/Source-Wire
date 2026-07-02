import { readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";
const contributionTermsIssue = 258;
const exactContributionTermsApprovalText =
  "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit.";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

for (const requiredPath of [
  "docs/contribution-terms-prd-preparation.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "SECURITY.md",
  "docs/reviewer-feedback-guide.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-approval-record-packet.md",
  ".github/pull_request_template.md"
]) {
  await assertPathExists(requiredPath);
}

const preparation = await readFile("docs/contribution-terms-prd-preparation.md", "utf8");
const approvalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const contributing = await readFile("CONTRIBUTING.md", "utf8");
const pullRequestTemplate = await readFile(".github/pull_request_template.md", "utf8");
const legalPacket = await readFile("docs/legal-review-question-packet.md", "utf8");

for (const requiredText of [
  "Status: future PRD preparation only.",
  "Issue `#258` must contain the exact owner approval text",
  "DCO, CLA, or no-external-code posture",
  "private-data exclusion rules",
  "Stop before PRD implementation if:",
  "ok exact contribution terms PRD approval recorded",
  "blocked code contribution acceptance"
]) {
  assertIncludes(preparation, requiredText, "contribution terms PRD preparation");
}

for (const requiredText of [
  exactContributionTermsApprovalText,
  "Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit."
]) {
  assertIncludes(approvalPacket, requiredText, "owner approval packet contribution terms approval text");
  assertIncludes(preparation, requiredText, "contribution terms PRD preparation exact approval text");
}

for (const requiredText of [
  "code contributions are not accepted",
  "Structured review feedback is welcome"
]) {
  assertIncludes(contributing, requiredText, "contributing boundary");
}

for (const requiredText of [
  "Source-Wire is Apache-2.0 licensed as a source package, but code contributions are not accepted yet.",
  "I understand Source-Wire is not accepting public code contributions yet."
]) {
  assertIncludes(pullRequestTemplate, requiredText, "pull request contribution boundary");
}

for (const requiredText of [
  "Contributor Terms",
  "developer certificate of origin",
  "contribution policy"
]) {
  assertIncludes(legalPacket, requiredText, "legal review contribution questions");
}

if (!(await hasContributionTermsApproval())) {
  failures.push("issue #258 exact contribution terms PRD approval is not recorded");
}

if (failures.length > 0) {
  console.error("failed contribution terms PRD preparation");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Contribution Terms PRD Preparation");
printRows([
  ["Preparation packet", "ready"],
  ["Owner approval issue", "#258"],
  ["Package", packageJson.name],
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Code contribution acceptance", "blocked"],
  ["CLA or DCO enforcement", "blocked"],
  ["Public pull request acceptance", "blocked"],
  ["Hosted runtime", "blocked"],
  ["npm publishing", "published as @source-wire/contracts@0.1.0, future versions gated"]
]);

printSection("Required Evidence Before PRD");
printList([
  "Issue #258 contains exact owner approval text.",
  "DCO, CLA, or no-external-code posture is selected.",
  "Private-data exclusion rules are explicit.",
  "Maintainer review policy is explicit.",
  "Issue feedback remains separate from code contribution acceptance."
]);

console.log("");
console.log("ok contribution terms PRD preparation ready");
console.log("ok contribution terms evidence map ready");
console.log("ok exact contribution terms PRD approval recorded");
console.log("blocked code contribution acceptance");

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

async function hasContributionTermsApproval() {
  const issue = await commandJson("gh", [
    "issue",
    "view",
    String(contributionTermsIssue),
    "--repo",
    repo,
    "--json",
    "body,comments"
  ]);
  const body = issue.body ?? "";
  const comments = Array.isArray(issue.comments) ? issue.comments : [];
  return hasApprovalRecordSection(body) || comments.some((comment) => comment.body?.includes(exactContributionTermsApprovalText));
}

function hasApprovalRecordSection(body) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactContributionTermsApprovalText);
}

async function commandJson(command, args) {
  const result = await commandResult(command, args);
  if (!result.ok) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stderr || result.errorMessage}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (parseError) {
    throw new Error(`Unable to parse ${command} JSON: ${parseError.message}`);
  }
}

function commandResult(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout,
        stderr,
        errorMessage: error?.message ?? ""
      });
    });
  });
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

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
