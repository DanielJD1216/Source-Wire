import { spawn } from "node:child_process";

const exactApproval =
  "Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked.";

const dryRun = await runPublisher([]);
assertExitCode(dryRun, 0, "dry run");
assertIncludes(dryRun.stdout, "ok hosted runtime child issue publisher ready", "dry run");
assertIncludes(dryRun.stdout, "blocked child issue publication requires --write", "dry run");
assertIncludes(dryRun.stdout, "blocked hosted runtime implementation", "dry run");

const missingApproval = await runPublisher([
  "--fixture",
  "approval-missing",
  "--write",
  "--confirm-exact",
  exactApproval
]);
assertExitCode(missingApproval, 1, "missing approval fixture");
assertIncludes(missingApproval.stdout, "Fixture mode: approval-missing. No GitHub API calls are made for fixture-backed approval or issue state.", "missing approval fixture");
assertIncludes(missingApproval.stderr, "failed hosted runtime child issue publisher: exact child issue publication approval is not recorded on parent issue #257", "missing approval fixture");
assertIncludes(missingApproval.stderr, "blocked child issue publication approval missing", "missing approval fixture");
assertIncludes(missingApproval.stderr, "blocked hosted runtime implementation", "missing approval fixture");

const duplicatePublication = await runPublisher([
  "--fixture",
  "approval-recorded-with-duplicates",
  "--write",
  "--confirm-exact",
  exactApproval
]);
assertExitCode(duplicatePublication, 1, "duplicate publication fixture");
assertIncludes(duplicatePublication.stdout, "Fixture mode: approval-recorded-with-duplicates. No GitHub API calls are made for fixture-backed approval or issue state.", "duplicate publication fixture");
assertIncludes(duplicatePublication.stderr, "failed hosted runtime child issue publisher: matching open child issue titles already exist", "duplicate publication fixture");
assertIncludes(duplicatePublication.stderr, "blocked child issue duplicate publication", "duplicate publication fixture");
assertIncludes(duplicatePublication.stderr, "blocked hosted runtime implementation", "duplicate publication fixture");

console.log("ok hosted runtime child issue publisher smoke");

function runPublisher(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/hosted-runtime-child-issue-publisher.mjs", ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}

function assertExitCode(result, expected, reason) {
  if (result.exitCode !== expected) {
    fail(`${reason}: expected exit code ${expected}, received ${result.exitCode}`, result);
  }
}

function assertIncludes(text, requiredText, reason) {
  if (!text.includes(requiredText)) {
    fail(`${reason}: missing ${JSON.stringify(requiredText)}`, { stdout: text, stderr: "" });
  }
}

function fail(message, result) {
  console.error(`failed hosted runtime child issue publisher smoke: ${message}`);
  if (result.stdout?.trim()) {
    console.error(`stdout:\n${result.stdout.trim()}`);
  }
  if (result.stderr?.trim()) {
    console.error(`stderr:\n${result.stderr.trim()}`);
  }
  process.exit(1);
}
