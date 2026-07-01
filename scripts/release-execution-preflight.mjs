import { execFile } from "node:child_process";

const checks = [
  ["release:approval-status", "release approval status"],
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

printSection("Release Execution Preflight Result");
console.log("ok release execution preflight ready");
console.log("ok release approval status current");
console.log("ok release decision preflight current");
console.log("ok publish readiness current");
console.log("ok release artifact evidence current");
console.log("ok live release boundaries current");
console.log("blocked release execution approval missing");

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
