import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

for (const requiredPath of [
  "SECURITY.md",
  "SUPPORT.md",
  "CONTRIBUTING.md",
  ".github/ISSUE_TEMPLATE/boundary-safety-concern.yml",
  ".github/ISSUE_TEMPLATE/docs-contract-feedback.yml",
  ".github/ISSUE_TEMPLATE/verification-failure.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/pull_request_template.md",
  "docs/public-status.md",
  "docs/repository-metadata.md",
  "docs/reviewer-feedback-guide.md",
  "docs/technical-reviewer-guide.md",
  "docs/publish-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

const securityPolicy = await readFile("SECURITY.md", "utf8");
const supportPolicy = await readFile("SUPPORT.md", "utf8");
const contributingPolicy = await readFile("CONTRIBUTING.md", "utf8");
const boundaryTemplate = await readFile(".github/ISSUE_TEMPLATE/boundary-safety-concern.yml", "utf8");
const reviewerGuide = await readFile("docs/reviewer-feedback-guide.md", "utf8");
const publicStatus = await readFile("docs/public-status.md", "utf8");

assertIncludes(securityPolicy, "It is Apache-2.0 licensed as a source package, unreleased, unpublished, and not a hosted runtime.", "SECURITY.md current source-package boundary");
assertIncludes(securityPolicy, "Security reporting does not approve:", "SECURITY.md blocked security approval list");
assertIncludes(securityPolicy, "real source payloads", "SECURITY.md private-data warning");
assertIncludes(supportPolicy, "not published to npm, not released on GitHub, and not a hosted runtime", "SUPPORT.md live channel boundary");
assertIncludes(supportPolicy, "code contribution acceptance", "SUPPORT.md contribution boundary");
assertIncludes(contributingPolicy, "code contributions are not accepted until the owner approves contribution terms", "CONTRIBUTING.md contribution boundary");
assertIncludes(contributingPolicy, "Use synthetic examples or public repo references only.", "CONTRIBUTING.md public-only feedback rule");
for (const requiredText of [
  "secrets",
  "private data",
  "local private paths",
  "production exports",
  "account IDs",
  "client names",
  "private screenshots",
  "real source payloads",
  "real chat logs",
  "real memory records"
]) {
  assertIncludes(boundaryTemplate, requiredText, "boundary issue template private-data warning");
}

for (const requiredText of [
  "secrets",
  "private data",
  "local private paths",
  "production exports",
  "account IDs",
  "client names",
  "real source payloads",
  "real chat logs",
  "real memory records",
  "private implementation history"
]) {
  assertIncludes(reviewerGuide, requiredText, "reviewer guide private-data warning");
}
assertIncludes(publicStatus, "Code contribution acceptance | Blocked", "public status contribution boundary");

const repoApi = await ghJson(["api", `repos/${repo}`]);
const advisories = await ghJson(["api", `repos/${repo}/security-advisories`]);

assertEqual(repoApi.visibility, "public", "live GitHub visibility must stay public");
assertEqual(repoApi.private, false, "live GitHub private flag must stay false");
assertEqual(repoApi.has_issues, true, "live GitHub issues must stay enabled for structured feedback");
assertEqual(repoApi.has_projects, false, "live GitHub projects must stay disabled");
assertEqual(repoApi.has_wiki, false, "live GitHub wiki must stay disabled");
assertEqual(repoApi.has_discussions, false, "live GitHub discussions must stay disabled");
assertEqual(repoApi.license?.spdx_id, "Apache-2.0", "live GitHub license must stay Apache-2.0");
assertEqual(repoApi.security_and_analysis?.secret_scanning?.status, "enabled", "live GitHub secret scanning must stay enabled");
assertEqual(repoApi.security_and_analysis?.secret_scanning_push_protection?.status, "enabled", "live GitHub secret scanning push protection must stay enabled");

if (!Array.isArray(advisories)) {
  failures.push("GitHub security advisories response must be an array");
} else if (advisories.length !== 0) {
  failures.push("GitHub security advisories must remain empty until an owner-managed advisory is needed");
}

if (failures.length > 0) {
  console.error("failed live security surface");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Live Security Surface");
printRows([
  ["Repository", repo],
  ["Visibility", repoApi.visibility],
  ["Issues", "enabled"],
  ["Projects", "disabled"],
  ["Wiki", "disabled"],
  ["Discussions", "disabled"],
  ["License", repoApi.license.spdx_id],
  ["Secret scanning", repoApi.security_and_analysis.secret_scanning.status],
  ["Push protection", repoApi.security_and_analysis.secret_scanning_push_protection.status],
  ["Security advisories", "none"],
  ["Public security policy", "present"],
  ["Public support policy", "present"],
  ["Contribution acceptance", "blocked"],
  ["Private data in public intake", "blocked"],
  ["Version", packageJson.version],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"]
]);

console.log("");
console.log("ok live security surface ready");
console.log("ok security intake boundary current");
console.log("ok github secret scanning enabled");
console.log("blocked production security scope");

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    failures.push(`missing required path: ${path}`);
  }
}

function ghJson(args) {
  return run("gh", args).then((stdout) => JSON.parse(stdout));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      resolve(stdout);
    });
  });
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
