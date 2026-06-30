import { execFile } from "node:child_process";

const checks = [
  ["world:share-preflight", "world-share preflight"],
  ["release:approval-status", "release approval status"],
  ["release:candidate-readiness", "release candidate readiness"],
  ["release:artifact-manifest", "release artifact manifest"],
  ["release:approval-request", "release approval request"],
  ["launch:decision-status", "launch decision status"]
];

printSection("Source-Wire Release Decision Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.");

for (const [scriptName, label] of checks) {
  printSection(label);
  await runNpmScript(scriptName);
}

printSection("Release Decision Preflight Result");
console.log("ok release decision preflight ready");
console.log("ok world share preflight current");
console.log("ok release approval status current");
console.log("ok release candidate evidence current");
console.log("ok release artifact evidence current");
console.log("blocked release implementation approval missing");

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

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}
