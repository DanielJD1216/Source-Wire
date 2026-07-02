import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];
const expectedTag = "v0.1.0";
const expectedReleaseTarget = "bd240283ec45e5b83ecd0e1c1cc9650097fd6509";

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public");

const remoteRefs = parseRemoteRefs(
  (await run("git", ["ls-remote", "origin", "refs/heads/main", `refs/tags/${expectedTag}`, `refs/tags/${expectedTag}^{}`])).stdout
);
const remoteMain = remoteRefs.get("refs/heads/main");
const releaseTagObject = remoteRefs.get(`refs/tags/${expectedTag}`);
const releaseTagTarget = remoteRefs.get(`refs/tags/${expectedTag}^{}`) ?? releaseTagObject;
const npmView = JSON.parse(
  (await run("npm", ["view", `${packageJson.name}@${packageJson.version}`, "name", "version", "dist-tags", "dist", "--json"])).stdout
);

if (!remoteMain) {
  failures.push("remote main ref must be readable");
}

if (!releaseTagObject) {
  failures.push("remote release tag v0.1.0 must exist");
}

assertEqual(releaseTagTarget, expectedReleaseTarget, "remote release tag target must remain the first release snapshot commit");
assertEqual(npmView.name, packageJson.name, "npm package name must match package.json");
assertEqual(npmView.version, packageJson.version, "npm package version must match package.json");
assertEqual(npmView["dist-tags"]?.latest, packageJson.version, "npm latest dist-tag must remain 0.1.0");

if (typeof npmView.dist?.shasum !== "string" || npmView.dist.shasum.length !== 40) {
  failures.push("npm published artifact shasum must be present");
}

if (typeof npmView.dist?.integrity !== "string" || !npmView.dist.integrity.startsWith("sha512-")) {
  failures.push("npm published artifact integrity must be sha512");
}

if (typeof npmView.dist?.tarball !== "string" || !npmView.dist.tarball.includes("/@source-wire/contracts/-/contracts-0.1.0.tgz")) {
  failures.push("npm published artifact tarball URL must point to @source-wire/contracts 0.1.0");
}

if (failures.length > 0) {
  console.error("failed release snapshot boundary");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const mainRelation =
  remoteMain === releaseTagTarget
    ? "origin/main currently matches the v0.1.0 release snapshot"
    : "origin/main contains post-release changes after the immutable v0.1.0 release snapshot";

printSection("Source-Wire Release Snapshot Boundary");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["origin/main", remoteMain],
  ["Remote release tag", expectedTag],
  ["Release tag object", releaseTagObject],
  ["Release tag target", releaseTagTarget],
  ["Main vs release", mainRelation],
  ["npm latest", npmView["dist-tags"].latest],
  ["npm tarball", npmView.dist.tarball],
  ["npm shasum", npmView.dist.shasum],
  ["npm integrity", npmView.dist.integrity],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

console.log("");
console.log("ok release snapshot boundary ready");
console.log("ok latest main can differ from v0.1.0 release snapshot");
console.log("ok npm artifact immutable at @source-wire/contracts@0.1.0");
console.log("blocked future release mutation approval missing");

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function parseRemoteRefs(stdout) {
  const refs = new Map();
  for (const line of stdout.trim().split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const [sha, ref] = line.split(/\s+/);
    refs.set(ref, sha);
  }

  return refs;
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
