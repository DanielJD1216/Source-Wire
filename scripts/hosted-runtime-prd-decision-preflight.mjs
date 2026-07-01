import { execFile } from "node:child_process";

const checks = [
  ["world:share-preflight", "world-share preflight"],
  ["owner:decision-status", "owner decision issue status"],
  ["owner:open-issues-status", "owner open issue boundary"],
  ["runtime:prd-preparation", "hosted runtime PRD preparation"],
  ["launch:decision-status", "launch decision status"]
];

printSection("Source-Wire Hosted Runtime PRD Decision Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It does not implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, enable branch governance, accept code contributions, or approve production runtime use.");

for (const [scriptName, label] of checks) {
  printSection(label);
  await runNpmScript(scriptName);
}

printSection("Hosted Runtime PRD Decision Preflight Result");
console.log("ok hosted runtime PRD decision preflight ready");
console.log("ok world share preflight current");
console.log("ok owner decision status current");
console.log("ok owner open issue boundary current");
console.log("ok hosted runtime PRD evidence current");
console.log("blocked hosted runtime PRD approval missing");

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
