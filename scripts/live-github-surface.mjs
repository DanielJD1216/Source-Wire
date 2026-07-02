import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

const expectedDescription = "Apache-2.0 agent-memory contract skeleton. Unpublished, unreleased, not hosted.";
const expectedHomepage = "https://github.com/DanielJD1216/Source-Wire/blob/main/docs/share-for-review.md";
const expectedTopics = [
  "agent-memory",
  "apache-2-0",
  "llm-memory",
  "mcp",
  "second-brain",
  "source-graph",
  "typescript"
];

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.0.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay restricted while npm publishing is blocked");

const repoView = await ghJson([
  "repo",
  "view",
  repo,
  "--json",
  [
    "name",
    "description",
    "homepageUrl",
    "repositoryTopics",
    "visibility",
    "isArchived",
    "isFork",
    "defaultBranchRef",
    "hasIssuesEnabled",
    "hasProjectsEnabled",
    "hasWikiEnabled",
    "licenseInfo",
    "url"
  ].join(",")
]);

const repoApi = await ghJson(["api", `repos/${repo}`]);
const releases = await ghJson(["release", "list", "--repo", repo, "--limit", "10", "--json", "tagName,name,isLatest,createdAt"]);
const latestRun = await ghJson([
  "run",
  "list",
  "--repo",
  repo,
  "--workflow",
  "Package Checks",
  "--limit",
  "1",
  "--json",
  "databaseId,headSha,status,conclusion,workflowName,url,createdAt"
]);
const remoteHead = (await run("git", ["rev-parse", "origin/main"])).trim();

assertEqual(repoView.name, "Source-Wire", "live GitHub repo name must remain Source-Wire");
assertEqual(repoView.description, expectedDescription, "live GitHub description must match repository metadata boundary");
assertEqual(repoView.homepageUrl, expectedHomepage, "live GitHub homepage must point to share-for-review");
assertEqual(repoView.visibility, "PUBLIC", "live GitHub visibility must stay public");
assertEqual(repoView.isArchived, false, "live GitHub repo must not be archived");
assertEqual(repoView.isFork, false, "live GitHub repo must not be a fork");
assertEqual(repoView.defaultBranchRef?.name, "main", "live GitHub default branch must stay main");
assertEqual(repoView.hasIssuesEnabled, true, "live GitHub issues must stay enabled for structured feedback");
assertEqual(repoView.hasProjectsEnabled, false, "live GitHub projects must stay disabled");
assertEqual(repoView.hasWikiEnabled, false, "live GitHub wiki must stay disabled");
assertEqual(repoView.licenseInfo?.key, "apache-2.0", "live GitHub license must be Apache-2.0");
assertEqual(repoView.url, "https://github.com/DanielJD1216/Source-Wire", "live GitHub URL must match Source-Wire");

const liveTopics = (repoView.repositoryTopics ?? []).map((topic) => topic.name).sort();
assertArrayEqual(liveTopics, expectedTopics, "live GitHub topics must match repository metadata boundary");

assertEqual(repoApi.private, false, "GitHub API private flag must be false");
assertEqual(repoApi.archived, false, "GitHub API archived flag must be false");
assertEqual(repoApi.disabled, false, "GitHub API disabled flag must be false");
assertEqual(repoApi.default_branch, "main", "GitHub API default branch must be main");
assertEqual(repoApi.has_issues, true, "GitHub API issues must stay enabled");
assertEqual(repoApi.has_projects, false, "GitHub API projects must stay disabled");
assertEqual(repoApi.has_wiki, false, "GitHub API wiki must stay disabled");
assertEqual(repoApi.license?.spdx_id, "Apache-2.0", "GitHub API license SPDX id must be Apache-2.0");

if (!Array.isArray(releases) || releases.length !== 0) {
  failures.push("GitHub releases must remain empty until release execution");
}

const [runInfo] = latestRun;
if (!runInfo) {
  failures.push("latest Package Checks run is missing");
} else {
  assertEqual(runInfo.workflowName, "Package Checks", "latest workflow name must be Package Checks");
  assertEqual(runInfo.status, "completed", "latest Package Checks run must be completed");
  assertEqual(runInfo.conclusion, "success", "latest Package Checks run must be successful");
  assertEqual(runInfo.headSha, remoteHead, "latest Package Checks run must match origin/main");
}

if (failures.length > 0) {
  console.error("failed live GitHub public surface");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Live GitHub Public Surface");
printRows([
  ["Repository", repo],
  ["URL", repoView.url],
  ["Visibility", repoView.visibility],
  ["Default branch", repoView.defaultBranchRef.name],
  ["License", repoView.licenseInfo.key],
  ["Description", repoView.description],
  ["Homepage", repoView.homepageUrl],
  ["Topics", liveTopics.join(", ")],
  ["Issues", "enabled"],
  ["Projects", "disabled"],
  ["Wiki", "disabled"],
  ["GitHub releases", "none"],
  ["Latest Package Checks", `${runInfo.conclusion} ${runInfo.url}`],
  ["Version", packageJson.version],
  ["npm publishing", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok live github public surface ready");
console.log("ok live github metadata matches docs");
console.log("ok live package checks green");
console.log("blocked github release not approved");

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

function assertArrayEqual(actual, expected, reason) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
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
