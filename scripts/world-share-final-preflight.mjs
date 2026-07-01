import { execFile } from "node:child_process";

const checks = [
  ["world:share-preflight", "world-share preflight"],
  ["release:decision-preflight", "release decision preflight"],
  ["repository:branch-governance-preflight", "branch governance decision preflight"],
  ["runtime:prd-decision-preflight", "hosted runtime PRD decision preflight"],
  ["contribution:terms-decision-preflight", "contribution terms PRD decision preflight"],
  ["owner:decision-status", "owner decision issue status"],
  ["owner:open-issues-status", "owner open issue boundary"],
  ["owner:decision-issues-freshness", "owner decision issue freshness"],
  ["launch:decision-status", "launch decision status"]
];

printSection("Source-Wire World Share Final Preflight");
console.log("This owner-side final preflight is read-only.");
console.log("It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

for (const [scriptName, label] of checks) {
  printSection(label);
  await runNpmScript(scriptName);
}

printSection("World Share Final Preflight Result");
console.log("ok world share final preflight ready");
console.log("ok world share preflight current");
console.log("ok release decision preflight current");
console.log("ok branch governance decision preflight current");
console.log("ok hosted runtime PRD decision preflight current");
console.log("ok contribution terms PRD decision preflight current");
console.log("ok owner decision issue boundary current");
console.log("ok owner decision issue freshness current");
console.log("blocked production launch channels");
console.log("blocked owner approvals missing");

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

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}
