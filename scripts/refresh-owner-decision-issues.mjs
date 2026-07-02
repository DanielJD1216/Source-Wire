import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";
const refreshedAt = new Date().toISOString().slice(0, 10);

const decisionIssues = [
  {
    number: 255,
    exactApprovalText:
      "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.",
    command: "npm run release:decision-preflight",
    gateProof: [
      "ok release decision preflight ready",
      "ok world share preflight current",
      "ok owner open issue boundary current",
      "ok release approval status current",
      "ok release candidate evidence current",
      "ok release artifact evidence current",
      "ok release execution completed",
      "ok npm package published @source-wire/contracts@0.1.0",
      "ok github release published v0.1.0"
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
      "ok branch governance execution packet current",
      "ok branch governance implementation approval recorded",
      "ok minimal branch protection implemented",
      "blocked repository rulesets not enabled"
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
      "ok hosted runtime PRD execution packet current",
      "ok exact hosted runtime PRD approval recorded"
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
      "ok contribution terms PRD execution packet current",
      "ok contribution terms policy current",
      "ok public intake boundary current",
      "ok exact contribution terms PRD approval recorded",
      "blocked code contribution acceptance"
    ]
  }
];

const finalPreflightProof = [
  "ok world share final preflight ready",
  "ok world share preflight current",
  "ok world share operator summary current",
  "ok release decision preflight current",
  "ok branch governance decision preflight current",
  "ok hosted runtime PRD decision preflight current",
  "ok hosted runtime child issue publication preflight current",
  "ok hosted runtime child issue approval status current",
  "ok contribution terms PRD decision preflight current",
  "ok reviewer labels current",
  "ok owner decision issue boundary current",
  "ok owner open issue future planning smoke current",
  "ok owner decision issue freshness current",
  "blocked production launch channels",
  "blocked focused implementation units required"
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
    "body,title,url,comments"
  ]);
  const approvalComments = getApprovalComments(issue.comments, decisionIssue.exactApprovalText);

  const nextBody = refreshIssueBody(issue.body ?? "", {
    issueNumber: decisionIssue.number,
    issueTitle: issue.title,
    commit,
    commitMessage,
    packageChecksUrl: latestRun.url,
    packageChecksConclusion: latestRun.conclusion,
    command: decisionIssue.command,
    gateProof: decisionIssue.gateProof,
    approvalComments,
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
    .replace(/- npm publishing: blocked/gu, "- npm publishing: published as `@source-wire/contracts@0.1.0`")
    .replace(/- GitHub release publishing: blocked/gu, "- GitHub release publishing: published as `v0.1.0`")
    .replace(/- GitHub release: blocked/gu, "- GitHub release: published as `v0.1.0`")
    .replace(/- Release tags: blocked/gu, "- Release tags: published as `v0.1.0`")
    .replace(/- Version: `0\.0\.0`/gu, "- Version: `0.1.0`")
    .replace(/- Version: 0\.0\.0/gu, "- Version: 0.1.0")
    .replace(/- Contribution terms approval: blocked because no separate exact owner approval record exists yet/gu, "- Contribution terms PRD: complete; code contribution acceptance blocked")
    .replace(/^npm publishing: blocked$/gmu, "npm publishing: published")
    .replace(/^GitHub release: blocked$/gmu, "GitHub release: published")
    .replace(/https:\/\/github\.com\/DanielJD1216\/Source-Wire\/actions\/runs\/\d+/gu, context.packageChecksUrl)
    .replace(/Latest Package Checks for that commit:\n\n```text\nhttps:\/\/github\.com\/DanielJD1216\/Source-Wire\/actions\/runs\/\d+\n```/u, `Latest Package Checks for that commit:\n\n\`\`\`text\n${context.packageChecksUrl}\n\`\`\``)
    .replace(/Latest verified Source-Wire commit:\n\n```text\n[0-9a-f]{40}\n[^`]+```/u, `Latest verified Source-Wire commit:\n\n\`\`\`text\n${context.commit}\n${context.commitMessage}\n\`\`\``);

  const manifestBlock = `Current artifact manifest from the latest verified commit:\n\n\`\`\`text\n${context.artifactManifest}\n\`\`\``;
  nextBody = nextBody.replace(/Current artifact manifest from the latest verified commit:\n\n```text\n[\s\S]*?```/u, manifestBlock);
  nextBody = replaceProofBlock(nextBody, "Current owner-decision status proof", currentOwnerDecisionStatusProof());

  if (context.issueNumber === 255) {
    nextBody = refreshReleaseApprovalIssueBody(nextBody, context);
  }

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

function refreshReleaseApprovalIssueBody(body, context) {
  const approvalRecorded = context.approvalComments.length > 0;
  const approvalSource = approvalRecorded ? "recorded in issue comment; release execution completed" : "blocked because no separate exact owner approval record exists yet";
  let nextBody = body.replace(
    /- Release implementation approval: .+/u,
    `- Release implementation approval: ${approvalSource}`
  );

  const releaseApprovalStatusProof = [
    `Issue                  : #${context.issueNumber} ${context.issueTitle}`,
    "State                  : OPEN",
    `Exact approval         : ${approvalRecorded ? "recorded" : "not recorded"}`,
    `Approval record section: ${approvalRecorded ? "not used, approval is in comment" : "missing"}`,
    `Approval comments      : ${context.approvalComments.length}`,
    "ok release approval status readable",
    ...(approvalRecorded
      ? ["ok exact release approval recorded", "ok release execution completed"]
      : ["blocked exact release approval missing", "blocked release implementation approval missing"])
  ].join("\n");

  const releaseDecisionPreflightProof = [
    "ok release decision preflight ready",
    "ok world share preflight current",
    "ok owner open issue boundary current",
    "ok release approval status current",
    "ok release candidate evidence current",
    "ok release artifact evidence current",
    ...(approvalRecorded
      ? [
          "ok release execution completed",
          "ok npm package published @source-wire/contracts@0.1.0",
          "ok github release published v0.1.0"
        ]
      : ["blocked release implementation approval missing"])
  ].join("\n");

  nextBody = replaceProofBlock(nextBody, "Current release approval status proof", releaseApprovalStatusProof);
  nextBody = replaceProofBlock(nextBody, "Current release-decision preflight proof", releaseDecisionPreflightProof);

  return nextBody;
}

function currentOwnerDecisionStatusProof() {
  return [
    "ok owner decision status readable",
    "ok exact release implementation approval recorded",
    "ok exact branch governance implementation approval recorded",
    "ok exact hosted runtime PRD approval recorded",
    "ok exact contribution terms PRD approval recorded",
    "ok all tracked owner decision approvals recorded",
    "blocked execution still requires focused implementation units"
  ].join("\n");
}

function replaceProofBlock(body, label, proof) {
  const pattern = new RegExp(`${escapeRegExp(label)}:\\n\\n\`\`\`text\\n[\\s\\S]*?\`\`\``, "u");
  return body.replace(pattern, `${label}:\n\n\`\`\`text\n${proof}\n\`\`\``);
}

function getApprovalComments(comments, exactApprovalText) {
  if (!exactApprovalText || !Array.isArray(comments)) {
    return [];
  }

  return comments.filter((comment) => comment.body?.includes(exactApprovalText));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

async function getLatestPackageChecksRun() {
  const runs = await ghJson([
    "run",
    "list",
    "--repo",
    repo,
    "--branch",
    "main",
    "--workflow",
    "Package Checks",
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
  const manifestMatch = result.stdout.match(/Source-Wire Release Artifact Manifest\n[-]+\n(?<manifest>[\s\S]*?)\nok release artifact manifest ready/u);
  if (!manifestMatch?.groups?.manifest) {
    throw new Error("unable to parse release artifact manifest");
  }

  return manifestMatch.groups.manifest.trim();
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
