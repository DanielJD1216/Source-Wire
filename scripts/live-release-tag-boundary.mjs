import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];
const expectedTag = "v0.1.0";
const expectedTarget = "bd240283ec45e5b83ecd0e1c1cc9650097fd6509";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after release publication");

const localTags = parseLines(await run("git", ["tag", "--list"]));
const remoteTags = parseRemoteTags(await run("git", ["ls-remote", "--tags", "origin"]));
const release = JSON.parse(await run("gh", ["release", "view", expectedTag, "--repo", "DanielJD1216/Source-Wire", "--json", "tagName,name,isDraft,isPrerelease,targetCommitish,publishedAt,url"]));

if (!localTags.includes(expectedTag)) {
  failures.push(`local git tags must include ${expectedTag}`);
}

if (!remoteTags.includes(expectedTag)) {
  failures.push(`remote git tags must include ${expectedTag}`);
}

assertEqual(release.tagName, expectedTag, "GitHub release tag must match expected tag");
assertEqual(release.targetCommitish, expectedTarget, "GitHub release target commit must match release commit");
assertEqual(release.isDraft, false, "GitHub release must not be draft");
assertEqual(release.isPrerelease, false, "GitHub release must not be prerelease");

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
  ["Local git tag", expectedTag],
  ["Remote git tag", expectedTag],
  ["GitHub release", release.url],
  ["Release target", release.targetCommitish],
  ["Published at", release.publishedAt],
  ["npm publishing", "published"],
  ["GitHub release publishing", "published"],
  ["Release tag creation", "complete"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok live release tag boundary ready");
console.log("ok local release tag v0.1.0");
console.log("ok remote release tag v0.1.0");
console.log("ok github release published v0.1.0");
console.log("blocked hosted runtime implementation");

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
