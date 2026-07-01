import { execFile } from "node:child_process";

const steps = [
  ["world:share-preflight", "world-share preflight"],
  ["owner:decision-status", "owner decision issue status"],
  ["repository:live-branch", "live branch governance"],
  ["repository:branch-governance-request", "branch governance approval request"],
  ["repository:branch-governance-plan", "branch governance implementation plan"]
];

printSection("Source-Wire Branch Governance Decision Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It does not enable branch protection, create repository rulesets, publish npm, create a GitHub release, create tags, deploy services, accept code contributions, or approve hosted runtime use.");

for (const [scriptName, label] of steps) {
  printSection(label);
  await runScript(scriptName);
}

printSection("Branch Governance Decision Preflight Result");
console.log("ok branch governance decision preflight ready");
console.log("ok world share preflight current");
console.log("ok owner decision status current");
console.log("ok live branch governance current");
console.log("ok branch governance execution plan current");
console.log("blocked branch governance implementation approval missing");

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = execFile("npm", ["run", scriptName], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 20
    });

    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`npm run ${scriptName} failed with exit code ${code}`));
    });
  });
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}
