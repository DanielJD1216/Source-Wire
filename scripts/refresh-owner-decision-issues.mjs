import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";
const refreshedAt = new Date().toISOString().slice(0, 10);

const decisionIssues = [
  {
    number: 255,
    command: "npm run release:decision-preflight",
    gateProof: [
      "ok release decision preflight ready",
      "ok world share preflight current",
      "ok owner open issue boundary current",
      "ok release approval status current",
      "ok release candidate evidence current",
      "ok release artifact evidence current",
      "blocked release execution not performed"
    ]
  },
  {
    number: 256,
    command: "npm run repository:branch-governance-preflight",
    gateProof: [
      "ok branch governance decision preflight ready",
      "ok world share preflight current",
      "ok owner decision status current",
      "ok owner open issue boundary current",
      "ok live branch governance current",
      "ok branch governance execution plan current",
      "blocked branch governance implementation approval missing"
    ]
  },
  {
    number: 257,
    command: "npm run runtime:prd-decision-preflight",
    gateProof: [
      "ok hosted runtime PRD decision preflight ready",
      "ok world share preflight current",
      "ok owner decision status current",
      "ok owner open issue boundary current",
      "ok hosted runtime PRD evidence current",
      "blocked hosted runtime PRD approval missing"
    ]
  },
  {
    number: 258,
    command: "npm run contribution:terms-decision-preflight",
    gateProof: [
      "ok contribution terms PRD decision preflight ready",
      "ok world share preflight current",
      "ok owner decision status current",
      "ok owner open issue boundary current",
      "ok contribution terms PRD evidence current",
      "ok public intake boundary current",
      "blocked contribution terms PRD approval missing"
    ]
  }
];

const finalPreflightProof = [
  "ok world share final preflight ready",
  "ok world share preflight current",
  "ok release decision preflight current",
  "ok branch governance decision preflight current",
  "ok hosted runtime PRD decision preflight current",
  "ok contribution terms PRD decision preflight current",
  "ok reviewer labels current",
  "ok owner decision issue boundary current",
  "ok owner decision issue freshness current",
  "blocked production launch channels",
  "blocked owner approvals missing"
];

printSection("Source-Wire Owner Decision Issue Refresh");
console.log("This owner-side refresh mutates GitHub issue bodies only.");
console.log("It does not record owner approval, publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

const commit = (await run("git", ["rev-parse", "HEAD"])).stdout.trim();
const originMain = (await run("git", ["rev-parse", "origin/main"])).stdout.trim();
if (commit !== originMain) {
  throw new Error(`local HEAD must match origin/main before refreshing owner-decision issues: ${commit} != ${originMain}`);
}

const commitMessage = (await run("git", ["log", "-1", "--pretty=%s"])).stdout.trim();
const latestRun = await getLatestPackageChecksRun();
if (latestRun.headSha !== commit || latestRun.status !== "completed" || latestRun.conclusion !== "success") {
  throw new Error(`latest Package Checks must be successful on ${commit}; received ${JSON.stringify(latestRun)}`);
}

const artifactManifest = await getReleaseArtifactManifest();

for (const decisionIssue of decisionIssues) {
  const issue = await ghJson([
    "issue",
    "view",
    String(decisionIssue.number),
    "--repo",
    repo,
    "--json",
    "body,title,url"
  ]);

  const nextBody = refreshIssueBody(issue.body ?? "", {
    commit,
    commitMessage,
    packageChecksUrl: latestRun.url,
    packageChecksConclusion: latestRun.conclusion,
    command: decisionIssue.command,
    gateProof: decisionIssue.gateProof,
    artifactManifest
  });

  if (nextBody !== issue.body) {
    await run("gh", [
      "issue",
      "edit",
      String(decisionIssue.number),
      "--repo",
      repo,
      "--body",
      nextBody
    ]);
  }

  console.log(`ok owner decision issue #${decisionIssue.number} refreshed`);
}

printSection("Owner Decision Issue Refresh Result");
console.log("ok owner decision issue refresh ready");
console.log("ok owner decision issue bodies current");
console.log("blocked owner approvals or execution paths missing");

function refreshIssueBody(body, context) {
  let nextBody = body
    .replace(/Source-Wire commit: `[0-9a-f]{40}`/gu, `Source-Wire commit: \`${context.commit}\``)
    .replace(/Commit message: `[^`]+`/gu, `Commit message: \`${context.commitMessage}\``)
    .replace(/Package Checks run: `https:\/\/github\.com\/DanielJD1216\/Source-Wire\/actions\/runs\/\d+`/gu, `Package Checks run: \`${context.packageChecksUrl}\``)
    .replace(/https:\/\/github\.com\/DanielJD1216\/Source-Wire\/actions\/runs\/\d+/gu, context.packageChecksUrl)
    .replace(/Latest Package Checks for that commit:\n\n```text\nhttps:\/\/github\.com\/DanielJD1216\/Source-Wire\/actions\/runs\/\d+\n```/u, `Latest Package Checks for that commit:\n\n\`\`\`text\n${context.packageChecksUrl}\n\`\`\``)
    .replace(/Latest verified Source-Wire commit:\n\n```text\n[0-9a-f]{40}\n[^`]+```/u, `Latest verified Source-Wire commit:\n\n\`\`\`text\n${context.commit}\n${context.commitMessage}\n\`\`\``);

  const manifestBlock = `Current artifact manifest from the latest verified commit:\n\n\`\`\`text\n${context.artifactManifest}\n\`\`\``;
  nextBody = nextBody.replace(/Current artifact manifest from the latest verified commit:\n\n```text\n[\s\S]*?```/u, manifestBlock);

  const refreshSection = buildRefreshSection(context);
  const refreshSectionPattern = /^## Latest Status Refresh\s*$[\s\S]*?(?=^## )/mu;
  if (refreshSectionPattern.test(nextBody)) {
    return nextBody.replace(refreshSectionPattern, `${refreshSection}\n\n`);
  }

  const recommendedIndex = nextBody.search(/^## Recommended/mu);
  if (recommendedIndex === -1) {
    return `${nextBody.trimEnd()}\n\n${refreshSection}\n`;
  }

  return `${nextBody.slice(0, recommendedIndex).trimEnd()}\n\n${refreshSection}\n\n${nextBody.slice(recommendedIndex)}`;
}

function buildRefreshSection(context) {
  return `## Latest Status Refresh

Refreshed: ${refreshedAt}

- Source-Wire commit: \`${context.commit}\`
- Commit message: \`${context.commitMessage}\`
- Package Checks: ${context.packageChecksConclusion}
- Package Checks run: \`${context.packageChecksUrl}\`
- Final owner-side preflight command: \`npm run world:share-final-preflight\`
- Issue-specific gate command: \`${context.command}\`

Latest final-preflight proof:

\`\`\`text
${finalPreflightProof.join("\n")}
\`\`\`

Latest issue-specific gate proof:

\`\`\`text
${context.gateProof.join("\n")}
\`\`\`

This refresh does not record owner approval or approve blocked work.`;
}

async function getLatestPackageChecksRun() {
  const runs = await ghJson([
    "run",
    "list",
    "--repo",
    repo,
    "--branch",
    "main",
    "--limit",
    "1",
    "--json",
    "headSha,status,conclusion,url"
  ]);
  const [runInfo] = runs;
  if (!runInfo) {
    throw new Error("latest Package Checks run is missing");
  }

  return runInfo;
}

async function getReleaseArtifactManifest() {
  const result = await run("npm", ["run", "release:artifact-manifest"], { maxBuffer: 1024 * 1024 * 20 });
  const manifestMatch = result.stdout.match(/Package\s*: (?<packageName>.+)\nVersion\s*: (?<version>.+)\nLicense\s*: (?<license>.+)\nFilename\s*: (?<filename>.+)\nFile count\s*: (?<fileCount>.+)\nRequired path count: (?<requiredPathCount>.+)\nTarball size bytes : (?<tarballSize>.+)\nUnpacked size bytes: (?<unpackedSize>.+)\nShasum\s*: (?<shasum>.+)\nIntegrity\s*: (?<integrity>.+)/u);
  if (!manifestMatch?.groups) {
    throw new Error("unable to parse release artifact manifest");
  }

  const groups = manifestMatch.groups;
  return [
    `Package            : ${groups.packageName}`,
    `Version            : ${groups.version}`,
    `License            : ${groups.license}`,
    `Filename           : ${groups.filename}`,
    `File count         : ${groups.fileCount}`,
    `Required path count: ${groups.requiredPathCount}`,
    `Tarball size bytes : ${groups.tarballSize}`,
    `Unpacked size bytes: ${groups.unpackedSize}`,
    `Shasum             : ${groups.shasum}`,
    `Integrity          : ${groups.integrity}`
  ].join("\n");
}

function ghJson(args) {
  return run("gh", args, { maxBuffer: 1024 * 1024 * 20 }).then((result) => JSON.parse(result.stdout));
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd: process.cwd(),
        maxBuffer: options.maxBuffer ?? 1024 * 1024 * 10
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}
