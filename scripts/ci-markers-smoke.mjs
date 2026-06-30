import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const markerScript = join(scriptDir, "check-ci-markers.mjs");

const completeLog = [
  "ok release gate",
  "ok license Apache-2.0",
  "ok version 0.0.0",
  "ok publishing blocked",
  "ok release approval request ready",
  "blocked npm publishing not approved",
  "blocked github release not approved",
  "blocked version release not approved",
  "ok release candidate readiness ready",
  "ok local package verification ready",
  "blocked release implementation approval missing",
  "ok license decision record ready",
  "ok license decision captured",
  "ok license implementation complete",
  "ok license approval request ready",
  "ok owner license approval captured",
  "ok license implementation complete",
  "ok license implementation plan ready",
  "ok license decision paths mapped",
  "ok license implementation complete",
  "ok owner license approval preflight ready",
  "ok owner approval package complete",
  "ok owner license approval captured",
  "ok owner decision workflow ready",
  "ok owner decision options available",
  "ok owner license decision captured",
  "ok owner decision intake ready",
  "ok owner decision options available",
  "ok owner decision captured",
  "ok legal review packet ready",
  "ok owner license approval recorded",
  "ok owner launch checklist ready",
  "blocked launch channels missing",
  "ok world share open source ready",
  "blocked production launch channels",
  "ok first visitor share audit ready",
  "ok apache 2 reuse ready",
  "blocked production launch channels",
  "ok launch decision status ready",
  "ok apache 2 license implemented",
  "ok source repo sharing ready",
  "blocked npm publishing not approved",
  "blocked github release not approved",
  "blocked hosted runtime not approved",
  "blocked contributions not accepted",
  "ok package required paths 55",
  "ok package dry-run @source-wire/contracts@0.0.0",
  "ok package file count 82",
  "ok package content smoke @source-wire/contracts@0.0.0",
  "ok installed required paths 55",
  "ok installed runtime readiness summary",
  "ok installed runtime readiness summary content",
  "ok installed package docs links",
  "ok minimal runtime boundary smoke",
  "ok runtime boundary check authorized_read",
  "ok runtime boundary check unauthorized_read_denial",
  "ok runtime boundary check wrong_namespace_denial",
  "ok runtime boundary check source_maintenance_no_auto_promotion",
  "ok runtime boundary check owner_controlled_approval",
  "ok runtime boundary check agent_approval_denial",
  "ok synthetic runtime boundary smoke",
  "ok runtime boundary installed smoke @source-wire/contracts@0.0.0",
  "ok installed runtime boundary example",
  "ok runtime boundary diagnostics smoke authorized_read",
  "ok diagnostic failure includes check name",
  "ok diagnostic failure includes assertion",
  "ok diagnostic failure includes expected value",
  "ok diagnostic failure includes received value",
  "ok diagnostic failure includes next action",
  "ok readiness report",
  "ok docs links 38 markdown files",
  "ok command docs setup 15 command-bearing markdown files",
  "Findings: 0 high=0 medium=0 low=0",
  "ok public claim boundary scan",
  "ok ci markers smoke"
].join("\n");

const incompleteLog = [
  "ok release gate",
  "ok license Apache-2.0"
].join("\n");

const completeResult = await runMarkerCheck(completeLog);
if (completeResult.exitCode !== 0) {
  console.error("failed ci markers smoke complete log should pass");
  printResult(completeResult);
  process.exit(1);
}

if (!completeResult.stdout.includes("ok ci markers 25 groups 75 markers")) {
  console.error("failed ci markers smoke complete log did not report expected marker count");
  printResult(completeResult);
  process.exit(1);
}

const incompleteResult = await runMarkerCheck(incompleteLog);
if (incompleteResult.exitCode === 0) {
  console.error("failed ci markers smoke incomplete log should fail");
  printResult(incompleteResult);
  process.exit(1);
}

if (!incompleteResult.stderr.includes("failed ci markers missing required marker evidence")) {
  console.error("failed ci markers smoke incomplete log did not report missing evidence");
  printResult(incompleteResult);
  process.exit(1);
}

console.log("ok ci markers smoke");

function runMarkerCheck(input) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [markerScript, "-"], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"]
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

    child.stdin.end(input);
  });
}

function printResult(result) {
  if (result.stdout.trim()) {
    console.error(`stdout:\n${result.stdout.trim()}`);
  }

  if (result.stderr.trim()) {
    console.error(`stderr:\n${result.stderr.trim()}`);
  }
}
