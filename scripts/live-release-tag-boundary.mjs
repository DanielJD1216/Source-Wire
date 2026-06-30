import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while release publishing is blocked");

const localTags = parseLines(await run("git", ["tag", "--list"]));
const remoteTags = parseRemoteTags(await run("git", ["ls-remote", "--tags", "origin"]));
const releases = JSON.parse(await run("gh", ["release", "list", "--repo", "DanielJD1216/Source-Wire", "--limit", "20", "--json", "tagName,name,isLatest,createdAt"]));

if (localTags.length > 0) {
  failures.push(`local git tags must remain empty until release approval: ${localTags.join(", ")}`);
}

if (remoteTags.length > 0) {
  failures.push(`remote git tags must remain empty until release approval: ${remoteTags.join(", ")}`);
}

if (releases.length > 0) {
  failures.push(`GitHub releases must remain empty until release approval: ${releases.map((release) => release.tagName).join(", ")}`);
}

if (failures.length > 0) {
  console.error("failed live release tag boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Live Release Tag Boundary");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Local git tags", "none"],
  ["Remote git tags", "none"],
  ["GitHub releases", "none"],
  ["npm publishing", "blocked"],
  ["GitHub release publishing", "blocked"],
  ["Release tag creation", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok live release tag boundary ready");
console.log("ok local git tags empty");
console.log("ok remote git tags empty");
console.log("blocked release tag creation not approved");

function parseLines(text) {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseRemoteTags(text) {
  return parseLines(text)
    .map((line) => line.split(/\s+/u)[1] ?? "")
    .filter(Boolean)
    .map((ref) => ref.replace(/^refs\/tags\//u, ""))
    .filter((ref) => !ref.endsWith("^{}"));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      resolve(stdout);
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
