import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

const npmView = await run("npm", ["view", packageJson.name, "name", "version", "dist-tags", "--json"], { allowFailure: true });

let registryState = "unknown";
let npmErrorCode = "";
let npmErrorSummary = "";

if (npmView.exitCode === 0) {
  failures.push(`${packageJson.name} exists in the npm registry; npm publishing is no longer blocked`);
  registryState = "published";
} else {
  const parsedError = parseNpmError(npmView.stdout);
  npmErrorCode = parsedError?.error?.code ?? "";
  npmErrorSummary = parsedError?.error?.summary ?? npmView.stderr.trim();

  if (npmErrorCode === "E404" || /Not Found/i.test(npmErrorSummary)) {
    registryState = "unpublished";
  } else {
    failures.push(`npm registry state could not be proven as unpublished: ${npmErrorSummary || "unknown npm error"}`);
  }
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
  ["npm error code", npmErrorCode],
  ["npm error summary", npmErrorSummary],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok live npm registry boundary ready");
console.log("ok npm package unpublished");
console.log("ok local package publish boundary intact");
console.log("blocked npm publishing not approved");

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
