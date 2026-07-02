import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { requiredPackagePaths } from "./package-required-paths.mjs";

const forbiddenPathPrefixes = [
  ".git/",
  ".github/",
  "node_modules/",
  "src/",
  "scripts/"
];

const forbiddenExactPaths = [
  ".env",
  ".env.local",
  "package-lock.json",
  "tsconfig.json"
];

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packResult = await run("npm", ["pack", "--dry-run", "--json"]);
if (packResult.exitCode !== 0) {
  console.error(packResult.stderr.trim() || packResult.stdout.trim());
  process.exit(packResult.exitCode);
}

const [pack] = JSON.parse(packResult.stdout);
const files = pack.files.map((entry) => entry.path).sort();
const failures = [];

assertEqual(pack.name, "@source-wire/contracts", "package name");
assertEqual(pack.version, "0.1.0", "package version");
assertEqual(packageJson.license, "Apache-2.0", "package license");
assertEqual(packageJson.publishConfig?.access, "public", "publish access");

for (const requiredPath of requiredPackagePaths) {
  if (!files.includes(requiredPath)) {
    failures.push(`missing required package path: ${requiredPath}`);
  }
}

for (const file of files) {
  if (forbiddenExactPaths.includes(file)) {
    failures.push(`forbidden package path: ${file}`);
  }

  const forbiddenPrefix = forbiddenPathPrefixes.find((prefix) => file.startsWith(prefix));
  if (forbiddenPrefix) {
    failures.push(`forbidden package path prefix ${forbiddenPrefix}: ${file}`);
  }
}

if (typeof pack.shasum !== "string" || pack.shasum.length !== 40) {
  failures.push("package dry-run did not return a sha1 shasum");
}

if (typeof pack.integrity !== "string" || !pack.integrity.startsWith("sha512-")) {
  failures.push("package dry-run did not return sha512 integrity");
}

if (failures.length > 0) {
  console.error("failed release artifact manifest");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("");
console.log("Source-Wire Release Artifact Manifest");
console.log("-------------------------------------");
printRows([
  ["Package", pack.name],
  ["Version", pack.version],
  ["License", packageJson.license],
  ["Filename", pack.filename],
  ["File count", String(files.length)],
  ["Required path count", String(requiredPackagePaths.length)],
  ["Tarball size bytes", String(pack.size)],
  ["Unpacked size bytes", String(pack.unpackedSize)],
  ["Shasum", pack.shasum],
  ["Integrity", pack.integrity],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Release tag", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Code contributions", "blocked"]
]);

console.log("");
console.log("ok release artifact manifest ready");
console.log(`ok release artifact package identity ${pack.name}@${pack.version}`);
console.log("ok release artifact integrity recorded");
console.log("blocked release artifact publish not approved");

function assertEqual(actual, expected, label) {
  if (actual === expected) {
    return;
  }

  failures.push(`${label} must be ${expected}, received ${String(actual)}`);
}

function printRows(rows) {
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}: ${value}`);
  }
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("close", (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}
