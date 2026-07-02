import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const ownerDecisionIssues = new Map();
const requiredReviewerLabel = "reviewer-feedback";
const reviewerTopicLabels = new Set(["verification", "docs", "contracts", "boundary", "safety"]);
const expectedReviewerLabels = new Set([requiredReviewerLabel, ...reviewerTopicLabels]);
const failures = [];

const packageJson = JSON.parse(await readFile("package.json", "utf8"));

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

for (const requiredPath of [
  "docs/world-share-post-share-monitor.md",
  "docs/world-share-final-preflight.md",
  "docs/world-share-packet.md",
  "docs/reviewer-feedback-guide.md",
  "docs/reviewer-labels.md",
  "CONTRIBUTING.md",
  ".github/ISSUE_TEMPLATE/docs-contract-feedback.yml",
  ".github/ISSUE_TEMPLATE/verification-failure.yml",
  ".github/ISSUE_TEMPLATE/boundary-safety-concern.yml",
  ".github/pull_request_template.md"
]) {
  await assertPathExists(requiredPath);
}

const monitorDoc = await readFile("docs/world-share-post-share-monitor.md", "utf8");
const contributing = await readFile("CONTRIBUTING.md", "utf8");
const pullRequestTemplate = await readFile(".github/pull_request_template.md", "utf8");

for (const requiredText of [
  "Status: owner-side post-share monitor.",
  "structured reviewer feedback issues stay allowed",
  "open pull requests fail the monitor because code contributions are still blocked",
  "ok post-share monitor ready",
  "ok structured reviewer issue intake current",
  "blocked code contribution PRs"
]) {
  assertIncludes(monitorDoc, requiredText, "post-share monitor doc");
}

assertIncludes(contributing, "code contributions are not accepted until the owner approves contribution terms", "contributing contribution boundary");
assertIncludes(pullRequestTemplate, "I understand Source-Wire is not accepting public code contributions yet.", "pull request contribution boundary");

const liveLabels = await ghJson([
  "label",
  "list",
  "--repo",
  repo,
  "--json",
  "name",
  "--limit",
  "200"
]);
const liveLabelNames = new Set(liveLabels.map((label) => label.name));
for (const expectedLabel of expectedReviewerLabels) {
  if (!liveLabelNames.has(expectedLabel)) {
    failures.push(`missing reviewer label: ${expectedLabel}`);
  }
}

const openIssues = await ghJson([
  "issue",
  "list",
  "--repo",
  repo,
  "--state",
  "open",
  "--limit",
  "200",
  "--json",
  "number,title,url,labels,author,createdAt"
]);

const openPullRequests = await ghJson([
  "pr",
  "list",
  "--repo",
  repo,
  "--state",
  "open",
  "--limit",
  "100",
  "--json",
  "number,title,url,author,createdAt"
]);

const ownerIssues = [];
const reviewerIssues = [];

for (const issue of openIssues) {
  if (ownerDecisionIssues.has(issue.number)) {
    const expectedTitle = ownerDecisionIssues.get(issue.number);
    ownerIssues.push(issue);
    if (issue.title !== expectedTitle) {
      failures.push(`owner decision issue #${issue.number} title mismatch: expected ${JSON.stringify(expectedTitle)}, received ${JSON.stringify(issue.title)}`);
    }
    continue;
  }

  const labels = new Set((issue.labels ?? []).map((label) => label.name));
  const hasReviewerLabel = labels.has(requiredReviewerLabel);
  const topicLabels = [...reviewerTopicLabels].filter((label) => labels.has(label));

  if (!hasReviewerLabel) {
    failures.push(`open issue #${issue.number} is not a tracked owner decision issue and lacks ${requiredReviewerLabel}: ${issue.title}`);
  }
  if (topicLabels.length === 0) {
    failures.push(`open reviewer issue #${issue.number} lacks a topic label: ${[...reviewerTopicLabels].join(", ")}`);
  }

  reviewerIssues.push({ ...issue, topicLabels });
}

if (openPullRequests.length > 0) {
  for (const pullRequest of openPullRequests) {
    failures.push(`open pull request #${pullRequest.number} exists while code contributions are blocked: ${pullRequest.title}`);
  }
}

printSection("Source-Wire Post-Share Monitor");
console.log("This owner-side monitor is read-only.");
console.log("It allows owner-decision issues and structured reviewer feedback issues after public sharing.");
console.log("It does not close issues, edit issues, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

printRows([
  ["Repository", repo],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Open owner-decision issues", String(ownerIssues.length)],
  ["Open reviewer feedback issues", String(reviewerIssues.length)],
  ["Open pull requests", String(openPullRequests.length)],
  ["Code contributions", "blocked"],
  ["Hosted runtime", "blocked"]
]);

printSection("Open Issue Classification");
if (openIssues.length === 0) {
  console.log("No open issues found.");
} else {
  for (const issue of openIssues.toSorted((left, right) => left.number - right.number)) {
    const kind = ownerDecisionIssues.has(issue.number) ? "owner-decision" : "reviewer-feedback";
    const labels = (issue.labels ?? []).map((label) => label.name).join(", ") || "no labels";
    console.log(`#${issue.number} ${kind}: ${issue.title}`);
    console.log(`labels: ${labels}`);
    console.log(`url: ${issue.url}`);
  }
}

printSection("Post-Share Monitor Result");

if (failures.length > 0) {
  console.log("ok post-share monitor readable");
  for (const failure of failures) {
    console.log(`failed ${failure}`);
  }
  process.exit(1);
}

console.log("ok post-share monitor ready");
console.log("ok structured reviewer issue intake current");
console.log("blocked code contribution PRs");

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
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}: ${value}`);
  }
}
