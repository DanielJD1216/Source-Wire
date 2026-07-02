import { execFile } from "node:child_process";

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

printSection("Contribution Terms PRD Decision Preflight Result");
console.log("ok contribution terms PRD decision preflight ready");
console.log("ok world share preflight current");
console.log("ok owner decision status current");
console.log("ok owner open issue boundary current");
console.log("ok contribution terms PRD evidence current");
console.log("ok contribution terms PRD execution packet current");
console.log("ok public intake boundary current");
console.log("blocked contribution terms PRD approval missing");

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
