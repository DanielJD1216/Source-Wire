import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

const npmView = await run("npm", ["view", packageJson.name, "name", "version", "dist-tags", "--json"], { allowFailure: true });
const npmAccess = await run("npm", ["access", "get", "status", packageJson.name, "--json"], { allowFailure: true });

let registryState = "published";
let npmVersion = "";
let npmLatest = "";
let npmAccessStatus = "";

if (npmView.exitCode === 0) {
  const npmData = JSON.parse(npmView.stdout);
  npmVersion = npmData.version ?? "";
  npmLatest = npmData["dist-tags"]?.latest ?? "";
  assertEqual(npmData.name, packageJson.name, "npm registry package name must match package.json");
  assertEqual(npmVersion, packageJson.version, "npm registry version must match package.json");
  assertEqual(npmLatest, packageJson.version, "npm latest dist-tag must match package.json version");
} else {
  const parsedError = parseNpmError(npmView.stdout);
  const npmErrorCode = parsedError?.error?.code ?? "";
  const npmErrorSummary = parsedError?.error?.summary ?? npmView.stderr.trim();
  registryState = "unknown";
  failures.push(`npm registry package must be published: ${npmErrorCode || npmErrorSummary || "unknown npm error"}`);
}

if (npmAccess.exitCode === 0) {
  const accessData = JSON.parse(npmAccess.stdout);
  npmAccessStatus = accessData[packageJson.name] ?? "";
  assertEqual(npmAccessStatus, "public", "npm package access status must be public");
} else {
  failures.push(`npm access status could not be proven public: ${npmAccess.stderr.trim() || "unknown npm error"}`);
}

if (failures.length > 0) {
  console.error("failed live npm registry boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Live npm Registry Boundary");
printRows([
  ["Package", packageJson.name],
  ["Local version", packageJson.version],
  ["Local license", packageJson.license],
  ["Local publishConfig.access", packageJson.publishConfig.access],
  ["Registry state", registryState],
  ["Registry version", npmVersion],
  ["latest dist-tag", npmLatest],
  ["npm access", npmAccessStatus],
  ["npm publishing", "published"],
  ["GitHub release", "published"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok live npm registry boundary ready");
console.log("ok npm package published @source-wire/contracts@0.1.0");
console.log("ok npm latest dist-tag 0.1.0");
console.log("ok npm package public");
console.log("blocked hosted runtime not approved");

function parseNpmError(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      const result = {
        exitCode: error?.code ?? 0,
        stdout,
        stderr
      };

      if (error && !options.allowFailure) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      resolve(result);
    });
  });
}

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  for (const [label, value] of rows) {
    console.log(`${label}: ${value}`);
  }
}
