import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const PACKAGE_NAME = "@source-wire/contracts";
const CANDIDATE_VERSION = "0.2.0";
const CURRENT_PUBLISHED_VERSION = "0.1.0";
const CANDIDATE_TAG = `v${CANDIDATE_VERSION}`;
const REPOSITORY = "DanielJD1216/Source-Wire";
const EXPECTED_HOMEPAGE =
  "https://github.com/DanielJD1216/Source-Wire/blob/main/docs/guides/share-for-review.md";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, PACKAGE_NAME, "package name");
assertEqual(packageJson.version, CANDIDATE_VERSION, "candidate version");
assertEqual(packageJson.license, "Apache-2.0", "package license");
assertEqual(packageJson.publishConfig?.access, "public", "npm publish access");
assertEqual(packageLock.packages?.[""]?.version, CANDIDATE_VERSION, "package-lock root version");

await runNpmScript("release:auth-preflight");
await runNpmScript("release:0.2.0-gate");

const gitStatus = await run("git", ["status", "--porcelain"]);
const localHead = (await run("git", ["rev-parse", "HEAD"])).stdout.trim();
const remoteHead = (await run("git", ["rev-parse", "origin/main"])).stdout.trim();
const latestWorkflow = await runJson("gh", [
  "api",
  `repos/${REPOSITORY}/actions/workflows/package-checks.yml/runs?per_page=1`
]);
const repository = await runJson("gh", ["api", `repos/${REPOSITORY}`]);
const npmVersions = normalizeVersions(
  JSON.parse((await run("npm", ["view", PACKAGE_NAME, "versions", "--json"])).stdout)
);
const npmDistTags = JSON.parse(
  (await run("npm", ["view", PACKAGE_NAME, "dist-tags", "--json"])).stdout
);
const npmAccess = JSON.parse(
  (await run("npm", ["access", "get", "status", PACKAGE_NAME, "--json"])).stdout
);
const localCandidateTags = parseLines(
  (await run("git", ["tag", "--list", CANDIDATE_TAG])).stdout
);
const remoteCandidateTags = parseRemoteTags(
  (
    await run("git", [
      "ls-remote",
      "--tags",
      "origin",
      `refs/tags/${CANDIDATE_TAG}`,
      `refs/tags/${CANDIDATE_TAG}^{}`
    ])
  ).stdout
);
const candidateRelease = await run(
  "gh",
  ["release", "view", CANDIDATE_TAG, "--repo", REPOSITORY, "--json", "tagName"],
  { allowFailure: true }
);

assertEqual(gitStatus.stdout.trim(), "", "working tree must be clean");
assertEqual(localHead, remoteHead, "local HEAD must match origin/main");
assertEqual(repository.homepage, EXPECTED_HOMEPAGE, "GitHub homepage");
assertEqual(repository.private, false, "GitHub repository visibility");
assertEqual(npmDistTags.latest, CURRENT_PUBLISHED_VERSION, "current npm latest tag");
assertEqual(npmAccess[PACKAGE_NAME], "public", "npm package access");

if (!npmVersions.includes(CURRENT_PUBLISHED_VERSION)) {
  failures.push(`npm must retain ${CURRENT_PUBLISHED_VERSION} before release`);
}
if (npmVersions.includes(CANDIDATE_VERSION)) {
  failures.push(`${PACKAGE_NAME}@${CANDIDATE_VERSION} must be absent before publication`);
}
if (localCandidateTags.includes(CANDIDATE_TAG)) {
  failures.push(`local candidate tag ${CANDIDATE_TAG} must be absent before release`);
}
if (remoteCandidateTags.includes(CANDIDATE_TAG)) {
  failures.push(`remote candidate tag ${CANDIDATE_TAG} must be absent before release`);
}
if (candidateRelease.exitCode === 0) {
  failures.push(`GitHub release ${CANDIDATE_TAG} must be absent before release`);
}

const [workflow] = latestWorkflow.workflow_runs ?? [];
if (!workflow) {
  failures.push("latest Package Checks workflow is missing");
} else {
  assertEqual(workflow.status, "completed", "latest Package Checks status");
  assertEqual(workflow.conclusion, "success", "latest Package Checks conclusion");
  assertEqual(workflow.head_sha, localHead, "latest Package Checks commit");
}

if (failures.length > 0) {
  console.error("failed contracts 0.2.0 execution preflight");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Contracts 0.2.0 Execution Preflight");
printRows([
  ["Package", `${PACKAGE_NAME}@${CANDIDATE_VERSION}`],
  ["Candidate commit", localHead],
  ["Current npm latest", npmDistTags.latest],
  ["Candidate npm version", "absent"],
  ["Candidate Git tag", "absent"],
  ["Candidate GitHub release", "absent"],
  ["GitHub homepage", repository.homepage],
  ["Package access", npmAccess[PACKAGE_NAME]],
  ["Package Checks", `${workflow.conclusion} ${workflow.html_url}`],
  ["Hosted runtime", "blocked"],
  ["Production runtime", "blocked"],
  ["Live providers", "blocked"],
  ["Real data", "blocked"]
]);

console.log("");
console.log("ok contracts 0.2.0 execution preflight ready");
console.log("ok release publish credentials ready");
console.log("ok exact-commit CI green");
console.log("ok candidate absent from npm");
console.log("ok candidate tag and release absent");
console.log("blocked release mutation not performed");

function normalizeVersions(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
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

function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = execFile("npm", ["run", scriptName], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 60
    });

    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);

    child.on("error", (error) => {
      reject(new Error(`npm run ${scriptName} failed to start: ${error.message}`));
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm run ${scriptName} exited with code ${code}`));
    });
  });
}

function runJson(command, args) {
  return run(command, args).then((result) => JSON.parse(result.stdout));
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 20 },
      (error, stdout, stderr) => {
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
      }
    );
  });
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    failures.push(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
    );
  }
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  const width = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(width)}: ${value}`);
  }
}
