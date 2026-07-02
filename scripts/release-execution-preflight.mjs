import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";
const releaseApprovalIssue = 255;
const exactReleaseApprovalText =
  "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms.";

const checks = [
  ["release:approval-status", "release approval status"],
  ["release:auth-preflight", "release auth preflight"],
  ["release:decision-preflight", "release decision preflight"],
  ["publish:readiness", "publish readiness"],
  ["release:artifact-manifest", "release artifact manifest"],
  ["world:live-status", "live world-share status"],
  ["release:live-tags", "live release tag boundary"],
  ["registry:live-npm", "live npm registry boundary"]
];

printSection("Source-Wire Release Execution Preflight");
console.log("This owner-side preflight is read-only.");
console.log("Run it only before a future approved release implementation unit.");
console.log("It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

for (const [scriptName, label] of checks) {
  printSection(label);
  await runNpmScript(scriptName);
}

const releaseApprovalRecorded = await hasReleaseApproval();
const releaseAuthReady = await hasReleaseAuth();

printSection("Release Execution Preflight Result");
console.log("ok release execution preflight ready");
console.log("ok release approval status current");
console.log("ok release auth preflight current");
console.log("ok release decision preflight current");
console.log("ok publish readiness current");
console.log("ok release artifact evidence current");
console.log("ok live release boundaries current");
if (releaseApprovalRecorded) {
  console.log("ok exact release approval recorded");
} else {
  console.log("blocked release execution approval missing");
}
if (releaseAuthReady) {
  console.log("ok release publish credentials ready");
} else {
  console.log("blocked release publish credentials missing");
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

async function hasReleaseApproval() {
  const issue = await commandJson("gh", [
    "issue",
    "view",
    String(releaseApprovalIssue),
    "--repo",
    repo,
    "--json",
    "body,comments"
  ]);
  const body = issue.body ?? "";
  const comments = Array.isArray(issue.comments) ? issue.comments : [];
  return hasApprovalRecordSection(body) || comments.some((comment) => comment.body?.includes(exactReleaseApprovalText));
}

async function hasReleaseAuth() {
  const npmWhoami = await commandResult("npm", ["whoami"]);
  const npmProfile = await commandResult("npm", ["profile", "get", "--json"]);
  const ghAuth = await commandResult("gh", ["auth", "status"]);
  const npmProfileData = parseJson(npmProfile.stdout);
  const npmPublishSecondFactorReady =
    Boolean(process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN) || npmProfileData?.tfa !== false;
  return npmWhoami.ok && npmProfile.ok && npmPublishSecondFactorReady && ghAuth.ok;
}

function hasApprovalRecordSection(body) {
  const sectionPattern = /^## Owner Approval Record\s*$[\s\S]*?(?=^## |\s*$)/mu;
  const section = body.match(sectionPattern)?.[0] ?? "";
  return section.includes(exactReleaseApprovalText);
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

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
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
