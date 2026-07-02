import { execFile } from "node:child_process";

const repo = "DanielJD1216/Source-Wire";
const contributionTermsIssue = 258;
const exactContributionTermsApprovalText =
  "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit.";

const checks = [
  ["world:share-preflight", "world-share preflight"],
  ["owner:decision-status", "owner decision issue status"],
  ["owner:open-issues-status", "owner open issue boundary"],
  ["contribution:terms-preparation", "contribution terms PRD preparation"],
  ["contribution:terms-execution-packet", "contribution terms PRD execution packet"],
  ["pull-request:boundary", "pull request boundary"],
  ["intake:boundary", "public intake boundary"],
  ["launch:decision-status", "launch decision status"]
];

printSection("Source-Wire Contribution Terms PRD Decision Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It does not accept code contributions, change contribution policy, add a CLA, add a DCO requirement, publish npm, create a GitHub release, deploy services, add hosted runtime behavior, enable branch governance, or approve production runtime use.");

for (const [scriptName, label] of checks) {
  printSection(label);
  await runNpmScript(scriptName);
}

const contributionTermsApprovalRecorded = await hasContributionTermsApproval();

printSection("Contribution Terms PRD Decision Preflight Result");
console.log("ok contribution terms PRD decision preflight ready");
console.log("ok world share preflight current");
console.log("ok owner decision status current");
console.log("ok owner open issue boundary current");
console.log("ok contribution terms PRD evidence current");
console.log("ok contribution terms PRD execution packet current");
console.log("ok public intake boundary current");
if (contributionTermsApprovalRecorded) {
  console.log("ok exact contribution terms PRD approval recorded");
} else {
  console.log("blocked contribution terms PRD approval missing");
}
console.log("blocked code contribution acceptance");

function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = execFile("npm", ["run", scriptName], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 30
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
