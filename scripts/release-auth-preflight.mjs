import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const registry = await commandText("npm", ["config", "get", "registry"]);
const npmPing = await commandResult("npm", ["ping"]);
const npmWhoami = await commandResult("npm", ["whoami"]);
const ghAuth = await commandResult("gh", ["auth", "status"]);

printSection("Source-Wire Release Auth Preflight");
console.log("This owner-side preflight is read-only.");
console.log("It checks whether this machine can authenticate to npm and GitHub before release execution.");
console.log("It does not publish npm, create a GitHub release, create tags, change package version, deploy services, enable branch governance, accept code contributions, implement hosted runtime behavior, or approve production runtime use.");

printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Registry", registry.trim() || "unknown"],
  ["npm publish", "blocked until final release execution"],
  ["GitHub release", "blocked until final release execution"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Release Auth Status");
if (npmPing.ok) {
  console.log("ok npm registry reachable");
} else {
  console.log("blocked npm registry unreachable");
  console.log(`npm ping error: ${firstMeaningfulLine(npmPing.stderr || npmPing.errorMessage)}`);
}

if (npmWhoami.ok) {
  console.log(`ok npm auth ready user ${npmWhoami.stdout.trim()}`);
} else {
  console.log("blocked npm auth missing");
  console.log(`npm auth error: ${firstMeaningfulLine(npmWhoami.stderr || npmWhoami.errorMessage)}`);
}

if (ghAuth.ok) {
  console.log("ok github auth ready");
} else {
  console.log("blocked github auth missing");
  console.log(`github auth error: ${firstMeaningfulLine(ghAuth.stderr || ghAuth.errorMessage)}`);
}

printSection("Release Auth Preflight Result");
console.log("ok release auth preflight readable");
if (npmPing.ok && npmWhoami.ok && ghAuth.ok) {
  console.log("ok release publish credentials ready");
} else {
  console.log("blocked release publish credentials missing");
}

async function commandText(command, args) {
  const result = await commandResult(command, args);
  return result.ok ? result.stdout : "";
}

function commandResult(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout,
        stderr,
        errorMessage: error?.message ?? ""
      });
    });
  });
}

function firstMeaningfulLine(text) {
  const line = text
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.length > 0 && !value.startsWith("npm error A complete log"));
  return line ?? "unknown";
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}: ${value}`);
  }
}
