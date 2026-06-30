import { execFile } from "node:child_process";

const checks = [
  ["docs:external-links", "public external links"],
  ["world:live-status", "live world-share status"],
  ["launch:decision-status", "launch decision blockers"]
];

printSection("Source-Wire World Share Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It does not publish npm, create a GitHub release, create tags, deploy services, enable branch governance, accept code contributions, or approve hosted runtime use.");

for (const [scriptName, label] of checks) {
  printSection(label);
  await runNpmScript(scriptName);
}

printSection("World Share Preflight Result");
console.log("ok world share preflight ready");
console.log("ok external reviewer links reachable");
console.log("ok live source-package boundary current");
console.log("blocked production launch channels");

function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = execFile("npm", ["run", scriptName], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 20
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
