import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
const failures = [];
const expectedTag = "v0.1.0";
const expectedTarget = "bd240283ec45e5b83ecd0e1c1cc9650097fd6509";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");
assertEqual(packageLock.packages?.[""]?.name, packageJson.name, "package-lock root name must match package.json");
assertEqual(packageLock.packages?.[""]?.version, packageJson.version, "package-lock root version must match package.json");
assertEqual(packageLock.packages?.[""]?.license, packageJson.license, "package-lock root license must match package.json");
assertEqual(packageLock.packages?.[""]?.bin?.["source-wire"], "dist/cli.js", "package-lock root bin must include source-wire CLI");

const repoApi = await ghJson(["api", `repos/${repo}`], `https://api.github.com/repos/${repo}`);
const mainBranch = await ghJson(["api", `repos/${repo}/branches/main`], `https://api.github.com/repos/${repo}/branches/main`);
const rulesets = await ghJson(["api", `repos/${repo}/rulesets`], `https://api.github.com/repos/${repo}/rulesets`);
const releases = await ghJson(["api", `repos/${repo}/releases`], `https://api.github.com/repos/${repo}/releases`);
const latestRun = await ghJson([
  "api",
  `repos/${repo}/actions/workflows/package-checks.yml/runs?per_page=1`
], `https://api.github.com/repos/${repo}/actions/workflows/package-checks.yml/runs?per_page=1`);
const advisories = await ghJson(["api", `repos/${repo}/security-advisories`]);
const remoteHead = (await run("git", ["rev-parse", "origin/main"])).stdout.trim();
const localTags = parseLines((await run("git", ["tag", "--list"])).stdout);
const remoteTags = parseRemoteTags((await run("git", ["ls-remote", "--tags", "origin"])).stdout);
const npmView = await run("npm", ["view", packageJson.name, "name", "version", "dist-tags", "--json"], { allowFailure: true });
const npmRegistryState = getNpmRegistryState(npmView);

const expectedDescription = "Apache-2.0 agent-memory contracts. npm v0.1.0, GitHub release v0.1.0, not hosted.";
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

assertEqual(repoApi.name, "Source-Wire", "live GitHub repo name must remain Source-Wire");
assertEqual(repoApi.description, expectedDescription, "live GitHub description must match repository metadata boundary");
assertEqual(repoApi.homepage, expectedHomepage, "live GitHub homepage must point to share-for-review");
assertEqual(repoApi.visibility, "public", "live GitHub visibility must stay public");
assertEqual(repoApi.archived, false, "live GitHub repo must not be archived");
assertEqual(repoApi.fork, false, "live GitHub repo must not be a fork");
assertEqual(repoApi.default_branch, "main", "live GitHub default branch must stay main");
assertEqual(repoApi.has_issues, true, "live GitHub issues must stay enabled for structured feedback");
assertEqual(repoApi.has_projects, false, "live GitHub projects must stay disabled");
assertEqual(repoApi.has_wiki, false, "live GitHub wiki must stay disabled");
assertEqual(repoApi.license?.key, "apache-2.0", "live GitHub license must be Apache-2.0");
assertEqual(repoApi.html_url, "https://github.com/DanielJD1216/Source-Wire", "live GitHub URL must match Source-Wire");

const liveTopics = (repoApi.topics ?? []).sort();
assertArrayEqual(liveTopics, expectedTopics, "live GitHub topics must match repository metadata boundary");

assertEqual(repoApi.private, false, "GitHub API private flag must be false");
assertEqual(repoApi.archived, false, "GitHub API archived flag must be false");
assertEqual(repoApi.disabled, false, "GitHub API disabled flag must be false");
assertEqual(repoApi.default_branch, "main", "GitHub API default branch must be main");
assertEqual(repoApi.has_issues, true, "GitHub API issues must stay enabled");
assertEqual(repoApi.has_projects, false, "GitHub API projects must stay disabled");
assertEqual(repoApi.has_wiki, false, "GitHub API wiki must stay disabled");
assertEqual(repoApi.has_discussions, false, "GitHub API discussions must stay disabled");
assertEqual(repoApi.license?.spdx_id, "Apache-2.0", "GitHub API license SPDX id must be Apache-2.0");
assertEqual(repoApi.security_and_analysis?.secret_scanning?.status, "enabled", "live GitHub secret scanning must stay enabled");
assertEqual(repoApi.security_and_analysis?.secret_scanning_push_protection?.status, "enabled", "live GitHub secret scanning push protection must stay enabled");
assertEqual(mainBranch.name, "main", "live GitHub branch name must be main");
assertEqual(mainBranch.commit?.sha, remoteHead, "live GitHub main branch must match origin/main");

if (!Array.isArray(rulesets)) {
  failures.push("GitHub rulesets response must be an array");
}
if (!Array.isArray(releases)) {
  failures.push("GitHub releases response must be an array");
} else {
  const release = releases.find((item) => item.tag_name === expectedTag);
  if (!release) {
    failures.push(`GitHub releases must include ${expectedTag}`);
  } else {
    assertEqual(release.draft, false, "GitHub release must not be draft");
    assertEqual(release.prerelease, false, "GitHub release must not be prerelease");
    assertEqual(release.target_commitish, expectedTarget, "GitHub release target commit must match release commit");
  }
}
if (!Array.isArray(advisories) || advisories.length !== 0) {
  failures.push("GitHub security advisories must remain empty until an owner-managed advisory is needed");
}
if (!localTags.includes(expectedTag)) {
  failures.push(`local git tags must include ${expectedTag}`);
}
if (!remoteTags.includes(expectedTag)) {
  failures.push(`remote git tags must include ${expectedTag}`);
}
if (npmRegistryState.state !== "published") {
  failures.push(`npm registry state must be published: ${npmRegistryState.summary || "unknown npm state"}`);
}
assertEqual(npmRegistryState.version, packageJson.version, "npm registry version must match package.json");
assertEqual(npmRegistryState.latest, packageJson.version, "npm latest dist-tag must match package.json version");

const [runInfo] = latestRun.workflow_runs ?? [];
if (!runInfo) {
  failures.push("latest Package Checks run is missing");
} else {
  assertEqual(runInfo.name, "Package Checks", "latest workflow name must be Package Checks");
  assertEqual(runInfo.status, "completed", "latest Package Checks run must be completed");
  assertEqual(runInfo.conclusion, "success", "latest Package Checks run must be successful");
  assertEqual(runInfo.head_sha, remoteHead, "latest Package Checks run must match origin/main");
}

if (failures.length > 0) {
  console.error("failed live world share status");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const activeRulesets = rulesets.filter((ruleset) => ruleset.enforcement !== "disabled");
const branchProtectionState = mainBranch.protected ? "enabled" : "not enabled";
const rulesetState = activeRulesets.length > 0 ? `${activeRulesets.length} active` : "none";

printSection("Source-Wire Live World Share Status");
printRows([
  ["Repository", repo],
  ["URL", repoApi.html_url],
  ["Share status", "ready for Apache-2.0 source-package review and reuse"],
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Package lock license", packageLock.packages[""].license],
  ["Visibility", repoApi.visibility],
  ["Default branch", repoApi.default_branch],
  ["origin/main SHA", remoteHead],
  ["Latest Package Checks", `${runInfo.conclusion} ${runInfo.html_url}`],
  ["npm registry", npmRegistryState.state],
  ["npm latest", npmRegistryState.latest],
  ["GitHub release", expectedTag],
  ["Local git tags", expectedTag],
  ["Remote git tags", expectedTag],
  ["Secret scanning", repoApi.security_and_analysis.secret_scanning.status],
  ["Push protection", repoApi.security_and_analysis.secret_scanning_push_protection.status],
  ["Branch protection", branchProtectionState],
  ["Active rulesets", rulesetState],
  ["Hosted runtime", "blocked"],
  ["Production runtime use", "blocked"],
  ["Code contributions", "blocked"]
]);

console.log("");
console.log("ok live world share status ready");
console.log("ok source repo sharing ready");
console.log("ok live public surface green");
console.log("ok live package lock Apache-2.0");
console.log("ok npm package published @source-wire/contracts@0.1.0");
console.log("ok release channels published v0.1.0");
console.log("blocked production launch channels");
console.log("ok minimal branch protection implemented");
console.log("blocked repository rulesets not enabled");

function getNpmRegistryState(result) {
  if (result.exitCode === 0) {
    const data = JSON.parse(result.stdout);
    return {
      state: "published",
      code: "",
      summary: "npm view succeeded",
      version: data.version ?? "",
      latest: data["dist-tags"]?.latest ?? ""
    };
  }

  const parsed = parseNpmError(result.stdout);
  const code = parsed?.error?.code ?? "";
  const summary = parsed?.error?.summary ?? result.stderr.trim();

  if (code === "E404" || /Not Found/i.test(summary)) {
    return { state: "unpublished", code, summary, version: "", latest: "" };
  }

  return { state: "unknown", code, summary, version: "", latest: "" };
}

function parseNpmError(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function parseLines(text) {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseRemoteTags(text) {
  return parseLines(text)
    .map((line) => line.split(/\s+/u)[1] ?? "")
    .filter(Boolean)
    .map((ref) => ref.replace(/^refs\/tags\//u, ""))
    .filter((ref) => !ref.endsWith("^{}"));
}

async function ghJson(args, fallbackUrl = "") {
  try {
    const result = await run("gh", args);
    return JSON.parse(result.stdout);
  } catch (error) {
    if (fallbackUrl.length === 0) {
      throw error;
    }

    return fetchJson(fallbackUrl);
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Source-Wire live world share status"
    }
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      const result = {
        exitCode: error?.code ?? 0,
        stdout,
        stderr
      };

      if (error && !options.allowFailure) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      resolve(result);
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
