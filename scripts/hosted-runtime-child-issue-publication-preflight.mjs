import { execFile } from "node:child_process";

const checks = [
  ["world:share-preflight", "world-share preflight"],
  ["runtime:prd-preparation", "hosted runtime PRD preparation"],
  ["runtime:prd-execution-packet", "hosted runtime PRD execution packet"],
  ["runtime-readiness:smoke", "runtime readiness synthetic gate"],
  ["runtime-proof-intake:smoke", "runtime proof intake gate"],
  ["runtime:child-issue-publication-packet", "hosted runtime child issue publication packet"],
  ["runtime:child-issue-publish", "hosted runtime child issue publisher dry run"],
  ["runtime:child-issue-publish:smoke", "hosted runtime child issue publisher guard smoke"],
  ["runtime:child-issue-approval-status", "hosted runtime child issue approval status"],
  ["owner:open-issues-status", "owner open issue boundary"],
  ["owner:open-issues-status:smoke", "owner open issue future planning smoke"],
  ["launch:decision-status", "launch decision status"]
];

printSection("Source-Wire Hosted Runtime Child Issue Publication Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It verifies the hosted-runtime child issue packet, publisher dry run, approval status, duplicate guard, open-issue boundary, and final launch blockers.");
console.log("It does not publish child issues, implement hosted runtime behavior, add an API server, add an MCP server runtime, add database migrations, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.");

for (const [scriptName, label] of checks) {
  printSection(label);
  await runNpmScript(scriptName);
}

printSection("Hosted Runtime Child Issue Publication Preflight Result");
console.log("ok hosted runtime child issue publication preflight ready");
console.log("ok child issue publication packet current");
console.log("ok child issue publisher dry run current");
console.log("ok child issue publisher guard smoke current");
console.log("ok runtime readiness gate current");
console.log("ok runtime proof intake gate current");
console.log("ok child issue approval status current");
console.log("ok owner open issue boundary current");
console.log("ok owner open issue future planning smoke current");
console.log("ok hosted runtime child issue publication approval recorded");
console.log("ok hosted runtime child planning issues open");
console.log("blocked hosted runtime implementation");

function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = execFile("npm", ["run", scriptName], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 90
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
